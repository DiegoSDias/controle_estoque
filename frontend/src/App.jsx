// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';

// 1. Importando todos os nossos componentes filhos
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ProdutosList from './components/ProdutosList';
import FornecedoresList from './components/FornecedoresList';
import ClientesList from './components/ClientesList';
import VendasList from './components/VendasList';

// Importa o nosso CSS principal
import './index.css'; 

// URL base da nossa API que está rodando no back-end
const API_URL = 'http://localhost:3000';

function App() {
  // 2. Estados para controlar a aplicação
  const [activeTab, setActiveTab] = useState('dashboard'); // Controla qual aba está ativa
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  
  // Função genérica para buscar dados de um endpoint
  const fetchData = async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        const data = await response.json();
        setter(data); // Atualiza o estado correspondente com os dados recebidos
      } catch (error) {
        console.error(`Erro ao buscar ${endpoint}:`, error);
      }
    };
  // 3. Efeito para buscar TODOS os dados da API quando o app carregar
  useEffect(() => {
    // Chamamos a função para cada um dos nossos endpoints
    fetchData('fornecedores', setFornecedores);
    fetchData('produtos', setProdutos);
    fetchData('clientes', setClientes);
    fetchData('vendas', setVendas);
  }, []); // O array vazio [] garante que isso rode apenas UMA VEZ.

  // 4. Função para decidir qual componente renderizar baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Passamos todos os dados que o Dashboard precisa como "props"
        return <Dashboard produtos={produtos} fornecedores={fornecedores} clientes={clientes} vendas={vendas} />;
      case 'produtos':
      return <ProdutosList 
                produtos={produtos} 
                fornecedores={fornecedores} 
                recarregarDados={() => fetchData('produtos', setProdutos)} 
            />;
      case 'fornecedores':
        return (
          <FornecedoresList
            fornecedores={fornecedores}
            recarregarDados={() => fetchData('fornecedores', setFornecedores)}
          />
        );
      case 'clientes':
        return (<ClientesList 
          clientes={clientes} 
          recarregarDados={() => fetchData('clientes', setFornecedores)}
        />
      );
     // ... dentro da função renderContent() no App.jsx

case 'vendas':
  // Passamos vendas, clientes, produtos e uma função para recarregar os dados
  return <VendasList 
            vendas={vendas}
            clientes={clientes}
            produtos={produtos}
            recarregarDados={() => {
              fetchData('vendas', setVendas);
              fetchData('produtos', setProdutos);
            }} 
         />;
      default:
        return <Dashboard />;
    }
  };

  // 5. O JSX final que monta a nossa página
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Passamos o estado da aba ativa e a função para alterá-la para a Navegação */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;