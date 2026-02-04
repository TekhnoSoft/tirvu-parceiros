import React, { useState, useEffect } from 'react';
import financeService from '../services/financeService';
import { useAuth } from '../context/AuthContext';
import { 
    DollarSign, 
    Download, 
    Eye, 
    Search, 
    Calendar, 
    TrendingUp, 
    TrendingDown,
    FileText,
    Filter,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Finance = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        partnerId: ''
    });

    useEffect(() => {
        fetchMovements();
    }, [filters]);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const data = await financeService.getMovements(filters);
            setMovements(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar movimentações.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadProof = async (movement) => {
        try {
            if (!movement.originalId || movement.type !== 'commission') return;
            
            const toastId = toast.loading('Baixando comprovante...');
            const data = await financeService.getProof(movement.originalId);
            
            if (data.proof) {
                // Determine file type from base64 header or default to png/pdf
                // Base64 usually comes as "data:image/png;base64,..."
                const link = document.createElement('a');
                link.href = data.proof;
                
                // Try to guess extension
                let extension = 'png';
                if (data.proof.includes('application/pdf')) extension = 'pdf';
                else if (data.proof.includes('image/jpeg')) extension = 'jpg';
                
                link.download = `comprovante_${movement.id}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Download iniciado!', { id: toastId });
            } else {
                toast.error('Comprovante não encontrado.', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao baixar comprovante.');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Movimentações Financeiras</h1>
                    <p className="text-gray-500">Histórico de comissões e pagamentos.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                    <input 
                        type="date" 
                        className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                    <input 
                        type="date" 
                        className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    />
                </div>
                
                <button 
                    onClick={() => setFilters({ startDate: '', endDate: '', partnerId: '' })}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Limpar Filtros
                </button>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : movements.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        Nenhuma movimentação encontrada.
                    </div>
                ) : (
                    movements.map((mov) => (
                        <div key={mov.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500">{formatDate(mov.date)}</div>
                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                        {mov.type === 'commission' || mov.type === 'credit' ? (
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        {mov.description}
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${
                                    mov.type === 'commission' || mov.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {mov.type === 'debit' ? '-' : '+'} {formatCurrency(mov.value)}
                                </div>
                            </div>

                            {user.role === 'admin' && (
                                <div className="text-sm bg-gray-50 p-2 rounded-lg">
                                    <p className="font-medium text-gray-900">{mov.partnerName}</p>
                                    <p className="text-xs text-gray-500">{mov.partnerEmail}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <div>
                                    {mov.status === 'paid' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Pago
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pendente
                                        </span>
                                    )}
                                </div>
                                {mov.hasProof && (
                                    <button 
                                        onClick={() => handleDownloadProof(mov)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Comprovante
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                                {user.role === 'admin' && (
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parceiro</th>
                                )}
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Comprovante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Carregando movimentações...
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Nenhuma movimentação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                movements.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDate(mov.date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            <div className="flex items-center gap-2">
                                                {mov.type === 'commission' || mov.type === 'credit' ? (
                                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                                )}
                                                {mov.description}
                                            </div>
                                        </td>
                                        {user.role === 'admin' && (
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>
                                                    <p className="font-medium text-gray-900">{mov.partnerName}</p>
                                                    <p className="text-xs text-gray-500">{mov.partnerEmail}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${
                                            mov.type === 'commission' || mov.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {mov.type === 'debit' ? '-' : '+'} {formatCurrency(mov.value)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {mov.status === 'paid' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Pago
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {mov.hasProof ? (
                                                <button 
                                                    onClick={() => handleDownloadProof(mov)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Baixar Comprovante"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-300">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Finance;
