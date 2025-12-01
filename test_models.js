import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "YOUR_API_KEY";

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    const modelsToTest = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of modelsToTest) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${modelName} works!`);
            console.log("Response:", result.response.text());
            return; // Stop after finding a working one
        } catch (error) {
            console.error(`FAILED: ${modelName} - ${error.message}`);
        }
    }
}

testModels();
