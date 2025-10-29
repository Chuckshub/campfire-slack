export default async function handler(req, res) {
  const CAMPFIRE_API_TOKEN = process.env.CAMPFIRE_API_TOKEN;
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  
  try {
    // 1. Fetch invoices from Campfire
    const campfireResponse = await fetch('https://api.meetcampfire.com/v1/invoices', {
      headers: {
        'Authorization': `Bearer ${CAMPFIRE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await campfireResponse.json();
    const invoices = data.invoices || data.data || data;
    
    // 2. Filter for recent invoices (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentInvoices = invoices.filter(inv => {
      const createdAt = new Date(inv.created_at || inv.createdAt);
      return createdAt > tenMinutesAgo;
    });
    
    console.log(`Found ${recentInvoices.length} recent invoices`);
    
    // 3. Send Slack notification for each
    for (const invoice of recentInvoices) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📝 New Invoice: ${invoice.invoice_number || invoice.number}`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '📝 New Invoice Created' }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Invoice #:*\n${invoice.invoice_number || invoice.number}` },
                { type: 'mrkdwn', text: `*Customer:*\n${invoice.customer_name || invoice.customer?.name}` },
                { type: 'mrkdwn', text: `*Amount:*\n$${parseFloat(invoice.amount || invoice.total).toFixed(2)}` },
                { type: 'mrkdwn', text: `*Status:*\n${invoice.status}` }
              ]
            }
          ]
        })
      });
    }
    
    return res.status(200).json({
      success: true,
      invoices_checked: invoices.length,
      recent_invoices: recentInvoices.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
