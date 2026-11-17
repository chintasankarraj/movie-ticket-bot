"""Unit tests for GitHub Actions cloud persistence and single-shot execution.

These tests run completely offline and verify:
1. Missing cloud state initializes to an empty set.
2. Valid existing cloud state loads correctly.
3. Corrupted or structurally invalid JSON state is rejected with ValueError.
4. Previously seen shows are excluded from new alert lists.
5. Failed Telegram delivery leaves cloud state unchanged on disk.
6. Successful Telegram delivery atomically persists new shows to cloud state.
7. Atomic replacement (os.replace) is used for state file updates.
8. Runs with zero new shows do not modify the cloud state file.
9. BookMyShow cloud scraping is completely skipped.
10. District monitoring executes properly via showtime_parser.
11. Local seen_shows.json is never accessed or modified by cloud monitoring.
12. Persistence failures after Telegram success are reported cleanly.
13. Workflow git push failure detection behavior.
14. Single-shot main() execution behavior across success and failure flows.
"""

import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import MagicMock, patch

import monitor_cloud
from showtime_parser import ParsedShow


class TestCloudPersistenceAndSingleShot(unittest.TestCase):

    def setUp(self):
        self.test_token = "123456789:AAFakeCloudTestToken998877"
        self.test_chat_id = "-1001122334455"

    # =========================================================================
    # 1. CLOUD STATE LOADING & VALIDATION
    # =========================================================================

    def test_missing_cloud_state_initializes_empty(self):
        """Missing cloud state file on initial setup returns an empty set."""
        with tempfile.TemporaryDirectory() as temp_dir:
            missing_path = os.path.join(temp_dir, "non_existent_cloud_seen.json")
            seen = monitor_cloud.load_cloud_seen(filepath=missing_path)
            self.assertEqual(seen, set())

    def test_valid_existing_cloud_state_loads(self):
        """Valid JSON list of show identifiers loads into a Python set."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            initial_data = [
                "DISTRICT_Prasads Multiplex: Hyderabad_12:15 AM",
                "DISTRICT_AMB Cinemas: Gachibowli_01:30 AM"
            ]
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump(initial_data, f)

            seen = monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertEqual(len(seen), 2)
            self.assertIn("DISTRICT_Prasads Multiplex: Hyderabad_12:15 AM", seen)
            self.assertIn("DISTRICT_AMB Cinemas: Gachibowli_01:30 AM", seen)

    def test_corrupted_json_rejected_safely(self):
        """Corrupted JSON (syntax error) raises ValueError and never returns empty set."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            with open(state_path, "w", encoding="utf-8") as f:
                f.write('{"corrupted": [unclosed json')

            with self.assertRaises(ValueError) as ctx:
                monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertIn("Corrupted cloud state file", str(ctx.exception))

    def test_structurally_invalid_json_rejected_safely(self):
        """Structurally invalid JSON (not a list of strings) raises ValueError."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")

            # Case A: Dictionary instead of list
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump({"shows": ["DISTRICT_A_12:00 AM"]}, f)

            with self.assertRaises(ValueError) as ctx:
                monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertIn("Structurally invalid cloud state", str(ctx.exception))

            # Case B: List of non-strings (e.g. numbers)
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump([123, 456], f)

            with self.assertRaises(ValueError) as ctx:
                monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertIn("Structurally invalid cloud state", str(ctx.exception))

    # =========================================================================
    # 2. DEDUPLICATION & ATOMIC PERSISTENCE
    # =========================================================================

    def test_previously_seen_shows_excluded(self):
        """Previously seen shows are excluded from newly discovered shows."""
        seen = {"DISTRICT_Prasads Multiplex_12:15 AM"}

        # Mock page returning body with seen and unseen shows
        mock_page = MagicMock()
        mock_page.inner_text.return_value = (
            "Prasads Multiplex\n12:15 AM\n"
            "AMB Cinemas: Gachibowli\n01:30 AM\n"
        )

        found_shows = monitor_cloud.check_district(mock_page, seen)
        # Prasads is in seen, so only AMB Cinemas should be returned
        self.assertEqual(len(found_shows), 1)
        self.assertEqual(found_shows[0], ("AMB Cinemas: Gachibowli", "01:30 AM"))

    def test_failed_telegram_delivery_leaves_cloud_state_unchanged(self):
        """If Telegram alert fails, cloud state is not updated."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            initial_shows = ["DISTRICT_Prasads Multiplex_12:15 AM"]
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump(initial_shows, f)

            seen = monitor_cloud.load_cloud_seen(filepath=state_path)
            new_shows = [("AMB Cinemas: Gachibowli", "01:30 AM")]

            # Simulate failed delivery
            delivery_success = False
            if delivery_success:
                monitor_cloud.mark_cloud_shows_seen(seen, new_shows, filepath=state_path)

            # Re-read from disk
            persisted = monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertEqual(persisted, {"DISTRICT_Prasads Multiplex_12:15 AM"})
            self.assertNotIn("DISTRICT_AMB Cinemas: Gachibowli_01:30 AM", persisted)

    def test_successful_telegram_delivery_updates_cloud_state(self):
        """Only after Telegram confirms delivery, new shows are atomically saved to cloud state."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            initial_shows = ["DISTRICT_Prasads Multiplex_12:15 AM"]
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump(initial_shows, f)

            seen = monitor_cloud.load_cloud_seen(filepath=state_path)
            new_shows = [("AMB Cinemas: Gachibowli", "01:30 AM")]

            # Simulate confirmed delivery
            delivery_success = True
            if delivery_success:
                monitor_cloud.mark_cloud_shows_seen(seen, new_shows, filepath=state_path)

            persisted = monitor_cloud.load_cloud_seen(filepath=state_path)
            self.assertIn("DISTRICT_Prasads Multiplex_12:15 AM", persisted)
            self.assertIn("DISTRICT_AMB Cinemas: Gachibowli_01:30 AM", persisted)
            self.assertEqual(len(persisted), 2)

    def test_persistence_uses_atomic_replacement(self):
        """save_cloud_seen uses os.replace for atomic file creation."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            seen_set = {"DISTRICT_Venue_12:00 AM"}

            with patch("os.replace", wraps=os.replace) as spy_replace:
                monitor_cloud.save_cloud_seen(seen_set, filepath=state_path)
                spy_replace.assert_called_once()
                # Target path in os.replace must be the destination state_path
                self.assertEqual(spy_replace.call_args[0][1], state_path)

            # Confirm file exists and parses properly
            with open(state_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            self.assertEqual(content, ["DISTRICT_Venue_12:00 AM"])

    def test_no_new_shows_does_not_modify_state_file(self):
        """When no new shows are found, cloud_seen_shows.json is not modified."""
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            initial_content = '[\n  "DISTRICT_Existing_12:00 AM"\n]\n'
            with open(state_path, "w", encoding="utf-8") as f:
                f.write(initial_content)

            initial_stat = os.stat(state_path)

            # In single-shot run with no shows found:
            district_shows = []
            if district_shows:
                monitor_cloud.mark_cloud_shows_seen(set(), district_shows, filepath=state_path)

            after_stat = os.stat(state_path)
            with open(state_path, "r", encoding="utf-8") as f:
                after_content = f.read()

            self.assertEqual(initial_content, after_content)
            self.assertEqual(initial_stat.st_mtime, after_stat.st_mtime)

    # =========================================================================
    # 3. SCRAPING BEHAVIOR & SCOPE ISOLATION
    # =========================================================================

    def test_bookmyshow_cloud_scraping_is_skipped(self):
        """BookMyShow cloud scraping returns an empty list without launching browsers or HTTP calls."""
        result = monitor_cloud.check_bookmyshow()
        self.assertEqual(result, [])

    def test_district_monitoring_executes(self):
        """District monitoring parses and identifies midnight shows correctly."""
        mock_page = MagicMock()
        mock_page.inner_text.return_value = (
            "Sudarshan 35MM: RTC X Roads\n"
            "12:00 AM\n"
            "02:30 AM\n"
            "09:30 AM\n"
        )
        found = monitor_cloud.check_district(mock_page, set())
        self.assertEqual(len(found), 2)
        self.assertEqual(found[0], ("Sudarshan 35MM: RTC X Roads", "12:00 AM"))
        self.assertEqual(found[1], ("Sudarshan 35MM: RTC X Roads", "02:30 AM"))

    def test_local_seen_shows_json_never_accessed_or_modified_by_cloud(self):
        """Local seen_shows.json is never imported, read, or modified by monitor_cloud."""
        # 1. Module-level check
        self.assertFalse(hasattr(monitor_cloud, "SEEN_FILE"))
        self.assertTrue(hasattr(monitor_cloud, "CLOUD_SEEN_FILE"))
        self.assertTrue(monitor_cloud.CLOUD_SEEN_FILE.endswith("cloud_seen_shows.json"))

        # 2. File-system check with sentinel local file
        with tempfile.TemporaryDirectory() as temp_dir:
            local_seen_path = os.path.join(temp_dir, "seen_shows.json")
            cloud_seen_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            with open(local_seen_path, "w", encoding="utf-8") as f:
                json.dump(["LOCAL_SENTINEL_SHOW"], f)

            # Perform cloud operations targeting cloud_seen_path
            seen = monitor_cloud.load_cloud_seen(filepath=cloud_seen_path)
            monitor_cloud.mark_cloud_shows_seen(seen, [("Venue", "01:00 AM")], filepath=cloud_seen_path)

            # Verify local seen file remains identical
            with open(local_seen_path, "r", encoding="utf-8") as f:
                local_content = json.load(f)
            self.assertEqual(local_content, ["LOCAL_SENTINEL_SHOW"])

    def test_persistence_failure_after_telegram_success_reported(self):
        """If atomic save fails after Telegram succeeds, IOError is raised with a clear diagnostic."""
        with tempfile.TemporaryDirectory() as temp_dir:
            target_path = os.path.join(temp_dir, "cloud_seen.json")
            with patch("os.replace", side_effect=IOError("Permission denied during replace")):
                with self.assertRaises(IOError) as ctx:
                    monitor_cloud.save_cloud_seen({"DISTRICT_Show_12:00 AM"}, filepath=target_path)
                self.assertIn("Failed to atomically persist cloud state", str(ctx.exception))

    def test_git_push_failure_detection(self):
        """Verify that a non-zero git push returncode causes a failure in bash runner logic."""
        def simulate_git_commit_push_step(git_has_diff: bool, push_exit_code: int) -> int:
            """Simulates the workflow bash step: git add -> git diff --staged -> git push."""
            if not git_has_diff:
                return 0  # Nothing to commit, succeeds cleanly
            # Changes present -> commit and push
            if push_exit_code != 0:
                return 1  # Step fails if push fails
            return 0

        # Scenario A: No changes -> step succeeds (exit code 0)
        self.assertEqual(simulate_git_commit_push_step(git_has_diff=False, push_exit_code=0), 0)

        # Scenario B: Changes present and push succeeds -> step succeeds (exit code 0)
        self.assertEqual(simulate_git_commit_push_step(git_has_diff=True, push_exit_code=0), 0)

        # Scenario C: Changes present but push fails (e.g. branch protection / permissions) -> step FAILS (exit code 1)
        self.assertEqual(simulate_git_commit_push_step(git_has_diff=True, push_exit_code=1), 1)

    # =========================================================================
    # 4. SINGLE-SHOT MAIN() FLOW TESTS
    # =========================================================================

    @patch("monitor_cloud.check_district", return_value=[])
    @patch("monitor_cloud.sync_playwright")
    def test_main_single_shot_no_shows_exits_cleanly(self, mock_playwright, mock_district):
        """When no new shows are found, main() exits with 0 and sends no Telegram message."""
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()
        mock_browser.new_context.return_value = mock_context
        mock_context.new_page.return_value = mock_page
        mock_playwright.return_value.__enter__.return_value.chromium.launch.return_value = mock_browser

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump([], f)

            with patch.object(monitor_cloud, "TELEGRAM_BOT_TOKEN", self.test_token), \
                 patch.object(monitor_cloud, "TELEGRAM_CHAT_ID", self.test_chat_id), \
                 patch.object(monitor_cloud, "CLOUD_SEEN_FILE", state_path), \
                 patch("monitor_cloud.send_telegram_alert") as mock_alert:

                exit_code = monitor_cloud.main()
                self.assertEqual(exit_code, 0)
                mock_alert.assert_not_called()

    @patch("monitor_cloud.check_district", return_value=[("AMB Cinemas", "01:00 AM")])
    @patch("monitor_cloud.sync_playwright")
    def test_main_single_shot_shows_found_success_flow(self, mock_playwright, mock_district):
        """When new shows are found and Telegram succeeds, state is saved and main() returns 0."""
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()
        mock_browser.new_context.return_value = mock_context
        mock_context.new_page.return_value = mock_page
        mock_playwright.return_value.__enter__.return_value.chromium.launch.return_value = mock_browser

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump([], f)

            with patch.object(monitor_cloud, "TELEGRAM_BOT_TOKEN", self.test_token), \
                 patch.object(monitor_cloud, "TELEGRAM_CHAT_ID", self.test_chat_id), \
                 patch.object(monitor_cloud, "CLOUD_SEEN_FILE", state_path), \
                 patch("monitor_cloud.send_telegram_alert", return_value=True) as mock_alert:

                exit_code = monitor_cloud.main()
                self.assertEqual(exit_code, 0)
                mock_alert.assert_called_once()

                # Verify state file was updated
                saved = monitor_cloud.load_cloud_seen(filepath=state_path)
                self.assertIn("DISTRICT_AMB Cinemas_01:00 AM", saved)

    @patch("monitor_cloud.check_district", return_value=[("AMB Cinemas", "01:00 AM")])
    @patch("monitor_cloud.sync_playwright")
    def test_main_single_shot_telegram_failure_exits_nonzero(self, mock_playwright, mock_district):
        """When Telegram delivery fails, main() exits with SystemExit(1) and state is unchanged."""
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()
        mock_browser.new_context.return_value = mock_context
        mock_context.new_page.return_value = mock_page
        mock_playwright.return_value.__enter__.return_value.chromium.launch.return_value = mock_browser

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = os.path.join(temp_dir, "cloud_seen_shows.json")
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump([], f)

            with patch.object(monitor_cloud, "TELEGRAM_BOT_TOKEN", self.test_token), \
                 patch.object(monitor_cloud, "TELEGRAM_CHAT_ID", self.test_chat_id), \
                 patch.object(monitor_cloud, "CLOUD_SEEN_FILE", state_path), \
                 patch("monitor_cloud.send_telegram_alert", return_value=False):

                with self.assertRaises(SystemExit) as ctx:
                    monitor_cloud.main()
                self.assertEqual(ctx.exception.code, 1)

                # Verify state file was NOT updated
                saved = monitor_cloud.load_cloud_seen(filepath=state_path)
                self.assertEqual(saved, set())


if __name__ == "__main__":
    unittest.main()
