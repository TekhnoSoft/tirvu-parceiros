import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileText, CheckCircle, XCircle, ArrowRight, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { Chart } from "react-google-charts";
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/admin');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-full p-8">
      <img src="/loader-logo.gif" alt="Carregando..." className="h-40 w-auto" />
    </div>
  );
  if (!data) return <div className="text-center p-8 text-red-500">Erro ao carregar dados.</div>;

  const { partnerStats, leadStats, financialStats, recentPartners, partnersByState } = data;

  // Preparar dados para o mapa
  // Usamos um índice único para garantir cores diferentes, e o tooltip para mostrar o valor real
  const mapData = [
    ["Estado", "Cor", { role: "tooltip", type: "string", p: { html: true } }],
    ...(partnersByState || []).map((item, index) => {
        const count = parseInt(item.count);
        const uf = item.uf;
        const tooltip = `<div style="padding:10px;"><strong>${uf}</strong><br/>Parceiros: ${count}</div>`;
        return [`BR-${uf}`, index, tooltip];
    })
  ];

  const mapOptions = {
    region: "BR",
    resolution: "provinces",
    colorAxis: { colors: ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1', '#FF7043', '#9E9D24', '#5C6BC0', '#F06292'] },
    backgroundColor: "#ffffff",
    datalessRegionColor: "#f5f5f5",
    defaultColor: "#f5f5f5",
    legend: 'none',
    tooltip: { isHtml: true }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna da Esquerda: KPIs (1/3 da largura) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Parceiros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total Parceiros</p>
                        <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{partnerStats.total}</p>
                </div>
                <div className="flex gap-2 text-xs">
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">{partnerStats.approved} Aprovados</span>
                    <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">{partnerStats.pending} Pendentes</span>
                </div>
            </div>

            {/* Leads */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Leads Totais</p>
                        <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{leadStats.total}</p>
                </div>
                <div className="flex gap-2 text-xs">
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{leadStats.converted} Convertidos</span>
                </div>
            </div>

            {/* Vendas (GMV) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Volume de Vendas</p>
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalSales || 0)}
                    </p>
                </div>
            </div>

            {/* Financeiro (Comissões) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Comissões (Total)</p>
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalCommissions || 0)}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Pago</p>
                        <p className="text-sm font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalPaid || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">A Pagar</p>
                        <p className="text-sm font-bold text-yellow-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalPayable || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Coluna da Direita: Mapa (2/3 da largura) */}
        <div className="lg:col-span-8 h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden h-full flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex-none">Distribuição de Parceiros por Estado</h3>
                <div className="w-full flex-1 flex items-center justify-center -ml-4 min-h-0">
                {partnersByState && partnersByState.length > 0 ? (
                    <Chart
                    chartType="GeoChart"
                    width="100%"
                    height="100%"
                    data={mapData}
                    options={mapOptions}
                    />
                ) : (
                    <div className="text-gray-500">Nenhum dado geográfico disponível.</div>
                )}
                </div>
            </div>
        </div>
      </div>

      {/* Recent Partners */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[500px]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Novos Parceiros</h3>
          <button 
            onClick={() => navigate('/admin/partners')}
            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-200 overflow-y-auto custom-scrollbar">
          {recentPartners.length > 0 ? (
            recentPartners.map((p) => (
              <div key={p.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                        {p.User.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{p.User.name}</p>
                        <p className="text-xs text-gray-500">{p.User.email}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    p.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                }`}>
                    {p.status === 'approved' ? 'Aprovado' : p.status === 'pending' ? 'Pendente' : 'Reprovado'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">Nenhum parceiro recente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
