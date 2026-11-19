# 💊 MediTrack AI — Smart Daily Medication Reminder & Verification System

TEAM: MIXI
NAME: CHE AHMAD RAHIMI BIN CHE ROZAID
UNIVERSITY: UNIVERSITI TEKNIKAL MALAYSIA MELAKA (UTeM)

DEMO VIDEO: https://drive.google.com/file/d/1t-kw3m7X0q-rGJKEoDpQjhwv1NUuOcs9/view?usp=drivesdk

POSTER: https://drive.google.com/file/d/18GmhnwLY_PJV3ow-jZGMTNIjfK4lCBrV/view?usp=drivesdk

LIVE APP: https://medi-track-medication-tracker.replit.app

MediTrack AI is an interactive, senior-friendly digital application designed to tackle daily medication non-adherence among the elderly and chronic patients. Built with **Python and Streamlit**, this prototype serves as a high-fidelity **Proof-of-Concept (PoC)** optimized for the AIMIX: IID 2026 Innovation Competition under Track B4 (Digital Applications & Emerging Technologies).

---

## 🌟 Core Features & Implementation Architecture

- **Senior-Optimized Dashboard:** Features large typographic visual elements, a high-contrast dark green aesthetic, and a dynamic circular progress tracker showing real-time daily adherence rates.
- **Simulated Real-Time Alarms:** An integrated background simulation controller that triggers proactive user attention alerts exactly when a dosage window arrives.
- **Audio Accessibility (Text-to-Speech):** Utilizes native HTML5 Web Speech API synthesis to broadcast explicit voice reminders in English (*"Mr. Ahmad, it is 12:00 PM. Please take your Paracetamol tablets now."*) to support visually impaired or forgetful users.
- **AI-Ready Computer Vision Framework:** Leverages system camera hardware hardware via webcam to capture pill graphics. It includes a structured placeholder architecture designed for seamless plug-and-play integration with Multimodal Vision Models (like Google Gemini API / OpenAI Vision API).
- **Dynamic State Management:** Once a user completes a verified pill intake, the application dynamically increments data arrays, re-adjusts progress indicators from 2/3 to 3/3, and commits logs to the system repository.
- **Caregiver Escalation System (SOS):** Features an automated emergency safety layout that simulates dispatching SMS notifications to a designated caregiver's mobile phone if a patient misses critical daily doses.

---

## 🛠️ Tech Stack & Language Architecture

- **Language:** 100% Python (`main.py`)
- **UI Framework:** Streamlit Framework (optimized for cross-platform desktop/mobile viewport rendering)
- **Accessibility Logic:** Native JavaScript Web Speech Synthesis API injected via Streamlit Components
- **Hosting Workspace:** Replit Sandbox Cloud Environment

---

## 🚀 How to Run the App Locally

To test or evaluate this source code on your local system, ensure you have Python installed and execute the following commands in your terminal:

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd meditrack-ai
   ```

2. **Install the required dependencies:**
   ```bash
   pip install streamlit
   ```

3. **Launch the application server:**
   ```bash
   streamlit run main.py
   ```

Open `http://localhost:8501` in your browser viewport to interact with the system.

---

## 🌍 Alignment with Sustainable Development Goals (SDGs)

This innovation directly supports **SDG Goal 3: Good Health and Well-being** by drastically reducing domestic medical dosing mistakes, improving treatment outcomes for independent senior citizens, and delivering remote peace of mind to family caregivers.

*Developed for academic innovation evaluation purposes — AIMIX: IID 2026. Powered by Gemini Vision API Framework Core.*
