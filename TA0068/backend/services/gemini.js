const formatMedicalData = async (transcript) => {
    console.log("--- 🤖 OPENROUTER SERVICE: REQUEST START ---");
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("❌ CRITICAL: OPENROUTER_API_KEY IS MISSING");
        throw new Error("OPENROUTER_API_KEY is not configured in .env");
    }

    console.log("--- 📝 TRANSCRIPT RECEIVED ---");
    console.log(transcript);

    try {
        console.log("--- 📝 SENDING REQUEST TO OPENROUTER ---");
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:5055", // Required by OpenRouter
                "X-Title": "DocuFlux AI", // Optional but good practice
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a medical documentation assistant. Extract structured medical data from the transcript. Ignore greetings and small talk. Return ONLY valid JSON in the specified format. No markdown, no conversational text."
                    },
                    {
                        "role": "user",
                        "content": `Extract structured medical data from this transcript. Return ONLY valid JSON in this format:
{
  "symptoms": [],
  "diagnosis": "",
  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": ""
    }
  ],
  "advice": ""
}

Transcript:
${transcript}`
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("--- ❌ OPENROUTER API ERROR ---");
            console.error(JSON.stringify(data, null, 2));
            throw new Error(data.error?.message || "OpenRouter API request failed");
        }

        const rawText = data.choices[0].message.content;
        console.log("--- 📥 RAW AI RESPONSE ---");
        console.log(rawText);

        // Robust cleanup for markdown and accidental text
        let cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Find the first { and last } to ensure we only parse the JSON block
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}') + 1;
        if (start === -1 || end === 0) {
            throw new Error("AI response did not contain a valid JSON object");
        }
        cleanText = cleanText.substring(start, end);

        console.log("--- 🧹 CLEANED JSON STRING ---");
        console.log(cleanText);

        const parsedData = JSON.parse(cleanText);
        console.log("--- ✅ PARSED DATA SUCCESS ---");
        
        return parsedData;
    } catch (error) {
        console.error("--- ❌ OPENROUTER SERVICE ERROR ---");
        console.error("Error Message:", error.message);
        throw error;
    }
};

module.exports = { formatMedicalData };
