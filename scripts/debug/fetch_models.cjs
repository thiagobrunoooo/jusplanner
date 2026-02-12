const https = require('https');

const apiKey = process.env.GOOGLE_API_KEY || "YOUR_API_KEY";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            if (jsonData.models) {
                const geminiModels = jsonData.models
                    .filter(m => m.name.includes('gemini'))
                    .map(m => m.name);
                console.log(JSON.stringify(geminiModels, null, 2));
            } else {
                console.log("No models found or error in response:", JSON.stringify(jsonData, null, 2));
            }
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
