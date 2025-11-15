// frontend/src/components/Dashboard.jsx
import React, { useState } from 'react';
import { Package, Users, Truck, ShoppingCart, AlertTriangle, TrendingUp, Cake, X, Mail, Phone } from 'lucide-react';

// Recebe todas as props do App.jsx
const Dashboard = ({ 
  stats = { total_produtos: 0, total_fornecedores: 0, total_clientes: 0, vendas_hoje_count: 0 }, 
  recentes = [], 
  produtosCriticos = [], 
  topProdutos = [],
  aniversariantes = []
}) => {

  const [clienteModal, setClienteModal] = useState(null); 

  // 1. CARDS DE ESTATÍSTICAS
  const statsCards = [
    { title: 'Total de Produtos', value: stats.total_produtos, icon: Package, color: 'bg-blue-500' },
    { title: 'Fornecedores', value: stats.total_fornecedores, icon: Truck, color: 'bg-orange-500' },
    { title: 'Clientes', value: stats.total_clientes, icon: Users, color: 'bg-blue-600' },
    { title: 'Vendas Hoje', value: stats.vendas_hoje_count, icon: ShoppingCart, color: 'bg-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center">
                    <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* === 2. SEÇÃO PRODUTOS CRÍTICOS === */}
      {produtosCriticos.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Produtos em Nível Crítico</h3>
            </div>
            <div className="space-y-2">
              {produtosCriticos.map((produto) => (
                <div key={produto.nome_produto} className="flex justify-between items-center bg-white rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-900">{produto.nome_produto}</span>
                    <span className="text-sm text-gray-600 ml-2">({produto.status_estoque})</span>
                  </div>
                  <span className="text-orange-600 font-semibold">{produto.quantidade_estoque} unidades</span>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* === 3. SEÇÃO ANIVERSARIANTES  === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center">
          <Cake className="h-5 w-5 text-pink-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Aniversariantes da Semana</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {aniversariantes.length > 0 ? (
            aniversariantes.map((cliente) => (
              <div key={cliente.id_cliente} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{cliente.nome_cliente}</p>
                  <p className="text-sm text-gray-500">
                    Aniversário em: {new Date(cliente.proximo_aniversario).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => setClienteModal(cliente)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200"
                >
                  Ver Contato
                </button>

              </div>
            ))
          ) : (
            <p className="p-4 text-gray-500">Nenhum aniversariante nos próximos 7 dias.</p>
          )}
        </div>
      </div>
      {/* === 4. SEÇÃO TOP 5 E VENDAS RECENTES (Corrigido) === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda (Top 5 Produtos - RESTAURADO) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="p-6 border-b border-gray-100 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Top 5 Produtos</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {topProdutos.length > 0 ? (
                topProdutos.map((produto, index) => (
                  <div key={produto.nome_produto} className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-gray-400 w-6">{index + 1}.</span>
                      <span className="font-medium text-gray-900">{produto.nome_produto}</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {produto.total_vendido} <span className="text-sm font-normal text-gray-500">vendas</span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500">Nenhuma venda registrada ainda.</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna da Direita (Vendas Recentes - Correto) */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {recentes.length > 0 ? (
                  recentes.map((venda) => (
                    <div key={venda.id_venda} className="p-6 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{venda.nome_cliente}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(venda.data_venda).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}
                        </p>
                      </div>
                      <div className="text-right">
                      <p className="font-bold text-green-600">
                        R$ {venda.valor_total ? parseFloat(venda.valor_total).toFixed(2) : '0.00'}
                      </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-6 text-gray-500">Nenhuma venda recente.</p>
                )}
              </div>
            </div>
        </div>

      </div>

      {/* === 5. JSX DO MODAL DE CONTATO === */}
    {clienteModal && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={() => setClienteModal(null)} // Fecha ao clicar fora
      >
        <div 
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()} // Impede de fechar ao clicar dentro
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{clienteModal.nome_cliente}</h3>
            <button onClick={() => setClienteModal(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="flex items-center">
              <Mail className="h-5 w-5 text-gray-500 mr-3" />
              <span className="text-gray-800">{clienteModal.email || 'E-mail não cadastrado'}</span>
            </p>
            <p className="flex items-center">
              <Phone className="h-5 w-5 text-gray-500 mr-3" />
              <span className="text-gray-800">{clienteModal.telefone || 'Telefone não cadastrado'}</span>
            </p>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default Dashboard;