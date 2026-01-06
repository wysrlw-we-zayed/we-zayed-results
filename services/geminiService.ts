
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

export class GeminiService {
  // Always use the named parameter and direct process.env access
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  async chat(history: ChatMessage[], message: string): Promise<string> {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `
      أنت مساعد تعليمي ذكي لمدرسة WE-Zayed للتكنولوجيا التطبيقية.
      أهم تخصصاتنا: البرمجة، الشبكات، والاتصالات.
      عندما يسأل الطالب عن نتيجته، وجهه دائماً لاستخدام "الرقم القومي" المكون من 14 رقماً في صندوق البحث بالصفحة الرئيسية.
      أجب بأسلوب ودود ومهني وبلهجة مصرية مهذبة أو لغة عربية فصحى بسيطة.
      ساعد الطلاب في معرفة المواد الدراسية أو فرص التدريب في شركة WE.
    `;

    try {
      // Use config.systemInstruction for improved guidance
      const response = await this.ai.models.generateContent({
        model,
        contents: [
          ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      // Use the text property (not a method)
      return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
    }
  }
}
