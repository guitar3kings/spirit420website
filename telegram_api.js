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
    
    // Telegram Bot Token и Chat ID
    const BOT_TOKEN = '8592268723:AAERL30weAwcS6vCxejXvWKS-kZ72_ZPOpk';
    const ADMIN_ID = '393004597';

    // Формируем список товаров
    const itemsList = orderData.items.map(item => 
      `• ${item.name} x${item.quantity} - ฿${item.price * item.quantity}`
    ).join('\n');

    // Формируем сообщение
    const message = `
🔔 НОВЫЙ ЗАКАЗ #${orderData.orderId}

👤 Клиент: ${orderData.name}
📱 Телефон: ${orderData.phone}

🍵 Товары:
${itemsList}

📍 Адрес: ${orderData.address}
🗺️ Координаты: https://maps.google.com/?q=${orderData.location.lat},${orderData.location.lng}

🕐 Время: ${orderData.time}
💬 Комментарий: ${orderData.comment || '-'}

💰 Сумма товаров: ${orderData.subtotal}
🚚 Доставка: ${orderData.delivery}
━━━━━━━━━━━━━
💵 ИТОГО: ${orderData.total}
    `.trim();

    // Отправляем в Telegram
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
      throw new Error('Failed to send to Telegram');
    }

    // Также отправляем локацию отдельным сообщением
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

    return res.status(200).json({ success: true, orderId: orderData.orderId });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process order' });
  }
}