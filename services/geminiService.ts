import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AISuggestions, Customer, CompanyAnalysis, InvoiceData, AIJournalSuggestion, User, ApplicationCode, Estimate, EstimateItem, Lead, ApprovalRoute, Job, LeadStatus, LeadScore, JournalEntry } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = "gemini-2.5-flash";

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

const estimateDraftSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "見積の件名。ユーザーの依頼から推測する。例: A4チラシ印刷の件" },
        items: {
            type: Type.ARRAY,
            description: "見積の明細項目リスト",
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING, description: "項目の区分。'paper' (用紙), 'print' (印刷), 'design' (デザイン), 'finishing' (加工), 'other' (その他) のいずれか。" },
                    content: { type: Type.STRING, description: "品目や作業内容。例: コート90kg, 両面カラー印刷" },
                    quantity: { type: Type.INTEGER, description: "数量" },
                    unit: { type: Type.STRING, description: "単位 (例: 枚, 式, 連)" },
                    unitPrice: { type: Type.NUMBER, description: "単価" },
                    price: { type: Type.NUMBER, description: "金額 (数量 x 単価)" },
                    cost: { type: Type.NUMBER, description: "この項目の原価。単価の約40-60%が一般的。" },
                    costRate: { type: Type.NUMBER, description: "原価率 (原価 / 金額)。0から1の間の数値。" },
                    subtotal: { type: Type.NUMBER, description: "小計。この項目では金額と同じ。" },
                },
                required: ["division", "content", "quantity", "unit", "unitPrice", "price", "cost", "costRate", "subtotal"]
            }
        },
        total: { type: Type.NUMBER, description: "全明細の金額の合計" },
        notes: { type: Type.STRING, description: "納期や支払い条件など、見積に関する補足事項。" }
    },
    required: ["title", "items", "total", "notes"]
};

export const draftEstimate = async (prompt: string): Promise<Partial<Estimate>> => {
    try {
        const fullPrompt = `あなたは印刷会社の営業アシスタントです。ユーザーからの自然言語による依頼を解釈し、詳細な見積書の下書きを作成してください。

### ユーザーの依頼
"${prompt}"

### 指示
- 依頼内容から、件名と、必要と思われる複数の明細項目（用紙、印刷、デザイン、加工費など）を洗い出してください。
- 印刷業界の標準的な価格設定を考慮し、各項目の数量、単価、金額、原価を現実的な数値で算出してください。
- 原価率は一般的に40%から60%の範囲です。
- 備考として、一般的な納期や支払い条件を記載してください。
- 最終的な出力は、指定されたJSONスキーマに厳密に従ってください。`;

        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: estimateDraftSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Partial<Estimate>;

    } catch (error) {
        console.error("Error calling Gemini API for estimate draft:", error);
        throw new Error("AIによる見積下書きの生成に失敗しました。");
    }
};


const extractInvoiceSchema = {
  type: Type.OBJECT,
  properties: {
    vendorName: { type: Type.STRING, description: "請求書の発行元企業名または個人名。" },
    invoiceDate: { type: Type.STRING, description: "請求書の発行日 (YYYY-MM-DD形式)。" },
    totalAmount: { type: Type.NUMBER, description: "請求書の合計金額。" },
    description: { type: Type.STRING, description: "請求内容の概要。品目やサービス内容を簡潔にまとめる。" },
    costType: { type: Type.STRING, description: "費用の種類を推測する。変動費なら'V'、固定費なら'F'。", enum: ['V', 'F'] },
    account: { type: Type.STRING, description: "この費用に最も適した勘定科目を推測する。例:「会議費」「消耗品費」" },
    relatedCustomer: { type: Type.STRING, description: "関連する顧客名。もしあれば。" },
    project: { type: Type.STRING, description: "関連するプロジェクト名。もしあれば。" },
  },
  required: ["vendorName", "invoiceDate", "totalAmount", "description", "costType", "account"],
};

export const extractInvoiceDetails = async (base64Image: string, mimeType: string): Promise<InvoiceData> => {
  try {
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const textPart = { text: `添付された画像から請求書情報を抽出し、JSON形式で返してください。特に発行元、発行日、合計金額、内容、そして費用が変動費(V)か固定費(F)かを推測してください。また、摘要から勘定科目を推測してください。` };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: extractInvoiceSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    return {
      vendorName: parsed.vendorName || '',
      invoiceDate: parsed.invoiceDate || '',
      totalAmount: parsed.totalAmount || 0,
      description: parsed.description || '',
      costType: parsed.costType || 'V',
      account: parsed.account || '',
      relatedCustomer: parsed.relatedCustomer || '',
      project: parsed.project || '',
    };

  } catch (error) {
    console.error("Error calling Gemini API for invoice extraction:", error);
    throw new Error("AIによる請求書情報の抽出に失敗しました。");
  }
};


