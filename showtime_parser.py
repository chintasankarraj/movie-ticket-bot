"""
Showtime Parser Module
======================
Pure, dependency-free utility for extracting, normalizing, and filtering showtimes
and cinema venues from unstructured webpage text (BookMyShow, District, etc.).

Supported Time Formats:
  - 12-hour formats: "12:00 AM", "12:15 AM", "01:30 AM", "1:30 AM", "12:00 PM", etc.
  - Times with metadata badges: "12:00 AM (Dolby Atmos)", "12:15 AM - Fast Filling", "01:30 AM 3D"
  - 24-hour unambiguous formats: "00:15", "01:30", "04:45", "14:30", "23:59"

Business Filtering Rule:
  Midnight/early-morning shows are defined as 12:00 AM through 04:59 AM (inclusive).
"""

import re
from typing import NamedTuple, Optional, List, Tuple


class ParsedShow(NamedTuple):
    venue: str
    time: str          # Normalized format: "HH:MM AM/PM" (e.g., "12:15 AM")
    provider: str = ""
    raw_time: str = ""
    is_midnight: bool = False

    def to_tuple(self) -> Tuple[str, str]:
        """Return (venue, time) tuple for backward compatibility."""
        return (self.venue, self.time)


# ==============================================================================
# Regular Expressions for Time Extraction
# ==============================================================================

# 12-hour pattern: matches "12:00 AM", "1:15 PM", "12:30am", with optional badge text
PATTERN_12H = re.compile(
    r"\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*([AaPp][Mm])\b",
    re.IGNORECASE
)

# Unambiguous 24-hour pattern: standalone tokens like "00:15", "01:30", "04:45", "23:30"
# Must not be preceded by +, -, currency symbols, or dots, and not followed by non-time units.
PATTERN_24H = re.compile(
    r"(?<![\d\w\+\-\$\₹\.])([01][0-9]|2[0-3]):([0-5][0-9])(?![\d\w\+\-\$\₹\.\:\/])"
)

# Reject lines matching phone numbers, currency, dates, runtimes
PATTERN_REJECT = re.compile(
    r"(\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|₹|\bRs\.|\b\d{2,4}-\d{6,8}\b|\b\d+h\s*\d+m\b)",
    re.IGNORECASE
)


# ==============================================================================
# Cinema Name Matching & SEO Blacklist
# ==============================================================================

KNOWN_CINEMA_INDICATORS = [
    "pvr",
    "inox",
    "cinemas",
    "cinema",
    "theatre",
    "theater",
    "multiplex",
    "cinepolis",
    "miraj",
    "prasads",
    "prasad's",
    "70mm",
    "35mm",
    "talkies",
    # Specific known Hyderabad cinema venues and chains:
    "amb",            # AMB Gachibowli / AMB Cinemas
    "asian",          # Asian Radhika, Asian Mukta, Asian Swapna
    "sudarshan",      # Sudarshan 35MM, RTC X Roads
    "devi",           # Devi 70MM
    "sandhya",        # Sandhya 70MM
    "bvk",            # BVK Screen 1 / BVK Multiplex
    "sree ramana",
    "sri ramana",
    "tarakarama",
    "rajdhani",
    "kumar",          # Kumar 70MM
    "sushma",         # Sushma 70MM
    "viswanath",      # Viswanath Theater
    "sree sai raja",
    "sree sai puja",
]

EXCLUDED_SECTION_KEYWORDS = [
    "top cinemas in",
    "find the best cinemas",
    "terms & conditions",
    "terms and conditions",
    "privacy policy",
    "browse our list",
    "available on ios",
    "scan to download",
    "all rights reserved",
    "book movie tickets",
    "looking to catch",
    "prefer watching movies",
    "movies in hyderabad",
    "trending releases",
    "skip to main content",
    "search for movies",
    "search for events",
    "listyourshow",
    "gift cards",
    "non-cancellable",
    "allows cancellation",
    "km away",
    "wheelchair friendly",
    "superhero, adventure",
    "movie runtime:",
    "by accessing this page",
    "filters",
    "for you",
    "dining",
    "events",
    "activities",
]


# ==============================================================================
# Pure Helper Functions
# ==============================================================================

