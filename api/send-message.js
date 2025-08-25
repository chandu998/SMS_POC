const twilio = require('twilio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { to, contentSid, contentVariables } = req.body;
  
  if (!to || !contentSid || !contentVariables) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // --- THIS IS THE CRUCIAL CHANGE ---
    // Load secrets from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Check if variables are set to prevent errors
    if (!accountSid || !authToken) {
      return res.status(500).json({ success: false, error: 'Twilio credentials not configured.' });
    }

    const client = twilio(accountSid, authToken);

    const parsedContentVariables = JSON.parse(contentVariables);

    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      contentSid,
      contentVariables: parsedContentVariables,
    });

    return res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};