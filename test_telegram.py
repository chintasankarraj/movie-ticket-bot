import os
import sys
import requests

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

def mask_token(text: str, token: str) -> str:
    if token and token in text:
        return text.replace(token, "[REDACTED_BOT_TOKEN]")
    return text

def test_telegram_connection():
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        sys.exit(
            "[!] CONFIGURATION ERROR: Missing required credentials.\n"
            "    Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment or in a .env file.\n"
            "    See .env.example for template."
        )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": "🎉 <b>Success!</b> Your Avengers Doomsday 12 AM Ticket Notifier is connected and ready to send alerts!",
        "parse_mode": "HTML"
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        data = resp.json()

        if data.get("ok"):
            print("✅ SUCCESS! Telegram message delivered to your phone!")
        else:
            err_desc = mask_token(str(data.get("description")), TELEGRAM_BOT_TOKEN)
            print("❌ ERROR:", err_desc)
            print("\n👉 Remember: Open Telegram, search for your bot, and click the START button at the bottom.")
    except Exception as e:
        safe_err = mask_token(str(e), TELEGRAM_BOT_TOKEN)
        print(f"❌ Connection error: {safe_err}")

if __name__ == "__main__":
    test_telegram_connection()
