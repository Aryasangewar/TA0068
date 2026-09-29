// ─── DocuFlux AI Processing Service ─────────────────────────────────────────
// Uses OpenRouter API (Gemini 2.0 Flash) to structure medical transcripts.
// Falls back to a smart keyword-based extractor if no API key is set.

const SYMPTOM_KEYWORDS = [
    'pain', 'fever', 'cough', 'headache', 'nausea', 'vomiting', 'fatigue',
    'dizziness', 'breathlessness', 'chest pain', 'swelling', 'rash', 'itching',
    'diarrhea', 'constipation', 'weakness', 'anxiety', 'insomnia', 'sore throat',
    'runny nose', 'congestion', 'blurred vision', 'hearing loss', 'back pain',
    'joint pain', 'muscle pain', 'frequent urination', 'excessive thirst',
    'weight loss', 'weight gain', 'palpitations', 'bleeding', 'numbness'
];

const COMMON_MEDS = [
    'paracetamol', 'ibuprofen', 'amoxicillin', 'cetirizine', 'metformin',
    'amlodipine', 'atorvastatin', 'omeprazole', 'aspirin', 'losartan',
    'azithromycin', 'doxycycline', 'metronidazole', 'pantoprazole', 'salbutamol'
];

/**
 * Smart fallback parser — extracts basic medical info from plain text without AI.
 */
const generateFallbackData = (transcript) => {
    const lower = transcript.toLowerCase();

    const detectedSymptoms = SYMPTOM_KEYWORDS.filter(s => lower.includes(s))
        .map(s => s.charAt(0).toUpperCase() + s.slice(1));

    const detectedMeds = COMMON_MEDS
        .filter(m => lower.includes(m))
        .map(m => ({
            name: m.charAt(0).toUpperCase() + m.slice(1),
            dosage: 'As prescribed',
            frequency: 'As directed',
            duration: 'As advised'
        }));

    return {
        diagnosis: 'General Clinical Consultation — Pending AI Review',
        symptoms: detectedSymptoms.length > 0 ? detectedSymptoms : ['Symptoms noted in transcript'],
        medicines: detectedMeds.length > 0 ? detectedMeds : [],
        advice: 'Follow physician instructions. Return if symptoms worsen. AI processing unavailable — please add OpenRouter API key.'
    };
};

const formatMedicalData = async (transcript) => {
    console.log('--- 🤖 AI SERVICE: REQUEST START ---');

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your_openrouter_api_key_here' || apiKey.trim() === '') {
        console.warn('⚠️  OpenRouter API key not configured. Using smart fallback parser.');
        return generateFallbackData(transcript);
    }

    console.log('--- 📝 TRANSCRIPT RECEIVED ---');
    console.log(transcript.substring(0, 200) + '...');

    try {
        console.log('--- 📤 SENDING TO OPENROUTER (Gemini 2.0 Flash) ---');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:5055',
                'X-Title': 'DocuFlux AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a medical documentation assistant. Extract structured medical data from the transcript. Ignore greetings and small talk. Return ONLY valid JSON in the specified format. No markdown, no conversational text, no explanations.'
                    },
                    {
                        role: 'user',
                        content: `Extract structured medical data from this transcript. Return ONLY valid JSON:\n{\n  "symptoms": ["string"],\n  "diagnosis": "string",\n  "medicines": [{"name": "string","dosage": "string","frequency": "string","duration": "string"}],\n  "advice": "string"\n}\n\nTranscript:\n${transcript}`
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('--- ❌ OPENROUTER API ERROR ---');
            console.error(JSON.stringify(data, null, 2));
            console.warn('⚠️  Falling back to smart parser due to API error.');
            return generateFallbackData(transcript);
        }

        const rawText = data.choices[0].message.content;
        console.log('--- 📥 RAW AI RESPONSE ---');
        console.log(rawText.substring(0, 300));

        // Robust cleanup for markdown and accidental text
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find the first { and last } to ensure we only parse the JSON block
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}') + 1;

        if (start === -1 || end === 0) {
            console.warn('⚠️  AI response had no valid JSON. Using fallback.');
            return generateFallbackData(transcript);
        }

        cleanText = cleanText.substring(start, end);
        const parsedData = JSON.parse(cleanText);
        console.log('--- ✅ AI PROCESSING SUCCESS ---');
        return parsedData;

    } catch (error) {
        console.error('--- ❌ AI SERVICE ERROR — USING FALLBACK ---');
        console.error('Error:', error.message);
        return generateFallbackData(transcript);
    }
};

module.exports = { formatMedicalData };
