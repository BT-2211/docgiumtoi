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

      const isExpiryFocus = scanMode === 'EXPIRATION_FOCUS';

      const prompt = `
You are "ĐọcGiùmTôi", an empathetic AI assistant for Vietnamese seniors reading medicine boxes, food bottles, personal care items, and household goods.

TASK:
Analyze the uploaded image. Extract product identity, usage instructions, and specifically LOCATE AND VERIFY EXPIRATION DATES (Hạn Sử Dụng / HSD / EXP / Best Before / BBE / NSX).
${isExpiryFocus ? `\n[CHẾ ĐỘ CHUYÊN SOI HẠN SỬ DỤNG - EXPIRATION FOCUS]:
- Tập trung cao độ tìm kiếm mọi vết in mờ, dập nổi kim loại (embossed), in phun chấm (dot-matrix), in trên nắp chai, đáy hộp, đuôi tuýp kem/thuốc mỡ, viền mép vỉ thuốc hoặc mép bao bì.
- Tính toán rõ ràng thời gian còn lại hoặc thời gian đã quá hạn tính đến năm hiện tại (2026).` : ''}

RULES:
1. Identify the item as "MEDICINE" or "HOUSEHOLD_GOOD".
2. Locate and parse any expiration date (e.g., 'HSD: 12/2026', 'EXP: 15/10/2026', '24 tháng kể từ NSX'). If faded or missing, explicitly state "Không thấy rõ HSD".
3. Provide details for 'expiration_info':
   - 'status': "VALID" (còn hạn), "EXPIRED" (hết hạn), "UNCLEAR" (mờ/không thấy)
   - 'expiry_date_text': Chuỗi ngày HSD (ví dụ: 'HSD: 15/10/2026' hoặc 'Không thấy rõ HSD')
   - 'mfg_date_text': Ngày sản xuất nếu thấy (ví dụ: 'NSX: 15/10/2024')
   - 'days_remaining_text': Thời gian ước tính (ví dụ: 'Còn khoảng 8 tháng' hoặc 'Đã hết hạn 2 tháng trước')
   - 'location_found': Vị trí tìm thấy (ví dụ: 'Đáy chai', 'Trên nắp', 'Đuôi vỉ thuốc', 'Mặt sau hộp')
4. Keep spoken scripts extremely concise, warm, and clear for Text-to-Speech (TTS) playback in Vietnamese. Always mention product name, purpose, and CLEARLY STATE THE EXPIRATION DATE in a loving tone ("Dạ thưa Bác...").
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
          item_category: {
            type: Type.STRING,
            enum: ["MEDICINE", "HOUSEHOLD_GOOD"],
            description: "Detect whether the item is 'MEDICINE' or 'HOUSEHOLD_GOOD'",
          },
          product_name: {
            type: Type.STRING,
            description: "Clear item name, e.g., 'Dầu gội Sunsilk' or 'Thuốc Amlodipine'",
          },
          primary_purpose: {
            type: Type.STRING,
            description: "Clear purpose, e.g., 'Dùng để gội đầu' or 'Thuốc trị huyết áp'",
          },
          expiration_info: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                enum: ["VALID", "EXPIRED", "UNCLEAR"],
                description: "VALID if within expiry date, EXPIRED if past expiry date, UNCLEAR if faded or missing",
              },
              expiry_date_text: {
                type: Type.STRING,
                description: "Date string parsed, e.g., 'HSD: 15/10/2026' or 'Không thấy rõ HSD'",
              },
              mfg_date_text: {
                type: Type.STRING,
                description: "Manufacturing date if found, e.g. 'NSX: 01/2024'",
              },
              days_remaining_text: {
                type: Type.STRING,
                description: "Remaining or expired time text, e.g. 'Còn khoảng 8 tháng' or 'Đã quá hạn 2 tháng'",
              },
              location_found: {
                type: Type.STRING,
                description: "Location where date was spotted, e.g. 'In ở đáy chai' or 'Góc dưới mặt sau'",
              },
            },
            required: ["status", "expiry_date_text"],
          },
          usage_instruction: {
            type: Type.STRING,
            description: "Simple 1-sentence instruction",
          },
          safety_alert: {
            type: Type.STRING,
            description: "Critical warning or 'CẢNH BÁO: Hàng đã HẾT HẠN!'",
          },
          speech_script: {
            type: Type.STRING,
            description: "Warm, concise spoken Vietnamese script for automatic audio playback",
          },
        },
        required: [
          "item_category",
          "product_name",
          "primary_purpose",
          "expiration_info",
          "usage_instruction",
          "safety_alert",
          "speech_script",
        ],
      };

      // List of supported Gemini models, prioritizing active official models
      const candidateModels = [
        "gemini-3.7-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      let lastError: any = null;
      let parsedData: MedicineAnalysisResult | null = null;

      for (const modelName of candidateModels) {
        // Attempt with retry
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Analyzing medicine with model: ${modelName} (attempt ${attempt})...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: { parts: contents },
              config: {
                systemInstruction:
                  "Bạn là chuyên gia trợ lý y tế ĐọcGiùmTôi tận tâm, ân cần phục vụ người cao tuổi Việt Nam. Trả lời luôn luôn theo đúng cấu trúc JSON được định nghĩa.",
                responseMimeType: "application/json",
                responseSchema: responseSchemaConfig,
              },
            });

            const resultText = response.text?.trim();
            if (resultText) {
              parsedData = JSON.parse(resultText) as MedicineAnalysisResult;
              // Ensure backwards compatibility
              if (parsedData) {
                parsedData.primary_function = parsedData.primary_purpose || parsedData.primary_function || '';
                parsedData.primary_purpose = parsedData.primary_purpose || parsedData.primary_function || '';
                parsedData.how_to_use = parsedData.usage_instruction || parsedData.how_to_use || '';
                parsedData.usage_instruction = parsedData.usage_instruction || parsedData.how_to_use || '';
              }
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Model ${modelName} attempt ${attempt} failed:`, err?.message || err);
            
            // If high demand (503), rate limit (429), or overloaded, wait briefly or try next
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        if (parsedData) {
          console.log(`Successfully analyzed medicine using model: ${modelName}`);
          break; // Successfully got parsed response!
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
