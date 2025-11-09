import React, { useState } from 'react';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const ClientesList = ({ clientes, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);

  // Estados para os campos do formulário
  const [nomeCliente, setNomeCliente] = useState('');
const [cpf, setCpf] = useState('');
const [email, setEmail] = useState('');
const [telefone, setTelefone] = useState('');
const [dataNascimento, setDataNascimento] = useState('');
const [nomeRua, setNomeRua] = useState('');
const [numeroRua, setNumeroRua] = useState('');
const [complemento, setComplemento] = useState('');
const [bairro, setBairro] = useState('');
const [cidade, setCidade] = useState('');
const [estado, setEstado] = useState('');
const [cep, setCep] = useState('');


  // --- Funções de Ação ---
  const abrirModal = (cliente = null) => {
  if (cliente) {
    setClienteEmEdicao(cliente);
    setNomeCliente(cliente.nome_cliente);
    setCpf(cliente.cpf || '');
    setTelefone(cliente.telefone || '');
    setEmail(cliente.email || '');
    setDataNascimento(formatDateInput(cliente.data_nascimento));
    setNomeRua(cliente.nome_rua || '');
    setNumeroRua(cliente.numero_rua || '');
    setComplemento(cliente.complemento || '');
    setBairro(cliente.bairro || '');
    setCidade(cliente.cidade || '');
    setEstado(cliente.estado || '');
    setCep(cliente.cep || '');
  } else {
    setClienteEmEdicao(null);
    setNomeCliente('');
    setCpf('');
    setTelefone('');
    setEmail('');

    // limpar também os novos campos
    setDataNascimento('');
    setNomeRua('');
    setNumeroRua('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setEstado('');
    setCep('');
  }
  setIsModalOpen(true);
};

  const fecharModal = () => {
    setIsModalOpen(false);
  };

  const formatDateInput = (value) => {
    if (!value) return '';
    // se vier "2004-07-03T03:00:00.000Z"
    return value.split('T')[0];
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const response = await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('Cliente excluído com sucesso!');
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
    
    const dadosCliente = {
      nome_cliente: nomeCliente,
      cpf,
      telefone,
      email,
      data_nascimento: dataNascimento || null,
      nome_rua: nomeRua || null,
      numero_rua: numeroRua || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
    };
    const ehEdicao = !!clienteEmEdicao;
    const url = ehEdicao ? `${API_URL}/clientes/${clienteEmEdicao.id_cliente}` : `${API_URL}/clientes`;
    const method = ehEdicao ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCliente),
      });

      if (response.ok) {
        alert(`Cliente ${ehEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        fecharModal();
        recarregarDados();
      } else {
        const erro = await response.json();
        alert(`Erro: ${erro.erro}`);
      }
    } catch (error) {
      console.log('Não foi possível conectar à API: ', error);
    }
  };

  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <button onClick={() => abrirModal()} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente) => (
          <div key={cliente.id_cliente} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600 rounded-lg p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => abrirModal(cliente)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(cliente.id_cliente)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{cliente.nome_cliente}</h3>
            <div className="space-y-1 text-sm text-gray-500">
              <p>CPF: {cliente.cpf}</p>
              <p>Telefone: {cliente.telefone}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro/Edição de Cliente */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{clienteEmEdicao ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados básicos */}
                <input
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  type="text"
                  placeholder="Nome Completo*"
                  required
                  className="p-2 border rounded-md md:col-span-2"
                />

                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  type="text"
                  placeholder="CPF"
                  className="p-2 border rounded-md"
                />

                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  type="text"
                  placeholder="Telefone"
                  className="p-2 border rounded-md"
                />

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="E-mail"
                  className="p-2 border rounded-md md:col-span-2"
                />

                {/* Data de nascimento */}
                <input
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  type="date"
                  placeholder="Data de Nascimento"
                  className="p-2 border rounded-md"
                />

                {/* Endereço */}
                <input
                  value={nomeRua}
                  onChange={(e) => setNomeRua(e.target.value)}
                  type="text"
                  placeholder="Logradouro (Rua, Avenida, etc.)"
                  className="p-2 border rounded-md md:col-span-2"
                />

                <input
                  value={numeroRua}
                  onChange={(e) => setNumeroRua(e.target.value)}
                  type="text"
                  placeholder="Número"
                  className="p-2 border rounded-md"
                />

                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  type="text"
                  placeholder="Complemento"
                  className="p-2 border rounded-md"
                />

                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  type="text"
                  placeholder="Bairro"
                  className="p-2 border rounded-md"
                />

                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  type="text"
                  placeholder="Cidade"
                  className="p-2 border rounded-md"
                />

                <input
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  className="p-2 border rounded-md"
                />

                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  type="text"
                  placeholder="CEP"
                  className="p-2 border rounded-md"
                />
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

export default ClientesList;