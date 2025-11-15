// backend/routes/devolucoes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @route   GET /devolucoes
 * @desc    Busca todos os detalhes de devoluções usando a VIEW
 */
router.get('/', async (req, res) => {
  try {
    const query = `SELECT * FROM vw_devolucoes_detalhes`;
    const [rows] = await pool.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar devoluções:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

// (adicionar rotas POST, PUT, DELETE para devoluções)

module.exports = router;