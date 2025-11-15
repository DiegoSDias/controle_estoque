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

// Top 5 produtos
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

// === NOVO ENDPOINT PARA OS CARDS PRINCIPAIS ===
router.get('/stats-principais', async (req, res) => {
  try {
    // Chama a VIEW que acabamos de criar
    const sql = `SELECT * FROM vw_dashboard_stats`;
    const [rows] = await pool.promise().query(sql);
    // Retorna o objeto único com { total_produtos: X, ... }
    res.json(rows[0]); 
  } catch (error) {
    console.error('Erro ao buscar stats principais:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// === NOVO ENDPOINT PARA VENDAS RECENTES ===
router.get('/vendas-recentes', async (req, res) => {
  try {
    // Reutiliza a VIEW da tela de Vendas, pegando só as 5 mais novas
    const sql = `SELECT * FROM vw_vendas_com_cliente ORDER BY data_venda DESC LIMIT 5`;
    const [rows] = await pool.promise().query(sql);
    // Retorna um array com as 5 vendas
    res.json(rows); 
  } catch (error) {
    console.error('Erro ao buscar vendas recentes:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
