const { Lead } = require('../models');

const STAGE_MAP = {
  32: 'nova_indicacao',
  33: 'prospeccao',
  34: 'em_desenvolvimento',
  35: 'agendado_apresentacao',
  36: 'no_show_treinamento',
  37: 'em_apresentacao',
  38: 'follow_up',
  39: 'aguardando_treinamento',
  40: 'no_show_treinamento',
  41: 'teste_gratis',
  42: 'vendidos',
  43: 'perdidos'
};

const handlePipedriveWebhook = async (req, res) => {
  try {
    console.log(req);
    console.log('Received Pipedrive Webhook:', JSON.stringify(req.body, null, 2));

    let payload = req.body;
    
    // Handle case where payload is wrapped in an empty key string (as seen in user logs)
    if (payload[''] && typeof payload[''] === 'string') {
        try {
            payload = JSON.parse(payload['']);
        } catch (e) {
            console.error('Failed to parse inner JSON payload:', e);
        }
    }

    // Extract relevant data
    // Support both direct fields (user example) and standard Pipedrive structure (current/previous)
    const dealId = payload.deal_id || (payload.current && payload.current.id);
    const stageId = payload.stage_id || (payload.current && payload.current.stage_id);

    if (dealId && stageId) {
        const newStatus = STAGE_MAP[parseInt(stageId)];
        
        if (newStatus) {
            console.log(`Processing deal ${dealId} with stage ${stageId} -> status: ${newStatus}`);
            
            // Find lead by pipedriveId
            // Note: Ensure pipedriveId is stored as string in DB or match types
            const lead = await Lead.findOne({ where: { pipedriveId: String(dealId) } });
            
            if (lead) {
                await lead.update({ status: newStatus });
                console.log(`Lead ${lead.id} updated to status ${newStatus}`);
            } else {
                 console.log(`Lead not found for Pipedrive Deal ID: ${dealId}`);
                 // Fallback: If indicacao_id is present and matches internal ID?
                 if (payload.indicacao_id) {
                     const leadById = await Lead.findByPk(payload.indicacao_id);
                     if (leadById) {
                         // Update status AND save pipedriveId for future reference
                         await leadById.update({ 
                             status: newStatus,
                             pipedriveId: String(dealId)
                         });
                         console.log(`Lead ${leadById.id} updated (matched by indicacao_id)`);
                     }
                 }
            }
        } else {
             console.log(`Stage ID ${stageId} not mapped to any known status.`);
        }
    }

    // Respond immediately with 200 OK
    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Error processing Pipedrive webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handlePipedriveWebhook,
};
