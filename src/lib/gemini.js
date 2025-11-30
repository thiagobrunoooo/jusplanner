import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
// We'll handle the missing key case in the UI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: {
            parts: [{
                text: `Você é o JusIA, um assistente jurídico pessoal especializado em Direito Brasileiro.
Seu objetivo é ajudar estudantes de direito e advogados iniciantes a estudar e compreender conceitos jurídicos.

Diretrizes:
1.  **Didática**: Explique conceitos complexos de forma simples, mas técnica.
2.  **Fundamentação**: Sempre cite a legislação pertinente (CF/88, CC, CP, CPC, etc.) e, se possível, súmulas ou jurisprudência consolidada.
3.  **Formatação**: Use Markdown para estruturar sua resposta. Use **negrito** para termos-chave, listas para requisitos ou elementos, e blocos de código para citações longas.
4.  **Questões**: Se o usuário pedir uma questão, crie uma questão inédita estilo OAB/Concursos com 4 alternativas (A, B, C, D) e um gabarito comentado ao final.
5.  **Tom**: Profissional, encorajador e objetivo.

Se o usuário perguntar sobre algo fora do contexto jurídico ou de estudos, gentilmente redirecione para o foco do assistente.`
            }]
        }
    });
}

export const sendMessageToGemini = async (message, history = []) => {
    if (!model) {
        if (import.meta.env.VITE_GEMINI_API_KEY) {
            // Try re-initializing if key was added later (e.g. hot reload)
            genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            model = genAI.getGenerativeModel({
                model: "gemini-2.5-pro",
                systemInstruction: {
                    parts: [{
                        text: `Você é o JusIA, um assistente jurídico pessoal especializado em Direito Brasileiro.
Seu objetivo é ajudar estudantes de direito e advogados iniciantes a estudar e compreender conceitos jurídicos.

Diretrizes:
1.  **Didática**: Explique conceitos complexos de forma simples, mas técnica.
2.  **Fundamentação**: Sempre cite a legislação pertinente (CF/88, CC, CP, CPC, etc.) e, se possível, súmulas ou jurisprudência consolidada.
3.  **Formatação**: Use Markdown para estruturar sua resposta. Use **negrito** para termos-chave, listas para requisitos ou elementos, e blocos de código para citações longas.
4.  **Questões**: Se o usuário pedir uma questão, crie uma questão inédita estilo OAB/Concursos com 4 alternativas (A, B, C, D) e um gabarito comentado ao final.
5.  **Tom**: Profissional, encorajador e objetivo.

Se o usuário perguntar sobre algo fora do contexto jurídico ou de estudos, gentilmente redirecione para o foco do assistente.`
                    }]
                }
            });
        } else {
            throw new Error("API Key não configurada. Por favor, adicione VITE_GEMINI_API_KEY ao seu arquivo .env");
        }
    }

    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro ao falar com o Gemini:", error);
        throw error;
    }
};
