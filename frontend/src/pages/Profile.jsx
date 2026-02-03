import React, { useState, useEffect } from 'react';
import { User, CreditCard, Save, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import partnerService from '../services/partnerService';
import { maskCPF, maskCNPJ, maskPhone } from '../utils/masks';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await partnerService.getProfile();
      setPartner(data);
      setPixKey(data.pixKey || '');
      setPixKeyType(data.pixKeyType || 'cpf');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handlePixKeyChange = (e) => {
    let value = e.target.value;
    
    // Apply masks based on type
    if (pixKeyType === 'cpf') value = maskCPF(value);
    else if (pixKeyType === 'cnpj') value = maskCNPJ(value);
    else if (pixKeyType === 'phone') value = maskPhone(value);
    // Email and random key don't need specific masks, maybe just trim?
    
    setPixKey(value);
  };

  const handlePixKeyTypeChange = (e) => {
    setPixKeyType(e.target.value);
    setPixKey(''); // Clear key when type changes to avoid invalid masks
  };

  const handleUpdatePix = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnerService.updateProfile({ pixKey, pixKeyType });
      toast.success('Chave Pix atualizada com sucesso!');
      setPartner(prev => ({ ...prev, pixKey, pixKeyType }));
    } catch (error) {
      console.error('Erro ao atualizar Pix:', error);
      toast.error('Erro ao atualizar chave Pix.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partner) {
    return <div className="text-center text-gray-500 mt-10">Perfil não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Dados do Parceiro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-700">Dados Pessoais</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nome Completo</p>
                <p className="font-medium text-gray-900">{partner.User?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{partner.User?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone / WhatsApp</p>
                <p className="font-medium text-gray-900">{partner.phone || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium text-gray-900">
                  {partner.city && partner.uf 
                    ? `${partner.city} - ${partner.uf}` 
                    : 'Não informado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Dados Pix (Editável) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-700">Dados Bancários (Pix)</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleUpdatePix}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="pixKeyType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Chave
                  </label>
                  <select
                    id="pixKeyType"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-colors outline-none"
                    value={pixKeyType}
                    onChange={handlePixKeyTypeChange}
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="pixKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Chave Pix
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="pixKey"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                      placeholder={
                        pixKeyType === 'cpf' ? '000.000.000-00' :
                        pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                        pixKeyType === 'phone' ? '(00) 00000-0000' :
                        pixKeyType === 'email' ? 'exemplo@email.com' :
                        'Chave aleatória'
                      }
                      value={pixKey}
                      onChange={handlePixKeyChange}
                    />
                  </div>
                </div>
              </div>

              <p className="mb-4 text-xs text-gray-500">
                Esta chave será utilizada para transferências de comissões aprovadas. Mantenha-a sempre atualizada.
              </p>

              <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm ${
                    saving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando Alterações...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;