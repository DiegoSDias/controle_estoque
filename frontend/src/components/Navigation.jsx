import React from 'react';
import { Package, Users, Truck, ShoppingCart, BarChart3 } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart }
  ];

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'text-white border-b-2 border-orange-400'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <IconComponent className="h-5 w-5 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;