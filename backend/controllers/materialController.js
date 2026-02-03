const { Material } = require('../models');

exports.createMaterial = async (req, res) => {
  try {
    const { title, type, url, content, description, thumbnail } = req.body;
    
    // Validations
    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }
    if (!type) {
      return res.status(400).json({ message: 'Tipo é obrigatório' });
    }

    const material = await Material.create({
      title,
      type,
      url,
      content,
      description,
      thumbnail
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ message: 'Erro ao criar material' });
  }
};

exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(materials);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ message: 'Erro ao buscar materiais' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, url, content, description, thumbnail } = req.body;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado' });
    }

    await material.update({
      title,
      type,
      url,
      content,
      description,
      thumbnail
    });

    res.json(material);
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ message: 'Erro ao atualizar material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado' });
    }

    await material.destroy();
    res.json({ message: 'Material excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ message: 'Erro ao excluir material' });
  }
};
