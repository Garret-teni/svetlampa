"""
Простой веб-сервер для сайта СветЛампа.
Раздаёт статические файлы (HTML/CSS/JS) и принимает заявки,
пересылая их в Telegram. Токен бота хранится только на сервере
в файле .env и не попадает в браузер клиента.
"""
import os
import json
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE_DIR = Path(__file__).parent

# --- Настройки из файла .env ---
def load_env():
    env = {}
    env_file = SITE_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

ENV = load_env()
# Приоритет: переменные окружения (например, заданные на Render) > файл .env
BOT_TOKEN = os.environ.get("BOT_TOKEN") or ENV.get("BOT_TOKEN", "")
CHAT_ID = os.environ.get("CHAT_ID") or ENV.get("CHAT_ID", "")

MAX_BODY = 32_000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def do_POST(self):
        if self.path != "/api/order":
            self.send_error(404, "Not Found")
            return

        length = int(self.headers.get("Content-Length", 0))
        if length > MAX_BODY:
            self._json(413, {"ok": False, "error": "Слишком большой запрос"})
            return

        raw = self.rfile.read(length) if length else b""
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            self._json(400, {"ok": False, "error": "Некорректный JSON"})
            return

        text = str(data.get("text", "")).strip()
        if not text:
            self._json(400, {"ok": False, "error": "Пустое сообщение"})
            return

        if not BOT_TOKEN or not CHAT_ID:
            self._json(500, {"ok": False, "error": "Сервер не настроен (BOT_TOKEN/CHAT_ID)"})
            return

        ok = self.send_telegram(text)
        if ok:
            self._json(200, {"ok": True})
        else:
            self._json(502, {"ok": False, "error": "Не удалось отправить в Telegram"})

    def send_telegram(self, text):
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = json.dumps({
            "chat_id": CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Сайт запущен: http://localhost:{port}")
    print("Для остановки нажмите Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановлено.")


if __name__ == "__main__":
    main()