import React, { useState, useEffect } from "react";
import { Plus, Edit, Loader2, Trash2 } from "lucide-react";

const API_URL = "http://localhost:3000";

const VendasList = ({ vendas, clientes, produtos, recarregarDados }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendaEmEdicao, setVendaEmEdicao] = useState(null);

  const [idCliente, setIdCliente] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);
  const [estoqueDisponivel, setEstoqueDisponivel] = useState({});
  const [itensOriginais, setItensOriginais] = useState([]);

  const [excluindoId, setExcluindoId] = useState(null);

  // Devolução
  const [isModalDevolucaoOpen, setIsModalDevolucaoOpen] = useState(false);
  const [itemDevolucao, setItemDevolucao] = useState(null);
  const [devQuantidade, setDevQuantidade] = useState(1);
  const [devMotivo, setDevMotivo] = useState("");
  const [devReutilizavel, setDevReutilizavel] = useState(true);
  const [devCarregando, setDevCarregando] = useState(false);

  const fmtBRL = (n) =>
    Number(n ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const inicializarEstoque = () => {
    const map = {};
    produtos.forEach((p) => {
      map[p.id_produto] = p.quantidade_estoque ?? 0;
    });
    return map;
  };

  // Estoque visível
  useEffect(() => {
    const base = inicializarEstoque();

    if (vendaEmEdicao && itensOriginais.length > 0) {
      itensOriginais.forEach((item) => {
        if (base[item.id_produto] != null) {
          base[item.id_produto] += item.quantidade;
        }
      });
    }

    carrinho.forEach((item) => {
      if (base[item.id_produto] != null) {
        base[item.id_produto] -= item.quantidade;
      }
    });

    setEstoqueDisponivel(base);
  }, [carrinho, produtos, vendaEmEdicao, itensOriginais]);

  const abrirModal = () => {
    setVendaEmEdicao(null);
    setIdCliente("");
    setCarrinho([]);
    setItensOriginais([]);
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
        const prodInfo =
          produtos.find((p) => p.id_produto === it.id_produto) || {};
        return {
          ...prodInfo,
          id_produto: it.id_produto,
          nome_produto: it.nome_produto,
          quantidade: it.quantidade,
          id_item_venda: it.id_item_venda,
        };
      });

      setCarrinho(itensCarrinho);
      setItensOriginais(itensCarrinho);
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

    const disponivel =
      estoqueDisponivel[idProd] ?? produtoNoBanco.quantidade_estoque ?? 0;

    if (qtd > disponivel) {
      alert(
        `Quantidade solicitada (${qtd}) maior que o estoque disponível (${disponivel}).`
      );
      return;
    }

    setCarrinho((prev) => {
      const idx = prev.findIndex((item) => item.id_produto === idProd);
      if (idx === -1) {
        return [...prev, { ...produtoNoBanco, quantidade: qtd }];
      } else {
        const novo = [...prev];
        novo[idx] = {
          ...novo[idx],
          quantidade: novo[idx].quantidade + qtd,
        };
        return novo;
      }
    });

    setProdutoSelecionado("");
    setQuantidadeProduto(1);
  };

  // quantidade no carrinho agora é fixa (sem input)
  const removerDoCarrinho = (id_produto) => {
    setCarrinho((prev) => prev.filter((p) => p.id_produto !== id_produto));
  };

  const handleClickRemover = (item) => {
    if (!vendaEmEdicao || !item.id_item_venda) {
      removerDoCarrinho(item.id_produto);
      return;
    }

    setItemDevolucao(item);
    setDevQuantidade(item.quantidade);
    setDevMotivo("");
    setDevReutilizavel(true);
    setIsModalDevolucaoOpen(true);
  };

  const confirmarDevolucao = async () => {
    if (!itemDevolucao) return;

    const qtd = parseInt(devQuantidade, 10);
    if (!qtd || qtd <= 0) {
      alert("Informe uma quantidade válida para devolução.");
      return;
    }
    if (qtd > itemDevolucao.quantidade) {
      alert(`Você só pode devolver até ${itemDevolucao.quantidade} unidades.`);
      return;
    }

    try {
      setDevCarregando(true);

      const response = await fetch(`${API_URL}/devolucoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_item_venda: itemDevolucao.id_item_venda,
          quantidade: qtd,
          motivo: devMotivo,
          reutilizavel: devReutilizavel,
        }),
      });

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        alert(
          `Erro ao registrar devolução: ${
            erro.detalhes || erro.erro || "Falha desconhecida"
          }`
        );
        return;
      }

      // Atualiza carrinho no front: diminui ou remove
      setCarrinho((prev) =>
        prev.flatMap((i) => {
          if (i.id_produto !== itemDevolucao.id_produto) return [i];
          const novaQtd = i.quantidade - qtd;
          return novaQtd > 0 ? [{ ...i, quantidade: novaQtd }] : [];
        })
      );

      alert("Devolução registrada com sucesso.");
      setIsModalDevolucaoOpen(false);
      setItemDevolucao(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar devolução.");
    } finally {
      setDevCarregando(false);
    }
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
    const url = ehEdicao
      ? `${API_URL}/vendas/${vendaEmEdicao.id_venda}`
      : `${API_URL}/vendas`;
    const method = ehEdicao ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosVenda),
      });
      if (response.ok) {
        alert(
          `Venda ${ehEdicao ? "atualizada" : "registrada"} com sucesso!`
        );
        fecharModal();
        recarregarDados();
      } else {
        const erro = await response.json().catch(() => ({}));
        alert(
          `Erro ao ${
            ehEdicao ? "atualizar" : "registrar"
          }: ${erro.detalhes || erro.erro || "Falha desconhecida"}`
        );
      }
    } catch (error) {
      console.log("Erro ao salvar venda:", error);
    }
  };

  const excluirVenda = async (id_venda) => {
    const confirmar = window.confirm(
      `Excluir a venda #${id_venda}? Esta ação é irreversível.`
    );
    if (!confirmar) return;

    try {
      setExcluindoId(id_venda);
      const resp = await fetch(`${API_URL}/vendas/${id_venda}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Falha ao excluir venda.");
      alert(`Venda #${id_venda} excluída com sucesso.`);
      recarregarDados();
    } catch (e) {
      alert("Erro ao excluir venda.");
      console.log(e);
    } finally {
      setExcluindoId(null);
    }
  };

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

      {/* Tabela de vendas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
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
                    ? new Date(venda.data_venda).toLocaleString("pt-BR")
                    : "-"}
                </td>
                <td className="px-6 py-4">
                  {fmtBRL(parseFloat(venda.valor_total))}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end items-center gap-2">
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
      </div>

      {/* Modal de venda */}
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
                <label className="block text-sm font-medium mb-1">
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
                                {item.quantidade}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {fmtBRL(item.preco_venda)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {fmtBRL(subtotal)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleClickRemover(item)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Devolver Item
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

      {/* Modal de Devolução */}
      {isModalDevolucaoOpen && itemDevolucao && (
        <div
          className="modal-overlay"
          onClick={() => !devCarregando && setIsModalDevolucaoOpen(false)}
        >
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Devolução de item</h2>

            <p className="text-sm text-gray-700 mb-2">
              Produto: <strong>{itemDevolucao.nome_produto}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Quantidade na venda: {itemDevolucao.quantidade}
            </p>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Quantidade a devolver
              </label>
              <input
                type="number"
                min="1"
                max={itemDevolucao.quantidade}
                value={devQuantidade}
                onChange={(e) => setDevQuantidade(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Motivo (opcional)
              </label>
              <textarea
                value={devMotivo}
                onChange={(e) => setDevMotivo(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Ex: produto danificado, erro no pedido..."
              />
            </div>

            <div className="mb-4 flex items-center gap-2">
              <input
                id="devReutilizavel"
                type="checkbox"
                checked={devReutilizavel}
                onChange={(e) => setDevReutilizavel(e.target.checked)}
                className="h-4 w-4"
              />
              <label
                htmlFor="devReutilizavel"
                className="text-sm text-gray-700"
              >
                Item pode voltar para o estoque (reutilizável)
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  !devCarregando && setIsModalDevolucaoOpen(false)
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                disabled={devCarregando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarDevolucao}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                disabled={devCarregando}
              >
                {devCarregando && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirmar devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasList;