def normalize_time_str(time_str: str) -> Optional[str]:
    """
    Extract and normalize a time string into standard 'HH:MM AM' or 'HH:MM PM'.
    Returns None if no unambiguous time pattern is recognized.
    """
    if not time_str or not isinstance(time_str, str):
        return None

    clean = time_str.strip()
    if not clean:
        return None

    # Check reject patterns (e.g. date strings, runtimes like '2h 45m', prices)
    if PATTERN_REJECT.search(clean):
        # Only reject if there's no unambiguous 12h time in it
        if not PATTERN_12H.search(clean):
            return None

    # 1. Check 12-hour pattern first
    match_12h = PATTERN_12H.search(clean)
    if match_12h:
        hour = int(match_12h.group(1))
        minute = match_12h.group(2)
        meridiem = match_12h.group(3).upper()
        return f"{hour:02d}:{minute} {meridiem}"

    # 2. Check 24-hour unambiguous pattern
    match_24h = PATTERN_24H.search(clean)
    if match_24h:
        hour_24 = int(match_24h.group(1))
        minute = match_24h.group(2)
        if hour_24 == 0:
            return f"12:{minute} AM"
        elif hour_24 < 12:
            return f"{hour_24:02d}:{minute} AM"
        elif hour_24 == 12:
            return f"12:{minute} PM"
        else:
            return f"{(hour_24 - 12):02d}:{minute} PM"

    return None


def is_midnight_time(time_str: str) -> bool:
    """
    Checks if a time string represents a midnight/early-morning show
    between 12:00 AM and 04:59 AM (inclusive).
    """
    normalized = normalize_time_str(time_str)
    if not normalized:
        return False

    if not normalized.endswith("AM"):
        return False

    try:
        hour = int(normalized.split(":")[0])
        # In 12-hour clock: 12 AM is midnight hour (12:00 AM to 12:59 AM),
        # 1 AM to 4 AM are early-morning hours (01:00 AM to 04:59 AM).
        return hour == 12 or (1 <= hour <= 4)
    except (ValueError, IndexError):
        return False


def is_valid_cinema_line(line: str) -> bool:
    """
    Evaluates whether a text line looks like a valid cinema name.
    """
    if not line or not isinstance(line, str):
        return False

    stripped = line.strip()
    if len(stripped) < 3 or len(stripped) > 120:
        return False

    lower = stripped.lower()

    # Reject lines containing SEO, footer, or navigation boilerplate
    if any(ex in lower for ex in EXCLUDED_SECTION_KEYWORDS):
        return False

    # Must contain at least one known cinema keyword/indicator
    return any(ind in lower for ind in KNOWN_CINEMA_INDICATORS)


def is_section_delimiter(line: str) -> bool:
    """
    Checks if a text line indicates a major page section break or footer
    that should reset the active cinema venue tracker.
    """
    lower = line.strip().lower()
    return any(ex in lower for ex in [
        "top cinemas in",
        "terms & conditions",
        "terms and conditions",
        "privacy policy",
        "browse our list",
        "by accessing this page",
        "filters",
    ])


# ==============================================================================
# Core Parser
# ==============================================================================

def parse_showtimes(dom_text: str, provider: str = "") -> List[ParsedShow]:
    """
    Parse raw webpage text into a structured list of ParsedShow objects.

    Args:
        dom_text: Raw body text extracted from page.inner_text("body").
        provider: Provider identifier string (e.g. "BookMyShow", "District").

    Returns:
        List of ParsedShow namedtuples.
    """
    if not dom_text or not isinstance(dom_text, str):
        return []

    lines = [l.strip() for l in dom_text.split("\n") if l.strip()]
    if not lines:
        return []

    results: List[ParsedShow] = []
    current_venue: Optional[str] = None
    seen_in_page = set()

    for line in lines:
        # 1. Check for section delimiters (SEO footers, terms, filters)
        if is_section_delimiter(line):
            current_venue = None
            continue

        # 2. Check if line is a cinema venue header
        if is_valid_cinema_line(line):
            current_venue = line
            continue

        # 3. Check if line contains a showtime
        normalized_time = normalize_time_str(line)
        if normalized_time:
            venue_name = current_venue if current_venue else "Unknown Venue"
            midnight_flag = is_midnight_time(normalized_time)

            # Deduplicate multiple identical show chips under the same venue in the same page
            show_key = (venue_name, normalized_time)
            if show_key not in seen_in_page:
                seen_in_page.add(show_key)
                results.append(
                    ParsedShow(
                        venue=venue_name,
                        time=normalized_time,
                        provider=provider,
                        raw_time=line,
                        is_midnight=midnight_flag
                    )
                )

    return results


def extract_midnight_shows(dom_text: str, provider: str = "") -> List[Tuple[str, str]]:
    """
    Convenience function returning only midnight shows as (venue, normalized_time) tuples.
    Preserves exact backward compatibility with existing monitor scripts.
    """
    all_shows = parse_showtimes(dom_text, provider=provider)
    return [show.to_tuple() for show in all_shows if show.is_midnight]
