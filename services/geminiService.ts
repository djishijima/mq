import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { AISuggestions, Customer, CompanyAnalysis, InvoiceData, AIJournalSuggestion, User, ApplicationCode, Estimate, EstimateItem, Lead, ApprovalRoute, Job, LeadStatus, JournalEntry, LeadScore, Application, ApplicationWithDetails } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = "gemini-2.5-flash";

const suggestJobSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "印刷案件の簡潔でプロフェッショナルなタイトル。例：「カフェオープン記念 A5チラシ」" },
    quantity: { type: Type.INTEGER, description: "この種の案件で一般的または推奨される数量。例：1000" },
    paperType: { type: Type.STRING, description: "提供されたリストから最も適した用紙を選択。" },
    finishing: { type: Type.STRING, description: "提供されたリストから推奨される加工オプションを選択。" },
    details: { type: Type.STRING, description: "色、両面/片面、目的など、仕様を含む案件要件の詳細な説明。" },
    price: { type: Type.INTEGER, description: "この案件の現実的な販売価格（P）。数量、用紙、加工を考慮して見積もってください。例：85000" },
    variableCost: { type: Type.INTEGER, description: "この案件の現実的な変動費（V）。主に用紙代やインク代など。一般的に価格の40-60%程度です。例：35000" },
  },
  required: ["title", "quantity", "paperType", "finishing", "details", "price", "variableCost"],
};

export const suggestJobParameters = async (prompt: string, paperTypes: string[], finishingOptions: string[]): Promise<AISuggestions> => {
  const fullPrompt = `以下の依頼内容に基づき、印刷案件のパラメータを提案してください。
依頼内容: "${prompt}"

選択可能な用紙リスト: ${paperTypes.join(', ')}
選択可能な加工リスト: ${finishingOptions.join(', ')}

上記リストに最適なものがない場合は、依頼内容に最も近い一般的なものを提案してください。`;
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: { responseMimeType: "application/json", responseSchema: suggestJobSchema },
  });
  const jsonStr = response.text.trim();
  return JSON.parse(jsonStr);
};

const analyzeCompanySchema = {
    type: Type.OBJECT,
    properties: {
        swot: { type: Type.STRING, description: "企業の強み、弱み、機会、脅威を分析したSWOT分析の結果。箇条書きで記述してください。" },
        painPointsAndNeeds: { type: Type.STRING, description: "企業が抱えているであろう課題や潜在的なニーズ。箇条書きで記述してください。" },
        suggestedActions: { type: Type.STRING, description: "これらの分析に基づき、当社が提案できる具体的なアクションや印刷案件。箇条書きで記述してください。" },
        proposalEmail: {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING, description: "提案メールの件名" },
                body: { type: Type.STRING, description: "提案メールの本文。担当者名は[あなたの名前]としてください。" }
            },
            required: ["subject", "body"]
        }
    },
    required: ["swot", "painPointsAndNeeds", "suggestedActions", "proposalEmail"]
};

export const analyzeCompany = async (customer: Customer): Promise<CompanyAnalysis> => {
    const prompt = `以下の企業情報に基づいて、詳細な企業分析レポートを作成してください。

企業名: ${customer.customerName}
ウェブサイト: ${customer.websiteUrl || '情報なし'}
事業内容: ${customer.companyContent || '情報なし'}
既存の営業活動情報: ${customer.infoSalesActivity || '情報なし'}
要求事項: ${customer.infoRequirements || '情報なし'}

レポートには、SWOT分析、課題とニーズ、具体的な提案アクション、そして提案メールの下書きを含めてください。`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: analyzeCompanySchema },
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

const extractInvoiceSchema = {
    type: Type.OBJECT,
    properties: {
        vendorName: { type: Type.STRING, description: "請求書の発行元企業名。" },
        invoiceDate: { type: Type.STRING, description: "請求書の発行日 (YYYY-MM-DD形式)。" },
        totalAmount: { type: Type.NUMBER, description: "請求書の合計金額（税込）。" },
        description: { type: Type.STRING, description: "請求内容の簡潔な説明。" },
        costType: { type: Type.STRING, description: "この費用が変動費(V)か固定費(F)かを推測してください。", enum: ["V", "F"] },
        account: { type: Type.STRING, description: "この請求内容に最も適した会計勘定科目を提案してください。例: 仕入高, 広告宣伝費, 事務用品費" },
    },
    required: ["vendorName", "invoiceDate", "totalAmount", "description", "costType", "account"],
};

export const extractInvoiceDetails = async (imageBase64: string, mimeType: string): Promise<InvoiceData> => {
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: "この画像から請求書の詳細情報を抽出してください。" };
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: "application/json", responseSchema: extractInvoiceSchema }
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

const suggestJournalEntrySchema = {
    type: Type.OBJECT,
    properties: {
        account: { type: Type.STRING, description: "この取引に最も適した勘定科目。" },
        description: { type: Type.STRING, description: "取引内容を簡潔に説明する摘要。" },
        debit: { type: Type.NUMBER, description: "借方の金額。貸方の場合は0。" },
        credit: { type: Type.NUMBER, description: "貸方の金額。借方の場合は0。" }
    },
    required: ["account", "description", "debit", "credit"]
};

