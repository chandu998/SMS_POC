const { put } = require('@vercel/blob');
const twilio = require('twilio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { to, body, imageBase64, channel } = req.body;
  if (!to || !body || !imageBase64 || !channel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const blob = await put(`msg-image-${Date.now()}.png`, imageBuffer, {
      access: 'public',
      contentType: 'image/png',
    });
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const twilioSmsNumber = process.env.TWILIO_SMS_NUMBER;
    if (!accountSid || !authToken || !twilioWhatsAppNumber || !twilioSmsNumber) {
      return res.status(500).json({ error: 'Server configuration error.' });
    }
    const client = twilio(accountSid, authToken);
    let message;
    if (channel === 'whatsapp') {
      message = await client.messages.create({
        from: twilioWhatsAppNumber,
        to: `whatsapp:${to}`,
        body,
        mediaUrl: [blob.url],
      });
    } else if (channel === 'mms') {
      message = await client.messages.create({
        from: twilioSmsNumber,
        to,
        body,
        mediaUrl: [blob.url],
      });
    } else {
      return res.status(400).json({ error: 'Invalid channel' });
    }
    return res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
