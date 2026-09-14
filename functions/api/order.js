// Cloudflare Pages Function: принимает заявку с сайта и отправляет её в Telegram.
// Токен и chat_id берутся из защищённых переменных окружения Cloudflare,
// поэтому в браузер посетителя они не попадают.

const TELEGRAM_API = "https://api.telegram.org";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const text = (body.text || "").toString().trim();

    if (!text) {
      return json(400, { ok: false, error: "Пустое сообщение" });
    }
    if (!env.BOT_TOKEN || !env.CHAT_ID) {
      return json(500, { ok: false, error: "Сервер не настроен (BOT_TOKEN/CHAT_ID)" });
    }

    const url = `${TELEGRAM_API}/bot${env.BOT_TOKEN}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!resp.ok) {
      return json(502, { ok: false, error: "Не удалось отправить в Telegram" });
    }
    return json(200, { ok: true });
  } catch (err) {
    return json(400, { ok: false, error: "Некорректный запрос" });
  }
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}