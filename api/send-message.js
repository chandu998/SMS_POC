const twilio = require('twilio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { to, contentSid, contentVariables } = req.body;
  if (!to || !contentSid || !contentVariables) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Use your sandbox credentials and number
    const accountSid = 'AC2bebd399cc3004c282a942ee8483c7e9';
    const authToken = '398fad43e4ea586126d39c6cd8192b98'; // Replace with your actual Auth Token
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio sandbox number
      to: `whatsapp:${to}`,
      contentSid,
      contentVariables,
    });

    return res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
