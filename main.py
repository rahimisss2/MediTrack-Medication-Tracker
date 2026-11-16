import streamlit as st
import streamlit.components.v1 as components
import hashlib
import json
import time
from datetime import datetime

# Configure a mobile-friendly page
st.set_page_config(
    page_title="MediTrack AI",
    page_icon="💊",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# --- SIMULATED DATA (DATABASE) ---
if 'schedule' not in st.session_state:
    st.session_state.schedule = [
        {"id": 1, "name": "Metformin (Diabetes)", "time": "08:00 AM", "dose": "1 Tablet", "status": "Not Taken", "color": "White, Round"},
        {"id": 2, "name": "Amlodipine (High Blood Pressure)", "time": "08:00 PM", "dose": "1/2 Tablet", "status": "Not Taken", "color": "Yellow, Rectangular"},
        {"id": 3, "name": "Paracetamol (Pain Relief)", "time": "12:00 PM", "dose": "2 Tablets", "status": "Taken", "color": "White, Oblong"}
    ]

# Demo state is scoped to the current Streamlit session.
for key, default in {
    "alarm_pending": False,
    "speak_alarm": False,
    "scan_item_id": None,
    "scan_results": {},
    "intake_log": [],
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


def simulate_alarm():
    medication = next(s for s in st.session_state.schedule if s["id"] == 1)
    # Replaying an alarm must never undo an already recorded dose.
    if medication["status"] != "Taken":
        medication["status"] = "Next up"
        st.session_state.alarm_pending = True
        st.session_state.speak_alarm = True


def complete_intake(item_id):
    """Only an explicit confirmation records intake, never a camera capture."""
    medication = next(s for s in st.session_state.schedule if s["id"] == item_id)
    if medication["status"] == "Taken":
        return
    if item_id not in st.session_state.scan_results:
        return
    medication["status"] = "Taken"
    st.session_state.intake_log.append({
        "medication_id": item_id,
        "name": medication["name"],
        "taken_at": datetime.now().isoformat(timespec="seconds"),
        "source": "manual confirmation after demo scan",
    })
    if item_id == 1:
        st.session_state.alarm_pending = False
        st.session_state.speak_alarm = False
    st.session_state.scan_item_id = None
    st.session_state.scan_results.pop(item_id, None)


def voice_alert(autoplay):
    message = (
        "Encik Ahmad, waktu ini jam 8:00 pagi. "
        "Sila ambil satu biji ubat Metformin anda sekarang."
    )
    # A manual replay is necessary on browsers that block automatic speech.
    components.html(
        """
        <button id="replay" type="button">Play Malay voice reminder</button>
        <p id="speech-status" role="status"></p>
        <script>
        const status = document.getElementById("speech-status");
        function speak() {
          if (!("speechSynthesis" in window)) {
            status.textContent = "Voice alerts are not supported in this browser.";
            return;
          }
          const speech = new SpeechSynthesisUtterance(MESSAGE);
          speech.lang = "ms-MY";
          speech.rate = 0.85;
          const voice = speechSynthesis.getVoices().find(v => /^ms/i.test(v.lang));
          if (voice) speech.voice = voice;
          speech.onstart = () => status.textContent = "Playing reminder.";
          speech.onend = () => status.textContent = "Reminder finished.";
          speech.onerror = () => status.textContent =
            "Automatic audio may be blocked. Press Play to try again.";
          speechSynthesis.cancel();
          speechSynthesis.speak(speech);
        }
        document.getElementById("replay").addEventListener("click", speak);
        if (AUTOPLAY) {
          status.textContent = "If audio does not play, press Play.";
          speak();
        }
        </script>
        """.replace("MESSAGE", json.dumps(message)).replace(
            "AUTOPLAY", json.dumps(autoplay)
        ),
        height=105,
    )


taken = sum(item["status"] == "Taken" for item in st.session_state.schedule)
total = len(st.session_state.schedule)
adherence = round(100 * taken / total) if total else 0

# --- APP USER INTERFACE (UI) ---
st.title("💊 MediTrack AI")
st.subheader("Smart Medication Reminder & Scanning Hub")
st.caption(
    "Demonstration only. Example medications and doses are not medical advice. "
    "Camera scans do not identify medication or validate dosage. "
    "Follow your prescription and consult a pharmacist when unsure."
)
st.write("---")

# Section 1: Patient Profile & Daily Status
with st.sidebar:
    st.header("👤 Patient Profile")
    st.write("**Patient Name:** Mr. Ahmad")
    st.write("**Age:** 67 Years")
    st.write(f"**Daily Adherence Rate:** {adherence}%")
    with st.expander("Simulation Control"):
        st.caption("Demo alarm only. This does not schedule background reminders.")
        metformin_taken = next(
            s["status"] == "Taken" for s in st.session_state.schedule if s["id"] == 1
        )
        st.button(
            "Simulate 8:00 AM Alarm",
            on_click=simulate_alarm,
            disabled=metformin_taken,
        )
        if metformin_taken:
            st.caption("Metformin is already logged; another alarm will not reset it.")

# Section 2: Medication Schedule (Dashboard)
st.header("📅 Today's Medication Schedule")
if st.session_state.alarm_pending:
    st.warning("⚠️ ATTENTION: It is 8:00 AM. Time to take your Metformin tablet!")
    st.caption("Simulated reminder using the example prescription.")
    voice_alert(st.session_state.speak_alarm)
    st.session_state.speak_alarm = False

# A compact, accessible circular progress indicator; no app theme overrides.
st.image(
    f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"
        role="img" aria-label="{taken}/{total} taken today">
      <circle cx="60" cy="60" r="48" fill="none" stroke="#dce8e2" stroke-width="10"/>
      <circle cx="60" cy="60" r="48" fill="none" stroke="#23634b" stroke-width="10"
        pathLength="100" stroke-dasharray="{100 * taken / total if total else 0} 100"
        transform="rotate(-90 60 60)"/>
      <text x="60" y="66" text-anchor="middle" font-size="24" fill="#23634b">{taken}/{total}</text>
    </svg>""",
    width=120,
)
st.write(f"**{taken}/{total} taken today**")

for item in st.session_state.schedule:
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.write(f"**{item['name']}**")
        st.caption(f"Time: {item['time']} | Dose: {item['dose']}")
    with col2:
        if item['status'] == "Taken":
            st.success("✅ Taken")
        else:
            st.warning("Next up" if item["id"] == 1 else item['status'])
    with col3:
        if item['status'] != "Taken":
            if st.button("Scan Pill with AI", key=f"btn_{item['id']}"):
                st.session_state.scan_item_id = item["id"]
                st.rerun()

    # Keep the scanner immediately inside the selected medication's schedule entry.
    if st.session_state.scan_item_id == item["id"] and item["status"] != "Taken":
        with st.expander("Camera scan — demonstration only", expanded=True):
            st.warning(
                "This is a simulated scan, not medical verification. "
                "It cannot detect the correct medicine or dosage."
            )
            st.info(f"Example appearance for {item['name']}: {item['color']}")
            img_file = st.camera_input(
                "Take a photo for the demo scan", key=f"camera_{item['id']}"
            )
            if img_file is not None:
                fingerprint = hashlib.sha256(img_file.getvalue()).hexdigest()
                if st.session_state.scan_results.get(item["id"]) != fingerprint:
                    # Clear the prior result before a replacement capture is processed.
                    st.session_state.scan_results.pop(item["id"], None)
                    with st.spinner(
                        "AI is analyzing pill features (shape, size, markings)..."
                    ):
                        time.sleep(2)
                    st.session_state.scan_results[item["id"]] = fingerprint
                st.success(
                    "✅ DEMO SCAN SUCCESSFUL: Simulated workflow completed for Mr. Ahmad. "
                    "Medicine identity and dosage have NOT been verified."
                )
                st.caption(
                    "Compare the prescription label yourself. "
                    "Only log intake if you have actually taken your prescribed medication."
                )
                st.button(
                    "Complete & Log Intake",
                    key=f"complete_{item['id']}",
                    on_click=complete_intake,
                    args=(item["id"],),
                )
            else:
                st.session_state.scan_results.pop(item["id"], None)
            if st.button("Cancel scan", key=f"cancel_{item['id']}"):
                st.session_state.scan_item_id = None
                st.session_state.scan_results.pop(item["id"], None)
                st.rerun()
    st.divider()
