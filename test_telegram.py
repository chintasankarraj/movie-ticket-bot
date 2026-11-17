import requests

TELEGRAM_BOT_TOKEN = "9240366318:AAFxev3gxJYJEtF4A9rwAF4nRlaNmsw70P8"
TELEGRAM_CHAT_ID = "1836867995"

url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
payload = {
    "chat_id": TELEGRAM_CHAT_ID,
    "text": "🎉 <b>Success!</b> Your Avengers Doomsday 12 AM Ticket Notifier is connected and ready to send alerts!",
    "parse_mode": "HTML"
}

resp = requests.post(url, json=payload, timeout=10)
data = resp.json()

if data.get("ok"):
    print("✅ SUCCESS! Telegram message delivered to your phone!")
else:
    print("❌ ERROR:", data.get("description"))
    print("\n👉 Remember: Open Telegram, search for @chintasankarrajbot, and click the START button at the bottom.")
