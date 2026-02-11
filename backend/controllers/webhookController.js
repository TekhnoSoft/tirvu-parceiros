const { Lead, LeadNote } = require('../models');
const { Op } = require('sequelize');

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
    console.log(req.headers, req.body, req.method, req.url);
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

    // Special handling for refId update: { indicacao_id: '=32', deal_id: '=5647' }
    if (payload.indicacao_id && payload.deal_id && 
        typeof payload.indicacao_id === 'string' && payload.indicacao_id.startsWith('=') &&
        typeof payload.deal_id === 'string' && payload.deal_id.startsWith('=')) {
        
        const leadId = payload.indicacao_id.substring(1); // Remove '='
        const refId = payload.deal_id.substring(1);       // Remove '='
        
        console.log(`Processing refId update: Lead ID ${leadId}, Ref ID ${refId}`);

        try {
            const lead = await Lead.findByPk(leadId);
            if (lead) {
                await lead.update({ refId: refId });
                console.log(`Lead ${leadId} updated with refId ${refId}`);
                return res.status(200).json({ message: 'Lead refId updated successfully' });
            } else {
                console.log(`Lead ${leadId} not found for refId update`);
                return res.status(404).json({ message: 'Lead not found' });
            }
        } catch (error) {
            console.error('Error updating lead refId:', error);
            return res.status(500).json({ message: 'Error updating lead' });
        }
    }

    // Handle Note Created Event
    if (payload.meta && payload.meta.entity === 'note' && payload.meta.action === 'create' && payload.data) {
        const { deal_id, content } = payload.data;
        
        console.log(`Processing Note Created: Deal ID ${deal_id}, Content: ${content}`);
        
        if (deal_id && content) {
            try {
                // Find Lead by refId (deal_id)
                // Also check pipedriveId for backward compatibility or if refId isn't set yet
                const lead = await Lead.findOne({ 
                    where: { 
                        [Op.or]: [
                            { refId: String(deal_id) },
                            { pipedriveId: String(deal_id) }
                        ]
                    } 
                });

                if (lead) {
                    await LeadNote.create({
                        leadId: lead.id,
                        content: content,
                        userId: null // Webhook notes don't have a direct internal user mapping easily available
                    });
                    console.log(`Note added to Lead ${lead.id}`);
                    return res.status(200).json({ message: 'Note added successfully' });
                } else {
                    console.log(`Lead not found for Note (Deal ID: ${deal_id})`);
                    return res.status(404).json({ message: 'Lead not found for note' });
                }
            } catch (error) {
                console.error('Error adding note to lead:', error);
                return res.status(500).json({ message: 'Error processing note' });
            }
        }
    }

    // Handle Deal Change (Stage Change)
    if (payload.meta && payload.meta.entity === 'deal' && payload.meta.action === 'change' && payload.data) {
        const dealId = payload.meta.entity_id;
        const stageId = payload.data.stage_id;
        
        console.log(`Processing Deal Change: Deal ID ${dealId}, New Stage ID: ${stageId}`);

        if (dealId && stageId) {
            const newStatus = STAGE_MAP[parseInt(stageId)];
            
            if (newStatus) {
                try {
                    // Find lead by refId (dealId)
                    // Also check pipedriveId for backward compatibility
                    const lead = await Lead.findOne({ 
                        where: { 
                            [Op.or]: [
                                { refId: String(dealId) },
                                { pipedriveId: String(dealId) }
                            ]
                        } 
                    });
                    
                    if (lead) {
                        await lead.update({ status: newStatus });
                        console.log(`Lead ${lead.id} updated to status ${newStatus}`);
                        return res.status(200).json({ message: 'Lead status updated successfully' });
                    } else {
                        console.log(`Lead not found for Deal Change (Deal ID: ${dealId})`);
                        // Fallback logic could go here if needed, but keeping it strict for now based on user request
                        return res.status(404).json({ message: 'Lead not found for deal change' });
                    }
                } catch (error) {
                    console.error('Error updating lead status:', error);
                    return res.status(500).json({ message: 'Error processing deal change' });
                }
            } else {
                 console.log(`Stage ID ${stageId} not mapped to any known status.`);
                 return res.status(200).json({ message: 'Stage not mapped, ignored' });
            }
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
