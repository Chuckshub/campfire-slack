export default async function handler(req, res) {
  const CAMPFIRE_API_TOKEN = process.env.CAMPFIRE_API_TOKEN;
  
  try {
    const response = await fetch('https://api.meetcampfire.com/v1/invoices', {
      headers: {
        'Authorization': `Bearer ${CAMPFIRE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const invoices = data.invoices || data.data || data;
    
    return res.status(200).json({
      success: true,
      total_invoices: invoices.length,
      sample: invoices[0] || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
