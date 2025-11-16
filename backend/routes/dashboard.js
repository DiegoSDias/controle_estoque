const express = require('express');
const router = express.Router(); 
const pool = require('../config/database');

// Produtos críticos
router.get('/produtos-criticos', async (req, res) => {
  try {
    const query = `
      SELECT nome_produto, quantidade_estoque, quant_min, status_estoque
      FROM vw_produtos_estoque
      WHERE status_estoque = 'Crítico' OR status_estoque = 'Sem Estoque'
      ORDER BY quantidade_estoque ASC
      LIMIT 10;
    `;

    const [rows] = await pool.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos críticos:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

// Top 5 produtos mais vendidos
router.get('/top-5-produtos', async (req, res) => {
  try {
    const query = `
      SELECT nome_produto, total_vendido
      FROM vw_top_produtos
      LIMIT 5;
    `;
    const [rows] = await pool.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar top 5 produtos:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

// Aniversariantes da semana
router.get('/aniversariantes-semana', async (req, res) => {
  try {
    const query = `
      SELECT nome_cliente, data_nascimento, proximo_aniversario, email, telefone
      FROM vw_aniversariantes
      WHERE 
        proximo_aniversario BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY 
        proximo_aniversario ASC;
    `;

    const [rows] = await pool.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar aniversariantes:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

// === Stats principais da dashboard (cards) ===
router.get('/stats-principais', async (req, res) => {
  try {
    const sql = `SELECT * FROM vw_dashboard_stats`;
    const [rows] = await pool.promise().query(sql);
    res.json(rows[0] || null); 
  } catch (error) {
    console.error('Erro ao buscar stats principais:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// === Vendas recentes ===
router.get('/vendas-recentes', async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM vw_vendas_com_cliente
      ORDER BY data_venda DESC
      LIMIT 5
    `;
    const [rows] = await pool.promise().query(sql);
    res.json(rows); 
  } catch (error) {
    console.error('Erro ao buscar vendas recentes:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// === Produtos mais devolvidos ===
router.get('/produtos-mais-devolvidos', async (req, res) => {
  try {
    const sql = `
      SELECT
        id_produto,
        nome_produto,
        total_devolvido,
        numero_devolucoes
      FROM vw_produtos_mais_devolvidos
      ORDER BY total_devolvido DESC
      LIMIT 10;
    `;
    const [rows] = await pool.promise().query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos mais devolvidos:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

// === Produtos perto da validade ===
router.get('/produtos-perto-validade', async (req, res) => {
  try {
    const sql = `
      SELECT
        id_produto,
        nome_produto,
        quantidade_estoque,
        data_validade,
        dias_para_validade
      FROM vw_produtos_perto_validade
      ORDER BY dias_para_validade ASC;
    `;
    const [rows] = await pool.promise().query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos perto da validade:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

module.exports = router;
