
// src/services/aiTipService.ts
import { 
  LOCAL_STORAGE_OPENROUTER_API_KEY, 
  LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, 
  DEFAULT_OPENROUTER_MODEL 
} from '../constants';
import type { Language } from '../constants'; // Import Language type

export interface AiTipError {
  key: string; // Translation key
  fallback: string; // Fallback message
  params?: Record<string, string | number>;
}

const generatePrompt = (balance: number, recentTransactionsCount: number, currencyCode: string, currencySymbol: string, language: Language): string => {
  let financialStatusDescription = "stable";
  if (balance < 0) {
    financialStatusDescription = "currently in debt";
  } else if (balance < 100) { // Assuming USD-like scale, adjust if necessary based on currency context
    financialStatusDescription = "on the lower side";
  } else if (balance > 5000) { // Adjust based on currency/user context
    financialStatusDescription = "looking healthy";
  }

  let transactionActivityDescription = "moderate";
  if (recentTransactionsCount < 5) {
    transactionActivityDescription = "low";
  } else if (recentTransactionsCount > 20) {
    transactionActivityDescription = "high";
  }
  
  const languageInstruction = language === 'zh-TW' ? '請以繁體中文回答。' : 'Please respond in English.';

  return `
    You are Clarity, the friendly and insightful AI financial advisor integrated within the ClarityLedger personal finance app. Your goal is to provide encouraging and actionable financial tips to users to help them improve their financial well-being.

    User's Current Financial Snapshot within ClarityLedger:
    - Current Balance: ${currencySymbol}${balance.toFixed(2)} ${currencyCode}
    - Recent Transaction Activity: ${transactionActivityDescription} (${recentTransactionsCount} transactions recently)
    - Derived Financial Status: ${financialStatusDescription}

    Based on this snapshot, provide ONE concise (2-3 sentences maximum), practical, and encouraging financial tip. The tip should be highly relevant to the user's current situation as described.

    Key Guidelines for Your Tip:
    1.  **Actionable:** Suggest a concrete step the user can consider.
    2.  **Relevant to ClarityLedger Users:** Frame advice in a way that aligns with actions someone managing their finances might take (e.g., reviewing spending categories, setting a budget goal, building savings).
    3.  **Specific (Avoid Generic):** Instead of "save more money," suggest *how* or *what to consider* based on their snapshot. For example, if balance is low and activity high, suggest reviewing transaction categories in ClarityLedger to identify areas for potential savings.
    4.  **Encouraging Tone:** Be positive, empathetic, and supportive.
    5.  **Concise:** Strictly 2-3 sentences maximum.
    6.  **No Markdown:** Plain text response only.
    7.  **Language:** ${languageInstruction}

    Example Scenarios:
    -   **Low Balance, High Activity:** "ClarityLedger shows a good amount of recent activity. Have you considered reviewing your expense categories in the app? Pinpointing where most of your spending goes could reveal opportunities to save and help build up your balance. Every small adjustment adds up!"
    -   **Healthy Balance, Low Activity:** "Your balance in ClarityLedger is looking healthy, which is great progress! If you're not already, perhaps explore setting a new savings goal in the app, or consider options for making your money grow, like researching low-risk investments that align with your comfort level."
    -   **In Debt, Moderate Activity:** "Managing debt can be challenging, but tracking it in ClarityLedger is a positive step. Consider reviewing your budget to see if you can allocate a bit more towards payments on the debt with the highest interest rate. Consistent effort, even small, makes a big difference over time!"

    Now, provide a tip for the user described above.
  `;
};


export const getFinancialTip = async (
  balance: number, 
  recentTransactionsCount: number,
  currencyCode: string,
  currencySymbol: string,
  language: Language 
): Promise<string | AiTipError> => {
  const apiKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
  const modelName = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;

  if (!apiKey) {
    return { 
        key: 'aiFinancialTip.errorApiKeyNotSet', 
        fallback: 'API Key for OpenRouter is not set. Please configure it in settings.' 
    };
  }

  const prompt = generatePrompt(balance, recentTransactionsCount, currencyCode, currencySymbol, language);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150, // Max tokens for 2-3 sentences
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Catch if errorData is not JSON
      const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
      const errorCode = errorData?.error?.code || response.status;

      console.error("OpenRouter API Error:", errorCode, errorMessage, errorData);

      if (response.status === 401) {
        return { 
            key: 'aiFinancialTip.errorInvalidApiKey', 
            fallback: 'Invalid OpenRouter API Key. Please check it in settings.' 
        };
      }
      if (response.status === 429) {
        return { 
            key: 'aiFinancialTip.errorRateLimit', 
            fallback: `Rate limit exceeded for OpenRouter model: ${modelName}. Please check your OpenRouter account.`,
            params: { model: modelName }
        };
      }
      return { 
          key: 'aiFinancialTip.errorRequestFailed', 
          fallback: `OpenRouter API request failed for model ${modelName}: ${response.status} - ${errorMessage}`,
          params: { model: modelName, status: response.status, message: errorMessage }
      };
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      console.error("OpenRouter Error: No choices returned", data);
      return { 
        key: 'aiFinancialTip.errorNoChoices',
        fallback: 'The AI model returned no choices. This might be due to content filters or an issue with the model.'
      };
    }
    
    const tipMessage = data.choices[0]?.message?.content?.trim();
    
    if (!tipMessage) {
      console.error("OpenRouter Error: Empty message content", data.choices[0]);
      return {
        key: 'aiFinancialTip.errorEmptyMessage',
        fallback: 'The AI model returned an empty message. Please try again.'
      };
    }
    
    return tipMessage;

  } catch (error: any) {
    console.error("Error fetching financial tip:", error);
    // Check if it's a network error (fetch throws TypeError for network issues)
    if (error instanceof TypeError && error.message === "Failed to fetch") { // Common browser message
        return { 
            key: 'aiFinancialTip.errorNetwork', 
            fallback: `Network error when trying to connect to OpenRouter for model ${modelName}. Please check your connection.`,
            params: { model: modelName, message: error.message }
        };
    }
    // Generic error
    return { 
        key: 'aiFinancialTip.errorDefault', 
        fallback: `Sorry, an unexpected error occurred while fetching a tip. ${error.message || ''}`,
        params: { message: error.message || 'Unknown error' }
    };
  }
};
