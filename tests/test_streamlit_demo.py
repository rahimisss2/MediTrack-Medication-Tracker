"""Fast state-flow checks; these do not replace real browser/camera testing."""
import ast
import copy
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


class State(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


class Context:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False


class StopRender(Exception):
    pass


class DemoTests(unittest.TestCase):
    def setUp(self):
        self.source = Path(__file__).resolve().parents[1].joinpath("main.py").read_text()
        self.code = compile(ast.parse(self.source), "main.py", "exec")
        self.st = types.ModuleType("streamlit")
        self.st.session_state = State()
        self.st.sidebar = Context()
        self.events = []
        self.buttons = {}
        self.photo = None
        for name in [
            "title", "subheader", "caption", "write", "header", "warning",
            "success", "info", "image", "divider", "error", "table",
        ]:
            setattr(self.st, name, self.recorder(name))
        self.st.set_page_config = lambda **_: None
        self.st.expander = self.st.container = lambda *_, **__: Context()
        self.st.spinner = lambda text: self.events.append(("spinner", text)) or Context()
        self.st.columns = lambda *_: [Context(), Context(), Context()]
        self.st.radio = lambda *_, **__: self.st.session_state.get("navigation", "Schedule")
        self.st.button = lambda label, **kw: self.buttons.update({label: kw}) or False
        self.st.camera_input = lambda label, **_: (
            self.events.append(("camera", label)) or self.photo
        )
        self.st.stop = lambda: (_ for _ in ()).throw(StopRender())
        self.st.rerun = lambda: None
        components = types.ModuleType("streamlit.components")
        html = types.ModuleType("streamlit.components.v1")
        html.html = self.recorder("html")
        components.v1 = html
        self.st.components = components
        self.modules = patch.dict(sys.modules, {
            "streamlit": self.st,
            "streamlit.components": components,
            "streamlit.components.v1": html,
        })
        self.modules.start()
        self.addCleanup(self.modules.stop)
        self.namespace = {}
        self.render()

    def recorder(self, name):
        def record(*args, **_):
            self.events.append((name, args[0] if args else None))
        return record

    def render(self):
        self.events.clear()
        self.buttons.clear()
        with patch("time.sleep") as sleep:
            try:
                exec(self.code, self.namespace)
            except StopRender:
                pass
        return sleep

    def click(self, label):
        button = self.buttons[label]
        button["on_click"](*button.get("args", ()))

    def test_noon_alarm_opens_camera_without_changing_intake(self):
        self.assertEqual(self.namespace["taken"], 2)
        before = copy.deepcopy(self.st.session_state.schedule)
        self.click("Simulate 12:00 PM Alarm")
        self.render()
        self.assertIn(("camera", "Pill photo"), self.events)
        self.assertIn(("warning", "⚠️ ATTENTION: It is 12:00 PM. Time to take your Paracetamol tablets!"), self.events)
        speech = next(value for name, value in self.events if name == "html")
        self.assertIn("Mr. Ahmad, it is 12:00 PM. Please take your Paracetamol tablets now.", speech)
        self.assertIn('speech.lang = "en-US"', speech)
        self.assertEqual(before, self.st.session_state.schedule)
        self.assertEqual(self.st.session_state.intake_log, [])

    def test_capture_and_manual_completion_update_history_and_progress(self):
        self.click("Simulate 12:00 PM Alarm")
        self.photo = types.SimpleNamespace(getvalue=lambda: b"demo-photo")
        sleep = self.render()
        sleep.assert_called_once_with(2)
        self.assertIn(("spinner", "AI is analyzing pill features..."), self.events)
        self.assertEqual(self.namespace["taken"], 2)
        self.assertFalse(self.st.session_state.intake_log)
        self.render().assert_not_called()
        self.click("Complete & Log Intake")
        self.render()
        self.assertEqual(self.namespace["taken"], 3)
        self.assertFalse(self.st.session_state.alarm_pending)
        self.namespace["complete_intake"](3)
        self.assertEqual(len(self.st.session_state.intake_log), 1)
        self.st.session_state.navigation = "History"
        self.render()
        rows = next(value for name, value in self.events if name == "table")
        self.assertEqual(rows[0]["Medication"], "Paracetamol")
        self.assertEqual(rows[0]["Status"], "Taken")
        self.assertIn("MYT", rows[0]["Taken on"])
        self.assertIn("not verified by Gemini", rows[0]["Verification"])

    def test_sos_is_only_a_simulation_and_completion_clears_it(self):
        self.click("Simulate Missed Dose Event")
        self.render()
        banner = next(value for name, value in self.events if name == "error")
        self.assertIn("12:00 PM Paracetamol", banner)
        self.assertIn("SIMULATION ONLY", banner)
        self.assertIn("No notification or SMS has actually been sent.", banner)
        self.assertFalse(self.st.session_state.intake_log)
        self.click("Simulate 12:00 PM Alarm")
        self.photo = types.SimpleNamespace(getvalue=lambda: b"demo-photo")
        self.render()
        self.click("Complete & Log Intake")
        self.assertFalse(self.st.session_state.caregiver_sos_pending)

    def test_alarm_from_history_navigates_to_schedule_and_dismisses(self):
        self.st.session_state.navigation = "History"
        self.render()
        self.click("Simulate 12:00 PM Alarm")
        self.assertEqual(self.st.session_state.navigation, "Schedule")
        self.render()
        self.click("Dismiss Alarm")
        self.render()
        self.assertFalse(self.st.session_state.alarm_pending)
        self.assertTrue(any(name == "html" and "speechSynthesis.cancel()" in value
                            for name, value in self.events))


if __name__ == "__main__":
    unittest.main()
