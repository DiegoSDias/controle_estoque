// frontend/src/components/DevolucoesList.jsx
import React from 'react';
import { PackageX } from 'lucide-react'; // Ícone para devolução

// Componente "read-only" que recebe a lista de devoluções
const DevolucoesList = ({ devolucoes = [] }) => {

  const formatData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Relatório de Devoluções</h2>
        {/* Futuramente, você pode adicionar um botão de "Nova Devolução" aqui */}
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
            {devolucoes.length > 0 ? (
              devolucoes.map((dev) => (
                <tr key={dev.id_devolucao} className="hover:bg-gray-50">
                  <td className="px-6 py-4">#{dev.id_devolucao}</td>
                  <td className="px-6 py-4">{formatData(dev.data_devolucao)}</td>
                  <td className="px-6 py-4">{dev.nome_cliente}</td>
                  <td className="px-6 py-4">{dev.nome_produto}</td>
                  <td className="px-6 py-4">{dev.quantidade_devolvida}</td>
                  <td className="px-6 py-4">{dev.motivo}</td>
                  <td className="px-6 py-4">
                    {dev.reutilizavel ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Sim</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Não</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Nenhuma devolução registrada.
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