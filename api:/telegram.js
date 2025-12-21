// api/telegram.js
// Vercel Serverless Function для отправки уведомлений в Telegram

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderData = req.body;
    
    // Telegram Bot Token и Chat ID (твои данные)
    const BOT_TOKEN = '8592268723:AAERL30weAwcS6vCxejXvWKS-kZ72_ZPOpk';
    const ADMIN_ID = '393004597';

    // Формируем список товаров с HTML форматированием
    const itemsList = orderData.items.map(item => 
      `  • <b>${item.name}</b> x${item.quantity} - ฿${item.price * item.quantity}`
    ).join('\n');

    // Формируем красивое сообщение
    const message = `
🔔 <b>НОВЫЙ ЗАКАЗ #${orderData.orderId}</b>

👤 <b>Клиент:</b> ${orderData.name}
📱 <b>Телефон:</b> ${orderData.phone}

🛍 <b>Товары:</b>
${itemsList}

📍 <b>Адрес:</b> ${orderData.address}
🕐 <b>Время доставки:</b> ${orderData.time}
💬 <b>Комментарий:</b> ${orderData.comment || '-'}

💰 <b>Товары:</b> ${orderData.subtotal}
🚚 <b>Доставка:</b> ${orderData.delivery}
━━━━━━━━━━━━━
💵 <b>ИТОГО: ${orderData.total}</b>

⏰ Заказ получен: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bangkok' })}
    `.trim();

    // Отправляем текстовое сообщение
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    if (!telegramResponse.ok) {
      const error = await telegramResponse.json();
      throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
    }

    // Отправляем локацию на карте (если есть координаты)
    if (orderData.location) {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_ID,
            latitude: orderData.location.lat,
            longitude: orderData.location.lng
          })
        }
      );
    }

    return res.status(200).json({ 
      success: true, 
      orderId: orderData.orderId,
      message: 'Order notification sent to admin'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process order',
      details: error.message 
    });
  }
}