const suggestJournalSchema = {
  type: Type.OBJECT,
  properties: {
    account: { type: Type.STRING, description: "取引に最も適した勘定科目。" },
    description: { type: Type.STRING, description: "取引の簡潔な説明（摘要）。" },
    debit: { type: Type.NUMBER, description: "借方金額。貸方の場合は0。" },
    credit: { type: Type.NUMBER, description: "貸方金額。借方の場合は0。" },
  },
  required: ["account", "description", "debit", "credit"],
};

export const suggestJournalEntry = async (prompt: string): Promise<AIJournalSuggestion> => {
  try {
    const fullPrompt = `以下のユーザーの自然言語入力に基づいて、単一の仕訳エントリを提案してください。借方と貸方のどちらか一方のみに金額が入るようにしてください。
    ユーザー入力: "${prompt}"`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestJournalSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AIJournalSuggestion;
  } catch (error) {
    console.error("Error calling Gemini API for journal entry:", error);
    throw new Error("AIによる仕訳提案の取得に失敗しました。");
  }
};


const companyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        swot: { type: Type.STRING, description: "顧客企業のSWOT分析（強み、弱み、機会、脅威）。箇条書きで簡潔に。"},
        painPoints: { type: Type.STRING, description: "顧客が抱えていそうな課題（ペインポイント）。箇条書きで。"},
        potentialNeeds: { type: Type.STRING, description: "ペインポイントから考えられる、印刷物に関する潜在的なニーズ。箇条書きで。"},
        salesStrategy: { type: Type.STRING, description: "潜在ニーズに基づいた具体的な営業戦略や提案内容のアイデア。箇条書きで。"}
    },
    required: ["swot", "painPoints", "potentialNeeds", "salesStrategy"]
};

export const analyzeCompany = async (customer: Customer): Promise<CompanyAnalysis> => {
    try {
        const prompt = `
        あなたは経験豊富な印刷業界の営業コンサルタントです。
        以下の顧客情報に基づいて、営業戦略を立案するための分析を行ってください。

        ### 顧客情報
        - 企業名: ${customer.customerName}
        - 業種: (情報があれば)
        - 従業員数: ${customer.employeesCount}
        - 年商: ${customer.annualSales}
        - 事業内容: ${customer.companyContent}
        - 既存の取引履歴やメモ: ${customer.note}
        - 営業情報: ${customer.infoSalesActivity}
        - 抱えている課題(もしあれば): ${customer.infoRequirements}
        
        ### 分析項目
        1. SWOT分析 (Strengths, Weaknesses, Opportunities, Threats)
        2. 想定される課題 (ペインポイント)
        3. 潜在的な印刷ニーズ
        4. 具体的な営業戦略の提案

        分析結果をJSON形式で返してください。
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: companyAnalysisSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CompanyAnalysis;
    } catch (error) {
        console.error("Error calling Gemini API for company analysis:", error);
        throw new Error("AIによる企業分析に失敗しました。");
    }
};

const emailSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING, description: "メールの件名。簡潔で分かりやすく。" },
        body: { type: Type.STRING, description: "メールの本文全体。挨拶、本題、署名を含む。" },
    },
    required: ["subject", "body"],
};

export const generateSalesEmail = async (customer: Customer, userName: string): Promise<{ subject: string; body: string }> => {
    try {
        const prompt = `
        あなたは優秀な印刷会社の営業担当「${userName}」です。
        以下の顧客情報に基づき、新規提案を行うための丁寧でプロフェッショナルなメールの件名と本文を作成してください。

        ### 顧客情報
        - 企業名: ${customer.customerName}
        - 担当者: ${customer.representative || 'ご担当者様'}
        - これまでの取引: ${customer.infoHistory}
        - 潜在的なニーズ(AI分析の結果): ${customer.infoRequirements}
        - 提案したい内容: 新しい商品カタログ、イベント用のチラシ、ブランディング向上のためのパンフレットなど
        
        ### メール作成のポイント
        - 件名は具体的で分かりやすく。
        - 冒頭で自己紹介と関係性を簡潔に述べる。
        - 顧客のビジネスや最近の動向に触れ、関心を示す。
        - 顧客が抱えるであろう課題に寄り添い、その解決策として印刷物を提案する。
        - 具体的な提案内容（例：新しいパンフレットでブランドイメージ向上）を提示する。
        - 最後は、詳しいお話をお伺いしたい旨を伝え、アポイントの打診で締めくくる。
        - 最後に、以下の署名テンプレートをあなたの情報で補完して含めてください。

        ### 署名テンプレート
        +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
        株式会社MQ印刷
        営業部
        ${userName}

        e-mail : [あなたのメールアドレス]
        URL : [会社のウェブサイトURL]

        本社：[会社の住所]
        TEL : [会社の電話番号]　　FAX : [会社のFAX番号]
        +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: emailSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API for sales email:", error);
        throw new Error("AIによる提案メールの作成に失敗しました。");
    }
};

