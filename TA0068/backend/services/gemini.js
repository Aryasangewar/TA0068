const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const formatMedicalData = async (transcript) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are a medical scribe assistant. Convert the following medical consultation transcript into a structured JSON format.
        
        Transcript: "${transcript}"
        
        Strict JSON format:
        {
          "symptoms": ["list of symptoms"],
          "diagnosis": "brief diagnosis",
          "medicines": [
            { "name": "medicine name", "dosage": "dosage", "frequency": "frequency", "duration": "duration" }
          ],
          "advice": "general advice for the patient"
        }
        
        Only return the JSON object, nothing else.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Basic cleaning to ensure only JSON is parsed
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new Error("Failed to process transcript with AI");
    }
};

module.exports = { formatMedicalData };
