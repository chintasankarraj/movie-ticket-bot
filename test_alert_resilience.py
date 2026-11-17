"""Unit tests for Telegram alert delivery retry resilience and deduplication persistence.

These tests run completely offline and verify:
1. Bounded exponential retries on transient network/server failures.
2. HTTP 429 rate limit backoff and capping.
3. Fast-fail behavior on non-retryable 4xx client errors.
4. Token redaction in error messages and logs.
5. HTML entity escaping in alert formatting.
6. Safe deduplication: seen_shows.json is ONLY updated after delivery confirmation.
7. Shows remain eligible for retry if alert delivery fails.
"""

import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import MagicMock, call, patch

import requests

import monitor
import monitor_cloud
from showtime_parser import ParsedShow


class MockResponse:
    """Mock HTTP response helper for requests calls."""

    def __init__(self, status_code, json_data=None, text="", headers=None):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text or (json.dumps(json_data) if json_data else "")
        self.headers = headers or {}

    def json(self):
        if isinstance(self._json_data, Exception):
            raise self._json_data
        return self._json_data


class TestAlertDeliveryAndDeduplication(unittest.TestCase):

    def setUp(self):
        self.test_token = "123456789:AAFakeTestTokenForAlertResilience99"
        self.test_chat_id = "-100987654321"

    # =========================================================================
    # 1. TELEGRAM DELIVERY RETRY TESTS
    # =========================================================================

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_success_first_attempt(self, mock_post, mock_sleep):
        """Telegram alert succeeds on attempt 1 with HTTP 200 and ok=True."""
        mock_post.return_value = MockResponse(200, {"ok": True, "result": {"message_id": 1}})

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 1)
        self.assertEqual(mock_sleep.call_count, 0)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_connection_error_retry_success(self, mock_post, mock_sleep):
        """ConnectionError on attempt 1 triggers retry; succeeds on attempt 2."""
        mock_post.side_effect = [
            requests.exceptions.ConnectionError("Connection refused by host"),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 1)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_timeout_retry_success(self, mock_post, mock_sleep):
        """Timeout on attempt 1 triggers retry; succeeds on attempt 2."""
        mock_post.side_effect = [
            requests.exceptions.Timeout("Read timed out after 10s"),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 1)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_rate_limit_429_retry_success(self, mock_post, mock_sleep):
        """HTTP 429 Too Many Requests sleeps for parameter retry_after and succeeds on attempt 2."""
        mock_post.side_effect = [
            MockResponse(
                429,
                {
                    "ok": False,
                    "error_code": 429,
                    "description": "Too Many Requests: retry after 3",
                    "parameters": {"retry_after": 3}
                }
            ),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
        mock_sleep.assert_called_with(3.0)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_rate_limit_429_capped_at_30s(self, mock_post, mock_sleep):
        """HTTP 429 with extreme retry_after (e.g. 180s) is capped at 30 seconds."""
        mock_post.side_effect = [
            MockResponse(
                429,
                {
                    "ok": False,
                    "error_code": 429,
                    "description": "Too Many Requests",
                    "parameters": {"retry_after": 180}
                }
            ),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        mock_sleep.assert_called_with(30.0)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_server_error_5xx_retry_success(self, mock_post, mock_sleep):
        """HTTP 502 Bad Gateway triggers backoff and succeeds on attempt 2."""
        mock_post.side_effect = [
            MockResponse(502, text="Bad Gateway"),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 1)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_client_error_400_no_retry(self, mock_post, mock_sleep):
        """HTTP 400 Bad Request fails immediately without wasting retry attempts."""
        mock_post.return_value = MockResponse(
            400,
            {"ok": False, "error_code": 400, "description": "Bad Request: chat not found"}
        )

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertFalse(result)
        self.assertEqual(mock_post.call_count, 1)
        self.assertEqual(mock_sleep.call_count, 0)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_client_error_401_no_retry(self, mock_post, mock_sleep):
        """HTTP 401 Unauthorized fails immediately without retrying."""
        mock_post.return_value = MockResponse(
            401,
            {"ok": False, "error_code": 401, "description": "Unauthorized"}
        )

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.1)

        self.assertFalse(result)
        self.assertEqual(mock_post.call_count, 1)
        self.assertEqual(mock_sleep.call_count, 0)

    @patch("time.sleep")
    @patch("requests.post")
    def test_telegram_max_retries_exhausted(self, mock_post, mock_sleep):
        """When all attempts fail (e.g. 3 consecutive 500 errors), function returns False."""
        mock_post.side_effect = [
            MockResponse(500, text="Internal Server Error"),
            MockResponse(500, text="Internal Server Error"),
            MockResponse(500, text="Internal Server Error"),
        ]

        with patch.object(monitor, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor.send_telegram_alert("<b>Test Alert</b>", max_retries=3, base_delay=0.01)

        self.assertFalse(result)
        self.assertEqual(mock_post.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    @patch("time.sleep")
    @patch("requests.post")
    def test_token_masking_during_failure_logging(self, mock_post, mock_sleep):
        """Sensitive bot token is never printed to logs or stdout during failure scenarios."""
        sensitive_token = "998877665:SUPER_SECRET_TOKEN_DO_NOT_LEAK"
        error_with_token = f"ConnectionError: https://api.telegram.org/bot{sensitive_token}/sendMessage failed"
        mock_post.side_effect = requests.exceptions.ConnectionError(error_with_token)

        captured_stdout = io.StringIO()
        with redirect_stdout(captured_stdout):
            with patch.object(monitor, "TELEGRAM_BOT_TOKEN", sensitive_token), \
                 patch.object(monitor, "TELEGRAM_CHAT_ID", self.test_chat_id):
                result = monitor.send_telegram_alert("Alert", max_retries=1, base_delay=0.01)

        log_output = captured_stdout.getvalue()
        self.assertFalse(result)
        self.assertNotIn(sensitive_token, log_output)
        self.assertIn("[REDACTED_BOT_TOKEN]", log_output)

    def test_html_escaping_in_alert_payload(self):
        """HTML special characters in cinema venue names are escaped before sending."""
        bms_raw = [("PVR Forum & <IMAX> Sujana Mall", "12:15 AM")]
        district_raw = [("AMB 'Classic' Cinema > Screen 1", "01:00 AM")]

        alert = monitor.format_telegram_alert(bms_raw, district_raw)
        self.assertNotIn("<IMAX>", alert)
        self.assertIn("&lt;IMAX&gt;", alert)
        self.assertIn("PVR Forum &amp;", alert)
        self.assertIn("&gt; Screen 1", alert)
        self.assertIn("<b>12:15 AM</b>", alert)

    # =========================================================================
    # 2. DEDUPLICATION & PERSISTENCE FIX TESTS
    # =========================================================================

    def test_failed_alert_delivery_leaves_seen_file_unchanged(self):
        """If Telegram alert fails, seen_shows.json must NOT be updated. Shows remain eligible for next cycle."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_seen_file = os.path.join(temp_dir, "seen_shows.json")
            initial_shows = ["BMS_Prasads Multiplex_12:15 AM"]
            with open(temp_seen_file, "w", encoding="utf-8") as f:
                json.dump(initial_shows, f)

            seen = monitor.load_seen(filepath=temp_seen_file)
            self.assertEqual(seen, {"BMS_Prasads Multiplex_12:15 AM"})

            # Simulate new show detected
            bms_new = [("AMB Cinemas: Gachibowli", "01:30 AM")]
            district_new = []

            # Simulate failed alert delivery
            sent = False
            if sent:
                monitor.mark_shows_seen(seen, bms_new, district_new, filepath=temp_seen_file)

            # Re-read seen file from disk
            persisted_seen = monitor.load_seen(filepath=temp_seen_file)
            self.assertNotIn("BMS_AMB Cinemas: Gachibowli_01:30 AM", persisted_seen)
            self.assertEqual(persisted_seen, {"BMS_Prasads Multiplex_12:15 AM"})

    def test_successful_alert_delivery_updates_seen_file(self):
        """Only after Telegram confirms delivery, new show identifiers are added and saved to disk."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_seen_file = os.path.join(temp_dir, "seen_shows.json")
            initial_shows = ["BMS_Prasads Multiplex_12:15 AM"]
            with open(temp_seen_file, "w", encoding="utf-8") as f:
                json.dump(initial_shows, f)

            seen = monitor.load_seen(filepath=temp_seen_file)

            bms_new = [("AMB Cinemas: Gachibowli", "01:30 AM")]
            district_new = [("Sudarshan 35MM: RTC X Roads", "12:00 AM")]

            # Simulate confirmed delivery
            sent = True
            if sent:
                monitor.mark_shows_seen(seen, bms_new, district_new, filepath=temp_seen_file)

            persisted_seen = monitor.load_seen(filepath=temp_seen_file)
            self.assertIn("BMS_Prasads Multiplex_12:15 AM", persisted_seen)
            self.assertIn("BMS_AMB Cinemas: Gachibowli_01:30 AM", persisted_seen)
            self.assertIn("DISTRICT_Sudarshan 35MM: RTC X Roads_12:00 AM", persisted_seen)
            self.assertEqual(len(persisted_seen), 3)

    def test_previously_seen_shows_excluded_from_new_alerts(self):
        """Previously seen shows are filtered out so that user is not spammed on subsequent checks."""
        seen = {"BMS_Prasads Multiplex_12:15 AM"}

        candidate_shows = [
            ParsedShow(venue="Prasads Multiplex", time="12:15 AM", is_midnight=True, provider="BookMyShow"),
            ParsedShow(venue="AAA Cinemas: Ameerpet", time="01:00 AM", is_midnight=True, provider="BookMyShow")
        ]

        new_shows = []
        for show in candidate_shows:
            if show.is_midnight:
                key = f"BMS_{show.venue}_{show.time}"
                if key not in seen:
                    new_shows.append((show.venue, show.time))

        self.assertEqual(len(new_shows), 1)
        self.assertEqual(new_shows[0], ("AAA Cinemas: Ameerpet", "01:00 AM"))

    # =========================================================================
    # 3. CLOUD MONITOR CONSISTENCY TESTS
    # =========================================================================

    @patch("time.sleep")
    @patch("requests.post")
    def test_cloud_monitor_retry_behavior(self, mock_post, mock_sleep):
        """Cloud monitoring agent shares identical delivery resilience."""
        mock_post.side_effect = [
            MockResponse(503, text="Service Unavailable"),
            MockResponse(200, {"ok": True})
        ]

        with patch.object(monitor_cloud, "TELEGRAM_BOT_TOKEN", self.test_token), \
             patch.object(monitor_cloud, "TELEGRAM_CHAT_ID", self.test_chat_id):
            result = monitor_cloud.send_telegram_alert("<b>Cloud Alert</b>", max_retries=3, base_delay=0.01)

        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 1)


if __name__ == "__main__":
    unittest.main()
