import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { 
  Plus, Edit, Trash2, FileText, Image as ImageIcon, 
  Video, Link as LinkIcon, Download, ExternalLink, 
  X, Loader2, Eye, Type
} from 'lucide-react';
import toast from 'react-hot-toast';

const Materials = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'consultor';
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null); // For edit
  const [viewMaterial, setViewMaterial] = useState(null); // For viewing content/video

  const [formData, setFormData] = useState({
    title: '',
    type: 'link',
    description: '',
    url: '',
    content: null, // Base64 or Text
    thumbnail: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getAll();
      setMaterials(data);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setCurrentMaterial(material);
      setFormData({
        title: material.title,
        type: material.type,
        description: material.description || '',
        url: material.url || '',
        content: material.content,
        thumbnail: material.thumbnail || ''
      });
    } else {
      setCurrentMaterial(null);
      setFormData({
        title: '',
        type: 'link',
        description: '',
        url: '',
        content: null,
        thumbnail: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentMaterial(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, content: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Basic validation
      if (!formData.title) {
        toast.error('O título é obrigatório');
        return;
      }

      if (currentMaterial) {
        await materialService.update(currentMaterial.id, formData);
        toast.success('Material atualizado com sucesso');
      } else {
        await materialService.create(formData);
        toast.success('Material criado com sucesso');
      }
      
      handleCloseModal();
      fetchMaterials();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error('Erro ao salvar material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este material?')) {
      try {
        await materialService.delete(id);
        toast.success('Material excluído com sucesso');
        fetchMaterials();
      } catch (error) {
        console.error('Erro ao excluir material:', error);
        toast.error('Erro ao excluir material');
      }
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6 text-red-500" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case 'document': return <FileText className="w-6 h-6 text-orange-500" />;
      case 'text': return <Type className="w-6 h-6 text-gray-500" />;
      default: return <LinkIcon className="w-6 h-6 text-green-500" />;
    }
  };

  const handleDownload = (material) => {
    const link = document.createElement('a');
    link.href = material.content;
    link.download = material.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (material) => {
    if (material.type === 'link') {
      window.open(material.url, '_blank');
    } else if (material.type === 'document') {
        handleDownload(material);
    } else {
      setViewMaterial(material);
    }
  };

  // Helper to extract YouTube ID (simple version)
  const getEmbedUrl = (url) => {
    if (!url) return '';
    // Handle YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) {
            videoId = url.split('/').pop();
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        }
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle Vimeo
    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiais e Treinamentos</h1>
          <p className="text-gray-500 mt-1">Acesse documentos, vídeos e informativos.</p>
        </div>
        
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Material
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <img src="/loader-logo.gif" alt="Carregando..." className="h-40 w-auto" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum material encontrado</h3>
          <p className="text-gray-500 mt-1">Fique atento, novos conteúdos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header/Thumbnail */}
              <div className="h-40 bg-gray-100 relative flex items-center justify-center group cursor-pointer" onClick={() => handleView(material)}>
                {material.type === 'image' && material.content ? (
                  <img src={material.content} alt={material.title} className="w-full h-full object-cover" />
                ) : material.type === 'video' ? (
                   <div className="w-full h-full bg-black/5 flex items-center justify-center relative">
                        {/* Placeholder or Thumbnail if available */}
                        <Video className="w-12 h-12 text-gray-400" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-gray-900" />
                            </div>
                        </div>
                   </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    {getIconByType(material.type)}
                  </div>
                )}
                
                {/* Type Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-semibold text-gray-700 shadow-sm uppercase tracking-wider">
                  {material.type}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1" title={material.title}>{material.title}</h3>
                    {canEdit && (
                        <div className="flex gap-1">
                            <button onClick={() => handleOpenModal(material)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(material.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{material.description}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleView(material)}
                    className="flex-1 py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {material.type === 'video' ? <><Eye className="w-4 h-4" /> Assistir</> :
                    material.type === 'link' ? <><ExternalLink className="w-4 h-4" /> Acessar</> :
                    material.type === 'document' ? <><Download className="w-4 h-4" /> Baixar</> :
                    material.type === 'image' ? <><Eye className="w-4 h-4" /> Visualizar</> :
                    <><Eye className="w-4 h-4" /> Ler</>}
                  </button>

                  {material.type === 'image' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(material);
                      }}
                      className="px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {currentMaterial ? 'Editar Material' : 'Adicionar Material'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Treinamento de Vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value, content: null, url: ''})}
                >
                  <option value="link">Link Externo</option>
                  <option value="video">Vídeo (YouTube/Vimeo)</option>
                  <option value="document">Documento (PDF/Doc)</option>
                  <option value="image">Imagem/Banner</option>
                  <option value="text">Texto Informativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrição do material..."
                />
              </div>

              {/* Dynamic Inputs based on Type */}
              {(formData.type === 'link' || formData.type === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    placeholder={formData.type === 'video' ? "https://youtube.com/..." : "https://..."}
                  />
                </div>
              )}

              {(formData.type === 'document' || formData.type === 'image') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
                  <input
                    type="file"
                    accept={formData.type === 'image' ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx"}
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {formData.content && <p className="text-xs text-green-600 mt-1">Arquivo carregado</p>}
                </div>
              )}

              {formData.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                  <textarea
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                    rows="6"
                    value={formData.content || ''}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Digite o conteúdo aqui..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : 'Salvar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Material Modal (Video/Text/Image) */}
      {viewMaterial && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewMaterial(null)}>
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => setViewMaterial(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            {viewMaterial.type === 'video' ? (
                <div className="aspect-video w-full bg-black">
                    <iframe 
                        src={getEmbedUrl(viewMaterial.url)} 
                        title={viewMaterial.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            ) : viewMaterial.type === 'image' ? (
                <div className="w-full h-full max-h-[85vh] overflow-auto flex items-center justify-center bg-gray-100">
                    <img src={viewMaterial.content} alt={viewMaterial.title} className="max-w-full max-h-full object-contain" />
                </div>
            ) : viewMaterial.type === 'text' ? (
                <div className="p-8 overflow-y-auto max-h-[85vh]">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{viewMaterial.title}</h2>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                        {viewMaterial.content}
                    </div>
                </div>
            ) : null}
            
            {viewMaterial.type !== 'text' && (
                <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-lg">{viewMaterial.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{viewMaterial.description}</p>
                    </div>
                    {viewMaterial.type === 'image' && (
                        <button 
                            onClick={() => handleDownload(viewMaterial)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Baixar</span>
                        </button>
                    )}
                </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Materials;
