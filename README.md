🏥 DocuFlux AI: Next-Gen Medical Documentation
Zero-Trust AI Scribe & Clinical Privacy Layer

DocuFlux AI is a premium medical documentation assistant designed to bridge the gap between patient privacy and physician efficiency. Built for high-stakes clinical environments, it uses AI to transform verbal consultations into structured medical records while giving patients absolute control over their sensitive data.

DocuFlux UI AI Powered Privacy First

✨ Core Features
🎙️ AI Clinical Scribe
Real-time Recognition: Captures doctor-patient dialogue with high accuracy.
Deep Structure Engine: powered by Gemini 2.0 Flash, it extracts symptoms, diagnoses, medical protocols, and pharmaceutical matrices from raw audio.
Artifact Digitization: Allows uploading physical prescription images to attach to the digital record.
🛡️ Zero-Trust Privacy Vault
Unique Patient IDs: Patients are identified by secure 6-character short IDs (e.g., #29c477).
Granular Consent: Patients can selectively authorize data nodes. They can allow a doctor to see their "Diagnosis" but hide their "Medicines" or "Scans".
Backend-Enforced Filtering: Privacy isn't just a UI trick; unauthorized data is physically stripped from API responses by the backend.
📊 Professional Dashboards
Physician Portal: Manage active consultations, track clinical performance, and access verified archives.
Clinical Vault (Patient): A sleek, secure interface for patients to manage their medical legacy and authorize clinical handshakes.
🚀 Quick Start
1. Prerequisites
Node.js: v18+ recommended
MongoDB: A running MongoDB Atlas cluster
AI Access: An OpenRouter API Key
2. Backend Setup
cd backend
npm install
Create a .env file in the backend folder:

PORT=5055
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secure_string
OPENROUTER_API_KEY=your_openrouter_key
Run the server:

node server.js
3. Frontend Setup
cd docuflux-frontend
npm install
npm run dev
The app will be available at http://localhost:5173.

🛠️ Tech Stack
Frontend: React 18, Tailwind CSS, Lucide Icons, Vite
Backend: Node.js, Express, Mongoose
Database: MongoDB Atlas
AI Engine: Google Gemini 2.0 Flash (via OpenRouter)
🏥 How to Use
For Doctors
Initialize Identity: Ask the patient for their 6-character Short ID.
Request Access: Enter the ID to initiate a clinical handshake.
Voice Scribe: Start the recorder during the consultation. Once finished, click "Structure with Flow Engine".
Finalize: Review the AI-generated data, add resolution notes or upload an RX image, and mark the case as "Completed".
For Patients
Dashboard: Log in to see your "Clinical Vault".
Authorize: Any pending requests from doctors will appear in your "Privacy Control" panel.
Control Node: Choose exactly which fields the doctor is allowed to see before clicking "Authorize Channel".
👤 Credits
Design and Developed by Mohsin,Wasif,Furqan,Arya,Tamanna Crafted for the future of digital health.

© 2026 DocuFlux Health Systems • HIPAA Simulation Documentation