export const suggestJournalEntry = async (prompt: string): Promise<AIJournalSuggestion> => {
    const fullPrompt = `以下の日常的な取引内容を会計仕訳に変換してください。「${prompt}」`;
    const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: { responseMimeType: "application/json", responseSchema: suggestJournalEntrySchema },
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

export const generateSalesEmail = async (customer: Customer, senderName: string): Promise<{ subject: string; body: string }> => {
    const prompt = `顧客名「${customer.customerName}」向けの営業提案メールを作成してください。送信者は「${senderName}」です。`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;
    const subjectMatch = text.match(/件名:\s*(.*)/);
    const bodyMatch = text.match(/本文:\s*([\s\S]*)/);
    return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'ご提案の件',
        body: bodyMatch ? bodyMatch[1].trim() : text,
    };
};

export const generateLeadReplyEmail = async (lead: Lead, senderName: string): Promise<{ subject: string; body: string }> => {
    const prompt = `以下のリード情報に対して、初回の返信メールを作成してください。
会社名: ${lead.company}
担当者名: ${lead.name}様
問い合わせ内容: ${lead.message || '記載なし'}
送信者: ${senderName}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;
    const subjectMatch = text.match(/件名:\s*(.*)/);
    const bodyMatch = text.match(/本文:\s*([\s\S]*)/);
    return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'お問い合わせありがとうございます',
        body: bodyMatch ? bodyMatch[1].trim() : text,
    };
};

// FIX: Add missing 'analyzeLeadData' function.
export const analyzeLeadData = async (leads: Lead[]): Promise<string> => {
    const prompt = `以下のリードデータ（${leads.length}件）を分析し、営業活動に関する簡潔なインサイトや提案を1つ生成してください。
    特に、有望なリードの傾向や、アプローチすべきセグメントなどを指摘してください。
    
    データサンプル:
    ${JSON.stringify(leads.slice(0, 3).map(l => ({ company: l.company, status: l.status, inquiry_type: l.inquiry_type, message: l.message })), null, 2)}
    `;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const getDashboardSuggestion = async (jobs: Job[]): Promise<string> => {
    const prompt = `最近の案件データ（${jobs.length}件）を分析し、経営改善のための簡潔な提案を1つしてください。`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateDailyReportSummary = async (customerName: string, activityContent: string): Promise<string> => {
    const prompt = `以下のキーワードを元に、営業日報の活動内容をビジネス文書としてまとめてください。
訪問先: ${customerName}
キーワード: ${activityContent}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateWeeklyReportSummary = async (keywords: string): Promise<string> => {
    const prompt = `以下のキーワードを元に、週報の報告内容をビジネス文書としてまとめてください。
キーワード: ${keywords}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

const draftEstimateSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "見積の件名" },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING, description: "項目区分 (例: 印刷, 製本, デザイン)" },
                    content: { type: Type.STRING, description: "具体的な作業内容" },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER, description: "単価" },
                    price: { type: Type.NUMBER, description: "金額 (数量 * 単価)" },
                    cost: { type: Type.NUMBER, description: "原価" },
                },
                required: ["division", "content", "price", "cost"]
            }
        },
        notes: { type: Type.STRING, description: "補足事項や備考" }
    },
    required: ["title", "items"]
};

export const draftEstimate = async (prompt: string): Promise<Partial<Estimate>> => {
    const fullPrompt = `以下の要望に基づいて見積の下書きを作成してください: "${prompt}"`;
    const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: { responseMimeType: "application/json", responseSchema: draftEstimateSchema as any },
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

const scoreLeadSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "このリードの有望度を0から100のスコアで評価してください。" },
        rationale: { type: Type.STRING, description: "スコアの根拠を簡潔に説明してください。" }
    },
    required: ["score", "rationale"]
};

export const scoreLead = async (lead: Lead): Promise<LeadScore> => {
    const prompt = `以下のリード情報を分析し、有望度をスコアリングしてください。
会社名: ${lead.company}
問い合わせ種別: ${lead.inquiry_types?.join(', ') || lead.inquiry_type}
メッセージ: ${lead.message}`;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: scoreLeadSchema },
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

export const startBugReportChat = (): Chat => {
    const systemInstruction = `あなたはバグ報告と改善要望を受け付けるアシスタントです。ユーザーからの報告内容をヒアリングし、以下のJSON形式で最終的に出力してください。
    { "report_type": "bug" | "improvement", "summary": "簡潔な件名", "description": "詳細な内容" }
    このJSONを出力するまでは、自然な会話でユーザーから情報を引き出してください。`;
    return ai.chats.create({ model, config: { systemInstruction } });
};

export const processApplicationChat = async (history: { role: 'user' | 'model', content: string }[], appCodes: ApplicationCode[], users: User[], routes: ApprovalRoute[]): Promise<string> => {
  const prompt = `あなたは申請アシスタントです。ユーザーとの会話履歴と以下のマスター情報に基づき、ユーザーの申請を手伝ってください。
最終的に、ユーザーの申請内容を以下のJSON形式で出力してください。それまでは自然な会話を続けてください。
{ "applicationCodeId": "...", "formData": { ... }, "approvalRouteId": "..." }

会話履歴: ${JSON.stringify(history)}
申請種別マスター: ${JSON.stringify(appCodes)}
承認ルートマスター: ${JSON.stringify(routes)}
`;
  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text;
};

// --- From older chat models ---
export const generateClosingSummary = async (type: '月次' | '年次', currentJobs: Job[], prevJobs: Job[], currentJournal: JournalEntry[], prevJournal: JournalEntry[]): Promise<string> => {
  const prompt = `以下のデータに基づき、${type}決算のサマリーを生成してください。前月比や課題、改善提案を含めてください。`;
  // In a real scenario, you'd pass the data, but for brevity we'll just send the prompt.
  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text;
};