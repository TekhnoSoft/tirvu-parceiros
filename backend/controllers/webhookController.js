const handlePipedriveWebhook = async (req, res) => {
  try {
    console.log('Received Pipedrive Webhook:', JSON.stringify(req.body, null, 2));

    // Respond immediately with 200 OK
    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Error processing Pipedrive webhook:', error);
    // Even if there is an error in processing (if we add logic later), 
    // we might still want to return 200 to Pipedrive so it doesn't retry endlessly, 
    // unless it's a critical failure we want them to know about.
    // For now, 500 is fine for unexpected errors.
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handlePipedriveWebhook,
};