export const generateLeadReplyEmail = async (lead: Lead, userName: string): Promise<{ subject: string, body: string }> => {
    try {
        const prompt = `
        あなたは「株式会社MQ印刷」の優秀な営業担当です。
        以下のリード情報に基づき、丁寧でプロフェッショナルな初回返信メールの件名と本文を作成してください。

        ### リード情報
        - 企業名: ${lead.company}
        - 担当者名: ${lead.name}
        - メールアドレス: ${lead.email}
        - 問い合わせ内容:
        ${lead.message || '具体的な内容は記載されていませんが、資料請求やサービスに関するお問い合わせをいただいています。'}

        ### メール作成のポイント
        - 件名は「【株式会社MQ印刷】お問い合わせありがとうございます」のように、会社名を入れて分かりやすくしてください。
        - 冒頭で、問い合わせてくれたことへの感謝を伝えます。
        - 担当者名を「${userName}」として、自己紹介を簡潔に行います。
        - 問い合わせ内容に具体的に触れ、共感を示します。
        - 次のアクションとして、具体的なヒアリングや打ち合わせの提案をします。いくつか候補日時を提示すると親切です。
        - 最後に、以下の署名テンプレートをあなたの情報で補完して含めてください。
        - 全体的に、堅苦しすぎず、しかし礼儀正しいトーンで作成してください。

        ### 署名テンプレート
        +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
        株式会社MQ印刷
        営業部
        ${userName}

        e-mail : [あなたのメールアドレス]
        URL : [会社のウェブサイトURL]

        本社：[会社の住所]
        TEL : [会社の電話番号]　　FAX : [会社のFAX番号]
        +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+

        最終的な出力は、指定されたJSONスキーマに厳密に従ってください。
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: emailSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API for lead reply email:", error);
        throw new Error("AIによる返信メールの作成に失敗しました。");
    }
};

export const processApplicationChat = async (
    history: { role: 'user' | 'model', content: string }[],
    applicationCodes: ApplicationCode[],
    users: User[],
    approvalRoutes: ApprovalRoute[]
): Promise<string> => {
    const prompt = `
    あなたは企業の申請業務をサポートするAIアシスタントです。ユーザーとの対話を通じて、申請に必要な情報を収集し、最終的に提出可能なJSONオブジェクトを生成します。

    ### 利用可能な申請種別
    ${applicationCodes.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

    ### 利用可能なユーザー (承認者)
    ${users.map(u => `- ${u.name} (ID: ${u.id})`).join('\n')}
    
    ### 利用可能な承認ルート
    ${approvalRoutes.map(r => `- ${r.name} (ID: ${r.id})`).join('\n')}

    ### 会話履歴
    ${history.map(h => `${h.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${h.content}`).join('\n')}

    ### あなたのタスク
    1. ユーザーの意図を汲み取り、どの申請を行いたいかを特定してください。
    2. 申請に必要な情報を、自然な対話を通じて一つずつヒアリングしてください。承認ルートも必ず確認してください。
    3. すべての情報が揃ったら、以下のJSON形式で最終的な結果のみを出力してください。それ以外のテキストは絶対に含めないでください。
    4. 情報が不足している場合は、JSONを出力せず、次は何をヒアリングすべきかをユーザーに質問してください。

    ### 最終出力JSONフォーマット
    {
      "applicationCodeId": "申請種別のID (例: d2a1b3c4...)",
      "approvalRouteId": "承認ルートのID (例: e5f6a7b8...)",
      "formData": {
        // ...申請フォームに応じたキーと値...
      }
    }
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    return response.text;
};

const dashboardSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    suggestion: {
      type: Type.STRING,
      description: "A short, actionable suggestion for the business manager based on the provided data. Max 150 characters. Must be in Japanese.",
    },
  },
  required: ["suggestion"],
};

