// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';

// === IMPORTS QUE FALTAVAM (RESTAURADOS) ===
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ProdutosList from './components/ProdutosList';
import FornecedoresList from './components/FornecedoresList';
import ClientesList from './components/ClientesList';
import VendasList from './components/VendasList';
import DevolucoesList from './components/DevolucoesList';

import './index.css'; 
const API_URL = 'http://localhost:3000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // === ESTADOS DAS PÁGINAS ===
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);

  // === ESTADOS SÓ PARA O DASHBOARD ===
  const [dashboardStats, setDashboardStats] = useState({ total_produtos: 0, total_fornecedores: 0, total_clientes: 0, vendas_hoje_count: 0 });
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const [produtosCriticos, setProdutosCriticos] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);

  // ... (função fetchData) ...
  const fetchData = async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        const data = await response.json();
        setter(data); 
      } catch (error) {
        console.error(`Erro ao buscar ${endpoint}:`, error);
      }
    };
    
  // UseEffect agora busca dados do App e do Dashboard
  useEffect(() => {
    // --- Busca dados das PÁGINAS ---
    fetchData('fornecedores', setFornecedores);
    fetchData('produtos', setProdutos);
    fetchData('clientes', setClientes);
    fetchData('devolucoes', setDevolucoes);

    // --- Busca dados SÓ DO DASHBOARD ---
    fetchData('dashboard/stats-principais', setDashboardStats);
    fetchData('dashboard/vendas-recentes', setVendasRecentes);
    fetchData('dashboard/produtos-criticos', setProdutosCriticos);
    fetchData('dashboard/top-5-produtos', setTopProdutos);
    fetchData('dashboard/aniversariantes-semana', setAniversariantes);

  }, []); 

  // Função para decidir qual componente renderizar
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // === PROPS ATUALIZADAS ===
        // Passa apenas os dados que o Dashboard precisa
        return <Dashboard 
                  stats={dashboardStats}
                  recentes={vendasRecentes}
                  produtosCriticos={produtosCriticos} 
                  topProdutos={topProdutos}
                  aniversariantes={aniversariantes}
               />;
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
          recarregarDados={() => fetchData('clientes', setClientes)}
        />
      );
      case 'vendas':
        return <VendasList 
                  clientes={clientes}
                  produtos={produtos}
               />;
      case 'devolucoes':
        return <DevolucoesList devolucoes={devolucoes} />;  
      default:
        // === PROPS ATUALIZADAS ===
        return <Dashboard 
                  stats={dashboardStats}
                  recentes={vendasRecentes}
                  produtosCriticos={produtosCriticos}
                  topProdutos={topProdutos}
                  aniversariantes={aniversariantes}
                />;
    }
  };

  return (
  <div className="min-h-screen bg-gray-50">
    <Header />
    {/* O nome da prop aqui precisa ser 'setActiveTab' */}
    <Navigation activeTab={activeTab} setActiveTab={setActiveTab} /> 
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderContent()}
    </main>
  </div>
);
}

export default App;