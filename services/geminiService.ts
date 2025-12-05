import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { Expense, ExpenseCategory } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI
const ai = new GoogleGenAI({ apiKey });

const expenseSchema = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The cost of the expense" },
    category: { type: Type.STRING, description: "One of: Food, Transport, Housing, Entertainment, Shopping, Utilities, Health, Other. Infer the best fit." },
    date: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
    description: { type: Type.STRING, description: "A brief description of what was purchased" }
  },
  required: ["amount", "category", "date", "description"]
};

// Tool Definition for Adding Expenses
const addExpenseTool: FunctionDeclaration = {
  name: "addExpense",
  description: "Add a new expense to the user's tracker. Use this when the user explicitly asks to add, log, or record an expense.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The amount spent." },
      category: { 
        type: Type.STRING, 
        description: "Category of expense. Match to one of: Food, Transport, Housing, Entertainment, Shopping, Utilities, Health, Other." 
      },
      description: { type: Type.STRING, description: "What was purchased." },
      date: { type: Type.STRING, description: "Date of purchase (YYYY-MM-DD). Use today's date if not specified." }
    },
    required: ["amount", "category", "description", "date"]
  }
};

export const parseExpenseNaturalLanguage = async (text: string): Promise<Partial<Expense> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract expense details from this text: "${text}". If the year is not specified, assume current year: ${new Date().getFullYear()}. Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

export const parseExpenseImage = async (base64Data: string, mimeType: string): Promise<Partial<Expense> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this receipt/image and extract expense details. Return a JSON object. If the date is missing or unclear, use today's date: ${new Date().toISOString().split('T')[0]}.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Parse Error:", error);
    return null;
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const generateAssistantResponse = async (
  history: ChatMessage[],
  expenses: Expense[],
  currentInput: string
): Promise<any> => {
  try {
    // Context preparation
    const contextData = expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50)
      .map(e => `${e.date}: ₹${e.amount} for ${e.description} (${e.category})`)
      .join('\n');

    const systemInstruction = `
      You are "SpendSmart", a witty, creative, and super supportive personal finance AI.
      
      YOUR DATA (User's recent expenses):
      ${contextData || "No recent expenses found."}
      
      Current Date: ${new Date().toISOString().split('T')[0]}

      INSTRUCTIONS:
      1. **Tone**: Friendly, fun, emoji-loving (💸, 🍕, 🚀).
      2. **Capabilities**: You can analyze spending AND help add new expenses.
      3. **Adding Expenses**: If the user wants to add an expense, CALL the 'addExpense' tool. Do not just say you will do it.
      4. **Insights**: If asked about spending, spot trends and give advice.
      5. **Currency**: Indian Rupees (₹).
    `;

    // Convert simple history to Gemini Content format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: currentInput }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [addExpenseTool] }]
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    throw error;
  }
};