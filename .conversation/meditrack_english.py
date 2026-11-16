import streamlit as st
import time
from datetime import datetime

# Configure a mobile-friendly page
st.set_page_config(page_title="MediTrack AI", page_icon="💊", layout="centered")

# --- SIMULATED DATA (DATABASE) ---
if 'schedule' not in st.session_state:
    st.session_state.schedule = [
        {"id": 1, "name": "Metformin (Diabetes)", "time": "08:00 AM", "dose": "1 Tablet", "status": "Not Taken", "color": "White, Round"},
        {"id": 2, "name": "Amlodipine (High Blood Pressure)", "time": "08:00 PM", "dose": "1/2 Tablet", "status": "Not Taken", "color": "Yellow, Rectangular"},
        {"id": 3, "name": "Paracetamol (Pain Relief)", "time": "12:00 PM", "dose": "2 Tablets", "status": "Taken", "color": "White, Oblong"}
    ]

# --- VOICE NOTIFICATION SCENARIO (ALARM SIMULATION) ---
current_time_now = datetime.now().strftime("%I:%M %p")

# --- APP USER INTERFACE (UI) ---
st.title("💊 MediTrack AI")
st.subheader("Smart Medication Reminder & Scanning Hub")
st.write("---")

# Section 1: Patient Profile & Daily Status
st.sidebar.header("👤 User Profile")
st.sidebar.write("**Name:** Mr. Ahmad")
st.sidebar.write("**Age:** 67 Years")
st.sidebar.write("**Daily Adherence Rate:** 75%")

# Section 2: Medication Schedule (Dashboard)
st.header("📅 Today's Medication Schedule")
for item in st.session_state.schedule:
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.write(f"**{item['name']}**")
        st.caption(f"Time: {item['time']} | Dose: {item['dose']}")
    with col2:
        if item['status'] == "Taken":
            st.success(item['status'])
        else:
            st.warning(item['status'])
    with col3:
        if item['status'] != "Taken":
            if st.button("Verify Medication", key=f"btn_{item['id']}"):
                st.session_state.selected_item = item
                st.rerun()

st.write("---")

# Section 3: AI Scanning Mode (Camera)
if 'selected_item' in st.session_state:
    item = st.session_state.selected_item
    st.header("📸 AI Computer Vision Scanning Camera")
    st.info(f"Please point the camera at your medication: **{item['name']}** ({item['color']})")

    # Use Streamlit's built-in camera component
    img_file = st.camera_input("Take a photo of your medication for AI verification")

    if img_file:
        with st.spinner("AI is analyzing the medication's shape, size, and color..."):
            time.sleep(2)  # Simulate AI API processing

            # Simulate AI recognition logic using medication data
            st.subheader("🔮 Computer Vision API Analysis Results:")
            st.success("✅ VERIFIED: THIS IS THE CORRECT MEDICATION!")
            st.write(f"**Medication Detected:** {item['name']}")
            st.write(f"**Visual Feature Match:** {item['color']} (98.4% Accuracy)")
            st.write(f"**Dosage Instructions:** Please take **{item['dose']}** now with warm water.")

            # Update the status in the simulated database
            for s in st.session_state.schedule:
                if s['id'] == item['id']:
                    s['status'] = "Taken"

            # Finish button
            if st.button("Finish & Log Dose"):
                del st.session_state.selected_item
                st.rerun()
else:
    st.info("💡 Daily Tip: Click 'Verify Medication' on any schedule entry above to activate the AI verification camera.")
