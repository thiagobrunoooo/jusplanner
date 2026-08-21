import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Lista de modelos suportados em ordem de preferência e velocidade (otimizados para Free Tier)
const CANDIDATE_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-flash-latest'
];

const SYSTEM_INSTRUCTION = `Você é o JusIA, um assistente jurídico pessoal de alta performance especializado no Direito Brasileiro.
Seu objetivo é ajudar estudantes de direito, concurseiros e advogados a compreender temas jurídicos, tirar dúvidas e resolver questões.

Diretrizes de Resposta:
1. **Didática e Clareza**: Explique conceitos complexos com facilidade e precisão técnica.
2. **Fundamentação Jurídica**: Cite artigos de lei pertinentes (CF/88, Código Civil, Código Penal, CPC, CPP, CLT, etc.), súmulas e entendimentos dos Tribunais Superiores (STF/STJ).
3. **Formatação Elegante**: Use Markdown com cabeçalhos, **negrito** para termos essenciais, listas ordenadas e bullet points.
4. **Questões e Simulados**: Se o usuário pedir questões, crie questões inéditas estilo OAB / Concursos Públicos com 4 alternativas (A, B, C, D) e forneça o gabarito comentado detalhado.
5. **Tom**: Profissional, prestativo e motivador.`;

export const sendMessageToGemini = async (message, history = []) => {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
        throw new Error("API Key do Gemini não configurada no arquivo .env (VITE_GEMINI_API_KEY).");
    }

    const genAI = new GoogleGenerativeAI(key);
    let lastError = null;

    // Converte o histórico para o formato exigido pela SDK do Gemini
    const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // Tenta sequencialmente os modelos da cadeia de fallback
    for (const modelName of CANDIDATE_MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            });

            const chat = model.startChat({
                history: formattedHistory
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.warn(`[JusIA] Falha no modelo ${modelName}, tentando próximo...`, error.message);
            lastError = error;
        }
    }

    console.error("[JusIA Error Total]:", lastError);
    throw lastError || new Error("Não foi possível conectar ao JusIA no momento. Tente novamente em instantes.");
};
