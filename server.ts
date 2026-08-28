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
      const { imageBase64, mimeType = "image/jpeg", textQuery, scanMode, step, previousItemName } = req.body;

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

      const isSecondSideMode = Boolean(step === 2 || previousItemName);

      const prompt = `
Bạn là Trợ lý AI đọc chữ dành cho người cao tuổi và người mắt kém tại Việt Nam.
Nhiệm vụ của bạn là phân tích hình ảnh được chụp và trả về kết quả dạng JSON chuẩn xác 100%.

THÔNG TIN THỜI GIAN HỆ THỐNG:
- NGÀY HIỆN TẠI: ${currentDateStr} (Định dạng Quốc tế: ${currentIsoDate}).
${isSecondSideMode ? `- BỐI CẢNH LƯỢT CHỤP MẶT 2: Người dùng vừa chụp mặt 1 của sản phẩm: "${previousItemName || 'Sản phẩm trước'}". Lượt chụp này là để tìm Hạn Sử Dụng (HSD) và đối chiếu xác thực sản phẩm.` : ''}

YÊU CẦU XỬ LÝ THEO TỪNG LOẠI ĐỒ VẬT VÀ TÌNH HUỐNG:

1. TỰ ĐỘNG NHẬN DIỆN NHÓM ĐỒ VẬT (item_type):
   - "MEDICINE": Thuốc tây, thuốc đông y, thực phẩm chức năng, vỉ thuốc, chai siro, cao dán, vật tư y tế.
   - "CONSUMER_GOODS": Thực phẩm, bánh kẹo, đồ hộp, chai nước, sữa, gia vị, dầu ăn, dầu gội, mỹ phẩm, xà phòng, hàng tiêu dùng.
   - "PERSONAL_ITEM": Ví tiền, điện thoại, chùm chìa khóa, mắt kính, thẻ căn cước, thẻ ATM, đồng hồ, túi xách, đồ dùng cá nhân.
   - "UNKNOWN": Ảnh không rõ ràng, chụp vào khoảng trống, hoặc không nhận diện được vật thể nào.

2. XỬ LÝ LƯỢT CHỤP MẶT 2 & KIỂM TRA CHỤP NHẦM ĐỒ (CROSS-PRODUCT VALIDATION):
${isSecondSideMode ? `   - Đây là LƯỢT CHỤP MẶT 2 để tìm HSD sau khi đã quét mặt 1 là "${previousItemName}".
   - BẠN BẮT BUỘC SO SÁNH LOGO, THƯƠNG HIỆU, MÀU SẮC, TÊN SẢN PHẨM Ở ẢNH NÀY VỚI "${previousItemName}".
   - NẾU PHÁT HIỆN ĐÂY LÀ MỘT SẢN PHẨM KHÁC HOÀN TOÀN (Người dùng vô tình cầm nhầm món đồ khác để chụp mặt 2):
     + Gán "status": "cross_product_mismatch"
     + Gán "item_name": "[Tên sản phẩm vừa chụp]"
     + Gán "safety_alert": "Hình như Bác đang chụp một sản phẩm khác rồi ạ."
     + Gán "speech_text": "Hình như Bác đang chụp một sản phẩm khác rồi ạ. Bác kiểm tra lại đúng ${previousItemName ? previousItemName : 'sản phẩm'} lúc nãy để cháu đọc lại ạ!" (Chỉ dùng từ 'ạ', tuyệt đối KHÔNG dùng 'nhé ạ').
   - NẾU ĐÚNG LÀ MẶT SAU / MẶT ĐÁY CỦA CÙNG SẢN PHẨM:
     + Đọc Hạn sử dụng (HSD/EXP/MFG/NSX).
     + Nếu tìm thấy HSD: Gán "status": "success", điền đầy đủ "expiry_date", so sánh hạn với ngày hiện tại.` : `   - Nếu không trong chế độ chụp mặt 2, bỏ qua bước kiểm tra cross-product.`}

3. XỬ LÝ 2 KỊCH BẢN ĐẶC BIỆT KHÔNG THẤY HẠN SỬ DỤNG (EXPIRY EDGE-CASES):

   * KỊCH BẢN 1: CHỤP MẶT TRƯỚC HỘP (THIẾU HSD TRÊN MẶT NÀY)
     - Điều kiện: Nhận diện được tên sản phẩm/thuốc/hàng tiêu dùng nhưng KHÔNG tìm thấy ký tự HSD/EXP/MFG/NSX/Ngày sản xuất trên mặt ảnh này (do hạn in ở mặt sau/mặt đáy/nắp).
     - Action:
       + Gán "status": "need_second_side"
       + Gán "item_name": "[Tên sản phẩm/thuốc nhận diện được]"
       + "expiry_date": "Cần lật mặt sau/đáy"
       + "is_expired": false
       + "speech_text": "Cháu thấy [Tên sản phẩm] rồi ạ! Nhưng mặt này chưa thấy hạn sử dụng. Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại giúp cháu ạ!"

   * KỊCH BẢN 2: CHỤP GÓI BÁNH NHỎ / VỈ THUỐC BÓC LẺ (INDIVIDUAL PACK) & QUY TẮC CẢNH BÁO AN TOÀN:
     - Gán "status": "individual_pack"
     - Nếu là THỰC PHẨM / BÁNH KẸO / HÀNG TIÊU DÙNG (CONSUMER_GOODS):
       + Gán "item_type": "CONSUMER_GOODS"
       + "expiry_date": "Gói bóc lẻ - Không ghi HSD"
       + "is_expired": false
       + "safety_alert": "LƯU Ý: Đây là gói lẻ không ghi hạn sử dụng trên vỏ."
       + "usage_instructions": "Nếu vỏ hộp lớn mua đã lâu hoặc có dấu hiệu bị hỏng, Bác không nên dùng để đảm bảo sức khỏe ạ."
       + "speech_text": "Dạ đây là gói lẻ nên không ghi hạn sử dụng trên vỏ ạ. Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ."
       + TUYỆT ĐỐI KHÔNG khuyên dùng theo chỉ định bác sĩ.
     - Nếu là THUỐC / DƯỢC PHẨM XÉ LẺ (MEDICINE):
       + Gán "item_type": "MEDICINE"
       + "expiry_date": "Vỉ thuốc xé lẻ - Không có HSD"
       + "is_expired": false
       + "safety_alert": "CẢNH BÁO ĐỎ: Vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Tuyệt đối không nên uống nếu không nhớ ngày mua!"
       + "usage_instructions": "Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ."
       + "speech_text": "Bác ơi, đây là vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Để đảm bảo an toàn tuyệt đối cho sức khỏe, nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối KHÔNG NÊN UỐNG liều thuốc này ạ!"

4. XỬ LÝ LINH HOẠT TRƯỜNG 'HƯỚNG DẪN CÁCH DÙNG / LỜI KHUYÊN' (usage_instructions):
   - Nếu là MEDICINE bình thường (không phải vỉ xé lẻ):
     * Có liều dùng rõ ràng trên ảnh -> Đọc rõ liều dùng (ví dụ: "Uống 1 viên sau khi ăn sáng no ạ.").
     * Không thấy liều dùng -> BẮT BUỘC trả về chính xác: "Bác dùng theo đơn thuốc của bác sĩ hoặc hướng dẫn trên bao bì ạ."
   - Nếu là CONSUMER_GOODS (Bánh/Nước/Thực phẩm/Đồ tiêu dùng):
     * Trả về cách ăn/uống hoặc bảo quản/sử dụng (Ví dụ: "Bóc vỏ ăn trực tiếp, bảo quản nơi khô ráo thoáng mát ạ." hoặc "Dùng ngoài da để gội đầu, tránh để bọt dính vào mắt ạ.").
   - Nếu là PERSONAL_ITEM (Ví/Điện thoại/Chìa khóa/Mắt kính/Đồ cá nhân):
     * TUYỆT ĐỐI KHÔNG KHUYÊN DÙNG THEO BÁC SĨ HOẶC UỐNG THUỐC.
     * Trả về lời nhắc tiện ích thân thương (Ví dụ:
       - Với Ví tiền: "Bác nhớ cất ví vào túi hoặc kệ quen thuộc kẻo quên ạ!"
       - Với Điện thoại: "Điện thoại của Bác, Bác nhớ sạc pin nếu thấy báo yếu ạ!"
       - Với Chìa khóa: "Chìa khóa của Bác, Bác nhớ móc vào chỗ quen để khi cần dễ tìm ạ!"
       - Với Kính mắt: "Kính mắt của Bác, Bác nhớ cất vào hộp hoặc để mặt bàn quen thuộc ạ!"
       - Với Đồ cá nhân khác: "Đồ dùng cá nhân của Bác, Bác nhớ cất gọn gàng vào nơi quen thuộc để dễ lấy ạ!").

5. XỬ LÝ HẠN SỬ DỤNG BÌNH THƯỜNG (EXP / MFG):
   - Nếu là PERSONAL_ITEM: Gán "expiry_date": "Không áp dụng", "is_expired": false.
   - Nếu là MEDICINE hoặc CONSUMER_GOODS có HSD:
     * So sánh Hạn sử dụng (EXP) tìm thấy với NGÀY HIỆN TẠI (${currentDateStr}).
     * Nếu HẠN SỬ DỤNG < NGÀY HIỆN TẠI: Gán "is_expired": true và tạo LỜI CẢNH BÁO BÁO ĐỘNG trong lời thoại và safety_alert.
     * Chấp nhận tất cả định dạng ngày: DD/MM/YYYY, MM/DD/YYYY, YYYY.MM.DD, EXP0526, MFG/EXP.
     * Nếu không tìm thấy hoặc bị mờ trên ảnh bình thường (không phải mặt trước hay gói lẻ): Gán "expiry_date": "Không tìm thấy", "is_expired": false.

6. CẢNH BÁO AN TOÀN (safety_alert):
   - Điền thông tin khi có cảnh báo nguy hiểm thực sự (như sản phẩm hết hạn, thuốc xé lẻ mất HSD, hoặc cảnh báo chống chỉ định).
   - Nếu sản phẩm bình thường hoặc là đồ cá nhân an toàn, để chuỗi rỗng: "".

7. XỬ LÝ CÁC EDGE CASES KHÁC (Ảnh mờ, Lóa sáng, Run tay, Bấm nhầm):
   - Nếu ảnh quá lóa, bị mất nét do run tay, hoặc không thấy rõ chữ: Gán "status": "unclear", speech_text: "Bác ơi, ảnh bị lóa hoặc mờ nét rồi. Bác giữ chắc tay và chụp lại giúp cháu ạ."
   - Nếu không tìm thấy vật thể/sản phẩm: Gán "status": "not_found", "item_type": "UNKNOWN", speech_text: "Dạ thưa Bác, cháu chưa tìm thấy đồ vật trong ảnh. Bác đưa đồ vật lại gần camera và chụp lại giúp cháu ạ."
   - Nếu đọc được rõ ràng: Gán "status": "success".

8. FORMAT ĐỌC THẠO MỒNG MỘT (speech_text):
   - Lời thoại phải NGẮN GỌN (dưới 40 từ), lễ phép (dùng "Bác", "Cháu"), đọc chậm rãi.
   - QUY TẮC NGÔN TỪ: Tuyệt đối KHÔNG dùng "nhé ạ" hay "nhé", cuối câu luôn dùng từ "ạ" (hoặc "ạ!").
   - Phiên âm tên tiếng Anh khó đọc sang cách đọc tiếng Việt dễ hiểu (Ví dụ: iPhone -> Ai-phôn, Nokia -> Nô-ki-a, Paracetamol -> Pa-ra-se-ta-mol, Panadol -> Pa-na-đon, Amlodipine -> Am-lô-đi-pin, Sunsilk -> Săn-sêu).
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
            enum: ["success", "unclear", "not_found", "need_second_side", "individual_pack", "cross_product_mismatch"],
            description: "Trạng thái phân tích: 'success', 'need_second_side' (chụp mặt trước thiếu HSD), 'individual_pack' (gói lẻ bóc ra), 'cross_product_mismatch' (chụp nhầm đồ ở mặt 2), 'unclear' (ảnh mờ/lóa/run), hoặc 'not_found'",
          },
          item_type: {
            type: Type.STRING,
            enum: ["MEDICINE", "CONSUMER_GOODS", "PERSONAL_ITEM", "UNKNOWN"],
            description: "Nhóm đồ vật: 'MEDICINE', 'CONSUMER_GOODS', 'PERSONAL_ITEM', hoặc 'UNKNOWN'",
          },
          item_name: {
            type: Type.STRING,
            description: "Tên sản phẩm/đồ vật rõ ràng, kèm phiên âm nếu là tiếng Anh",
          },
          expiry_date: {
            type: Type.STRING,
            description: "Hạn sử dụng DD/MM/YYYY, 'Không tìm thấy' hoặc 'Không áp dụng'",
          },
          is_expired: {
            type: Type.BOOLEAN,
            description: "true nếu HSD trước ngày hiện tại, false nếu còn hạn hoặc không áp dụng",
          },
          usage_summary: {
            type: Type.STRING,
            description: "Tóm tắt công dụng / lợi ích / chức năng chính của đồ vật trong 1 câu ngắn gọn",
          },
          usage_instructions: {
            type: Type.STRING,
            description: "Hướng dẫn cách dùng / liều lượng / lời nhắc tiện ích theo quy tắc từng loại đồ vật.",
          },
          safety_alert: {
            type: Type.STRING,
            description: "Cảnh báo nguy hiểm hoặc lưu ý đặc biệt nếu có. Để rỗng '' nếu không có cảnh báo nào.",
          },
          speech_text: {
            type: Type.STRING,
            description: "Đoạn văn hoàn chỉnh dưới 40 từ để ứng dụng đọc thành tiếng cho người già nghe, kết thúc bằng từ 'ạ'",
          },
        },
        required: [
          "status",
          "item_type",
          "item_name",
          "expiry_date",
          "is_expired",
          "usage_summary",
          "usage_instructions",
          "safety_alert",
          "speech_text",
        ],
      };

      // Performance & Routing:
      // When in side 2 (searching specifically for HSD OCR) or scanMode === 'EXPIRATION_FOCUS',
      // prioritize gemini-3.1-flash-lite for ultra-fast, cost-efficient OCR.
      const candidateModels = isSecondSideMode || scanMode === "EXPIRATION_FOCUS"
        ? [
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest",
          ]
        : [
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest",
          ];

      let lastError: any = null;
      let parsedData: any = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`Analyzing image with model: ${modelName}... (Step: ${step || 1}, Side2: ${isSecondSideMode})`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contents },
            config: {
              systemInstruction:
                "Bạn là Trợ lý AI đọc chữ dành cho người cao tuổi và người mắt kém tại Việt Nam. Phân tích chính xác theo từng loại đồ vật và trả về JSON thuần theo schema.",
              responseMimeType: "application/json",
              responseSchema: responseSchemaConfig,
            },
          });

          const resultText = response.text?.trim();
          if (resultText) {
            const rawJson = JSON.parse(resultText);

            // Normalize & populate complete structure
            const status = rawJson.status || "success";
            let rawType = (rawJson.item_type || "").toUpperCase();
            if (rawType.includes("MEDICINE") || rawType.includes("THUỐC")) {
              rawType = "MEDICINE";
            } else if (rawType.includes("PERSONAL") || rawType.includes("VÍ") || rawType.includes("ĐIỆN THOẠI") || rawType.includes("CHÌA KHÓA")) {
              rawType = "PERSONAL_ITEM";
            } else if (rawType.includes("CONSUMER") || rawType.includes("FOOD")) {
              rawType = "CONSUMER_GOODS";
            } else if (rawType === "UNKNOWN") {
              rawType = "UNKNOWN";
            } else {
              rawType = "CONSUMER_GOODS";
            }

            const itemType = rawType;
            const itemName = rawJson.item_name || (previousItemName || "Sản phẩm");
            const isPersonalItem = itemType === "PERSONAL_ITEM";
            const isNeedSecondSide = status === "need_second_side";
            const isIndividualPack = status === "individual_pack";
            const isCrossMismatch = status === "cross_product_mismatch";

            const expiryDate = isPersonalItem
              ? "Không áp dụng"
              : isNeedSecondSide
              ? "Cần lật mặt sau/đáy"
              : isIndividualPack
              ? (itemType === "MEDICINE" ? "Vỉ thuốc xé lẻ - Không có HSD" : "Gói bóc lẻ - Không ghi HSD")
              : (rawJson.expiry_date || "Không tìm thấy");

            const isExpired = isPersonalItem || isNeedSecondSide || isIndividualPack || isCrossMismatch
              ? false
              : Boolean(rawJson.is_expired);

            const usageSummary = rawJson.usage_summary || "";

            let defaultUsageInstructions = "";
            if (isIndividualPack) {
              if (itemType === "MEDICINE") {
                defaultUsageInstructions = "Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ.";
              } else {
                defaultUsageInstructions = "Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.";
              }
            } else if (isNeedSecondSide) {
              defaultUsageInstructions = "Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại để xem hạn sử dụng ạ.";
            } else if (isCrossMismatch) {
              defaultUsageInstructions = `Bác vui lòng lấy đúng ${previousItemName || 'sản phẩm lúc nãy'} và chụp lại mặt sau ạ.`;
            } else if (itemType === "MEDICINE") {
              defaultUsageInstructions = "Bác dùng theo đơn thuốc của bác sĩ hoặc hướng dẫn trên bao bì ạ.";
            } else if (itemType === "PERSONAL_ITEM") {
              defaultUsageInstructions = "Bác nhớ cất gọn gàng vào nơi quen thuộc để dễ tìm khi cần ạ!";
            } else {
              defaultUsageInstructions = "Bảo quản nơi khô ráo thoáng mát và sử dụng theo hướng dẫn ạ.";
            }

            let usageInstructions = rawJson.usage_instructions || (status === "success" || isIndividualPack ? defaultUsageInstructions : "");
            
            // Clean up any unwanted 'nhé ạ' phrases to 'ạ'
            usageInstructions = usageInstructions.replace(/nhé\s+ạ/gi, "ạ").replace(/nhé\s+bác/gi, "Bác ạ");

            let safetyAlert = rawJson.safety_alert || "";
            if (isExpired) {
              safetyAlert = `CẢNH BÁO NGUY HIỂM: Sản phẩm ĐÃ HẾT HẠN SỬ DỤNG (${expiryDate})!`;
            } else if (isIndividualPack) {
              if (itemType === "MEDICINE") {
                safetyAlert = "CẢNH BÁO ĐỎ: Vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Tuyệt đối không nên uống nếu không nhớ ngày mua!";
              } else {
                safetyAlert = "LƯU Ý: Đây là gói lẻ không ghi hạn sử dụng trên vỏ.";
              }
            } else if (isCrossMismatch) {
              safetyAlert = `Hình như Bác đang chụp một sản phẩm khác với ${previousItemName || 'mặt trước lúc nãy'}.`;
            }
            safetyAlert = safetyAlert.replace(/nhé\s+ạ/gi, "ạ");

            let speechText = rawJson.speech_text || "";
            if (!speechText) {
              if (isCrossMismatch) {
                speechText = `Hình như Bác đang chụp một sản phẩm khác rồi ạ. Bác kiểm tra lại đúng ${previousItemName || 'hộp sản phẩm'} lúc nãy để cháu đọc lại ạ!`;
              } else if (isNeedSecondSide) {
                speechText = `Cháu thấy ${itemName} rồi ạ! Nhưng mặt này chưa thấy hạn sử dụng. Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại giúp cháu ạ!`;
              } else if (isIndividualPack) {
                if (itemType === "MEDICINE") {
                  speechText = "Bác ơi, đây là vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Để đảm bảo an toàn tuyệt đối cho sức khỏe, nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối KHÔNG NÊN UỐNG liều thuốc này ạ!";
                } else {
                  speechText = "Dạ đây là gói lẻ nên không ghi hạn sử dụng trên vỏ ạ. Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.";
                }
              }
            }
            speechText = speechText.replace(/nhé\s+ạ/gi, "ạ").replace(/nhé\s+bác/gi, "Bác ạ");

            const expiryStatus = isPersonalItem
              ? "NOT_APPLICABLE"
              : isExpired
              ? "EXPIRED"
              : (expiryDate && !expiryDate.toLowerCase().includes("không") && !isNeedSecondSide && !isIndividualPack && !isCrossMismatch ? "VALID" : "UNCLEAR");

            parsedData = {
              // Exact requested JSON keys
              status: status,
              item_type: itemType,
              item_name: itemName,
              expiry_date: expiryDate,
              is_expired: isExpired,
              usage_summary: usageSummary,
              usage_instructions: usageInstructions,
              safety_alert: safetyAlert,
              speech_text: speechText,
              is_cross_mismatch: isCrossMismatch,

              // Backward-compatible UI fields
              item_category: itemType === "MEDICINE" ? "MEDICINE" : itemType === "PERSONAL_ITEM" ? "PERSONAL_ITEM" : "CONSUMER_GOODS",
              product_name: itemName,
              primary_purpose: usageSummary,
              primary_function: usageSummary,
              usage_instruction: usageInstructions,
              how_to_use: usageInstructions,
              speech_script: speechText,
              expiration_info: {
                status: expiryStatus,
                expiry_date_text: isPersonalItem
                  ? "Không áp dụng hạn dùng"
                  : isCrossMismatch
                  ? "Chụp nhầm sản phẩm khác"
                  : isNeedSecondSide
                  ? "Cần lật mặt sau / mặt đáy"
                  : isIndividualPack
                  ? (itemType === "MEDICINE" ? "Vỉ thuốc xé lẻ - Không có HSD" : "Gói bóc lẻ - Không ghi HSD")
                  : expiryDate && !expiryDate.toLowerCase().includes("không")
                  ? `HSD: ${expiryDate}`
                  : "Không thấy rõ HSD",
                days_remaining_text: isPersonalItem
                  ? "Đồ dùng cá nhân"
                  : isCrossMismatch
                  ? "Vui lòng chụp lại đúng hộp"
                  : isNeedSecondSide
                  ? "Chưa thấy ngày HSD"
                  : isIndividualPack
                  ? (itemType === "MEDICINE" ? "Cảnh báo an toàn thuốc" : "Cần xem vỏ hộp lớn")
                  : isExpired
                  ? "Đã quá hạn sử dụng"
                  : "Còn hạn sử dụng",
              },
            };
            console.log(`Successfully analyzed item (${itemType}) with status (${status}) using model: ${modelName}`);
            break; // Successfully got parsed response!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed, failing over to next model:`, err?.message || err);
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
