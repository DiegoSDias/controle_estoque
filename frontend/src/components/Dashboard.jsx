import React from 'react';
import { Package, Users, Truck, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = ({ produtos, fornecedores, clientes, vendas }) => {
  const stats = [
    { title: 'Total de Produtos', value: produtos.length, icon: Package, color: 'bg-blue-500' },
    { title: 'Fornecedores', value: fornecedores.length, icon: Truck, color: 'bg-orange-500' },
    { title: 'Clientes', value: clientes.length, icon: Users, color: 'bg-blue-600' },
    { title: 'Vendas Hoje', value: vendas.length, icon: ShoppingCart, color: 'bg-orange-600' }
  ];
  const produtosEstoqueBaixo = produtos.filter(p => p.quantidade_estoque <= 10);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
      {/* Alertas de Estoque Baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Produtos com Estoque Baixo</h3>
            </div>
            <div className="space-y-2">
              {produtosEstoqueBaixo.map((produto) => (
                <div key={produto.id_produto} className="flex justify-between items-center bg-white rounded-lg p-3">
                  <span className="font-medium text-gray-900">{produto.nome_produto}</span>
                  <span className="text-orange-600 font-semibold">{produto.quantidade_estoque} unidades</span>
                </div>
              ))}
            </div>
        </div>
      )}
     <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {vendas.slice(0, 5).map((venda) => (
              <div key={venda.id_venda} className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{venda.nome_cliente}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(venda.data_venda).toLocaleDateString('pt-BR')} às {new Date(venda.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                 <p className="font-bold text-green-600">
  R$ {venda.valor_total ? parseFloat(venda.valor_total).toFixed(2) : '0.00'}
</p>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default Dashboard;

