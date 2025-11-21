import React, { useState, useMemo } from 'react';
import { Plus, Users, Edit, Trash2, Search } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const ClientesList = ({ clientes, recarregarDados }) => {
  // --- Estados do Componente ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);

  // Estado de busca (NOVO)
  const [busca, setBusca] = useState('');

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

  // --- FILTRO DE CLIENTES (NOVO) ---
  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;

    return clientes.filter((c) => {
      const nome = (c.nome_cliente || '').toLowerCase();
      const cpf = (c.cpf || '').toLowerCase();
      const tel = (c.telefone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const cidade = (c.cidade || '').toLowerCase();
      const uf = (c.estado || '').toLowerCase();

      return (
        nome.includes(termo) ||
        cpf.includes(termo) ||
        tel.includes(termo) ||
        email.includes(termo) ||
        cidade.includes(termo) ||
        uf.includes(termo)
      );
    });
  }, [busca, clientes]);

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
    const url = ehEdicao
      ? `${API_URL}/clientes/${clienteEmEdicao.id_cliente}`
      : `${API_URL}/clientes`;
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

  const formatarCpf = (value) => {
    value = value.replace(/\D/g, "");
    value = value.slice(0, 11);

    if (value.length <= 3) return value;
    if (value.length <= 6) return value.replace(/(\d{3})(\d+)/, "$1.$2");
    if (value.length <= 9)
      return value.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

    return value.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );
  };

  const formatarTelefone = (value) => {
    value = value.replace(/\D/g, "");

    if (value.length <= 2) return `(${value}`;
    if (value.length <= 6) return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length <= 10)
      return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;

    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  };

  const buscarCep = async (valorCep) => {
    const cepLimpo = valorCep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setNomeRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
    } catch (error) {
      console.log("Erro ao consultar CEP:", error);
      alert("Erro ao consultar CEP.");
    }
  };

  const formatarCep = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "").slice(0, 8);

    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    }

    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
  };

  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      {/* Cabeçalho + busca */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Barra de busca (NOVO) */}
          <div className="relative">
            <label htmlFor="busca-clientes" className="sr-only">
              Buscar Cliente
            </label>
            <input
              id="busca-clientes"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, telefone, cidade..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => abrirModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Lista de cards (usando clientesFiltrados) */}
      {clientesFiltrados.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum cliente encontrado para &quot;{busca}&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id_cliente} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-600 rounded-lg p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => abrirModal(cliente)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id_cliente)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {cliente.nome_cliente}
              </h3>
              <div className="space-y-1 text-sm text-gray-500">
                <p>CPF: {cliente.cpf}</p>
                <p>Telefone: {cliente.telefone}</p>
                {cliente.cidade && cliente.estado && (
                  <p>
                    {cliente.cidade} - {cliente.estado}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Cliente */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">
              {clienteEmEdicao ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  type="text"
                  placeholder="CPF"
                  maxLength={14}
                  className="p-2 border rounded-md"
                />

                <input
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
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

                <input
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  type="date"
                  placeholder="Data de Nascimento"
                  className="p-2 border rounded-md"
                />

                <input
                  value={formatarCep(cep)}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCep(valor);
                    if (valor.length === 8) buscarCep(valor);
                  }}
                  type="text"
                  placeholder="CEP"
                  className="p-2 border rounded-md md:col-span-2"
                />

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
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesList;