export const getDashboardSuggestion = async (jobs: Job[]): Promise<string> => {
  try {
    const today = new Date();
    const overdueJobs = jobs.filter(j => j.status !== '完了' && new Date(j.dueDate) < today).length;
    const highMarginJobs = jobs.filter(j => (j.price - j.variableCost) > 100000).length;

    const prompt = `あなたは経営コンサルタントAIです。以下のサマリーデータに基づき、印刷会社の経営者へ簡潔で具体的な行動指示を一つ提案してください。150文字以内で、日本語でお願いします。

    - 期限切れの未完了案件: ${overdueJobs}件
    - 限界利益が10万円を超える高利益案件: ${highMarginJobs}件
    
    例:「期限切れの案件が${overdueJobs}件あります。すぐに対応を検討してください。」 or 「高利益案件が${highMarginJobs}件あります。優先して生産計画を立てましょう。」`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dashboardSuggestionSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed.suggestion || "現在、特別な指示はありません。";
  } catch (error) {
    console.error("Error calling Gemini API for dashboard suggestion:", error);
    // Return a fallback suggestion on error
    return "AIからの提案の取得に失敗しました。";
  }
};

const leadAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    suggestion: {
      type: Type.STRING,
      description: "A short, actionable insight for the sales team based on the lead data. Max 200 characters. Must be in Japanese.",
    },
  },
  required: ["suggestion"],
};

export const analyzeLeadData = async (leads: Lead[]): Promise<string> => {
  if (leads.length === 0) {
    return "分析対象のリードデータがありません。";
  }

  try {
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const untouchedLeads = statusCounts[LeadStatus.Untouched] || 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleUntouchedLeads = leads.filter(
      l => l.status === LeadStatus.Untouched && new Date(l.created_at) < sevenDaysAgo
    ).length;

    const prompt = `あなたは優秀な営業マネージャーです。以下のリードデータサマリーに基づき、営業チームへの簡潔で具体的なアクションにつながる分析コメントを一つ提案してください。200文字以内で、日本語でお願いします。

### リードデータサマリー
- 総リード数: ${leads.length}件
- ステータス別件数: ${JSON.stringify(statusCounts)}
- 未対応リード数: ${untouchedLeads}件
- 7日以上未対応のリード数: ${staleUntouchedLeads}件

分析のポイント：
- 特に「未対応」のリードが多い場合や、長期間放置されているリードがある場合は、その対応を促すコメントを優先してください。
- 各ステータスのバランスを見て、ボトルネックがないか指摘してください。
例: 「未対応リードが${untouchedLeads}件あります。特に7日以上経過している${staleUntouchedLeads}件は早急にコンタクトを取りましょう。」`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: leadAnalysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed.suggestion || "データから特別な提案は見つかりませんでした。";
  } catch (error) {
    console.error("Error calling Gemini API for lead analysis:", error);
    return "AIによる分析に失敗しました。";
  }
};

const leadScoringSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A lead score from 0 to 100, where 100 is the highest quality lead.",
    },
    rationale: {
      type: Type.STRING,
      description: "A brief, bulleted explanation of why this score was given, based on the lead's data. Must be in Japanese.",
    },
  },
  required: ["score", "rationale"],
};

export const scoreLead = async (lead: Lead): Promise<LeadScore> => {
  try {
    const prompt = `
    あなたは印刷会社の営業支援AIです。以下のリード情報に基づいて、リードスコアリングを行ってください。
    スコアは0から100点で評価し、100点が最も成約確度の高いリードです。
    スコアリングの理由も簡潔な箇条書きで説明してください。

    ### リードスコアリングの評価基準
    - **高評価 (+)**:
        - 問い合わせ種別が「見積依頼」「デモ依頼」「導入相談」。
        - メッセージに「至急」「予算」「具体的納期」などの緊急性や具体性を示すキーワードが含まれる。
        - ソースが「紹介」。
        - 企業情報（従業員数、予算など）が具体的。
    - **中評価 (+/-)**:
        - 問い合わせ種別が「サービスに関する質問」「価格に関する問い合わせ」。
        - Webサイトからの流入で、特定のキャンペーン(UTM)情報がある。
    - **低評価 (-)**:
        - 問い合わせ種別が「資料請求」「その他」。
        - メッセージが非常に短い、または曖昧。
        - ソースが不明または一般的なWeb検索。

    ### リード情報
    - 会社名: ${lead.company}
    - 担当者名: ${lead.name}
    - ステータス: ${lead.status}
    - ソース: ${lead.source || '不明'}
    - 問い合わせ種別: ${lead.inquiry_types?.join(', ') || lead.inquiry_type || '不明'}
    - メッセージ: ${lead.message || 'なし'}
    - 従業員数: ${lead.employees || '不明'}
    - 予算感: ${lead.budget || '不明'}
    - UTMキャンペーン: ${lead.utm_campaign || 'なし'}

    上記の情報と評価基準を総合的に判断し、スコアと理由をJSON形式で返してください。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: leadScoringSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    // Ensure score is within range
    parsed.score = Math.max(0, Math.min(100, parsed.score || 0));

    return parsed as LeadScore;

  } catch (error) {
    console.error("Error calling Gemini API for lead scoring:", error);
    // Return a default low score on error
    return {
        score: 0,
        rationale: "AIによるスコアリング中にエラーが発生しました。"
    };
  }
};

export const generateDailyReportSummary = async (customerName: string, activityKeywords: string): Promise<string> => {
    try {
        const prompt = `
        あなたは優秀な営業担当者です。以下の情報に基づいて、簡潔でプロフェッショナルな営業日報の「活動内容」を作成してください。
        箇条書きなどを用いて、分かりやすくまとめてください。

        ### 情報
        - 訪問先・顧客名: ${customerName}
        - 活動内容のキーワード: ${activityKeywords}

        ### 作成例
        **訪問先:** 株式会社ABC商事
        **活動内容:**
        - 新製品「MQ-Solver X」のデモンストレーションを実施。
        - 担当の佐藤部長より、現行システムの課題（コスト、処理速度）についてヒアリング。
        - 次回、具体的な導入効果を試算した提案書を持参する約束を取り付けた。
        - 課題：競合のXYZ社も同様の提案をしている模様。価格面での優位性もアピールする必要がある。
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for daily report summary:", error);
        throw new Error("AIによる日報の要約作成に失敗しました。");
    }
};

