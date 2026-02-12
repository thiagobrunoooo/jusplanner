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
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw data:", data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
