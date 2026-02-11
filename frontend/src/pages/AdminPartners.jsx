import React, { useState, useEffect, useRef } from 'react';
import partnerService from '../services/partnerService';
import { CheckCircle, XCircle, Search, Filter, Loader2, X, AlertCircle, ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ptBR } from 'date-fns/locale';
import { 
  format, startOfMonth, endOfMonth, subMonths, addMonths, 
  startOfWeek, endOfWeek, startOfYear, endOfYear, 
  subDays, addDays, addWeeks, subWeeks, addYears, subYears,
  startOfDay, endOfDay
} from 'date-fns';

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [refreshInterval, setRefreshInterval] = useState(0); // 0 = off
  
  // Date Filter State
  const [dateFilterMode, setDateFilterMode] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly', 'last12', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  const [searchTerm, setSearchTerm] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update start/end dates when mode or reference date changes
  useEffect(() => {
    updateDateRange();
  }, [dateFilterMode, referenceDate]);

  const updateDateRange = () => {
    let start, end;
    const now = new Date();

    switch (dateFilterMode) {
      case 'daily':
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
        break;
      case 'weekly':
        start = startOfWeek(referenceDate, { locale: ptBR });
        end = endOfWeek(referenceDate, { locale: ptBR });
        break;
      case 'monthly':
        start = startOfMonth(referenceDate);
        end = endOfMonth(referenceDate);
        break;
      case 'yearly':
        start = startOfYear(referenceDate);
        end = endOfYear(referenceDate);
        break;
      case 'last12':
        start = subMonths(now, 12);
        end = endOfDay(now);
        break;
      case 'all':
        start = null;
        end = null;
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
    setStartDate(start);
    setEndDate(end);
  };

  const handlePrev = () => {
    switch (dateFilterMode) {
      case 'daily': setReferenceDate(subDays(referenceDate, 1)); break;
      case 'weekly': setReferenceDate(subWeeks(referenceDate, 1)); break;
      case 'monthly': setReferenceDate(subMonths(referenceDate, 1)); break;
      case 'yearly': setReferenceDate(subYears(referenceDate, 1)); break;
      default: break;
    }
  };

  const handleNext = () => {
    switch (dateFilterMode) {
      case 'daily': setReferenceDate(addDays(referenceDate, 1)); break;
      case 'weekly': setReferenceDate(addWeeks(referenceDate, 1)); break;
      case 'monthly': setReferenceDate(addMonths(referenceDate, 1)); break;
      case 'yearly': setReferenceDate(addYears(referenceDate, 1)); break;
      default: break;
    }
  };

  const getLabel = () => {
    switch (dateFilterMode) {
      case 'daily':
        // Se for hoje, mostrar "Hoje", se for ontem, "Ontem", senão data
        const today = startOfDay(new Date());
        const ref = startOfDay(referenceDate);
        if (ref.getTime() === today.getTime()) return 'Hoje';
        if (ref.getTime() === subDays(today, 1).getTime()) return 'Ontem';
        return format(referenceDate, "dd 'de' MMMM", { locale: ptBR });
      case 'weekly':
        const start = startOfWeek(referenceDate, { locale: ptBR });
        const end = endOfWeek(referenceDate, { locale: ptBR });
        // Se start e end forem no mesmo mês: 01 - 07 de Fevereiro
        if (start.getMonth() === end.getMonth()) {
           return `${format(start, 'dd')} - ${format(end, 'dd')} de ${format(end, 'MMMM', { locale: ptBR })}`;
        }
        return `${format(start, 'dd/MMM')} - ${format(end, 'dd/MMM', { locale: ptBR })}`;
      case 'monthly':
        return format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR });
      case 'yearly':
        return format(referenceDate, "yyyy", { locale: ptBR });
      case 'last12':
        return 'Últimos 12 meses';
      case 'all':
        return 'Todo o período';
      default:
        return '';
    }
  };

  const handleModeSelect = (mode) => {
    setDateFilterMode(mode);
    // Reset reference date to today when switching modes, except for navigation consistency if desired
    // For now, reset to today makes sense for "Ontem", "Hoje", etc.
    if (mode === 'daily' && dateFilterMode !== 'daily') setReferenceDate(new Date());
    if (mode === 'daily_yesterday') {
        setDateFilterMode('daily');
        setReferenceDate(subDays(new Date(), 1));
    } else if (mode === 'daily_today') {
        setDateFilterMode('daily');
        setReferenceDate(new Date());
    } else {
        setReferenceDate(new Date());
    }
    setIsDateDropdownOpen(false);
  };
  
  // Modal State
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Consultant Selection State
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState('');

  useEffect(() => {
    fetchPartners();
    fetchConsultants();
  }, [startDate, endDate]); // Refetch when date range changes

  const fetchConsultants = async () => {
    try {
      const data = await partnerService.getConsultants();
      setConsultants(data);
    } catch (error) {
      console.error('Erro ao buscar consultores:', error);
    }
  };

  const fetchPartners = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await partnerService.list('all', startDate, endDate);
      setPartners(data);
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-refresh logic
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchPartners(true);
      }, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, startDate, endDate]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await partnerService.approve(selectedPartner.id, selectedConsultant);
      await fetchPartners(); // Refresh list
      setIsApproveModalOpen(false);
      toast.success('Parceiro aprovado com sucesso! Credenciais enviadas via WhatsApp.');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar parceiro.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (partner) => {
    setSelectedPartner(partner);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const openApproveModal = (partner) => {
    setSelectedPartner(partner);
    setSelectedConsultant('');
    setIsApproveModalOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    try {
      setActionLoading(true);
      await partnerService.reject(selectedPartner.id, rejectReason);
      await fetchPartners();
      setIsRejectModalOpen(false);
      toast.success('Parceiro reprovado e notificado via WhatsApp.');
    } catch (error) {
      console.error('Erro ao reprovar:', error);
      toast.error('Erro ao reprovar parceiro.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;
    const matchesSearch = partner.User.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          partner.User.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aprovado</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Reprovado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pendente</span>;
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Parceiros</h1>
          <p className="text-gray-500">Administre as solicitações e parceiros ativos.</p>
        </div>
        
        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          
          {/* Date Navigator */}
          <div className="relative" ref={dateDropdownRef}>
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                onClick={handlePrev}
                disabled={dateFilterMode === 'all' || dateFilterMode === 'last12'}
                className={`p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors ${
                  (dateFilterMode === 'all' || dateFilterMode === 'last12') ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md flex items-center justify-center gap-2 min-w-[140px]"
              >
                <span className="capitalize">{getLabel()}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              <button 
                onClick={handleNext}
                disabled={dateFilterMode === 'all' || dateFilterMode === 'last12'}
                className={`p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors ${
                  (dateFilterMode === 'all' || dateFilterMode === 'last12') ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDateDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                >
                  <button
                    onClick={() => handleModeSelect('daily_yesterday')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                  >
                    Ontem
                  </button>
                  <button
                    onClick={() => handleModeSelect('daily_today')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                  >
                    Hoje
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={() => handleModeSelect('weekly')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary ${dateFilterMode === 'weekly' ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => handleModeSelect('monthly')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary ${dateFilterMode === 'monthly' ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => handleModeSelect('yearly')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary ${dateFilterMode === 'yearly' ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  >
                    Anual
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={() => handleModeSelect('last12')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary ${dateFilterMode === 'last12' ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  >
                    Últimos 12 meses
                  </button>
                  <button
                    onClick={() => handleModeSelect('all')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary ${dateFilterMode === 'all' ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'}`}
                  >
                    Todo o período
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Reprovados</option>
          </select>

          <select
            className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={0}>Atualização Manual</option>
            <option value={1}>Atualizar: 1 min</option>
            <option value={5}>Atualizar: 5 min</option>
            <option value={10}>Atualizar: 10 min</option>
          </select>
        </div>
      </div>

      {/* Tabela - Desktop */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <img src="/loader-logo.gif" alt="Carregando..." className="h-40 w-auto" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum parceiro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parceiro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {partner.User.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{partner.User.name}</div>
                          <div className="text-sm text-gray-500">ID: #{partner.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{partner.User.email}</div>
                      <div className="text-sm text-gray-500">{partner.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{partner.city} - {partner.uf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(partner.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {partner.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openApproveModal(partner)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectModal(partner)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            Reprovar
                          </button>
                        </div>
                      )}
                      {partner.status === 'rejected' && (
                         <span className="text-gray-400 text-xs italic max-w-[150px] truncate block" title={partner.rejectionReason}>
                           Motivo: {partner.rejectionReason}
                         </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista - Mobile */}
      <div className="sm:hidden space-y-4">
        {loading ? (
            <div className="flex justify-center items-center py-12">
            <img src="/loader-logo.gif" alt="Carregando..." className="h-40 w-auto" />
            </div>
        ) : filteredPartners.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
            Nenhum parceiro encontrado.
            </div>
        ) : (
            filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
                {/* Header: Avatar, Name, ID, Status */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {partner.User.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{partner.User.name}</div>
                            <div className="text-xs text-gray-500">ID: #{partner.id}</div>
                        </div>
                    </div>
                    <div>{getStatusBadge(partner.status)}</div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="truncate">{partner.User.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Telefone:</span>
                        <span>{partner.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Local:</span>
                        <span>{partner.city} - {partner.uf}</span>
                    </div>
                    {partner.status === 'rejected' && partner.rejectionReason && (
                         <div className="flex flex-col gap-1 bg-red-50 p-2 rounded text-xs text-red-700 mt-1">
                           <span className="font-semibold">Motivo da Reprovação:</span>
                           <span>{partner.rejectionReason}</span>
                         </div>
                    )}
                </div>

                {/* Actions */}
                {partner.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                        onClick={() => openApproveModal(partner)}
                        disabled={actionLoading}
                        className="flex-1 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                        Aprovar
                        </button>
                        <button
                        onClick={() => openRejectModal(partner)}
                        disabled={actionLoading}
                        className="flex-1 text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                        Reprovar
                        </button>
                    </div>
                )}
            </div>
            ))
        )}
      </div>

      {/* Modal de Reprovação */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Reprovar Parceiro</h3>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleReject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Reprovação
                  </label>
                  <textarea
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none h-32"
                    placeholder="Descreva o motivo da reprovação..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta mensagem será enviada para o WhatsApp do parceiro.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Reprovação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Aprovação */}
      <AnimatePresence>
        {isApproveModalOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Aprovar Parceiro</h3>
                <button 
                  onClick={() => setIsApproveModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-start gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Confirma a aprovação de {selectedPartner.User.name}?</p>
                    <p className="text-sm mt-1 opacity-90">
                      Uma senha será gerada automaticamente e enviada para o WhatsApp do parceiro junto com as instruções de acesso.
                    </p>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vincular Consultor (Opcional)
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={selectedConsultant}
                        onChange={(e) => setSelectedConsultant(e.target.value)}
                    >
                        <option value="">Nenhum consultor vinculado</option>
                        {consultants.map(consultant => (
                            <option key={consultant.id} value={consultant.id}>
                                {consultant.name}
                            </option>
                        ))}
                    </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar Aprovação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPartners;
