import os
import sys
import time
import datetime
import re
import html
import json
import random
import tempfile
import requests
from playwright.sync_api import sync_playwright
from showtime_parser import parse_showtimes, is_midnight_time, ParsedShow

# ==================== ENVIRONMENT CONFIGURATION ====================
def load_env_file(filepath=None):
    """Lightweight .env loader without external dependencies."""
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'").strip()
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"[!] Warning: Could not read .env: {e}")

load_env_file()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

DISTRICT_URL = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"
BMS_BUY_URL = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"

CLOUD_SEEN_FILE = os.path.join(os.path.dirname(__file__), "cloud_seen_shows.json")
# ===================================================================

def load_cloud_seen(filepath=None):
    """Load persistent cloud seen state from JSON.

    Returns a set of string show identifiers.
    - Missing file initializes to an empty set.
    - Corrupted or structurally invalid JSON raises ValueError to prevent duplicate alerts.
    """
    if filepath is None:
        filepath = CLOUD_SEEN_FILE
    if not os.path.exists(filepath):
        return set()

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Corrupted cloud state file '{filepath}': invalid JSON ({e})") from e
    except Exception as e:
        raise ValueError(f"Failed to read cloud state file '{filepath}': {e}") from e

    if not isinstance(data, list) or not all(isinstance(item, str) for item in data):
        raise ValueError(f"Structurally invalid cloud state in '{filepath}': expected list of strings, got {type(data).__name__}")

    return set(data)

def save_cloud_seen(seen, filepath=None):
    """Atomically save cloud seen state to disk using a temporary file and os.replace."""
    if filepath is None:
        filepath = CLOUD_SEEN_FILE

    target_dir = os.path.dirname(os.path.abspath(filepath)) or "."
    temp_path = None
    try:
        os.makedirs(target_dir, exist_ok=True)
        fd, temp_path = tempfile.mkstemp(prefix="cloud_seen_", suffix=".tmp", dir=target_dir)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(sorted(list(seen)), f, indent=2)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, filepath)
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise IOError(f"Failed to atomically persist cloud state to '{filepath}': {e}") from e

def mark_cloud_shows_seen(seen, district_shows, filepath=None):
    """Mark successfully alerted District shows as seen and persist atomically to disk."""
    for v, t in district_shows:
        seen.add(f"DISTRICT_{v}_{t}")
    save_cloud_seen(seen, filepath=filepath)

def mask_token(text: str, token: str) -> str:
    """Mask token from any string before logging to prevent accidental credential leakage."""
    if token and token in text:
        return text.replace(token, "[REDACTED_BOT_TOKEN]")
    return text

