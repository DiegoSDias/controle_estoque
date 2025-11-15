const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /devolucoes
router.post('/', async (req, res) => {
  const connection = await pool.promise().getConnection();

  try {
    const { id_item_venda, quantidade, motivo, reutilizavel } = req.body;

    if (!id_item_venda || !quantidade) {
      return res.status(400).json({ erro: 'id_item_venda e quantidade são obrigatórios.' });
    }

    const qtd = parseInt(quantidade, 10);
    if (!qtd || qtd <= 0) {
      return res.status(400).json({ erro: 'Quantidade deve ser maior que zero.' });
    }

    // Confere se o item existe e pega a quantidade ATUAL (já descontada por devoluções anteriores)
    const [itens] = await connection.query(
      'SELECT quantidade FROM ItensVenda WHERE id_item_venda = ?',
      [id_item_venda]
    );
    if (itens.length === 0) {
      return res.status(404).json({ erro: 'Item de venda não encontrado.' });
    }

    const quantidadeRestante = itens[0].quantidade; // quantidade que ainda está na venda

    // Agora só precisa garantir que não está devolvendo mais do que o que ainda existe na venda
    if (qtd > quantidadeRestante) {
      return res.status(400).json({
        erro: `Quantidade de devolução excede a quantidade restante na venda. Restante: ${quantidadeRestante}`
      });
    }

    // Insere devolução (trigger vai ajustar ItensVenda e o estoque)
    const sql = `
      INSERT INTO Devolucao (data_devolucao, motivo, quantidade, reutilizavel, id_item_venda)
      VALUES (NOW(), ?, ?, ?, ?)
    `;
    const [result] = await connection.query(sql, [
      motivo || null,
      qtd,
      !!reutilizavel,
      id_item_venda
    ]);

    res.status(201).json({
      message: 'Devolução registrada com sucesso.',
      id_devolucao: result.insertId
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao registrar devolução.', detalhes: erro.message });
  } finally {
    connection.release();
  }
});

// GET /devolucoes
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        d.id_devolucao,
        d.data_devolucao,
        d.motivo,
        d.quantidade,
        d.reutilizavel,
        iv.id_item_venda,
        v.id_venda,
        c.nome_cliente,
        p.nome_produto
      FROM Devolucao d
      JOIN ItensVenda iv ON d.id_item_venda = iv.id_item_venda
      JOIN Vendas v ON iv.id_venda = v.id_venda
      JOIN Clientes c ON v.id_cliente = c.id_cliente
      JOIN Produtos p ON iv.id_produto = p.id_produto
      ORDER BY d.data_devolucao DESC
    `;
    const [rows] = await pool.promise().query(sql);
    res.json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar devoluções.' });
  }
});

module.exports = router;
