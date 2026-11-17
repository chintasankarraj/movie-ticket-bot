import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import re
import subprocess
import html

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

class TestSecurityHardening(unittest.TestCase):

    def test_no_hardcoded_credentials_in_tracked_files(self):
        """Verify that no tracked file contains known sensitive patterns."""
        cmd = ["git", "grep", "-i", "-E", "[0-9]{9,11}:[A-Za-z0-9_-]{35}"]
        res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 1, f"Found hardcoded token in git files: {res.stdout}")

        # Check for specific user chat ID in tracked files
        cmd_chat = ["git", "grep", "-n", "1836867995"]
        res_chat = subprocess.run(cmd_chat, cwd=PROJECT_ROOT, capture_output=True, text=True)
        self.assertEqual(res_chat.returncode, 1, f"Found hardcoded chat ID in git files: {res_chat.stdout}")

    def test_dotenv_ignored_by_git(self):
        """Verify that .env is explicitly ignored by git."""
        cmd = ["git", "check-ignore", ".env"]
        res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, ".env must be ignored by git")
        self.assertIn(".env", res.stdout.strip())

    def test_dotenv_example_contains_no_real_secrets(self):
        """Verify that .env.example only contains placeholders."""
        example_path = os.path.join(PROJECT_ROOT, ".env.example")
        self.assertTrue(os.path.exists(example_path), ".env.example must exist")
        with open(example_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("9240366318", content)
        self.assertNotIn("1836867995", content)
        self.assertIn("your_telegram_bot_token_here", content)
        self.assertIn("your_numeric_chat_id_here", content)

    def test_github_workflow_references_secrets(self):
        """Verify that ticket_monitor.yml uses secrets and has no hardcoded values."""
        wf_path = os.path.join(PROJECT_ROOT, ".github", "workflows", "ticket_monitor.yml")
        self.assertTrue(os.path.exists(wf_path))
        with open(wf_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("${{ secrets.TELEGRAM_BOT_TOKEN }}", content)
        self.assertIn("${{ secrets.TELEGRAM_CHAT_ID }}", content)
        self.assertNotIn("9240366318", content)
        self.assertNotIn("1836867995", content)

    def test_missing_credentials_fails_safely_monitor(self):
        """Verify that running monitor functions without credentials raises clean SystemExit."""
        with patch.dict(os.environ, {}, clear=True):
            # Also mock non-existent .env
            import monitor
            with patch("monitor.TELEGRAM_BOT_TOKEN", None), patch("monitor.TELEGRAM_CHAT_ID", None):
                with self.assertRaises(SystemExit) as cm:
                    monitor.validate_credentials()
                self.assertIn("CONFIGURATION ERROR", str(cm.exception))

    def test_missing_credentials_fails_safely_monitor_cloud(self):
        """Verify that running monitor_cloud functions without credentials raises clean SystemExit."""
        with patch.dict(os.environ, {}, clear=True):
            import monitor_cloud
            with patch("monitor_cloud.TELEGRAM_BOT_TOKEN", None), patch("monitor_cloud.TELEGRAM_CHAT_ID", None):
                with self.assertRaises(SystemExit) as cm:
                    monitor_cloud.validate_credentials()
                self.assertIn("CONFIGURATION ERROR", str(cm.exception))

    def test_token_masking_in_error_logs(self):
        """Verify mask_token strips sensitive tokens from log messages."""
        import monitor
        secret_token = "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_1234567"
        raw_error = f"HTTPConnectionPool: Max retries exceeded with url: /bot{secret_token}/sendMessage"
        masked = monitor.mask_token(raw_error, secret_token)
        self.assertNotIn(secret_token, masked)
        self.assertIn("[REDACTED_BOT_TOKEN]", masked)

    def test_telegram_html_escaping_prevents_injection(self):
        """Verify that cinema names with HTML special characters are escaped."""
        import monitor
        dangerous_bms = [("PVR & INOX <Luxe> Theatre", "12:15 AM")]
        dangerous_district = [("Cinema 'A' & \"B\" Mall > Standard", "01:00 AM")]
        
        msg = monitor.format_telegram_alert(dangerous_bms, dangerous_district)
        # Verify raw characters are escaped
        self.assertNotIn("<Luxe>", msg)
        self.assertIn("&lt;Luxe&gt;", msg)
        self.assertIn("PVR &amp; INOX", msg)
        self.assertIn("&gt; Standard", msg)
        # Verify valid markup tags still exist
        self.assertIn("<b>12:15 AM</b>", msg)
        self.assertIn("<b>01:00 AM</b>", msg)
        self.assertIn("🚨 <b>TICKETS ALERT", msg)

    @patch("requests.post")
    def test_send_telegram_alert_mocked(self, mock_post):
        """Verify send_telegram_alert makes proper mocked POST call without sending real network traffic."""
        import monitor
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"ok": True, "result": {"message_id": 999}}
        mock_post.return_value = mock_resp

        with patch("monitor.TELEGRAM_BOT_TOKEN", "fake_token_123"), patch("monitor.TELEGRAM_CHAT_ID", "fake_chat_456"):
            result = monitor.send_telegram_alert("<b>Test Alert</b>")
            self.assertTrue(result)
            mock_post.assert_called_once()
            call_url = mock_post.call_args[0][0]
            call_json = mock_post.call_args[1]["json"]
            self.assertEqual(call_url, "https://api.telegram.org/botfake_token_123/sendMessage")
            self.assertEqual(call_json["chat_id"], "fake_chat_456")
            self.assertEqual(call_json["text"], "<b>Test Alert</b>")
            self.assertEqual(call_json["parse_mode"], "HTML")

if __name__ == "__main__":
    unittest.main()
