import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const ProdutosList = ({ produtos, fornecedores, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

  // Estados para os campos do formulário
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  const [idFornecedor, setIdFornecedor] = useState('');

  // --- Funções de Ação ---
  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEmEdicao(produto);
      setNomeProduto(produto.nome_produto);
      setDescricao(produto.descricao || '');
      setPrecoVenda(produto.preco_venda);
      setQuantidadeEstoque(produto.quantidade_estoque);
      setIdFornecedor(produto.id_fornecedor || '');
    } else {
      setProdutoEmEdicao(null);
      setNomeProduto('');
      setDescricao('');
      setPrecoVenda('');
      setQuantidadeEstoque('');
      setIdFornecedor('');
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => setIsModalOpen(false);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('Produto excluído com sucesso!');
          recarregarDados();
        } else {
          const erro = await response.json();
          alert(`Erro ao excluir: ${erro.erro}`);
        }
      } catch (error) {
        alert('Não foi possível conectar à API.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const dadosProduto = {
      nome_produto: nomeProduto,
      descricao,
      preco_venda: parseFloat(precoVenda),
      quantidade_estoque: parseInt(quantidadeEstoque, 10),
      id_fornecedor: idFornecedor ? parseInt(idFornecedor, 10) : null,
    };

    const ehEdicao = !!produtoEmEdicao;
    const url = ehEdicao ? `${API_URL}/produtos/${produtoEmEdicao.id_produto}` : `${API_URL}/produtos`;
    const method = ehEdicao ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosProduto),
      });

      if (response.ok) {
        alert(`Produto ${ehEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        fecharModal();
        recarregarDados();
      } else {
        const erro = await response.json();
        alert(`Erro: ${erro.erro || 'Verifique os dados e tente novamente.'}`);
      }
    } catch (error) {
      alert('Não foi possível conectar à API.');
    }
  };
  
  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        <button onClick={() => abrirModal()} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ... o seu thead da tabela continua aqui ... */}
            <tbody className="bg-white divide-y divide-gray-200">
              {produtos.map((produto) => (
                <tr key={produto.id_produto} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{produto.nome_produto}</td>
                  <td className="px-6 py-4">{produto.nome_fornecedor}</td>
                  <td className="px-6 py-4">R$ {parseFloat(produto.preco_venda).toFixed(2)}</td>
                  <td className="px-6 py-4">{produto.quantidade_estoque} un.</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => abrirModal(produto)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(produto.id_produto)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Produto */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} type="text" placeholder="Nome do Produto*" required className="w-full p-2 border rounded-md"/>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="w-full p-2 border rounded-md"></textarea>
              <div className="grid grid-cols-2 gap-4">
                <input value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} type="number" step="0.01" placeholder="Preço de Venda*" required className="w-full p-2 border rounded-md"/>
                <input value={quantidadeEstoque} onChange={e => setQuantidadeEstoque(e.target.value)} type="number" placeholder="Estoque Inicial*" required className="w-full p-2 border rounded-md"/>
              </div>
              <select value={idFornecedor} onChange={e => setIdFornecedor(e.target.value)} required className="w-full p-2 border rounded-md bg-white">
                <option value="">Selecione um Fornecedor*</option>
                {fornecedores.map(f => (
                  <option key={f.id_fornecedor} value={f.id_fornecedor}>
                    {f.nome_fantasia}
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={fecharModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosList;