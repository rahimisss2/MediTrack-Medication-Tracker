import streamlit as st
import streamlit.components.v1 as components
import hashlib
import json
import time
from datetime import datetime
from zoneinfo import ZoneInfo

# Configure a mobile-friendly page
st.set_page_config(
    page_title="MediTrack",
    page_icon="💊",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# --- SIMULATED DATA (DATABASE) ---
if 'schedule' not in st.session_state:
    st.session_state.schedule = [
        {"id": 1, "name": "Metformin (Diabetes)", "time": "08:00 AM", "dose": "1 Tablet", "status": "Taken", "color": "White, Round"},
        {"id": 2, "name": "Amlodipine (High Blood Pressure)", "time": "08:00 PM", "dose": "1/2 Tablet", "status": "Taken", "color": "Yellow, Rectangular"},
        {"id": 3, "name": "Paracetamol (Pain Relief)", "time": "12:00 PM", "dose": "2 Tablets", "status": "Next up", "color": "White, Oblong"}
    ]

# Demo state is scoped to the current Streamlit session.
for key, default in {
    "alarm_pending": False,
    "alarm_medication_id": 1,
    "speak_alarm": False,
    "stop_alarm_audio": False,
    "scan_item_id": None,
    "scan_results": {},
    "intake_log": [],
    "caregiver_sos_pending": False,
    "caregiver_sos_at": None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


def simulate_alarm():
    medication = next(s for s in st.session_state.schedule if s["id"] == 1)
    # Replaying an alarm must never undo an already recorded dose.
    if medication["status"] != "Taken":
        medication["status"] = "Next up"
        st.session_state.alarm_medication_id = 1
        st.session_state.alarm_pending = True
        st.session_state.speak_alarm = True
        st.session_state.stop_alarm_audio = False


def simulate_paracetamol_alarm():
    # Demo playback must not reset Paracetamol's already recorded intake.
    st.session_state.alarm_medication_id = 3
    st.session_state.alarm_pending = True
    st.session_state.speak_alarm = True
    st.session_state.stop_alarm_audio = False
    st.session_state.navigation = "Schedule"
    paracetamol = next(s for s in st.session_state.schedule if s["id"] == 3)
    if paracetamol["status"] != "Taken":
        st.session_state.scan_item_id = 3


def dismiss_alarm():
    st.session_state.alarm_pending = False
    st.session_state.speak_alarm = False
    st.session_state.stop_alarm_audio = True


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
        "taken_at": datetime.now(ZoneInfo("Asia/Kuala_Lumpur")).isoformat(timespec="seconds"),
        "status": "Taken",
        "dose": medication["dose"],
        "source": "manual confirmation after demo scan",
        "verification": "Simulated camera scan — not verified by Gemini Vision API",
    })
    if item_id == st.session_state.alarm_medication_id:
        dismiss_alarm()
    if item_id == 3:
        st.session_state.caregiver_sos_pending = False
    st.session_state.scan_item_id = None
    st.session_state.scan_results.pop(item_id, None)


def simulate_missed_dose():
    """Display a demo escalation without contacting any external service."""
    st.session_state.caregiver_sos_pending = True
    st.session_state.caregiver_sos_at = datetime.now(
        ZoneInfo("Asia/Kuala_Lumpur")
    ).isoformat(timespec="seconds")


def history_rows():
    """Newest first; old session entries retain their original provenance."""
    rows = []
    for entry in reversed(st.session_state.intake_log):
        recorded_at = datetime.fromisoformat(entry["taken_at"])
        if recorded_at.tzinfo is not None:
            recorded_at = recorded_at.astimezone(ZoneInfo("Asia/Kuala_Lumpur"))
            zone_label = "MYT"
        else:
            zone_label = "timezone not recorded"
        date_label = (
            f"{recorded_at.strftime('%B')} {recorded_at.day}, "
            f"{recorded_at.year}, {recorded_at.strftime('%I:%M %p').lstrip('0')}"
        )
        rows.append({
            "Medication": entry["name"].split(" (")[0],
            "Status": entry.get("status", "Taken"),
            "Taken on": f"{date_label} ({zone_label})",
            "Dose": entry.get("dose", "Not recorded"),
            "Verification": entry.get(
                "verification", "Simulated camera scan — manual confirmation"
            ),
        })
    return rows


# FUTURE REAL GEMINI API INTEGRATION ARCHITECTURE
# def request_gemini_review(photo_bytes, prescription_reference):
#     # Configure credentials securely on the server, never in browser code.
#     # Send an image and reference to a multimodal service adapter.
#     # Validate the structured response; handle timeouts and uncertain results.
#     # Record actual provider/version/request provenance only after a real call.
#     # Require qualified human review; do not treat visual matching as dose safety.
#     # Keep this demo path separate from genuine provider evidence.
#     raise NotImplementedError("No Gemini service is connected to this prototype.")


def simulate_pill_analysis(item_id, photo_bytes):
    """Cache only a demo workflow result; do not identify a medication."""
    fingerprint = hashlib.sha256(photo_bytes).hexdigest()
    if st.session_state.scan_results.get(item_id) != fingerprint:
        st.session_state.scan_results.pop(item_id, None)
        with st.spinner("AI is analyzing pill features (shape, size, markings)..."):
            time.sleep(2)
        st.session_state.scan_results[item_id] = fingerprint


