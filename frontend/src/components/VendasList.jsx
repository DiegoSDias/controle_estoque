import React, { useState, useEffect } from "react";
import { Plus, Edit, Loader2, Trash2, Search, DollarSign, ShoppingCart, Calendar } from "lucide-react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');


const API_URL = "http://localhost:3000";

const VendasList = ({ clientes, produtos }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendaEmEdicao, setVendaEmEdicao] = useState(null);

  const [vendas, setVendas] = useState([]);
  const [stats, setStats] = useState({ vendas_periodo: 0, faturado_periodo: 0, ticket_medio_periodo: 0 });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [dataFim, setDataFim] = useState(new Date());

  const [idCliente, setIdCliente] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);
  const [estoqueDisponivel, setEstoqueDisponivel] = useState({});

  const [excluindoId, setExcluindoId] = useState(null);

  const fmtBRL = (n) =>
    Number(n ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const fmtDate = (d) => {
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }

  const inicializarEstoque = () => {
    const map = {};
    produtos.forEach((p) => {
      map[p.id_produto] = p.quantidade_estoque ?? 0;
    });
    return map;
  };

  const carregarVendas = async () => {
    const params = new URLSearchParams();
    params.append('page', paginaAtual);
    params.append('limit', 20);
    if (busca) params.append('search', busca);
    if (dataInicio) params.append('data_inicio', fmtDate(dataInicio));
    if (dataFim) params.append('data_fim', fmtDate(dataFim));

    try {
      const resp = await fetch(`${API_URL}/vendas?${params.toString()}`);
      const data = await resp.json();
      setVendas(data.vendas || []);
      setTotalPaginas(data.totalPaginas || 1);
    } catch (e) {
      console.error("Erro ao carregar vendas:", e);
    }
  };

  const carregarStats = async () => {
    if (!dataInicio || !dataFim) return;
    
    const params = new URLSearchParams();
    params.append('data_inicio', fmtDate(dataInicio));
    params.append('data_fim', fmtDate(dataFim));

    try {
      const resp = await fetch(`${API_URL}/vendas/stats?${params.toString()}`);
      const data = await resp.json();
      setStats(data);
    } catch (e) {
      console.error("Erro ao carregar stats:", e);
    }
  };

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, dataInicio, dataFim]);

  useEffect(() => {
    carregarVendas();
    carregarStats();
  }, [paginaAtual, busca, dataInicio, dataFim]);

  useEffect(() => {
    const base = inicializarEstoque();
    carrinho.forEach((item) => {
      if (base[item.id_produto] != null) {
        base[item.id_produto] -= item.quantidade;
      }
    });
    setEstoqueDisponivel(base);
  }, [carrinho, produtos]);

  const abrirModal = () => {
    setVendaEmEdicao(null);
    setIdCliente("");
    setCarrinho([]);
    setProdutoSelecionado("");
    setQuantidadeProduto(1);
    setEstoqueDisponivel(inicializarEstoque());
    setIsModalOpen(true);
  };
  const fecharModal = () => setIsModalOpen(false);
  
  const abrirModalEdicao = async (id_venda) => {
    try {
      const resp = await fetch(`${API_URL}/vendas/${id_venda}`);
      if (!resp.ok) throw new Error("Falha ao carregar venda para edição.");
      const data = await resp.json();
      setVendaEmEdicao(data);
      setIdCliente(data.id_cliente?.toString() || "");
      const itensCarrinho = (data.itens ?? []).map((it) => {
        const prodInfo = produtos.find((p) => p.id_produto === it.id_produto) || {};
        return { 
            ...prodInfo, 
            id_produto: it.id_produto, 
            nome_produto: it.nome_produto, 
            quantidade: it.quantidade,
            preco_venda: it.preco_unitario 
        };
      });
      setCarrinho(itensCarrinho);
      const base = inicializarEstoque();
      itensCarrinho.forEach((item) => {
        if (base[item.id_produto] != null) {
          base[item.id_produto] += item.quantidade;
        }
      });
      setEstoqueDisponivel(base);

      setProdutoSelecionado("");
      setQuantidadeProduto(1);
      setIsModalOpen(true);
    } catch (e) {
      console.log("Erro ao abrir venda para edição:", e);
      alert("Erro ao abrir venda para edição.");
    }
  };

  const adicionarAoCarrinho = () => {
    if (!produtoSelecionado || quantidadeProduto <= 0) {
      alert("Selecione um produto e uma quantidade válida.");
      return;
    }
    const idProd = parseInt(produtoSelecionado, 10);
    const qtd = parseInt(quantidadeProduto, 10) || 1;
    const produtoNoBanco = produtos.find((p) => p.id_produto === idProd);
    if (!produtoNoBanco) {
      alert("Produto inválido.");
      return;
    }
    const disponivel = estoqueDisponivel[idProd] ?? produtoNoBanco.quantidade_estoque ?? 0;
    if (qtd > disponivel) {
      alert(`Quantidade solicitada (${qtd}) maior que o estoque disponível (${disponivel}).`);
      return;
    }
    setCarrinho((prev) => {
      const idx = prev.findIndex((item) => item.id_produto === idProd);
      if (idx === -1) {
        return [...prev, { ...produtoNoBanco, quantidade: qtd }];
      } else {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + qtd };
        return novo;
      }
    });
    setProdutoSelecionado("");
    setQuantidadeProduto(1);
  };

  const alterarQuantidadeItem = (id_produto, novaQtdBruta) => {
    let novaQtd = parseInt(novaQtdBruta, 10);
    if (Number.isNaN(novaQtd)) novaQtd = 0;

    setCarrinho((prevCarrinho) => {
      const item = prevCarrinho.find((i) => i.id_produto === id_produto);
      if (!item) return prevCarrinho;
      const qtdAntiga = item.quantidade;
      if (novaQtd <= 0) {
        return prevCarrinho.filter((i) => i.id_produto !== id_produto);
      }
      const dispAtual = estoqueDisponivel[id_produto] ?? 0;
      const delta = novaQtd - qtdAntiga;
      if (delta > dispAtual) {
        alert(`Quantidade máxima disponível é ${qtdAntiga + dispAtual}.`);
        return prevCarrinho.map((i) =>
          i.id_produto === id_produto ? { ...i, quantidade: (qtdAntiga + dispAtual) } : i
        );
      }
      return prevCarrinho.map((i) =>
        i.id_produto === id_produto ? { ...i, quantidade: novaQtd } : i
      );
    });
  };

  const removerDoCarrinho = (id_produto) => {
    setCarrinho((prev) => prev.filter((p) => p.id_produto !== id_produto));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) =>
      acc + Number(item.preco_venda ?? 0) * Number(item.quantidade ?? 0),
    0
  );

  const finalizarVenda = async () => {
    if (!idCliente || carrinho.length === 0) {
      alert("Selecione um cliente e adicione pelo menos um produto.");
      return;
    }
    const dadosVenda = {
      id_cliente: parseInt(idCliente, 10),
      produtos: carrinho.map((p) => ({
        id_produto: p.id_produto,
        quantidade: p.quantidade,
      })),
    };
    const ehEdicao = !!vendaEmEdicao;
    const url = ehEdicao ? `${API_URL}/vendas/${vendaEmEdicao.id_venda}` : `${API_URL}/vendas`;
    const method = ehEdicao ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosVenda),
      });
      if (response.ok) {
        alert(`Venda ${ehEdicao ? "atualizada" : "registrada"} com sucesso!`);
        fecharModal();
        carregarVendas();
        carregarStats();
      } else {
        const erro = await response.json().catch(() => ({}));
        alert(`Erro ao ${ehEdicao ? "atualizar" : "registrar"}: ${erro.detalhes || erro.erro || "Falha desconhecida"}`);
      }
    } catch (error) {
      console.log("Erro ao salvar venda:", error);
    }
  };

  const excluirVenda = async (id_venda) => {
    const confirmar = window.confirm(`Excluir a venda #${id_venda}? Esta ação é irreversível.`);
    if (!confirmar) return;

    try {
      setExcluindoId(id_venda);
      const resp = await fetch(`${API_URL}/vendas/${id_venda}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Falha ao excluir venda.");
      alert(`Venda #${id_venda} excluída com sucesso.`);
      carregarVendas();
      carregarStats();
    } catch (e) {
      alert("Erro ao excluir venda.");
      console.log(e);
    } 
    finally { setExcluindoId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Vendas</h2>
        <button
          onClick={abrirModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Venda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Faturado no Período" value={fmtBRL(stats.faturado_periodo)} icon={DollarSign} color="text-green-500" />
        <KpiCard title="Vendas no Período" value={stats.vendas_periodo} icon={ShoppingCart} color="text-blue-500" />
        <KpiCard title="Ticket Médio" value={fmtBRL(stats.ticket_medio_periodo)} icon={DollarSign} color="text-indigo-500" />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <label htmlFor="busca-venda" className="block text-sm font-medium mb-1">Buscar</label>
          <input
            id="busca-venda"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente ou ID da venda..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-9" />
        </div>
        
        <div>
          <label htmlFor="data-inicio" className="block text-sm font-medium mb-1">De:</label>
          <DatePicker
            id="data-inicio"
            selected={dataInicio}
            onChange={(date) => setDataInicio(date)}
            selectsStart
            startDate={dataInicio}
            endDate={dataFim}
            locale="pt-BR"
            className="w-full p-2 border rounded-lg"
            dateFormat="P"
          />
        </div>
        
        <div>
          <label htmlFor="data-fim" className="block text-sm font-medium mb-1">Até:</label>
          <DatePicker
            id="data-fim"
            selected={dataFim}
            onChange={(date) => setDataFim(date)}
            selectsEnd
            startDate={dataInicio}
            endDate={dataFim}
            minDate={dataInicio}
            locale="pt-BR"
            className="w-full p-2 border rounded-lg"
            dateFormat="P"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendas.map((venda) => (
              <tr key={venda.id_venda} className="hover:bg-gray-50 cursor-pointer" onClick={() => abrirModalEdicao(venda.id_venda)}>
                <td className="px-6 py-4">#{venda.id_venda}</td>
                <td className="px-6 py-4">{venda.nome_cliente}</td>
                <td className="px-6 py-4">
                  {venda.data_venda
                    ? new Date(venda.data_venda).toLocaleString("pt-BR", {dateStyle: 'short', timeStyle: 'short'})
                    : "-"}
                </td>
                <td className="px-6 py-4">
                  {fmtBRL(parseFloat(venda.valor_total))}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => abrirModalEdicao(venda.id_venda)}
                      className="text-indigo-600 hover:text-indigo-700"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => excluirVenda(venda.id_venda)}
                      className="text-red-600 hover:text-red-700"
                      disabled={excluindoId === venda.id_venda}
                      title="Excluir"
                    >
                      {excluindoId === venda.id_venda ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {vendas.length === 0 && (
          <p className="p-6 text-center text-gray-500">Nenhuma venda encontrada para este período ou busca.</p>
        )}

        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
            disabled={paginaAtual === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Página {paginaAtual} de {totalPaginas}</span>
          <button
            onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">
              {vendaEmEdicao ? "Editar Venda" : "Nova Venda"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente*</label>
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

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Adicionar Produto</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm mb-1">Produto*</label>
                    <select
                      value={produtoSelecionado}
                      onChange={(e) => setProdutoSelecionado(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white"
                    >
                      <option value="">Selecione um Produto</option>
                      {produtos.map((p) => {
                        const disp =
                          estoqueDisponivel[p.id_produto] ??
                          p.quantidade_estoque;
                        return (
                          <option
                            key={p.id_produto}
                            value={p.id_produto}
                            disabled={disp <= 0}
                          >
                            {p.nome_produto} (Est: {disp})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Qtd*</label>
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
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Carrinho</h3>

                {carrinho.length === 0 ? (
                  <p className="text-gray-500">O carrinho está vazio.</p>
                ) : (
                  <div className="bg-white border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2">Produto</th>
                          <th className="text-right px-3 py-2">Qtd</th>
                          <th className="text-right px-3 py-2">Preço</th>
                          <th className="text-right px-3 py-2">Subtotal</th>
                          <th className="text-right px-3 py-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrinho.map((item) => {
                          const subtotal =
                            Number(item.preco_venda ?? 0) *
                            Number(item.quantidade ?? 0);
                          return (
                            <tr key={item.id_produto} className="border-t">
                              <td className="px-3 py-2">
                                {item.nome_produto}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-16 p-1 border rounded-md text-right"
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    alterarQuantidadeItem(
                                      item.id_produto,
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                {fmtBRL(item.preco_venda)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {fmtBRL(subtotal)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() =>
                                    removerDoCarrinho(item.id_produto)
                                  }
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-6">
                <div className="text-lg font-semibold">
                  Total: {fmtBRL(totalCarrinho)}
                </div>
                <div className="flex space-x-4">
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
                    {vendaEmEdicao ? "Salvar Alterações" : "Finalizar Venda"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center">
      <div className={`p-3 mr-4 rounded-lg bg-gray-100 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default VendasList;