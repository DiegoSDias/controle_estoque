import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Layers, X } from 'lucide-react'; 

const API_URL = 'http://localhost:3000';

// Lista de categorias - poderíamos buscar do banco, mas estático é mais rápido
const CATEGORIAS = ['Construção', 'Hidráulica', 'Elétrica', 'Pintura', 'Ferramentas', 'Outros'];

const ProdutosList = ({ produtos, fornecedores, recarregarDados }) => {
  // --- Estados do Componente  ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

  // Estados para os campos do formulário
  const [nomeProduto, setNomeProduto] = useState('');
  // ... (outros estados do formulário)
  const [idFornecedor, setIdFornecedor] = useState('');

  // === 1. ESTADOS PARA OS FILTROS ===
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todos');

  // === 2. LÓGICA DE FILTRAGEM ===
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchCategoria = 
        categoria === 'Todos' || p.categoria === categoria;
      
      const matchBusca = 
        !busca || p.nome_produto.toLowerCase().includes(busca.toLowerCase());
        
      return matchCategoria && matchBusca;
    });
  }, [produtos, busca, categoria]); // Recalcula quando 'produtos', 'busca' ou 'categoria' mudar

  // --- Funções de Ação ---
  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEmEdicao(produto);
      setNomeProduto(produto.nome_produto);
      setDescricao(produto.descricao || '');
      setPrecoVenda(produto.preco_venda);
      setQuantidadeEstoque(produto.quantidade_estoque);
      setQuantMax(produto.quant_max);
      setQuantMin(produto.quant_min);
      setDataValidade(formatDateInput(produto.data_validade));
      setIdFornecedor(produto.id_fornecedor || '');
    } else {
      setProdutoEmEdicao(null);
      setNomeProduto('');
      setDescricao('');
      setPrecoVenda('');
      setQuantidadeEstoque('');
      setQuantMax('');
      setQuantMin('');
      setDataValidade('');
      setIdFornecedor('');
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => setIsModalOpen(false);

  const formatDateInput = (value) => {
    if (!value) return '';
    return value.split('T')[0];
  };
  
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
        console.log('Não foi possível conectar à API: ', error);
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
      quant_max: parseInt(quantMax),
      quant_min: parseInt(quantMin),
      data_validade: dataValidade,
      id_fornecedor: idFornecedor ? parseInt(idFornecedor, 10) : null,
    };

    const ehEdicao = !!produtoEmEdicao;
    const url = ehEdicao ? `${API_URL}/produtos/${produtoEmEdicao.id_produto}` : `${API_URL}/produtos`;

    const method = ehEdicao ? 'PUT' : 'POST';
    console.log(dadosProduto)
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
      console.log('Não foi possível conectar à API: ', error);
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

      {/* === 3. BARRA DE FILTROS === */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {/* Barra de Busca */}
        <div className="relative">
          <label htmlFor="busca-produto" className="sr-only">Buscar Produto</label>
          <input
            id="busca-produto"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        {/* Botões de Categoria */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoria('Todos')}
            className={`px-3 py-1 rounded-full text-sm font-medium
              ${categoria === 'Todos' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            Todos
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium
                ${categoria === cat 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              <Layers className="h-4 w-4 mr-1.5 inline-block" />
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Mín.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* === 4. USA 'produtosFiltrados' === */}
              {produtosFiltrados.map((produto) => (
                <tr key={produto.id_produto} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{produto.nome_produto}</td>
                  {/* Célula da Categoria (Nova) */}
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {produto.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4">{produto.nome_fornecedor}</td>
                  <td className="px-6 py-4">R$ {parseFloat(produto.preco_venda).toFixed(2)}</td>
                  <td className="px-6 py-4">{produto.quantidade_estoque} un.</td>
                  <td className="px-6 py-4">{produto.quant_min} un.</td>
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
          {/* Mensagem de filtro vazio */}
          {produtosFiltrados.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Nenhum produto encontrado com os filtros aplicados.
            </div>
          )}
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
              <div className="grid grid-cols-2 gap-4">
                <input value={quantMax} onChange={e => setQuantMax(e.target.value)} type="number" step="0.01" placeholder="Quant. Max de estoque" required className="w-full p-2 border rounded-md"/>
                <input value={quantMin} onChange={e => setQuantMin(e.target.value)} type="number" placeholder="Quant. Min de estoque" required className="w-full p-2 border rounded-md"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={dataValidade} onChange={e => setDataValidade(e.target.value)} type="date" placeholder="Data de validade" className="w-full p-2 border rounded-md"/>
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