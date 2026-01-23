import crypto from 'crypto';

export default async function handler(req, res) {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  const CAMPFIRE_WEBHOOK_SECRET = process.env.CAMPFIRE_WEBHOOK_SECRET;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    if (CAMPFIRE_WEBHOOK_SECRET) {
      const signature = req.headers['x-webhook-signature'] || req.headers['x-campfire-signature'];
      if (signature) {
        const hmac = crypto.createHmac('sha256', CAMPFIRE_WEBHOOK_SECRET);
        hmac.update(JSON.stringify(req.body));
        const expectedSignature = hmac.digest('hex');
        
        if (signature !== expectedSignature) {
          console.log('Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
    }
    
    console.log('Webhook received:', JSON.stringify(req.body));
    
    const data = req.body;
    const invoice = data.data || data.invoice || data;
    const eventType = data.topic || 'unknown';

    let headerText = '📝 New Invoice Created';
    let emoji = '📝';

    if (eventType === 'Invoice.paid') {
      headerText = '✅ Invoice Paid';
      emoji = '✅';
    }
    
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} Invoice: ${invoice.invoice_number || invoice.number}`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: headerText }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Invoice #:*\n${invoice.invoice_number || invoice.number || 'N/A'}` },
              { type: 'mrkdwn', text: `*Customer:*\n${invoice.client_name || invoice.customer_name || 'N/A'}` },
              { type: 'mrkdwn', text: `*Amount:*\n${(() => {
                if (eventType === 'Invoice.paid') {
                  const amountPaid = parseFloat(invoice.amount_paid || 0);
                  return amountPaid > 0 ? `$${amountPaid.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A';
                }
                const amount = parseFloat(invoice.amount_due || invoice.total_amount || invoice.amount || 0);
                return amount > 0 ? `$${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A';
              })()}` },
              { type: 'mrkdwn', text: `*Invoice Date:*\n${invoice.invoice_date || 'N/A'}` },
              { type: 'mrkdwn', text: `*Payment Terms:*\n${invoice.payment_term_name || 'N/A'}` },
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<https://app.meetcampfire.com/v2/accounting/invoices/${invoice.id}|View in Campfire →>`
            }
          }
        ]
      })
    });
    
    return res.status(200).json({ success: true, message: 'Notification sent' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
