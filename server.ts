import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Requests will fail if API key is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export type ItemCategory = "MEDICINE" | "HOUSEHOLD_GOOD";
export type ExpiryStatus = "VALID" | "EXPIRED" | "UNCLEAR";

export interface ExpirationInfo {
  status: ExpiryStatus;
  expiry_date_text: string;
  mfg_date_text?: string;
  days_remaining_text?: string;
  location_found?: string;
}

export interface MedicineAnalysisResult {
  item_category: ItemCategory;
  product_name: string;
  primary_purpose: string;
  primary_function?: string;
  expiration_info: ExpirationInfo;
  usage_instruction: string;
  how_to_use?: string;
  safety_alert: string;
  speech_script: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "ĐọcGiùmTôi" });
  });

  // Vietnamese TTS Audio Proxy endpoint
  app.get("/api/tts", async (req, res) => {
    try {
      const text = ((req.query.text as string) || "").trim();
      if (!text) {
        return res.status(400).send("Text is required");
      }

      const encoded = encodeURIComponent(text);
      const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=vi&client=tw-ob`;

      const response = await fetch(googleTTSUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
        },
      });

      if (!response.ok) {
        return res.status(response.status).send("TTS upstream error");
      }

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("TTS proxy error:", err);
      res.status(500).send("Failed to generate TTS audio");
    }
  });

  // Analyze medicine image/prescription endpoint
  app.post("/api/analyze-medicine", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", textQuery, scanMode } = req.body;

      if (!imageBase64 && !textQuery) {
        return res.status(400).json({
          error: "Vui lòng cung cấp hình ảnh vỏ thuốc hoặc tên thuốc cần tra cứu.",
        });
      }

      const ai = getAI();

      const now = new Date();
      const currentDateStr = now.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }); // DD/MM/YYYY
      const currentIsoDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

      const prompt = `
Bạn là Trợ lý AI đọc chữ dành cho người cao tuổi và người mắt kém tại Việt Nam.
Nhiệm vụ của bạn là phân tích hình ảnh được chụp và trả về kết quả dạng JSON chuẩn xác 100%.

THÔNG TIN THỜI GIAN HỆ THỐNG:
- NGÀY HIỆN TẠI: ${currentDateStr} (Định dạng Quốc tế: ${currentIsoDate}).

YÊU CẦU XỬ LÝ NGUYÊN TẮC VÀ EDGE CASES:

1. NHẬN DIỆN NGỮ CẢNH (item_type):
   - Nếu là thuốc/y tế -> set "medicine".
   - Nếu là thực phẩm/hộp bánh/chai nước/dầu gội/hàng tiêu dùng -> set "food_or_consumer".
   - Nếu là ảnh không rõ ràng/không phải vật phẩm -> set "unknown".

2. XỬ LÝ HẠN SỬ DỤNG (EXP / MFG):
   - So sánh Hạn sử dụng (EXP) tìm thấy với NGÀY HIỆN TẠI (${currentDateStr}).
   - Nếu HẠN SỬ DỤNG < NGÀY HIỆN TẠI: Gán "is_expired": true và tạo LỜI CẢNH BÁO BÁO ĐỘNG trong lời thoại.
   - Chấp nhận tất cả định dạng ngày: DD/MM/YYYY, MM/DD/YYYY, YYYY.MM.DD, EXP0526, MFG/EXP.
   - Nếu không tìm thấy hoặc bị mờ: Gán "expiry_date": "Không tìm thấy", "is_expired": false.

3. XỬ LÝ EDGE CASES (Ảnh mờ, Lóa sáng, Run tay, Bấm nhầm):
   - Nếu ảnh quá lóa, bị mất nét do run tay, hoặc không thấy rõ chữ: Gán "status": "unclear".
   - Lời thoại (speech_text) phải nhắc lịch sự: "Bác ơi, ảnh bị lóa hoặc mờ rồi. Bác cầm chắc tay và chụp lại giúp cháu ạ."
   - Nếu không tìm thấy vật thể/sản phẩm: Gán "status": "not_found", "item_type": "unknown".
   - Nếu đọc được rõ ràng: Gán "status": "success".

4. FORMAT ĐỌC THẠO MỒNG MỘT (speech_text):
   - Lời thoại phải NGẮN GỌN (dưới 40 từ), lễ phép (dùng "Bác", "Cháu"), đọc chậm rãi.
   - Phiên âm tên tiếng Anh khó đọc sang cách đọc tiếng Việt dễ hiểu (Ví dụ: Paracetamol -> Pa-ra-se-ta-mol, Panadol -> Pa-na-đon, Amlodipine -> Am-lô-đi-pin, Sunsilk -> Săn-sêu).
   - Cuối câu luôn dùng từ "ạ", tuyệt đối không dùng "nhé ạ" hay "nhé Bác".
`;

      const contents: any = [];

      if (imageBase64) {
        // Strip data:image/...;base64, if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      }

      contents.push({
        text: prompt + (textQuery ? `\nGhi chú bổ sung từ người dùng: ${textQuery}` : ""),
      });

      const responseSchemaConfig = {
        type: Type.OBJECT,
        properties: {
          status: {
            type: Type.STRING,
            enum: ["success", "unclear", "not_found"],
            description: "Trạng thái phân tích: 'success', 'unclear' (ảnh mờ/lóa/run), hoặc 'not_found'",
          },
          item_type: {
            type: Type.STRING,
            enum: ["medicine", "food_or_consumer", "unknown"],
            description: "Loại vật phẩm: 'medicine', 'food_or_consumer', hoặc 'unknown'",
          },
          item_name: {
            type: Type.STRING,
            description: "Tên sản phẩm/thuốc rõ ràng, kèm phiên âm nếu là tiếng Anh",
          },
          expiry_date: {
            type: Type.STRING,
            description: "Hạn sử dụng DD/MM/YYYY hoặc 'Không tìm thấy'",
          },
          is_expired: {
            type: Type.BOOLEAN,
            description: "true nếu HSD trước ngày hiện tại, false nếu còn hạn",
          },
          usage_summary: {
            type: Type.STRING,
            description: "Tóm tắt công dụng/cách dùng trong 1 câu ngắn",
          },
          speech_text: {
            type: Type.STRING,
            description: "Đoạn văn hoàn chỉnh dưới 40 từ để ứng dụng đọc thành tiếng cho người già nghe",
          },
        },
        required: [
          "status",
          "item_type",
          "item_name",
          "expiry_date",
          "is_expired",
          "usage_summary",
          "speech_text",
        ],
      };

      // List of supported Gemini models, prioritizing active, highly available official models
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-3.7-flash",
      ];

      let lastError: any = null;
      let parsedData: any = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`Analyzing image with model: ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contents },
            config: {
              systemInstruction:
                "Bạn là Trợ lý AI đọc chữ dành cho người cao tuổi và người mắt kém tại Việt Nam. Phân tích chính xác và trả về JSON thuần theo schema.",
              responseMimeType: "application/json",
              responseSchema: responseSchemaConfig,
            },
          });

          const resultText = response.text?.trim();
          if (resultText) {
            const rawJson = JSON.parse(resultText);

            // Normalize & populate complete structure
            const status = rawJson.status || "success";
            const itemType = rawJson.item_type || "medicine";
            const itemName = rawJson.item_name || "Sản phẩm";
            const expiryDate = rawJson.expiry_date || "Không tìm thấy";
            const isExpired = Boolean(rawJson.is_expired);
            const usageSummary = rawJson.usage_summary || "";
            const speechText = rawJson.speech_text || "";

            const expiryStatus = isExpired
              ? "EXPIRED"
              : (expiryDate && !expiryDate.toLowerCase().includes("không") ? "VALID" : "UNCLEAR");

            parsedData = {
              // Exact requested JSON keys
              status: status,
              item_type: itemType,
              item_name: itemName,
              expiry_date: expiryDate,
              is_expired: isExpired,
              usage_summary: usageSummary,
              speech_text: speechText,

              // Backward-compatible UI fields
              item_category: itemType === "medicine" ? "MEDICINE" : "HOUSEHOLD_GOOD",
              product_name: itemName,
              primary_purpose: usageSummary,
              primary_function: usageSummary,
              usage_instruction: usageSummary,
              how_to_use: usageSummary,
              safety_alert: isExpired
                ? `CẢNH BÁO NGUY HIỂM: Sản phẩm ĐÃ HẾT HẠN SỬ DỤNG (${expiryDate})!`
                : "Bác nhớ dùng đúng hướng dẫn và giữ nơi khô ráo thoáng mát ạ.",
              speech_script: speechText,
              expiration_info: {
                status: expiryStatus,
                expiry_date_text: expiryDate && !expiryDate.toLowerCase().includes("không")
                  ? `HSD: ${expiryDate}`
                  : "Không thấy rõ HSD",
                days_remaining_text: isExpired ? "Đã quá hạn sử dụng" : "Còn hạn sử dụng",
              },
            };
            console.log(`Successfully analyzed item using model: ${modelName}`);
            break; // Successfully got parsed response!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed, failing over to next model:`, err?.message || err);
          // Immediately try next candidate model without stalling
        }
      }

      if (!parsedData) {
        // Clean error message for user
        let userMessage = "Máy chủ AI đang có lượng truy cập cao. Bác vui lòng bấm thử lại sau vài giây nhé.";
        if (lastError?.message) {
          try {
            // Check if error message contains embedded JSON
            const jsonMatch = lastError.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const errObj = JSON.parse(jsonMatch[0]);
              if (errObj?.error?.code === 503 || errObj?.error?.status === "UNAVAILABLE" || errObj?.error?.message?.includes("high demand")) {
                userMessage = "Máy chủ đang có nhiều người cùng tra cứu thuốc. Bác vui lòng đợi 5-10 giây rồi bấm chụp lại nhé.";
              } else if (errObj?.error?.message) {
                userMessage = `Lỗi hệ thống: ${errObj.error.message}`;
              }
            }
          } catch {
            // fallback to default friendly message
          }
        }

        return res.status(503).json({
          success: false,
          error: userMessage,
        });
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Error analyzing medicine image:", error);
      let friendlyError = "Đã xảy ra sự cố khi đọc hình ảnh thuốc. Bác vui lòng thử lại nhé.";
      if (error?.message?.includes("high demand") || error?.message?.includes("503")) {
        friendlyError = "Máy chủ đang tạm thời bận do nhiều người sử dụng cùng lúc. Bác vui lòng đợi vài giây rồi bấm thử lại nhé.";
      }
      return res.status(500).json({
        success: false,
        error: friendlyError,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ĐọcGiùmTôi Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
