const express = require('express');
const router = express.Router(); // Usamos o Router do Express
const pool = require('../config/database'); // Importamos nossa conexão do BD

// GET - Buscar todos os produtos (Modificado para incluir categoria)
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

// GET - Buscar produto por ID (Modificado para incluir categoria)
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

// POST - Cadastrar produto (Modificado para incluir categoria)
router.post('/', (req, res) => {
  // Adicionado 'categoria'
  const { nome_produto, descricao, preco_venda, quantidade_estoque, quant_max, quant_min, data_validade, id_fornecedor, categoria } = req.body;
  
  if (!nome_produto || !preco_venda) {
    return res.status(400).json({ erro: "Nome do produto e preço de venda são obrigatórios" });
  }
  
  const sql = "INSERT INTO Produtos (nome_produto, descricao, preco_venda, quantidade_estoque, quant_max, quant_min, data_validade, id_fornecedor, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  // Adicionado 'categoria'
  const dados = [nome_produto, descricao, preco_venda, quantidade_estoque || 0, quant_max, quant_min, data_validade, id_fornecedor, categoria || 'Outros'];
  
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

// PUT - Atualizar produto (=== CORRIGIDO E ATUALIZADO ===)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  
  // 1. Pega TODOS os campos do formulário
  const { 
    nome_produto, 
    descricao, 
    preco_venda, 
    quantidade_estoque, 
    quant_max, 
    quant_min, 
    data_validade, 
    id_fornecedor,
    categoria // Adicionado 'categoria'
  } = req.body;
  
  if (!nome_produto || !preco_venda || !quant_max || !quant_min) {
    return res.status(400).json({ erro: "Nome, preço e quantidades max/min são obrigatórios" });
  }
  
  // 2. SQL atualizado para TODOS os campos
  const sql = `
    UPDATE Produtos SET 
      nome_produto = ?, 
      descricao = ?, 
      preco_venda = ?, 
      quantidade_estoque = ?, 
      quant_max = ?, 
      quant_min = ?, 
      data_validade = ?, 
      id_fornecedor = ?,
      categoria = ?
    WHERE id_produto = ?`;
    
  // 3. Array 'dados' atualizado com TODOS os campos
  const dados = [
    nome_produto, 
    descricao, 
    preco_venda, 
    quantidade_estoque, 
    quant_max, 
    quant_min, 
    data_validade, 
    id_fornecedor,
    categoria || 'Outros',
    id
  ];
  
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

// DELETE - Excluir produto (Seu código original, sem alterações)
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