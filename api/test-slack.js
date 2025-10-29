export default async function handler(req, res) {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '✅ Slack test successful!',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Message*\n\nYour Slack webhook is working!\n\nTime: ${new Date().toLocaleString()}`
          }
        }]
      })
    });
    
    return res.status(200).json({ success: true, message: 'Sent to Slack!' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
