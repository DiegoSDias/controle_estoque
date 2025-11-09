const express = require('express');
const router = express.Router(); // Usamos o Router do Express
const pool = require('../config/database'); // Importamos nossa conexão do BD


// GET - Listar todos os fornecedores
router.get('/', (req, res) => {
  const sql = "SELECT * FROM Fornecedores ORDER BY nome_fantasia";
  
  pool.query(sql, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar fornecedores" });
    }
    res.json(resultados);
  });
});

// GET - Buscar fornecedor por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM Fornecedores WHERE id_fornecedor = ?";
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar fornecedor" });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }
    res.json(resultados[0]);
  });
});

// POST - Cadastrar fornecedor
router.post('/', (req, res) => {
  const { nome_fantasia, razao_social, cnpj, email, telefone, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep } = req.body;
  
  // Validação básica
  if (!nome_fantasia) {
    return res.status(400).json({ erro: "Nome fantasia é obrigatório" });
  }
  
  const sql = "INSERT INTO Fornecedores (nome_fantasia, razao_social, cnpj, email, telefone, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const dados = [nome_fantasia, razao_social, cnpj, email, telefone, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ erro: "CNPJ ou Razão Social já cadastrados" });
      }
      return res.status(500).json({ erro: "Erro ao cadastrar fornecedor" });
    }
    res.status(201).json({ 
      message: "Fornecedor cadastrado com sucesso!",
      id: resultados.insertId 
    });
  });
});

// PUT - Atualizar fornecedor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome_fantasia, razao_social, cnpj, email, telefone, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep } = req.body;
  
  if (!nome_fantasia) {
    return res.status(400).json({ erro: "Nome fantasia é obrigatório" });
  }
  
  const sql = "UPDATE Fornecedores SET nome_fantasia = ?, razao_social = ?, cnpj = ?, email = ?, telefone = ?, nome_rua = ?, numero_rua = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ?  WHERE id_fornecedor = ?";
  const dados = [nome_fantasia, razao_social, cnpj, email, telefone, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep, id];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ erro: "CNPJ ou Razão Social já cadastrados" });
      }
      return res.status(500).json({ erro: "Erro ao atualizar fornecedor" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }
    res.json({ message: "Fornecedor atualizado com sucesso!" });
  });
});

// DELETE - Excluir fornecedor
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM Fornecedores WHERE id_fornecedor = ?";
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ erro: "Não é possível excluir fornecedor que possui produtos cadastrados" });
      }
      return res.status(500).json({ erro: "Erro ao excluir fornecedor" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }
    res.json({ message: "Fornecedor excluído com sucesso!" });
  });
});

module.exports = router; 