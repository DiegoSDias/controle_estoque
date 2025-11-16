// backend/routes/devolucoes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /devolucoes
router.post('/', async (req, res) => {
  const connection = await pool.promise().getConnection();

  try {
    const { id_item_venda, quantidade, motivo, reutilizavel } = req.body;

    if (!id_item_venda || !quantidade) {
      return res
        .status(400)
        .json({ erro: 'id_item_venda e quantidade são obrigatórios.' });
    }

    const qtd = parseInt(quantidade, 10);
    if (!qtd || qtd <= 0) {
      return res
        .status(400)
        .json({ erro: 'Quantidade deve ser maior que zero.' });
    }

    // Confere se o item existe e pega a quantidade ATUAL (já ajustada pelas devoluções anteriores)
    const [itens] = await connection.query(
      'SELECT quantidade FROM ItensVenda WHERE id_item_venda = ?',
      [id_item_venda]
    );
    if (itens.length === 0) {
      return res.status(404).json({ erro: 'Item de venda não encontrado.' });
    }

    const quantidadeRestante = itens[0].quantidade; // quantidade que ainda está na venda

    if (qtd > quantidadeRestante) {
      return res.status(400).json({
        erro: `Quantidade de devolução excede a quantidade restante na venda. Restante: ${quantidadeRestante}`,
      });
    }

    // Insere devolução (trigger ajusta ItensVenda, estoque e a venda)
    const sql = `
      INSERT INTO Devolucao (data_devolucao, motivo, quantidade, reutilizavel, id_item_venda)
      VALUES (NOW(), ?, ?, ?, ?)
    `;
    const [result] = await connection.query(sql, [
      motivo || null,
      qtd,
      !!reutilizavel,
      id_item_venda,
    ]);

    res.status(201).json({
      message: 'Devolução registrada com sucesso.',
      id_devolucao: result.insertId,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao registrar devolução.',
      detalhes: erro.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /devolucoes
 * @desc    Busca todos os detalhes de devoluções usando a VIEW
 */
router.get('/', async (req, res) => {
  try {
    const query = `SELECT * FROM vw_devolucoes_detalhes ORDER BY data_devolucao DESC`;
    const [rows] = await pool.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar devoluções:', error);
    res
      .status(500)
      .json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

module.exports = router;
