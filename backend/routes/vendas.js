// backend/routes/vendas.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// --- (Sua rota POST ... continua aqui, INALTERADA) ---
router.post('/', async (req, res) => {
  /* ... (código do POST original) ... */
});

// === NOVO ENDPOINT DE STATS (para os KPIs Dinâmicos) ===
// Chama o Stored Procedure que criamos
router.get('/stats', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    // Validação: se não enviar as datas, pegamos os últimos 30 dias
    const FIM = data_fim || new Date().toISOString().split('T')[0];
    const INICIO = data_inicio || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

    // Chama o Stored Procedure 'sp_get_vendas_stats_range'
    const sql = 'CALL sp_get_vendas_stats_range(?, ?)';
    const [resultados] = await pool.promise().query(sql, [INICIO, FIM]);
    
    // O resultado de um SP vem dentro de um array, pegamos o primeiro
    res.json(resultados[0][0]); 

  } catch(erro) {
    console.error('Erro ao buscar stats de vendas:', erro);
    return res.status(500).json({ erro: "Erro ao buscar stats de vendas" });
  }
});


// === ENDPOINT GET / (TODAS) ATUALIZADO PARA FILTROS E PAGINAÇÃO ===
router.get('/', async (req, res) => {
  try {
    // Parâmetros da query (com valores padrão)
    const { page = 1, limit = 20, search = '', data_inicio = '', data_fim = '' } = req.query;

    const offset = (page - 1) * limit;
    let params = []; // Array de parâmetros para o SQL
    let whereClauses = [];

    // --- Lógica dos Filtros ---
    // 1. Filtro de Busca (pelo nome do cliente ou ID da venda)
    if (search) {
      whereClauses.push(`(c.nome_cliente LIKE ? OR v.id_venda = ?)`);
      params.push(`%${search}%`);
      params.push(search);
    }

    // 2. Filtro de Data
    if (data_inicio && data_fim) {
      whereClauses.push(`DATE(v.data_venda) BETWEEN ? AND ?`);
      params.push(data_inicio);
      params.push(data_fim);
    }

    // --- Montagem da Query ---
    let whereSql = '';
    if (whereClauses.length > 0) {
      whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    }

    // Query para buscar os DADOS da página (usando a VIEW que já tínhamos)
    const sql = `
      SELECT * FROM vw_vendas_com_cliente v
      LEFT JOIN Clientes c ON v.id_cliente = c.id_cliente
      ${whereSql}
      ORDER BY v.data_venda DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    
    const [vendas] = await pool.promise().query(sql, queryParams);

    // Query para buscar o TOTAL de itens (para a paginação)
    const countSql = `
      SELECT COUNT(*) as total
      FROM Vendas v
      JOIN Clientes c ON v.id_cliente = c.id_cliente
      ${whereSql}
    `;
    const [totalRows] = await pool.promise().query(countSql, params);
    
    const total = totalRows[0].total;
    const totalPaginas = Math.ceil(total / limit);

    // Retorna um objeto com os dados e a paginação
    res.json({
      vendas,
      totalPaginas,
      paginaAtual: parseInt(page),
      totalVendas: total
    });

  } catch(erro) {
    console.error("Erro ao buscar vendas:", erro);
    return res.status(500).json({ erro: "Erro ao buscar vendas" });
  }
});


// --- (Sua rota GET /:id ... continua aqui, INALTERADA) ---
router.get('/:id', async (req, res) => {
  /* ... (código do GET /:id original) ... */
});

// --- (Sua rota PUT /:id ... continua aqui, INALTERADA) ---
router.put('/:id', async (req, res) => {
  /* ... (código do PUT original) ... */
});

// --- (Sua rota DELETE /:id ... continua aqui, INALTERADA) ---
router.delete('/:id', async (req, res) => {
  /* ... (código do DELETE original) ... */
});


module.exports = router;