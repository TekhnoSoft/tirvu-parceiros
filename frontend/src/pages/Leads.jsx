import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, Filter, MoreVertical, Edit2, Trash2, 
  User, Building, Phone, Mail, DollarSign, FileText, CheckCircle, X,
  ChevronLeft, ChevronRight, Calendar, ChevronDown, AlertTriangle, Loader2
} from 'lucide-react';
import leadService from '../services/leadService';
import partnerService from '../services/partnerService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ptBR } from 'date-fns/locale';
import { 
  format, startOfMonth, endOfMonth, subMonths, addMonths, 
  startOfWeek, endOfWeek, startOfYear, endOfYear, 
  subDays, addDays, addWeeks, subWeeks, addYears, subYears,
  startOfDay, endOfDay
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { maskCPF, maskCNPJ, maskPhone, maskCurrency } from '../utils/masks';

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  
  // Reopen Sale Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [leadToReopen, setLeadToReopen] = useState(null);

  const [currentLead, setCurrentLead] = useState(null); // null for create, object for edit

  // Sale Closing Modal State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleLead, setSaleLead] = useState(null);
  const [saleFormData, setSaleFormData] = useState({
    paymentStatus: 'awaiting_payment',
    saleValue: '',
    commissionPercentage: '',
    commissionValue: '',
    commissionProof: null // File object
  });
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  
  // Partner Pix Key (fetched when modal opens)
  const [partnerPixKey, setPartnerPixKey] = useState('');
  const [partnerPixKeyType, setPartnerPixKeyType] = useState('');

  // Calculate commission automatically
  useEffect(() => {
    if (saleFormData.saleValue && saleFormData.commissionPercentage) {
      // Helper to parse currency value supporting both BR (1.000,00) and US/Float (1000.00) formats
      const parseValue = (val) => {
          if (typeof val === 'number') return val;
          const clean = val.replace('R$ ', '').trim();
          if (clean.includes(',') && clean.includes('.')) {
              // Mixed format: assume BR if comma is last, US if dot is last
              return clean.lastIndexOf(',') > clean.lastIndexOf('.') 
                  ? parseFloat(clean.replace(/\./g, '').replace(',', '.')) 
                  : parseFloat(clean.replace(/,/g, ''));
          }
          if (clean.includes(',')) return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
          return parseFloat(clean);
      };

      const value = parseValue(saleFormData.saleValue);
      const percentage = parseFloat(String(saleFormData.commissionPercentage).replace(',', '.'));
      
      if (!isNaN(value) && !isNaN(percentage)) {
        const commission = (value * percentage) / 100;
        setSaleFormData(prev => ({
          ...prev,
          commissionValue: commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }));
      }
    } else {
        setSaleFormData(prev => ({
            ...prev,
            commissionValue: ''
          }));
    }
  }, [saleFormData.saleValue, saleFormData.commissionPercentage]);

  // Partner Filter State (Admin only)
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const partnerDropdownRef = useRef(null);

  // Date Filter State
  const [dateFilterMode, setDateFilterMode] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly', 'last12', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(event.target)) {
        setIsPartnerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update start/end dates when mode or reference date changes
  useEffect(() => {
    updateDateRange();
  }, [dateFilterMode, referenceDate]);

  // Fetch partners if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPartners();
    }
  }, [user]);

  // Fetch leads when filters change
  useEffect(() => {
    fetchLeads();
  }, [startDate, endDate, selectedPartner]);

  const fetchPartners = async () => {
    try {
      const data = await partnerService.list('approved'); // Only approved partners
      setPartners(data);
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    }
  };

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
        const today = startOfDay(new Date());
        const ref = startOfDay(referenceDate);
        if (ref.getTime() === today.getTime()) return 'Hoje';
        if (ref.getTime() === subDays(today, 1).getTime()) return 'Ontem';
        return format(referenceDate, "dd 'de' MMMM", { locale: ptBR });
      case 'weekly':
        const start = startOfWeek(referenceDate, { locale: ptBR });
        const end = endOfWeek(referenceDate, { locale: ptBR });
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
    if (mode === 'daily' && dateFilterMode !== 'daily') setReferenceDate(new Date());
    else if (mode === 'daily_yesterday') {
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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'PJ',
    document: '',
    value: '',
    status: 'new',
    observation: '',
    speakOnBehalf: true,
    numberOfEmployees: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const filters = {
        startDate,
        endDate,
        partnerId: selectedPartner?.id
      };
      const data = await leadService.list(filters);
      setLeads(data);
    } catch (error) {
      toast.error('Erro ao carregar leads.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setCurrentLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        type: lead.type || 'PJ',
        document: lead.document || '',
        value: lead.value || '',
        status: lead.status || 'new',
        partnerId: lead.partnerId || '',
        observation: lead.observation || '',
        speakOnBehalf: lead.speakOnBehalf !== undefined ? lead.speakOnBehalf : true,
        numberOfEmployees: lead.numberOfEmployees || ''
      });
    } else {
      setCurrentLead(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        type: 'PJ',
        document: '',
        value: '',
        status: 'new',
        partnerId: '',
        observation: '',
        speakOnBehalf: true,
        numberOfEmployees: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentLead) {
        await leadService.update(currentLead.id, formData);
        toast.success('Lead atualizado com sucesso!');
      } else {
        await leadService.create(formData);
        toast.success('Lead criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao salvar lead.');
      }
      console.error(error);
    }
  };

  const handleDelete = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (leadToDelete) {
        try {
            await leadService.delete(leadToDelete.id);
            toast.success('Lead excluído.');
            fetchLeads();
        } catch (error) {
            toast.error('Erro ao excluir lead.');
        } finally {
            setIsDeleteModalOpen(false);
            setLeadToDelete(null);
        }
    }
  };

  const handleToggleSale = async (lead) => {
    // If sale is closed and PAID, then we might want to Reopen (cancel sale/payment).
    if (lead.saleClosed && lead.paymentStatus === 'payment_made') {
        setLeadToReopen(lead);
        setIsReopenModalOpen(true);
        return;
    }

    // If sale is open OR (closed but awaiting payment -> "Dar Baixa"), open Sale Modal.
    setSaleLead(lead);

    // Prefill form data if available
    setSaleFormData({
        paymentStatus: lead.paymentStatus || 'awaiting_payment',
        saleValue: lead.saleValue !== null && lead.saleValue !== undefined 
            ? Number(lead.saleValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
            : '',
        commissionPercentage: lead.commissionPercentage !== null && lead.commissionPercentage !== undefined 
            ? lead.commissionPercentage 
            : '',
        commissionValue: lead.commissionValue !== null && lead.commissionValue !== undefined 
            ? Number(lead.commissionValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
            : '',
        commissionProof: null // Always require new proof or keep empty
    });
    
    // Fetch current partner's pix key if available
    if (lead.Partner) {
        setPartnerPixKey(lead.Partner.pixKey || 'Chave Pix não cadastrada');
        setPartnerPixKeyType(lead.Partner.pixKeyType || '');
    } else {
        // If lead doesn't have partner loaded, we might need to find it from the list
        const leadPartner = partners.find(p => p.id === lead.partnerId);
        if (leadPartner) {
            setPartnerPixKey(leadPartner.pixKey || 'Chave Pix não cadastrada');
            setPartnerPixKeyType(leadPartner.pixKeyType || '');
        } else {
            setPartnerPixKey('Parceiro não identificado ou sem chave Pix');
            setPartnerPixKeyType('');
        }
    }

    setIsSaleModalOpen(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleLead) return;

    setIsSubmittingSale(true);

    try {
        // Helper to parse currency value safely
        const parseCurrency = (val) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            
            // Remove R$, spaces (including non-breaking), and trim
            let clean = val.replace(/R\$\s?/g, '').replace(/\s/g, '').trim();
            
            // Handle mixed formats
            if (clean.includes(',') && clean.includes('.')) {
                // If comma is last, it's BR format (1.000,00) -> remove dots, replace comma with dot
                // If dot is last, it's US format (1,000.00) -> remove commas
                return clean.lastIndexOf(',') > clean.lastIndexOf('.')
                    ? parseFloat(clean.replace(/\./g, '').replace(',', '.'))
                    : parseFloat(clean.replace(/,/g, ''));
            }
            
            // If only comma, treat as decimal separator (BR standard)
            if (clean.includes(',')) {
                return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
            }
            
            // If only dot, treat as decimal separator (US standard) or thousand separator??
            // In ambiguous cases like "1.000", it could be 1000 or 1.
            // But usually input "1.000" means 1000 in BR. 
            // However, JS parseFloat("1.000") is 1.
            // Let's assume if it matches standard float format, keep it.
            return parseFloat(clean);
        };

        const saleValueFloat = parseCurrency(saleFormData.saleValue);
        // Ensure commissionValue is also parsed correctly. It might be calculated string.
        const commissionValueFloat = parseCurrency(saleFormData.commissionValue);

        const updateData = {
            saleClosed: true,
            paymentStatus: saleFormData.paymentStatus,
            saleValue: saleValueFloat,
            commissionPercentage: parseFloat(String(saleFormData.commissionPercentage).replace(',', '.')),
            commissionValue: commissionValueFloat
        };

        if (saleFormData.paymentStatus === 'payment_made' && saleFormData.commissionProof) {
            // Convert file to Base64
            const reader = new FileReader();
            reader.readAsDataURL(saleFormData.commissionProof);
            reader.onload = async () => {
                updateData.commissionProof = reader.result; // Base64 string
                
                try {
                    const response = await leadService.update(saleLead.id, updateData);
                    // Update local state
                    setLeads(leads.map(l => l.id === saleLead.id ? { ...l, ...response } : l));
                    setIsSaleModalOpen(false);
                    setSaleLead(null);
                    toast.success('Venda marcada como fechada!');
                } catch (error) {
                    console.error('Error updating lead with proof:', error);
                    toast.error('Erro ao salvar venda com comprovante.');
                } finally {
                    setIsSubmittingSale(false);
                }
            };
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                toast.error('Erro ao processar comprovante.');
                setIsSubmittingSale(false);
            };
            // Return here to wait for FileReader callback
            return;
        }

        // If no file needed or not payment_made
        const response = await leadService.update(saleLead.id, updateData);

        // Update local state
        setLeads(leads.map(l => l.id === saleLead.id ? { ...l, ...response } : l));
        
        setIsSaleModalOpen(false);
        setSaleLead(null);
        toast.success('Venda marcada como fechada!');
        setIsSubmittingSale(false); // Make sure to turn off spinner here
    } catch (error) {
        toast.error('Erro ao fechar venda.');
        console.error(error);
        setIsSubmittingSale(false);
    }
  };

  const confirmReopen = async () => {
    if (leadToReopen) {
        try {
            await leadService.update(leadToReopen.id, { saleClosed: false });
            
            setLeads(leads.map(l => l.id === leadToReopen.id ? { ...l, saleClosed: false } : l));
            toast.success('Venda reaberta com sucesso!');
        } catch (error) {
            toast.error('Erro ao reabrir venda.');
            console.error(error);
        } finally {
            setIsReopenModalOpen(false);
            setLeadToReopen(null);
        }
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-500">Gerencie seus potenciais clientes e oportunidades.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
        
        <div className="flex flex-1 gap-4 w-full md:w-auto flex-wrap items-center">
            <div className="relative flex-1 md:max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="text"
                placeholder="Buscar leads..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="new">Novo</option>
                <option value="contact">Contato</option>
                <option value="negotiation">Negociação</option>
                <option value="converted">Convertido</option>
                <option value="lost">Perdido</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Partner Filter (Admin Only) */}
            {user?.role === 'admin' && (
            <div className="relative" ref={partnerDropdownRef}>
                <button
                onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 w-full md:w-auto min-w-[200px] justify-between"
                >
                <div className="flex items-center gap-2 overflow-hidden">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="truncate max-w-[150px]">
                    {selectedPartner ? selectedPartner.User.name : 'Todos os Parceiros'}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence>
                {isPartnerDropdownOpen && (
                    <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                    <div className="px-3 pb-2 border-b border-gray-100 mb-2">
                        <input
                        type="text"
                        placeholder="Buscar parceiro..."
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={partnerSearchTerm}
                        onChange={(e) => setPartnerSearchTerm(e.target.value)}
                        autoFocus
                        />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                        <button
                        onClick={() => {
                            setSelectedPartner(null);
                            setIsPartnerDropdownOpen(false);
                            setPartnerSearchTerm('');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${!selectedPartner ? 'text-primary bg-blue-50/50' : 'text-gray-700'}`}
                        >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            T
                        </div>
                        Todos os Parceiros
                        </button>

                        {partners
                        .filter(p => p.User.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()))
                        .map(partner => (
                            <button
                            key={partner.id}
                            onClick={() => {
                                setSelectedPartner(partner);
                                setIsPartnerDropdownOpen(false);
                                setPartnerSearchTerm('');
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${selectedPartner?.id === partner.id ? 'text-primary bg-blue-50/50' : 'text-gray-700'}`}
                            >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                {partner.User.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{partner.User.name}</span>
                                <span className="text-xs text-gray-400">{partner.city}/{partner.uf}</span>
                            </div>
                            </button>
                        ))}
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            )}

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 w-full md:w-auto justify-between md:justify-start">
                <button 
                    onClick={handlePrev}
                    disabled={dateFilterMode === 'all' || dateFilterMode === 'last12'}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative" ref={dateDropdownRef}>
                    <button
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="flex-1 md:flex-none flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-md text-sm font-medium text-gray-700 min-w-[140px] justify-center"
                    >
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {getLabel()}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>

                    <AnimatePresence>
                    {isDateDropdownOpen && (
                        <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                        >
                        <div className="px-3 pb-2 border-b border-gray-100 mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Período</p>
                        </div>
                        
                        <button onClick={() => handleModeSelect('daily_today')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Hoje
                            {dateFilterMode === 'daily' && referenceDate.toDateString() === new Date().toDateString() && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <button onClick={() => handleModeSelect('daily_yesterday')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Ontem
                            {dateFilterMode === 'daily' && referenceDate.toDateString() === subDays(new Date(), 1).toDateString() && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={() => handleModeSelect('weekly')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Semanal
                            {dateFilterMode === 'weekly' && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <button onClick={() => handleModeSelect('monthly')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Mensal
                            {dateFilterMode === 'monthly' && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <button onClick={() => handleModeSelect('yearly')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Anual
                            {dateFilterMode === 'yearly' && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={() => handleModeSelect('last12')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Últimos 12 meses
                            {dateFilterMode === 'last12' && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        <button onClick={() => handleModeSelect('all')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center">
                            Todo o período
                            {dateFilterMode === 'all' && <CheckCircle className="w-3 h-3 text-primary" />}
                        </button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <button 
                    onClick={handleNext}
                    disabled={dateFilterMode === 'all' || dateFilterMode === 'last12' || (dateFilterMode === 'daily' && referenceDate >= startOfDay(new Date()))} // Disable future dates if desired, but let's keep it simple
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* List - Desktop */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome / Empresa</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parceiro</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                {/* <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th> */}
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Nenhum lead encontrado.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                          {lead.type === 'PJ' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {lead.Partner?.User?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {lead.Partner?.User?.role === 'admin' ? 'Administrador' : 'Parceiro'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 space-y-1">
                        {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</div>}
                        {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${lead.type === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {lead.type}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.value ? `R$ ${parseFloat(lead.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                    </td> */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize w-fit
                            ${lead.status === 'converted' ? 'bg-green-100 text-green-800' : 
                            lead.status === 'lost' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                            {
                                {
                                    'new': 'Novo',
                                    'contact': 'Contato',
                                    'negotiation': 'Negociação',
                                    'converted': 'Convertido',
                                    'lost': 'Perdido'
                                }[lead.status] || lead.status
                            }
                        </span>
                        
                        {/* Indicador pulsando para leads em prospecção (não novos e não perdidos) */}
                        {['contact', 'negotiation'].includes(lead.status) && (
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Em Prospecção</span>
                            </div>
                        )}

                        {/* Indicador de Aguardando Pagamento para Vendas Fechadas */}
                        {lead.saleClosed && lead.paymentStatus === 'awaiting_payment' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 w-fit mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                Aguardando Pagamento
                            </span>
                        )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Venda Fechada - Apenas Admin */}
                        {user?.role === 'admin' && (
                        <div className="relative group">
                          <button 
                            disabled={lead.status !== 'converted'}
                            onClick={() => handleToggleSale(lead)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs font-medium ${
                              lead.status === 'converted' 
                                ? (lead.saleClosed 
                                    ? (lead.paymentStatus === 'awaiting_payment' 
                                        ? 'text-white bg-yellow-500 hover:bg-yellow-600 border border-yellow-500 shadow-sm cursor-pointer' // Dar Baixa
                                        : 'text-white bg-green-600 hover:bg-green-700 border border-green-600 shadow-sm cursor-pointer') // Venda Fechada (Paga)
                                    : 'text-gray-500 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-300 cursor-pointer') // Convertida, mas não fechada
                                : 'text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed'
                            }`}
                          >
                            <DollarSign className="w-3 h-3" />
                            {lead.saleClosed 
                                ? (lead.paymentStatus === 'awaiting_payment' ? 'Dar Baixa' : 'Venda Fechada') 
                                : 'Fechar Venda'
                            }
                          </button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 w-max max-w-[150px] px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {lead.status === 'converted' 
                              ? (lead.saleClosed ? 'Clique para reabrir venda' : 'Clique para fechar venda')
                              : 'Disponível apenas para leads convertidos'}
                            {/* Seta do tooltip */}
                            <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                        )}

                        <button 
                            onClick={() => (user?.role === 'admin' || lead.status === 'new') && handleOpenModal(lead)} 
                            className={`p-1 rounded ${user?.role === 'admin' || lead.status === 'new' ? 'hover:bg-gray-200 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
                            disabled={user?.role !== 'admin' && lead.status !== 'new'}
                            title={user?.role !== 'admin' && lead.status !== 'new' ? "Apenas leads com status 'Novo' podem ser editados" : "Editar Lead"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(lead)} className="p-1 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* List - Mobile */}
      <div className="sm:hidden space-y-4">
        {loading ? (
           <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : filteredLeads.length === 0 ? (
           <div className="text-center py-10 text-gray-500">Nenhum lead encontrado.</div>
        ) : (
           filteredLeads.map((lead) => (
             <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Header: Icon, Name, Type */}
                <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {lead.type === 'PJ' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                      </div>
                   </div>
                   <span className={`px-2 py-1 rounded text-xs font-semibold ${lead.type === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {lead.type}
                   </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                    {/* Partner */}
                    <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Parceiro</span>
                        <span className="font-medium text-gray-900">{lead.Partner?.User?.name || 'N/A'}</span>
                        <span className="text-xs text-gray-400 capitalize">{lead.Partner?.User?.role === 'admin' ? 'Administrador' : 'Parceiro'}</span>
                    </div>
                    
                    {/* Contact */}
                    <div className="space-y-1">
                        {lead.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> <span className="truncate">{lead.email}</span></div>}
                        {lead.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> <span>{lead.phone}</span></div>}
                    </div>
                </div>

                {/* Status & Actions Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize w-fit
                            ${lead.status === 'converted' ? 'bg-green-100 text-green-800' : 
                            lead.status === 'lost' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                            {
                                {
                                    'new': 'Novo',
                                    'contact': 'Contato',
                                    'negotiation': 'Negociação',
                                    'converted': 'Convertido',
                                    'lost': 'Perdido'
                                }[lead.status] || lead.status
                            }
                        </span>
                         {/* Status Indicators */}
                         {['contact', 'negotiation'].includes(lead.status) && (
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Em Prospecção</span>
                            </div>
                        )}
                        {lead.saleClosed && lead.paymentStatus === 'awaiting_payment' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                Aguardando Pagamento
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                         {/* Sale Button (Admin) */}
                         {user?.role === 'admin' && (
                            <button 
                                disabled={lead.status !== 'converted'}
                                onClick={() => handleToggleSale(lead)}
                                className={`p-2 rounded-lg transition-colors ${
                                  lead.status === 'converted' 
                                    ? (lead.saleClosed 
                                        ? (lead.paymentStatus === 'awaiting_payment' 
                                            ? 'text-white bg-yellow-500' 
                                            : 'text-white bg-green-600') 
                                        : 'text-gray-600 bg-gray-100 hover:bg-green-50 hover:text-green-600') 
                                    : 'text-gray-300 bg-gray-50'
                                }`}
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                         )}
                         
                         {/* Edit */}
                        <button 
                            onClick={() => (user?.role === 'admin' || lead.status === 'new') && handleOpenModal(lead)} 
                            className={`p-2 rounded-lg ${user?.role === 'admin' || lead.status === 'new' ? 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600' : 'bg-gray-50 text-gray-300'}`}
                            disabled={user?.role !== 'admin' && lead.status !== 'new'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Delete (Admin) */}
                        {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(lead)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                    </div>
                </div>
             </div>
           ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{currentLead ? 'Editar Lead' : 'Novo Lead'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'PF' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setFormData({ ...formData, type: 'PF' })}
                    >
                      Física
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'PJ' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setFormData({ ...formData, type: 'PJ', document: '' })}
                    >
                      Jurídica
                    </button>
                  </div>
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100 disabled:text-gray-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={user?.role === 'partner'}
                  >
                    <option value="new">Novo</option>
                    <option value="contact">Contato</option>
                    <option value="negotiation">Negociação</option>
                    <option value="converted">Convertido</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.document}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maskedValue = formData.type === 'PF' ? maskCPF(value) : maskCNPJ(value);
                      setFormData({ ...formData, document: maskedValue });
                    }}
                    placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                   <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da Empresa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de funcionários (pode ser uma estimativa)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={formData.numberOfEmployees}
                  onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                  placeholder="Ex: 10-20, Aprox 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none resize-none h-24"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Fale mais do lead, melhor horario para contato, interesses etc...."
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="speakOnBehalf"
                    name="speakOnBehalf"
                    type="checkbox"
                    checked={formData.speakOnBehalf}
                    onChange={(e) => setFormData({ ...formData, speakOnBehalf: e.target.checked })}
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                  />
                </div>
                <div className="ml-2 text-sm">
                  <label htmlFor="speakOnBehalf" className="font-medium text-gray-700">
                    Eu autorizo a tirvu falar em meu nome
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode desmarcar esta opção até 10 vezes por mês.
                  </p>
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div> */}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
                >
                  {currentLead ? 'Salvar Alterações' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Sale Closing Modal */}
      {isSaleModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900">Fechar Venda</h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status do Pagamento (1ª Mensalidade)</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={saleFormData.paymentStatus}
                  onChange={(e) => setSaleFormData({ ...saleFormData, paymentStatus: e.target.value })}
                >
                  <option value="awaiting_payment">Aguardando Pagamento</option>
                  <option value="payment_made">Pagamento Efetuado</option>
                </select>
              </div>

              {/* Commission Payment Details (Only if payment_made) */}
              {saleFormData.paymentStatus === 'payment_made' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                          Chave Pix do Parceiro {partnerPixKeyType && <span className="text-blue-600 font-normal ml-1">({partnerPixKeyType.toUpperCase()})</span>}
                        </label>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-blue-200 text-gray-700 font-mono text-sm">
                            <span className="flex-1 truncate">{partnerPixKey}</span>
                            <button 
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(partnerPixKey);
                                    toast.success('Chave Pix copiada!');
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Copiar Chave Pix"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comprovante de Transferência</label>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            required={saleFormData.paymentStatus === 'payment_made'}
                            onChange={(e) => setSaleFormData({ ...saleFormData, commissionProof: e.target.files[0] })}
                            className="w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-100 file:text-blue-700
                                hover:file:bg-blue-200
                                cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">Formatos aceitos: Imagem ou PDF</p>
                    </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Venda</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={saleFormData.saleValue}
                  onChange={(e) => setSaleFormData({ ...saleFormData, saleValue: maskCurrency(e.target.value) })}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={saleFormData.commissionPercentage}
                    onChange={(e) => setSaleFormData({ ...saleFormData, commissionPercentage: e.target.value })}
                    placeholder="%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Comissão</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                    value={saleFormData.commissionValue}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 ${isSubmittingSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingSale ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Venda
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Lead?</h3>
            <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    Excluir
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reopen Sale Confirmation Modal */}
      {isReopenModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reabrir Venda?</h3>
            <p className="text-gray-500 mb-6">
                Deseja realmente reabrir a venda de <strong>{leadToReopen?.name}</strong>?
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => setIsReopenModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmReopen}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                    Reabrir
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Leads;