def validate_credentials():
    """Verify that required credentials are set; fail safely if missing."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        sys.exit(
            "[!] CONFIGURATION ERROR: Missing required credentials.\n"
            "    Please configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID\n"
            "    as environment variables (or GitHub Actions Secrets).\n"
            "    See .env.example for template."
        )

def send_telegram_alert(message, max_retries=3, base_delay=1.0):
    validate_credentials()
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(url, json=payload, timeout=10)

            # Safely determine status code (handling mocks where status_code may be a MagicMock)
            if type(getattr(resp, "status_code", None)) is int:
                status_code = resp.status_code
            else:
                try:
                    data = resp.json()
                    status_code = 200 if (isinstance(data, dict) and data.get("ok")) else 400
                except Exception:
                    status_code = 200

            # 1. Success case
            if status_code == 200:
                try:
                    data = resp.json()
                    if data.get("ok"):
                        return True
                    err_desc = mask_token(str(data.get("description", "Unknown API error")), TELEGRAM_BOT_TOKEN)
                    print(f"[!] Telegram API error (attempt {attempt}/{max_retries}): {err_desc}")
                except Exception as e:
                    print(f"[!] Telegram JSON parse error (attempt {attempt}/{max_retries}): {e}")

            # 2. Rate limit hit (HTTP 429)
            elif status_code == 429:
                retry_after = 5.0
                err_desc = "Too Many Requests"
                try:
                    data = resp.json()
                    err_desc = mask_token(str(data.get("description", err_desc)), TELEGRAM_BOT_TOKEN)
                    if "parameters" in data and "retry_after" in data["parameters"]:
                        retry_after = float(data["parameters"]["retry_after"])
                except Exception:
                    pass

                headers = getattr(resp, "headers", {}) or {}
                if "Retry-After" in headers:
                    try:
                        retry_after = float(headers["Retry-After"])
                    except ValueError:
                        pass

                # Cap retry_after between 0.5s and 30s to avoid excessive blocking
                retry_after = min(max(retry_after, 0.5), 30.0)
                print(f"[!] Telegram rate limit hit (HTTP 429, attempt {attempt}/{max_retries}): {err_desc}. Sleeping {retry_after}s...")
                if attempt < max_retries:
                    time.sleep(retry_after)
                    continue
                else:
                    print(f"[!] Telegram rate limit: max retries ({max_retries}) exhausted.")
                    return False

            # 3. Permanent client errors (HTTP 4xx except 429: 400, 401, 403, 404, etc.)
            elif 400 <= status_code < 500:
                try:
                    data = resp.json()
                    err_desc = mask_token(str(data.get("description", getattr(resp, "text", ""))), TELEGRAM_BOT_TOKEN)
                except Exception:
                    err_desc = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram client error HTTP {status_code} (non-retryable): {err_desc}")
                return False

            # 4. Server errors (HTTP 5xx)
            elif status_code >= 500:
                err_text = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram server error HTTP {status_code} (attempt {attempt}/{max_retries}): {err_text}")

            # 5. Unexpected status
            else:
                err_text = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram unexpected HTTP {status_code} (attempt {attempt}/{max_retries}): {err_text}")

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as net_err:
            safe_err = mask_token(str(net_err), TELEGRAM_BOT_TOKEN)
            print(f"[!] Telegram network error (attempt {attempt}/{max_retries}): {safe_err}")

        except Exception as e:
            safe_err = mask_token(str(e), TELEGRAM_BOT_TOKEN)
            print(f"[!] Telegram request exception (attempt {attempt}/{max_retries}): {safe_err}")

        # Sleep with exponential backoff and jitter if retries remain
        if attempt < max_retries:
            jitter = random.uniform(0.1, 0.5)
            delay = (base_delay * (2 ** (attempt - 1))) + jitter
            print(f"    Retrying Telegram alert in {delay:.2f}s...")
            time.sleep(delay)
        else:
            print(f"[!] Telegram alert delivery failed after {max_retries} attempts.")
            return False

    return False

def check_bookmyshow(page=None, seen=None):
    """BookMyShow cloud scraping is skipped due to Cloudflare anti-bot restrictions."""
    return []

def check_district(page, seen):
    """Perform a single check on District and return new midnight shows not in seen."""
    found_shows = []
    cycle_seen = set()
    try:
        page.goto(DISTRICT_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        parsed_shows = parse_showtimes(all_text, provider="District")
        for show in parsed_shows:
            if show.is_midnight:
                show_key = f"DISTRICT_{show.venue}_{show.time}"
                if show_key not in seen and show_key not in cycle_seen:
                    found_shows.append((show.venue, show.time))
                    cycle_seen.add(show_key)
    except Exception as e:
        print(f"  [District Error]: {e}")
        
    return found_shows

def format_telegram_alert(bms_shows, district_shows):
    """Format and HTML-escape telegram alert message."""
    msg_lines = [
        "🚨 <b>TICKETS ALERT: 12 AM SHOWS FOUND!</b> 🚨\n",
        "<b>Movie:</b> Avengers: Doomsday",
        "<b>Date:</b> December 17, 2026",
        "<b>City:</b> Hyderabad\n"
    ]
    
    if bms_shows:
        msg_lines.append("🎟️ <b>BookMyShow Shows:</b>")
        for v, t in bms_shows:
            clean_v = html.escape(str(v))
            clean_t = html.escape(str(t))
            msg_lines.append(f"• <b>{clean_t}</b> at {clean_v}")
        msg_lines.append(f'<a href="{BMS_BUY_URL}">👉 Click Here to Book on BookMyShow</a>\n')
        
    if district_shows:
        msg_lines.append("🎟️ <b>District Shows:</b>")
        for v, t in district_shows:
            clean_v = html.escape(str(v))
            clean_t = html.escape(str(t))
            msg_lines.append(f"• <b>{clean_t}</b> at {clean_v}")
        msg_lines.append(f'<a href="{DISTRICT_URL}">👉 Click Here to Book on District</a>\n')
        
    return "\n".join(msg_lines)

def main():
    validate_credentials()
    
    print("=" * 60)
    print(" ☁️ CLOUD NOTIFIER (SINGLE-SHOT): AVENGERS DOOMSDAY")
    print(" Provider: District (Hyderabad - Dec 17)")
    print(" Mode: Single execution with persistent state")
    print("=" * 60)
    
    # 1. Load persistent cloud state
    try:
        seen = load_cloud_seen()
        print(f"[*] Loaded {len(seen)} previously seen shows from cloud state.")
    except Exception as e:
        sys.exit(f"[!] FATAL: Cloud state validation failed: {e}")
    
    # 2. Perform single District check with Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now_str}] Checking District...")
        district_shows = check_district(page, seen)
        
        browser.close()
        
    # 3. Handle results
    if not district_shows:
        print("  -> No new 12 AM shows found on District.")
        print("✅ Single-shot check complete. Exiting cleanly.")
        return 0
        
    # 4. New shows found: build alert message
    full_msg = format_telegram_alert([], district_shows)
    print("\n" + "!" * 50)
    print(f"💥 {len(district_shows)} NEW 12 AM SHOW(S) FOUND! SENDING TELEGRAM ALERT...")
    print("!" * 50)
    
    sent = send_telegram_alert(full_msg)
    if not sent:
        print("❌ FAILED to send Telegram alert. Cloud state unchanged; shows will be retried on next run.")
        sys.exit(1)
        
    print("✅ Telegram alert sent successfully.")
    
    # 5. Only persist state after confirmed delivery
    try:
        mark_cloud_shows_seen(seen, district_shows)
        print(f"✅ Successfully persisted {len(district_shows)} new show(s) to cloud_seen_shows.json.")
    except Exception as e:
        print(f"[!] CRITICAL ERROR: Telegram alert sent, but failed to persist cloud state: {e}")
        sys.exit(1)
        
    return 0

if __name__ == "__main__":
    main()
