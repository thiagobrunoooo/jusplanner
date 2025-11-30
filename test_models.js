import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyA0dAWgqVC2Tcmz3i5jN4sluuXVFM7AvS0";

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
