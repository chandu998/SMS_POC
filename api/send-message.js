const twilio = require('twilio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { to, contentSid, contentVariables } = req.body;
  
  if (!to || !contentSid || !contentVariables) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const accountSid = "AC2bebd399cc3004c282a942ee8483c7e9";
    const authToken = "398fad43e4ea586126d39c6cd8192b98";
    
    if (!accountSid || !authToken) {
      return res.status(500).json({ success: false, error: 'Twilio credentials not configured.' });
    }

    // --- Start: Added robustness for JSON parsing ---
    let parsedContentVariables;
    try {
      parsedContentVariables = JSON.parse(contentVariables);
    } catch (e) {
      // If the parsing fails, we return a clear error to the client
      return res.status(400).json({ success: false, error: 'Invalid contentVariables JSON format.' });
    }
    // --- End: Added robustness ---

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      contentSid,
      // contentVariables: parsedContentVariables,
    });

    return res.status(200).json({ success: true, sid: message.sid });

  } catch (error) {
    // This will now only catch Twilio API errors or other issues
    return res.status(500).json({ success: false, error: error.message });
  }
};