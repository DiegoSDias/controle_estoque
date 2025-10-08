// frontend/src/components/Header.jsx

import React from 'react';
import { Package } from 'lucide-react'; // Importa só o ícone que este componente usa

const Header = () => (
  <header className="bg-white shadow-sm border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-orange-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
        </div>
        <div className="text-sm text-gray-500">
          Material de Construção
        </div>
      </div>
    </div>
  </header>
);

export default Header; 