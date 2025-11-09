const express = require('express');
const router = express.Router(); // Usamos o Router do Express
const pool = require('../config/database'); // Importamos nossa conexão do BD

router.get('/', (req, res) => {
  const sql = `
    SELECT p.*, f.nome_fantasia as nome_fornecedor 
    FROM Produtos p 
    LEFT JOIN Fornecedores f ON p.id_fornecedor = f.id_fornecedor 
    ORDER BY p.nome_produto
  `;
  
  pool.query(sql, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
    res.json(resultados);
  });
});

// GET - Buscar produto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT p.*, f.nome_fantasia as nome_fornecedor 
    FROM Produtos p 
    LEFT JOIN Fornecedores f ON p.id_fornecedor = f.id_fornecedor 
    WHERE p.id_produto = ?
  `;
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao buscar produto" });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.json(resultados[0]);
  });
});

// POST - Cadastrar produto
router.post('/', (req, res) => {
  const { nome_produto, descricao, preco_venda, quantidade_estoque, quant_max, quant_min, data_validade, id_fornecedor } = req.body;
  
  if (!nome_produto || !preco_venda) {
    return res.status(400).json({ erro: "Nome do produto e preço de venda são obrigatórios" });
  }
  
  const sql = "INSERT INTO Produtos (nome_produto, descricao, preco_venda, quantidade_estoque, quant_max, quant_min, data_validade, id_fornecedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const dados = [nome_produto, descricao, preco_venda, quantidade_estoque || 0, quant_max, quant_min, data_validade, id_fornecedor];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao cadastrar produto" });
    }
    res.status(201).json({ 
      message: "Produto cadastrado com sucesso!",
      id: resultados.insertId 
    });
  });
});

// PUT - Atualizar produto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  console.log(req.body)
  const { nome_produto, descricao, preco_venda, quantidade_estoque, id_fornecedor } = req.body;
  
  if (!nome_produto || !preco_venda) {
    return res.status(400).json({ erro: "Nome do produto e preço de venda são obrigatórios" });
  }
  
  const sql = "UPDATE Produtos SET nome_produto = ?, descricao = ?, preco_venda = ?, quantidade_estoque = ?, id_fornecedor = ? WHERE id_produto = ?";
  const dados = [nome_produto, descricao, preco_venda, quantidade_estoque, id_fornecedor, id];
  
  pool.query(sql, dados, (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ erro: "Erro ao atualizar produto" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.json({ message: "Produto atualizado com sucesso!" });
  });
});

// DELETE - Excluir produto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM Produtos WHERE id_produto = ?";
  
  pool.query(sql, [id], (erro, resultados) => {
    if (erro) {
      console.error(erro);
      if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ erro: "Não é possível excluir produto que já foi vendido" });
      }
      return res.status(500).json({ erro: "Erro ao excluir produto" });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.json({ message: "Produto excluído com sucesso!" });
  });
});

module.exports = router;