"""
Unit Test Suite for Showtime Parser Module
==========================================
Deterministic, local text fixture tests for showtime extraction, normalization,
midnight filtering, and cinema attribution.
"""

import unittest
from showtime_parser import (
    ParsedShow,
    normalize_time_str,
    is_midnight_time,
    is_valid_cinema_line,
    parse_showtimes,
    extract_midnight_shows,
)


class TestShowtimeParser(unittest.TestCase):

    # ==========================================================================
    # 1. Midnight Filtering & Boundary Tests
    # ==========================================================================

    def test_midnight_start_boundary_12_00_am(self):
        """12:00 AM is the exact start of the midnight window."""
        self.assertTrue(is_midnight_time("12:00 AM"))

    def test_midnight_inner_window_12_15_am(self):
        """12:15 AM falls within the midnight window."""
        self.assertTrue(is_midnight_time("12:15 AM"))

    def test_midnight_inner_window_01_30_am(self):
        """01:30 AM falls within the midnight window."""
        self.assertTrue(is_midnight_time("01:30 AM"))

    def test_midnight_inner_window_single_digit_hour(self):
        """1:30 AM (single-digit hour) falls within the midnight window."""
        self.assertTrue(is_midnight_time("1:30 AM"))

    def test_midnight_end_boundary_04_59_am(self):
        """04:59 AM is the exact inclusive end of the midnight window."""
        self.assertTrue(is_midnight_time("04:59 AM"))

    def test_non_midnight_boundary_05_00_am(self):
        """05:00 AM is outside the midnight window (morning show)."""
        self.assertFalse(is_midnight_time("05:00 AM"))

    def test_non_midnight_regular_morning(self):
        """08:00 AM and 10:30 AM are regular morning shows."""
        self.assertFalse(is_midnight_time("08:00 AM"))
        self.assertFalse(is_midnight_time("10:30 AM"))

    def test_non_midnight_noon(self):
        """12:00 PM (noon) must not be confused with 12:00 AM (midnight)."""
        self.assertFalse(is_midnight_time("12:00 PM"))

    def test_non_midnight_afternoon_and_evening(self):
        """Afternoon and evening times must be excluded."""
        self.assertFalse(is_midnight_time("03:30 PM"))
        self.assertFalse(is_midnight_time("07:45 PM"))
        self.assertFalse(is_midnight_time("11:00 PM"))

    def test_non_midnight_pre_midnight_boundary_11_59_pm(self):
        """11:59 PM is outside the midnight window."""
        self.assertFalse(is_midnight_time("11:59 PM"))

    # ==========================================================================
    # 2. Metadata Badges, Formatting & Whitespace Tests
    # ==========================================================================

    def test_time_with_metadata_badge_dolby_atmos(self):
        """Extracts showtime correctly when badge contains audio info."""
        self.assertEqual(normalize_time_str("12:00 AM (Dolby Atmos)"), "12:00 AM")
        self.assertTrue(is_midnight_time("12:00 AM (Dolby Atmos)"))

    def test_time_with_metadata_badge_fast_filling(self):
        """Extracts showtime correctly when chip indicates status."""
        self.assertEqual(normalize_time_str("12:15 AM - Fast Filling"), "12:15 AM")
        self.assertTrue(is_midnight_time("12:15 AM - Fast Filling"))

    def test_time_with_metadata_badge_3d_format(self):
        """Extracts showtime correctly when format is appended."""
        self.assertEqual(normalize_time_str("01:30 AM 3D"), "01:30 AM")
        self.assertTrue(is_midnight_time("01:30 AM 3D"))

    def test_time_with_surrounding_whitespace_and_lowercase(self):
        """Normalizes times with leading/trailing whitespace and lowercase am/pm."""
        self.assertEqual(normalize_time_str("   12:30 am \n\t"), "12:30 AM")
        self.assertTrue(is_midnight_time("   12:30 am \n\t"))

    def test_time_without_space_between_digits_and_meridiem(self):
        """Normalizes times formatted without whitespace like 12:00am."""
        self.assertEqual(normalize_time_str("12:00am"), "12:00 AM")
        self.assertTrue(is_midnight_time("12:00am"))

    # ==========================================================================
    # 3. Non-Showtime and Malformed String Rejection
    # ==========================================================================

    def test_reject_dates(self):
        """Date strings must not be parsed as showtimes."""
        self.assertIsNone(normalize_time_str("2026-12-17"))
        self.assertIsNone(normalize_time_str("17/12/2026"))
        self.assertFalse(is_midnight_time("2026-12-17"))

    def test_reject_prices(self):
        """Ticket prices must not be parsed as showtimes."""
        self.assertIsNone(normalize_time_str("₹ 450"))
        self.assertIsNone(normalize_time_str("Rs. 500"))
        self.assertFalse(is_midnight_time("₹ 450"))

    def test_reject_runtimes(self):
        """Movie runtime strings (e.g. 2h 45m) must not be parsed as showtimes."""
        self.assertIsNone(normalize_time_str("2h 45m"))
        self.assertIsNone(normalize_time_str("Movie runtime: 2h 35m"))
        self.assertFalse(is_midnight_time("2h 45m"))

    def test_reject_phone_numbers(self):
        """Phone numbers must not be parsed as showtimes."""
        self.assertIsNone(normalize_time_str("040-12345678"))
        self.assertFalse(is_midnight_time("040-12345678"))

    def test_reject_empty_and_invalid_types(self):
        """Empty or non-string inputs safely return None/False."""
        self.assertIsNone(normalize_time_str(""))
        self.assertIsNone(normalize_time_str(None))
        self.assertFalse(is_midnight_time(""))
        self.assertFalse(is_midnight_time(None))
        self.assertFalse(is_midnight_time("not a time string"))

    # ==========================================================================
    # 4. 24-Hour Format Support & Normalization
    # ==========================================================================

    def test_24h_midnight_normalization(self):
        """00:15 (24h) normalizes to 12:15 AM and is identified as midnight."""
        self.assertEqual(normalize_time_str("00:15"), "12:15 AM")
        self.assertTrue(is_midnight_time("00:15"))

    def test_24h_early_morning_normalization(self):
        """01:45 and 04:30 normalize to 01:45 AM and 04:30 AM."""
        self.assertEqual(normalize_time_str("01:45"), "01:45 AM")
        self.assertEqual(normalize_time_str("04:30"), "04:30 AM")
        self.assertTrue(is_midnight_time("01:45"))
        self.assertTrue(is_midnight_time("04:30"))

    def test_24h_daytime_and_evening_normalization(self):
        """24h times outside midnight normalize to corresponding AM/PM times."""
        self.assertEqual(normalize_time_str("05:00"), "05:00 AM")
        self.assertEqual(normalize_time_str("14:30"), "02:30 PM")
        self.assertEqual(normalize_time_str("23:15"), "11:15 PM")
        self.assertFalse(is_midnight_time("05:00"))
        self.assertFalse(is_midnight_time("14:30"))
        self.assertFalse(is_midnight_time("23:15"))

    # ==========================================================================
    # 5. Cinema Attribution & Hyderabad Specific Venue Matching
    # ==========================================================================

    def test_cinema_recognition_known_hyderabad_venues(self):
        """Recognizes major Hyderabad cinema venues correctly."""
        self.assertTrue(is_valid_cinema_line("AMB Gachibowli"))
        self.assertTrue(is_valid_cinema_line("Sudarshan 35MM, RTC X Roads"))
        self.assertTrue(is_valid_cinema_line("Devi 70MM 4K Laser & Dolby Atmos"))
        self.assertTrue(is_valid_cinema_line("Asian Radhika Multiplex, ECIL"))
        self.assertTrue(is_valid_cinema_line("BVK Screen 1, LB Nagar"))
        self.assertTrue(is_valid_cinema_line("Prasads Multiplex, Necklace Road"))
        self.assertTrue(is_valid_cinema_line("PVR Superplex Inorbit, Cyberabad"))
        self.assertTrue(is_valid_cinema_line("Miraj Cinemas : Shalini Shivani, Kothapet"))
        self.assertTrue(is_valid_cinema_line("Cinepolis Mantra Mall, Upparpally"))

    def test_cinema_rejection_for_seo_and_footers(self):
        """Rejects SEO headers and navigation footers from being treated as cinemas."""
        self.assertFalse(is_valid_cinema_line("Top Cinemas in Hyderabad – Best Movie Theatres"))
        self.assertFalse(is_valid_cinema_line("Find the best cinemas across Hyderabad"))
        self.assertFalse(is_valid_cinema_line("Terms & Conditions"))
        self.assertFalse(is_valid_cinema_line("Privacy Policy"))
        self.assertFalse(is_valid_cinema_line("Browse our list of trending movies"))

    # ==========================================================================
    # 6. Page Text Parsing & Multi-Cinema Extraction
    # ==========================================================================

    def test_parse_showtimes_multiple_cinemas(self):
        """Parses page text containing multiple cinemas and correctly attributes showtimes."""
        dom_text = """
        PVR Superplex Inorbit, Cyberabad
        08:00 AM
        11:30 AM
        12:15 AM (Fast Filling)

        Miraj Cinemas : Shalini Shivani
        10:00 AM
        01:15 PM
        11:00 PM
        """
        results = parse_showtimes(dom_text, provider="TestProvider")
        self.assertEqual(len(results), 6)

        # First cinema
        self.assertEqual(results[0].venue, "PVR Superplex Inorbit, Cyberabad")
        self.assertEqual(results[0].time, "08:00 AM")
        self.assertFalse(results[0].is_midnight)

        self.assertEqual(results[2].venue, "PVR Superplex Inorbit, Cyberabad")
        self.assertEqual(results[2].time, "12:15 AM")
        self.assertTrue(results[2].is_midnight)

        # Second cinema
        self.assertEqual(results[3].venue, "Miraj Cinemas : Shalini Shivani")
        self.assertEqual(results[3].time, "10:00 AM")
        self.assertFalse(results[3].is_midnight)

    def test_parse_showtimes_unknown_venue_before_cinema_header(self):
        """Showtimes appearing before any cinema header are assigned 'Unknown Venue'."""
        dom_text = """
        12:00 AM
        01:30 AM

        PVR Next Galleria Mall, Panjagutta
        10:00 AM
        """
        results = parse_showtimes(dom_text, provider="BMS")
        self.assertEqual(results[0].venue, "Unknown Venue")
        self.assertEqual(results[0].time, "12:00 AM")
        self.assertTrue(results[0].is_midnight)

        self.assertEqual(results[1].venue, "Unknown Venue")
        self.assertEqual(results[1].time, "01:30 AM")

        self.assertEqual(results[2].venue, "PVR Next Galleria Mall, Panjagutta")
        self.assertEqual(results[2].time, "10:00 AM")

    def test_parse_showtimes_seo_footer_resets_venue(self):
        """SEO footers at the bottom of the page do not inherit preceding cinema venues."""
        dom_text = """
        Prasads Multiplex
        11:00 PM

        Top Cinemas in Hyderabad – Best Movie Theatres
        Find the best cinemas across Hyderabad...
        12:30 AM
        """
        results = parse_showtimes(dom_text, provider="District")
        # Prasads show
        self.assertEqual(results[0].venue, "Prasads Multiplex")
        self.assertEqual(results[0].time, "11:00 PM")

        # The show under SEO footer must be reset to Unknown Venue, NOT Prasads!
        self.assertEqual(results[1].venue, "Unknown Venue")
        self.assertEqual(results[1].time, "12:30 AM")

    def test_parse_showtimes_deduplicates_identical_chips_under_same_venue(self):
        """Repeated identical showtime chips under the same venue are deduplicated."""
        dom_text = """
        AMB Gachibowli
        12:00 AM
        12:00 AM
        12:15 AM
        """
        results = parse_showtimes(dom_text, provider="BMS")
        amb_shows = [r.time for r in results if r.venue == "AMB Gachibowli"]
        self.assertEqual(len(amb_shows), 2)
        self.assertListEqual(amb_shows, ["12:00 AM", "12:15 AM"])

    def test_extract_midnight_shows_convenience_function(self):
        """extract_midnight_shows filters only midnight shows as (venue, time) tuples."""
        dom_text = """
        Sudarshan 35MM, RTC X Roads
        08:00 AM
        11:15 AM
        12:00 AM
        04:30 AM
        07:00 PM
        """
        midnight_tuples = extract_midnight_shows(dom_text, provider="BMS")
        self.assertEqual(len(midnight_tuples), 2)
        self.assertIn(("Sudarshan 35MM, RTC X Roads", "12:00 AM"), midnight_tuples)
        self.assertIn(("Sudarshan 35MM, RTC X Roads", "04:30 AM"), midnight_tuples)

    def test_parse_empty_and_whitespace_page(self):
        """Empty or whitespace-only inputs return an empty list without raising exceptions."""
        self.assertEqual(parse_showtimes(""), [])
        self.assertEqual(parse_showtimes("   \n\t  \n  "), [])
        self.assertEqual(parse_showtimes(None), [])
        self.assertEqual(extract_midnight_shows(""), [])


if __name__ == "__main__":
    unittest.main()
