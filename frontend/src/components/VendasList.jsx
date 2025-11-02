import React, { useState } from 'react';
import { Plus, Eye, ShoppingCart, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const VendasList = ({ vendas, clientes, produtos, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para o formulário de nova venda
  const [idCliente, setIdCliente] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);

  // Estados para o modal de detalhes (Eye)
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [vendaDetalhe, setVendaDetalhe] = useState(null);
  const [detalheCarregando, setDetalheCarregando] = useState(false);
  const [detalheErro, setDetalheErro] = useState('');

  // Helpers
  const fmtBRL = (n) =>
    Number(n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- Ações: Nova Venda ---
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
    const produtoNoBanco = produtos.find(
      (p) => p.id_produto === parseInt(produtoSelecionado, 10)
    );
    if (produtoNoBanco) {
      // Evita duplicatas
      if (carrinho.some((item) => item.id_produto === produtoNoBanco.id_produto)) {
        alert('Este produto já está no carrinho.');
        return;
      }
      setCarrinho([
        ...carrinho,
        { ...produtoNoBanco, quantidade: parseInt(quantidadeProduto, 10) || 1 },
      ]);
    }
  };

  const finalizarVenda = async () => {
    if (!idCliente || carrinho.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um produto ao carrinho.');
      return;
    }

    const dadosVenda = {
      id_cliente: parseInt(idCliente, 10),
      produtos: carrinho.map((p) => ({
        id_produto: p.id_produto,
        quantidade: p.quantidade,
      })),
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
        // Atualiza vendas e produtos (estoque)
        recarregarDados();
      } else {
        const erro = await response.json().catch(() => ({}));
        alert(`Erro ao registrar venda: ${erro.detalhes || erro.erro || 'Falha desconhecida'}`);
      }
    } catch (error) {
      console.log('Não foi possível conectar à API: ', error);
      alert('Não foi possível conectar à API.');
    }
  };

  // --- Ações: Detalhes da Venda (Eye) ---
  const abrirDetalheVenda = async (id_venda) => {
    setDetalheCarregando(true);
    setDetalheErro('');
    setVendaDetalhe(null);
    setDetalheAberto(true);

    try {
      const resp = await fetch(`${API_URL}/vendas/${id_venda}`);
      if (!resp.ok) {
        throw new Error('Falha ao carregar detalhes da venda.');
      }
      const data = await resp.json();

      // Esperado algo como:
      // {
      //   id_venda, data_venda, valor_total,
      //   cliente: { id_cliente, nome_cliente },
      //   itens: [ { id_produto, nome_produto, quantidade, preco_unitario } ]
      // }
      setVendaDetalhe(data);
    } catch (e) {
      setDetalheErro(e.message || 'Erro ao buscar detalhes.');
    } finally {
      setDetalheCarregando(false);
    }
  };

  const fecharDetalheVenda = () => {
    setDetalheAberto(false);
    setVendaDetalhe(null);
    setDetalheErro('');
    setDetalheCarregando(false);
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
        <button
          onClick={abrirModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Venda
        </button>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* thead (adicione suas colunas) */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.map((venda) => (
                <tr key={venda.id_venda} className="hover:bg-gray-50">
                  <td className="px-6 py-4">#{venda.id_venda}</td>
                  <td className="px-6 py-4">{venda.nome_cliente}</td>
                  <td className="px-6 py-4">
                    {venda.data_venda
                      ? new Date(venda.data_venda).toLocaleString('pt-BR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {fmtBRL(parseFloat(venda.valor_total))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      onClick={() => abrirDetalheVenda(venda.id_venda)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}

              {vendas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente*
                </label>
                <select
                  value={idCliente}
                  onChange={(e) => setIdCliente(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">Selecione um Cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nome_cliente}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adicionar Produtos ao Carrinho */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Adicionar Produto ao Carrinho
                </h3>
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Produto*
                    </label>
                    <select
                      value={produtoSelecionado}
                      onChange={(e) => setProdutoSelecionado(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white"
                    >
                      <option value="">Selecione um Produto</option>
                      {produtos.map((p) => (
                        <option key={p.id_produto} value={p.id_produto}>
                          {p.nome_produto} (Est: {p.quantidade_estoque})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qtd*
                    </label>
                    <input
                      value={quantidadeProduto}
                      onChange={(e) =>
                        setQuantidadeProduto(parseInt(e.target.value, 10))
                      }
                      type="number"
                      min="1"
                      className="w-24 p-2 border rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={adicionarAoCarrinho}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Itens no Carrinho */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Carrinho</h3>
                <div className="space-y-2">
                  {carrinho.length === 0 ? (
                    <p className="text-gray-500">O carrinho está vazio.</p>
                  ) : (
                    carrinho.map((item) => (
                      <div
                        key={item.id_produto}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
                      >
                        <span>{item.nome_produto}</span>
                        <span>{item.quantidade} un.</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={finalizarVenda}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Venda (Eye) */}
      {detalheAberto && (
        <div className="modal-overlay" onClick={fecharDetalheVenda}>
          <div
            className="modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {vendaDetalhe
                  ? `Detalhes da Venda #${vendaDetalhe.id_venda}`
                  : 'Detalhes da Venda'}
              </h2>
              <button
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={fecharDetalheVenda}
              >
                Fechar
              </button>
            </div>

            {detalheCarregando && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando detalhes...
              </div>
            )}

            {detalheErro && (
              <div className="text-red-600 text-sm">{detalheErro}</div>
            )}

            {!detalheCarregando && !detalheErro && vendaDetalhe && (
              <>
                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  <div>
                    <strong>Cliente:</strong>{' '}
                    {vendaDetalhe.nome_cliente ?? '-'}
                  </div>
                  <div>
                    <strong>Data:</strong>{' '}
                    {vendaDetalhe.data_venda
                      ? new Date(vendaDetalhe.data_venda).toLocaleString('pt-BR')
                      : '-'}
                  </div>
                </div>

                <div className="bg-white border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-3 py-2">Produto</th>
                        <th className="text-right px-3 py-2">Qtd</th>
                        <th className="text-right px-3 py-2">Preço</th>
                        <th className="text-right px-3 py-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(vendaDetalhe.itens ?? []).map((it) => {
                        const subtotal =
                          Number(it.preco_unitario ?? 0) *
                          Number(it.quantidade ?? 0);
                        return (
                          <tr key={it.id_produto} className="border-t">
                            <td className="px-3 py-2">
                              {it.nome_produto ?? `#${it.id_produto}`}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {it.quantidade}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtBRL(it.preco_unitario)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtBRL(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-4 text-base">
                  <span className="font-semibold">
                    Total:&nbsp;{fmtBRL(vendaDetalhe.valor_total)}
                  </span>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {/* Ex.: botão para imprimir/recibo, se desejar */}
                  {/* <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Imprimir</button> */}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasList;
