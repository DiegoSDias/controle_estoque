import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeRua, setNomeRua] = useState('');
  const [numeroRua, setNumeroRua] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  // --- Funções de Ação ---

  const abrirModal = (fornecedor = null) => {
    if (fornecedor) {
      // Modo Edição: preenche o formulário com os dados existentes
      setFornecedorEmEdicao(fornecedor);
      setNomeFantasia(fornecedor.nome_fantasia);
      setRazaoSocial(fornecedor.razao_social || '');
      setCnpj(fornecedor.cnpj || '');
      setEmail(fornecedor.email || '');
      setTelefone(fornecedor.telefone || '');
      setNomeRua(fornecedor.nome_rua || '');
      setNumeroRua(fornecedor.numero_rua || '');
      setComplemento(fornecedor.complemento || '');
      setBairro(fornecedor.bairro || '');
      setCidade(fornecedor.cidade || '');
      setEstado(fornecedor.estado || '');
      setCep(fornecedor.cep || '');
    } else {
      // Modo Cadastro: limpa o formulário
      setFornecedorEmEdicao(null);
      setNomeFantasia('');
      setRazaoSocial('');
      setCnpj('');
      setEmail('');
      setTelefone('');
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
        console.log('Não foi possível conectar à API: ', error);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const dadosFornecedor = { nome_fantasia: nomeFantasia, razao_social: razaoSocial, cnpj, email, telefone, nome_rua: nomeRua, numero_rua:numeroRua, complemento, bairro, cidade, estado, cep };
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
      console.log('Não foi possível conectar à API: ', error);
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
                {/* Dados principais */}
                <input
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  type="text"
                  placeholder="Nome Fantasia*"
                  required
                  className="p-2 border rounded-md md:col-span-2"
                />

                <input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  type="text"
                  placeholder="Razão Social"
                  className="p-2 border rounded-md md:col-span-2"
                />

                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  type="text"
                  placeholder="CNPJ"
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
                  placeholder="Estado (UF)"
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

export default FornecedoresList;