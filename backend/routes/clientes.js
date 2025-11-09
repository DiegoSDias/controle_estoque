const express = require('express');
const router = express.Router(); // Usamos o Router do Express
const pool = require('../config/database'); // Importamos nossa conexão do BD

router.get('/', (req, res) => {
  const sql = "SELECT * FROM Clientes ORDER BY nome_cliente";
  
  pool.query(sql, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar clientes" });
    }
    res.json(resultados);
  });
});

// GET - Buscar cliente por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM Clientes WHERE id_cliente = ?";
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar cliente" });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }
    res.json(resultados[0]);
  });
});

// POST - Cadastrar cliente
router.post('/', (req, res) => {
  const { nome_cliente, cpf, email, telefone, data_nascimento, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep } = req.body;
  
  if (!nome_cliente) {
    return res.status(400).json({ erro: "Nome do cliente é obrigatório" });
  }
  
  const sql = "INSERT INTO Clientes (nome_cliente, cpf, email, telefone, data_nascimento, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const dados = [nome_cliente, cpf, email, telefone, data_nascimento, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ erro: "CPF ou Email já cadastrados" });
      }
      return res.status(500).json({ erro: "Erro ao cadastrar cliente" });
    }
    res.status(201).json({ 
      message: "Cliente cadastrado com sucesso!",
      id: resultados.insertId 
    });
  });
});

// PUT - Atualizar cliente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome_cliente, cpf, email, telefone, data_nascimento, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep } = req.body;
  
  if (!nome_cliente) {
    return res.status(400).json({ erro: "Nome do cliente é obrigatório" });
  }
  
  const sql = "UPDATE Clientes SET nome_cliente = ?, cpf = ?, email = ?, telefone = ?, data_nascimento = ?, nome_rua = ?, numero_rua = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ? WHERE id_cliente = ?";
  const dados = [nome_cliente, cpf, email, telefone, data_nascimento, nome_rua, numero_rua, complemento, bairro, cidade, estado, cep, id];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ erro: "CPF ou Email já cadastrados" });
      }
      return res.status(500).json({ erro: "Erro ao atualizar cliente" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }
    res.json({ message: "Cliente atualizado com sucesso!" });
  });
});

// DELETE - Excluir cliente
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM Clientes WHERE id_cliente = ?";
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ erro: "Não é possível excluir cliente que possui vendas registradas" });
      }
      return res.status(500).json({ erro: "Erro ao excluir cliente" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }
    res.json({ message: "Cliente excluído com sucesso!" });
  });
});

module.exports = router