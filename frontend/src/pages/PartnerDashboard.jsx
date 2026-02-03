import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DollarSign, Users, TrendingUp, Activity, CheckCircle, Wallet } from 'lucide-react';

const PartnerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/partner');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Carregando dados...</div>;
  }

  if (!data) {
    return <div className="text-center p-8 text-red-500">Erro ao carregar dados.</div>;
  }

  const { kpis, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Comissões (Ganhos Totais) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Comissões</p>
            <p className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalEarnings || 0)}
            </p>
          </div>
        </div>

        {/* Recebido */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-teal-100 text-teal-600 mr-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Recebido</p>
            <p className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalReceived || 0)}
            </p>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Saldo a Receber</p>
            <p className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.balance || 0)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Leads Indicados</p>
            <p className="text-2xl font-bold text-gray-900">{kpis.leadsCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-gray-900">{kpis.conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Últimas Movimentações</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'} 
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">Nenhuma movimentação recente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