def voice_alert(autoplay):
    message = (
        "Mr. Ahmad, it is 12:00 PM. Please take your Paracetamol tablets now."
        if st.session_state.alarm_medication_id == 3 else
        "Mr. Ahmad, it is 8:00 AM. Please take your Metformin tablet now."
    )
    # A manual replay is necessary on browsers that block automatic speech.
    components.html(
        r"""
        <button id="replay" type="button">Play English voice reminder</button>
        <p id="speech-status" role="status"></p>
        <script>
        const status = document.getElementById("speech-status");
        function speak() {
          if (!("speechSynthesis" in window)) {
            status.textContent = "Voice alerts are not supported in this browser.";
            return;
          }
          const speech = new SpeechSynthesisUtterance(MESSAGE);
          speech.lang = "en-US";
          speech.rate = 0.9;
          const voices = speechSynthesis.getVoices();
          const voice = voices.find(v => /^en[-_]US$/i.test(v.lang))
            || voices.find(v => /^en\b/i.test(v.lang));
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
st.title("💊 MediTrack")
st.subheader("Smart Medication Reminder & Scanning Hub")
st.caption(
    "Demonstration only. Example medications and doses are not medical advice. "
    "Camera scans do not identify medication or validate dosage. "
    "Follow your prescription and consult a pharmacist when unsure."
)
st.write("---")

# Section 1: Patient Profile & Daily Status
with st.sidebar:
    page = st.radio("Navigation", ["Schedule", "History"], key="navigation")
    st.header("👤 Patient Profile")
    st.write("**Patient Name:** Mr. Ahmad")
    st.write("**Age:** 67 Years")
    st.write(f"**Daily Adherence Rate:** {adherence}%")
    with st.expander("🛠️ Demo Controls", expanded=True):
        st.caption("Demo alarm only. This does not schedule background reminders.")
        st.button(
            "Simulate 12:00 PM Alarm",
            on_click=simulate_paracetamol_alarm,
        )
        st.button(
            "Simulate Missed Dose Event",
            on_click=simulate_missed_dose,
            help="Demonstrates a caregiver escalation. No SMS or notification is sent.",
        )
    st.divider()
    st.caption(
        "Dikutip & Dikuasakan oleh: Gemini Vision API Framework Core for "
        "academic innovation evaluation (AIMIX: IID 2026)."
    )
    st.caption(
        "Attribution disclosure: the line above is the requested academic wording. "
        "Gemini Vision API is not connected or used in this demo; "
        "camera verification is simulated."
    )

# Stop queued or active speech after dismissing an alarm or confirming intake.
if st.session_state.stop_alarm_audio:
    components.html(
        '<script>if ("speechSynthesis" in window) '
        '{ window.speechSynthesis.cancel(); }</script>',
        height=0,
    )
    st.session_state.stop_alarm_audio = False

# Keep urgent escalation visible on both Schedule and History.
if st.session_state.caregiver_sos_pending:
    st.error(
        "🚨 CAREGIVER SOS ALERT — SIMULATION ONLY: Mr. Ahmad has missed his "
        "scheduled 12:00 PM Paracetamol dose in this demo scenario. "
        "An automated alert notification and SMS dispatch are being simulated "
        "for his designated caregiver (Son: +6012-3456789). "
        "No notification or SMS has actually been sent."
    )
    st.caption(f"Demo event time: {st.session_state.caregiver_sos_at} (MYT)")
    if st.button("Dismiss simulated caregiver alert"):
        st.session_state.caregiver_sos_pending = False
        st.rerun()

if st.session_state.alarm_pending:
    if st.session_state.alarm_medication_id == 3:
        st.warning("⚠️ ATTENTION: It is 12:00 PM. Time to take your Paracetamol tablets!")
    else:
        st.warning("⚠️ ATTENTION: It is 8:00 AM. Time to take your Metformin tablet!")
    st.caption("Simulated reminder using the example prescription.")
    voice_alert(st.session_state.speak_alarm)
    st.session_state.speak_alarm = False
    st.button("Dismiss Alarm", on_click=dismiss_alarm)

if page == "History":
    st.header("History")
    st.caption(
        "Intake records from this Streamlit session, newest first. "
        "Records are not saved after the session ends. "
        "The two prefilled example doses are not presented as verified history records."
    )
    rows = history_rows()
    if rows:
        st.table(rows)
    else:
        st.info(
            "No intake has been logged yet. Capture a demo photo on Schedule, "
            "then select Complete & Log Intake to add a timestamped record."
        )
    st.stop()

# Section 2: Medication Schedule (Dashboard)
st.header("📅 Today's Medication Schedule")

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
st.caption(
    "Demo starting state: two sample doses are prefilled as Taken. "
    "This is not a real adherence record or a recommendation to take medication."
)
if st.session_state.alarm_pending and next(
    s["status"] == "Taken" for s in st.session_state.schedule if s["id"] == 3
):
    st.info("Paracetamol is already logged. Replaying the alarm will not record another dose.")


def render_medication_card(item):
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.write(f"**{item['name']}**")
        st.caption(f"Time: {item['time']} | Dose: {item['dose']}")
    with col2:
        if item['status'] == "Taken":
            st.success("✅ Taken")
        else:
            st.warning(item['status'])
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
                "Pill photo", key=f"camera_{item['id']}"
            )
            if img_file is not None:
                simulate_pill_analysis(item["id"], img_file.getvalue())
                st.success(
                    "✅ AI VERIFICATION SIMULATION SUCCESSFUL: Demo scan completed "
                    "for Mr. Ahmad. Medicine identity and dosage have NOT been verified."
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


for item in st.session_state.schedule:
    with st.container(border=True):
        render_medication_card(item)
