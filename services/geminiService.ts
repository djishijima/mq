
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AISuggestions } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = "gemini-2.5-flash";

export interface InvoiceData {
    vendorName: string;
    invoiceDate: string;
    totalAmount: number;
    description: string;
}

const suggestJobSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "印刷案件の簡潔でプロフェッショナルなタイトル。例：「カフェオープン記念 A5チラシ」",
    },
    quantity: {
      type: Type.INTEGER,
      description: "この種の案件で一般的または推奨される数量。例：1000",
    },
    paperType: {
      type: Type.STRING,
      description: "提供されたリストから最も適した用紙を選択。",
    },
    finishing: {
      type: Type.STRING,
      description: "提供されたリストから推奨される加工オプションを選択。",
    },
    details: {
      type: Type.STRING,
      description: "色、両面/片面、目的など、仕様を含む案件要件の詳細な説明。",
    },
    price: {
        type: Type.INTEGER,
        description: "この案件の現実的な販売価格（P）。数量、用紙、加工を考慮して見積もってください。例：85000",
    },
    variableCost: {
        type: Type.INTEGER,
        description: "この案件の現実的な変動費（V）。主に用紙代やインク代など。一般的に価格の40-60%程度です。例：35000",
    },
  },
  required: ["title", "quantity", "paperType", "finishing", "details", "price", "variableCost"],
};

export const suggestJobParameters = async (prompt: string, paperTypes: string[], finishingOptions: string[]): Promise<AISuggestions> => {
  try {
    const fullPrompt = `以下の依頼内容に基づき、印刷案件のパラメータを提案してください。
    これは中小規模の印刷会社向けの案件です。
    
    ユーザーの依頼: "${prompt}"

    選択可能な用紙: ${paperTypes.join(', ')}
    選択可能な加工: ${finishingOptions.join(', ')}

    簡潔な案件タイトル、推奨数量、リストから最も適切な用紙と加工オプションを選択し、詳細な説明を作成してください。
    また、案件の仕様に基づいて、現実的な販売価格（P）と変動費（V）を見積もってください。`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestJobSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    return parsedJson as AISuggestions;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("AIからの提案の取得に失敗しました。もう一度お試しください。");
  }
};

const invoiceSchema = {
    type: Type.OBJECT,
    properties: {
        vendorName: {
            type: Type.STRING,
            description: "請求書の発行元会社名または店舗名",
        },
        invoiceDate: {
            type: Type.STRING,
            description: "請求書の発行日 (YYYY-MM-DD形式)",
        },
        totalAmount: {
            type: Type.NUMBER,
            description: "請求書の合計金額（税込）",
        },
        description: {
            type: Type.STRING,
            description: "請求内容の簡潔な説明（例：「印刷用紙の購入」）",
        },
    },
    required: ["vendorName", "invoiceDate", "totalAmount", "description"],
};

export const extractInvoiceDetails = async (base64Image: string, mimeType: string): Promise<InvoiceData> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };

        const textPart = {
            text: "この請求書画像から、発行元、発行日、合計金額、そして内容の簡単な説明を抽出し、指定されたJSONスキーマで返してください。",
        };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as InvoiceData;

    } catch (error) {
        console.error("Error calling Gemini API for invoice extraction:", error);
        throw new Error("請求書の詳細の抽出に失敗しました。画像の品質を確認して、もう一度お試しください。");
    }
};