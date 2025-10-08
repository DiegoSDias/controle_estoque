import React, { useState, useEffect } from 'react';
import { Plus, Truck, Edit, Trash2 } from 'lucide-react';

// API_URL para centralizar o endereço do back-end
const API_URL = 'http://localhost:3000';

const FornecedoresList = ({ fornecedores, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false); // controla a visibilidade do modal
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState(null); // guarda o fornecedor que está sendo editado

  // Estados para os campos do formulário
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // --- Funções de Ação ---

  const abrirModal = (fornecedor = null) => {
    if (fornecedor) {
      // Modo Edição: preenche o formulário com os dados existentes
      setFornecedorEmEdicao(fornecedor);
      setNomeFantasia(fornecedor.nome_fantasia);
      setRazaoSocial(fornecedor.razao_social || '');
      setCnpj(fornecedor.cnpj || '');
      setTelefone(fornecedor.telefone || '');
      setEmail(fornecedor.email || '');
    } else {
      // Modo Cadastro: limpa o formulário
      setFornecedorEmEdicao(null);
      setNomeFantasia('');
      setRazaoSocial('');
      setCnpj('');
      setTelefone('');
      setEmail('');
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        const response = await fetch(`${API_URL}/fornecedores/${id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('Fornecedor excluído com sucesso!');
          recarregarDados(); // Recarrega a lista
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
    
    const dadosFornecedor = { nome_fantasia: nomeFantasia, razao_social: razaoSocial, cnpj, telefone, email };
    const ehEdicao = !!fornecedorEmEdicao;
    const url = ehEdicao ? `${API_URL}/fornecedores/${fornecedorEmEdicao.id_fornecedor}` : `${API_URL}/fornecedores`;
    const method = ehEdicao ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosFornecedor),
      });

      if (response.ok) {
        alert(`Fornecedor ${ehEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        fecharModal();
        recarregarDados();
      } else {
        const erro = await response.json();
        alert(`Erro: ${erro.erro}`);
      }
    } catch (error) {
      alert('Não foi possível conectar à API.');
    }
  };

  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
        <button onClick={() => abrirModal()} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Novo Fornecedor
        </button>
      </div>

      {/* Cards dos Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fornecedores.map((fornecedor) => (
          <div key={fornecedor.id_fornecedor} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 rounded-lg p-3">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => abrirModal(fornecedor)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(fornecedor.id_fornecedor)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{fornecedor.nome_fantasia}</h3>
            <div className="space-y-1 text-sm text-gray-500">
              <p>CNPJ: {fornecedor.cnpj}</p>
              <p>Telefone: {fornecedor.telefone}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{fornecedorEmEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} type="text" placeholder="Nome Fantasia*" required className="p-2 border rounded-md md:col-span-2"/>
                <input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} type="text" placeholder="Razão Social" className="p-2 border rounded-md md:col-span-2"/>
                <input value={cnpj} onChange={e => setCnpj(e.target.value)} type="text" placeholder="CNPJ" className="p-2 border rounded-md"/>
                <input value={telefone} onChange={e => setTelefone(e.target.value)} type="text" placeholder="Telefone" className="p-2 border rounded-md"/>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="E-mail" className="p-2 border rounded-md md:col-span-2"/>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
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

export default FornecedoresList;