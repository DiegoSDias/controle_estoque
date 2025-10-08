import React, { useState } from 'react';
import { Plus, Eye, ShoppingCart } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const VendasList = ({ vendas, clientes, produtos, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para o formulário de nova venda
  const [idCliente, setIdCliente] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);

  // --- Funções de Ação ---
  const abrirModal = () => {
    // Reseta o formulário ao abrir
    setIdCliente('');
    setCarrinho([]);
    setProdutoSelecionado('');
    setQuantidadeProduto(1);
    setIsModalOpen(true);
  };

  const fecharModal = () => setIsModalOpen(false);

  const adicionarAoCarrinho = () => {
    if (!produtoSelecionado || quantidadeProduto <= 0) {
      alert('Selecione um produto e uma quantidade válida.');
      return;
    }
    const produtoNoBanco = produtos.find(p => p.id_produto === parseInt(produtoSelecionado));
    if (produtoNoBanco) {
        // Verifica se o produto já está no carrinho para evitar duplicatas
        if(carrinho.some(item => item.id_produto === produtoNoBanco.id_produto)) {
            alert('Este produto já está no carrinho.');
            return;
        }
        setCarrinho([...carrinho, { ...produtoNoBanco, quantidade: quantidadeProduto }]);
    }
  };

  const finalizarVenda = async () => {
    if (!idCliente || carrinho.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um produto ao carrinho.');
      return;
    }

    const dadosVenda = {
      id_cliente: parseInt(idCliente),
      produtos: carrinho.map(p => ({ id_produto: p.id_produto, quantidade: p.quantidade })),
    };

    try {
      const response = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosVenda),
      });

      if (response.ok) {
        alert('Venda registrada com sucesso!');
        fecharModal();
        recarregarDados(); // Recarrega vendas e produtos!
      } else {
        const erro = await response.json();
        alert(`Erro ao registrar venda: ${erro.detalhes || erro.erro}`);
      }
    } catch (error) {
      alert('Não foi possível conectar à API.');
    }
  };

  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
        <button onClick={abrirModal} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Nova Venda
        </button>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ... o seu thead da tabela ... */}
            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.map((venda) => (
                <tr key={venda.id_venda} className="hover:bg-gray-50">
                    {/* ... o seu JSX para as linhas da tabela ... */}
                    <td className="px-6 py-4">#{venda.id_venda}</td>
                    <td className="px-6 py-4">{venda.nome_cliente}</td>
                    <td className="px-6 py-4">{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">R$ {parseFloat(venda.valor_total).toFixed(2)}</td>
                    <td className="px-6 py-4"><button className="text-blue-600"><Eye className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Venda */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Registrar Nova Venda</h2>
            <div className="space-y-4">
              {/* Seleção de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente*</label>
                <select value={idCliente} onChange={e => setIdCliente(e.target.value)} required className="w-full p-2 border rounded-md bg-white">
                  <option value="">Selecione um Cliente</option>
                  {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nome_cliente}</option>)}
                </select>
              </div>

              {/* Adicionar Produtos ao Carrinho */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Adicionar Produto ao Carrinho</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produto*</label>
                    <select value={produtoSelecionado} onChange={e => setProdutoSelecionado(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                      <option value="">Selecione um Produto</option>
                      {produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome_produto} (Est: {p.quantidade_estoque})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd*</label>
                    <input value={quantidadeProduto} onChange={e => setQuantidadeProduto(parseInt(e.target.value, 10))} type="number" min="1" className="w-24 p-2 border rounded-md" />
                  </div>
                  <button type="button" onClick={adicionarAoCarrinho} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">Adicionar</button>
                </div>
              </div>

              {/* Itens no Carrinho */}
              <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Carrinho</h3>
                  <div className="space-y-2">
                    {carrinho.length === 0 
                        ? <p className="text-gray-500">O carrinho está vazio.</p>
                        : carrinho.map(item => (
                            <div key={item.id_produto} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                <span>{item.nome_produto}</span>
                                <span>{item.quantidade} un.</span>
                            </div>
                        ))
                    }
                  </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={fecharModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">Cancelar</button>
                <button type="button" onClick={finalizarVenda} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Finalizar Venda</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasList;