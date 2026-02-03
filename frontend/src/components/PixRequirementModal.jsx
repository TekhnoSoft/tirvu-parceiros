import React, { useState, useEffect } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import partnerService from '../services/partnerService';
import { maskCPF, maskCNPJ, maskPhone } from '../utils/masks';

const PixRequirementModal = ({ isOpen, onClose }) => {
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [saving, setSaving] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePixKeyChange = (e) => {
    let value = e.target.value;
    
    if (pixKeyType === 'cpf') value = maskCPF(value);
    else if (pixKeyType === 'cnpj') value = maskCNPJ(value);
    else if (pixKeyType === 'phone') value = maskPhone(value);
    
    setPixKey(value);
  };

  const handlePixKeyTypeChange = (e) => {
    setPixKeyType(e.target.value);
    setPixKey(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pixKey) {
        toast.error('Por favor, informe a chave Pix.');
        return;
    }

    setSaving(true);
    try {
      await partnerService.updateProfile({ pixKey, pixKeyType });
      toast.success('Chave Pix cadastrada com sucesso!');
      onClose(); // Callback to notify parent (Layout) that it's done
    } catch (error) {
      console.error('Erro ao cadastrar Pix:', error);
      toast.error('Erro ao salvar chave Pix.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-red-50 p-6 border-b border-red-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-full">
                    <CreditCard className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-800">Atenção Necessária</h2>
            </div>
            <p className="text-red-700 text-sm">
                Para continuar utilizando a plataforma e receber suas comissões, é obrigatório cadastrar uma chave Pix válida.
            </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="modalPixKeyType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Chave
                </label>
                <select
                  id="modalPixKeyType"
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

              <div>
                <label htmlFor="modalPixKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Chave Pix
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="modalPixKey"
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
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={saving}
                className={`w-full flex justify-center items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md ${
                  saving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Cadastrar Chave Pix'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PixRequirementModal;