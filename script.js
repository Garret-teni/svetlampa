// Формы отправляют заявку напрямую в Telegram (токен в коде страницы).

const BOT_TOKEN = '8996398615:AAG8JVbqzyJwk4tUUO-4udx2MwCLcBjIwIc';
const CHAT_ID = '700541690';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

function buildMessage(form) {
  const fd = new FormData(form);
  const parts = ['НОВАЯ ЗАЯВКА с сайта СветЛампа'];
  const push = (label, val) => {
    const v = (val || '').toString().trim();
    if (v) parts.push(`${label}: ${v}`);
  };

  if (form.id === 'custom-form') {
    parts.push('');
    parts.push('-- Конструктор лампы --');
    push('Форма основания', fd.get('shape'));
    push('Размер / длина', fd.get('size'));
    push('Цвет света', fd.get('color'));
    push('LED-лент', fd.get('strips'));
    push('Пожелания', fd.get('message'));
    parts.push('');
    parts.push('-- Контакты --');
    push('Имя', fd.get('name'));
    push('Телефон/Telegram', fd.get('phone'));
  } else {
    parts.push('');
    parts.push('-- Заказ --');
    push('Имя', fd.get('name'));
    push('Телефон/Telegram', fd.get('phone'));
    push('Тип', fd.get('type'));
    push('Описание', fd.get('message'));
  }

  return parts.join('\n');
}

async function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const status = form.querySelector('[data-status]');
  status.textContent = 'Отправляем...';
  status.className = 'form-status';

  try {
    const res = await fetch(TG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: buildMessage(form),
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      status.textContent = '✅ Заявка отправлена! Мастер свяжется с вами.';
      status.className = 'form-status ok';
      form.reset();
    } else {
      throw new Error(data.error || 'Ошибка');
    }
  } catch (err) {
    status.textContent = '❌ Не удалось отправить. Попробуйте ещё раз.';
    status.className = 'form-status err';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const custom = document.getElementById('custom-form');
  const order = document.getElementById('order-form');
  if (custom) custom.addEventListener('submit', submitForm);
  if (order) order.addEventListener('submit', submitForm);

  // Мобильное меню
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.style.display === 'flex';
      nav.style.display = open ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '68px';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.background = '#f7f4ef';
      nav.style.padding = '16px 20px';
      nav.style.boxShadow = '0 10px 30px rgba(0,0,0,.1)';
    });
  }
});