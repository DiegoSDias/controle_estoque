// frontend/src/components/DevolucoesList.jsx
import React, { useState, useMemo } from 'react';
import { PackageX, Search } from 'lucide-react';

const DevolucoesList = ({ devolucoes = [] }) => {
  const [busca, setBusca] = useState('');
  const [filtroReutilizavel, setFiltroReutilizavel] = useState('Todos'); // Todos | Sim | Não

  const formatData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  // --- FILTRO / BUSCA ---
  const devolucoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return devolucoes.filter((dev) => {
      const matchReutilizavel =
        filtroReutilizavel === 'Todos' ||
        (filtroReutilizavel === 'Sim' && dev.reutilizavel) ||
        (filtroReutilizavel === 'Não' && !dev.reutilizavel);

      if (!matchReutilizavel) return false;
      if (!termo) return true;

      const id = String(dev.id_devolucao || '').toLowerCase();
      const cliente = (dev.nome_cliente || '').toLowerCase();
      const produto = (dev.nome_produto || '').toLowerCase();
      const motivo = (dev.motivo || '').toLowerCase();
      const data = formatData(dev.data_devolucao || '').toLowerCase();
      const reutilTexto = dev.reutilizavel ? 'sim' : 'nao';

      const campos = [id, cliente, produto, motivo, data, reutilTexto];

      return campos.some((campo) => campo.includes(termo));
    });
  }, [devolucoes, busca, filtroReutilizavel]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <PackageX className="h-7 w-7 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            Relatório de Devoluções
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Busca */}
          <div className="relative">
            <label htmlFor="busca-devolucoes" className="sr-only">
              Buscar devolução
            </label>
            <input
              id="busca-devolucoes"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, produto, motivo..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filtro Reutilizável */}
          <select
            value={filtroReutilizavel}
            onChange={(e) => setFiltroReutilizavel(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Todos">Todos</option>
            <option value="Sim">Somente reutilizáveis</option>
            <option value="Não">Somente não reutilizáveis</option>
          </select>
        </div>
      </div>

      {/* Tabela de Devoluções */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Dev.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto Devolvido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reutilizável</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devolucoesFiltradas.length > 0 ? (
              devolucoesFiltradas.map((dev) => (
                <tr key={dev.id_devolucao} className="hover:bg-gray-50">
                  <td className="px-6 py-4">#{dev.id_devolucao}</td>
                  <td className="px-6 py-4">{formatData(dev.data_devolucao)}</td>
                  <td className="px-6 py-4">{dev.nome_cliente}</td>
                  <td className="px-6 py-4">{dev.nome_produto}</td>
                  <td className="px-6 py-4">{dev.quantidade_devolvida}</td>
                  <td className="px-6 py-4">{dev.motivo}</td>
                  <td className="px-6 py-4">
                    {dev.reutilizavel ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Sim
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Não
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Nenhuma devolução encontrada com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DevolucoesList;