export const generateWeeklyReportSummary = async (keywords: string): Promise<string> => {
    try {
        const prompt = `
        あなたは優秀なビジネスパーソンです。以下のキーワードに基づいて、今週の業務内容をまとめたプロフェッショナルな週報を作成してください。
        「今週の成果」「課題」「来週の予定」といったセクションに分けて、箇条書きで分かりやすく記述してください。

        ### 今週の活動キーワード
        ${keywords}

        ### 作成例
        **今週の成果:**
        - 株式会社ABC商事様より、新製品「MQ-Solver X」を正式受注（受注額: 500万円）。
        - 新規リード5件獲得。うち2件は見積提出済み。

        **課題と対策:**
        - Dプロジェクトの進捗に遅れが発生。原因は資材の納期遅延。
        - 対策として、代替サプライヤーと交渉を開始。来週水曜日までには結論を出す予定。

        **来週の予定:**
        - 株式会社XYZ様へ最終提案（月曜日）
        - Eプロジェクトのキックオフミーティング（水曜日）
        - チーム内週次レビュー（金曜日）
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for weekly report summary:", error);
        throw new Error("AIによる週報の要約作成に失敗しました。");
    }
};

export const generateClosingSummary = async (
    period: '月次' | '週次',
    currentJobs: Job[],
    pastJobs: Job[],
    currentJournal: JournalEntry[],
    pastJournal: JournalEntry[]
): Promise<string> => {
    try {
        const currentPQ = currentJobs.reduce((sum, job) => sum + job.price, 0);
        const currentMQ = currentJobs.reduce((sum, job) => sum + (job.price - job.variableCost), 0);
        const currentF = currentJournal.reduce((sum, entry) => sum + (entry.debit > entry.credit ? entry.debit - entry.credit : 0), 0);

        const pastPQ = pastJobs.reduce((sum, job) => sum + job.price, 0);

        const prompt = `
        あなたは会計コンサルタントAIです。以下の${period}の業績データを分析し、経営者向けの簡潔なサマリーレポートを作成してください。
        箇条書きで分かりやすく、重要なポイントに絞って記述してください。

        ### 今${period}のデータ
        - 売上高(PQ): ${currentPQ.toLocaleString()}円
        - 限界利益(MQ): ${currentMQ.toLocaleString()}円
        - 固定費(F): ${currentF.toLocaleString()}円
        - 利益(G): ${(currentMQ - currentF).toLocaleString()}円

        ### 前${period}のデータ
        - 売上高(PQ): ${pastPQ.toLocaleString()}円

        ### レポート作成の指示
        1.  **業績総括:** 売上高、限界利益、最終的な利益について簡潔に述べてください。
        2.  **前期間との比較:** 売上高の変動に焦点を当て、増減の理由を推測してください。
        3.  **特記事項:** 固定費の内訳や、特に利益率の高かった案件など、特筆すべき点があれば指摘してください。
        4.  **次のアクションへの提案:** 分析結果から、次に取り組むべき課題やアクションを1つ提案してください。
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for closing summary:", error);
        throw new Error("AIによる決算サマリーの生成に失敗しました。");
    }
};
