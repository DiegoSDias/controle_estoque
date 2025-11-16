// backend/routes/vendas.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST - Registrar nova venda (transação)
router.post('/', async (req, res) => {
  const connection = await pool.promise().getConnection();

  try {
    const { id_cliente, produtos } = req.body;

    if (!id_cliente || !produtos || produtos.length === 0) {
      return res
        .status(400)
        .json({ erro: 'ID do cliente e lista de produtos são obrigatórios.' });
    }

    await connection.beginTransaction();

    // 1) Cria a venda com valor_total = 0 (DEFAULT) e status ATIVA
    const sqlVenda = `
      INSERT INTO Vendas (id_cliente, data_venda, status)
      VALUES (?, NOW(), 'ATIVA')
    `;
    const [resultadoVenda] = await connection.query(sqlVenda, [id_cliente]);
    const id_venda_criada = resultadoVenda.insertId;

    // 2) Insere os itens da venda
    //    - Trigger trg_itens_venda_validacao valida produto, estoque e define preco_unitario
    //    - Trigger trg_baixa_estoque baixa o estoque
    //    - Trigger trg_recalcula_total_insert recalcula valor_total da venda
    for (const item of produtos) {
      const sqlItemVenda = `
        INSERT INTO ItensVenda (id_venda, id_produto, quantidade)
        VALUES (?, ?, ?)
      `;
      await connection.query(sqlItemVenda, [
        id_venda_criada,
        item.id_produto,
        item.quantidade,
      ]);
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: 'Venda realizada com sucesso!', id_venda: id_venda_criada });
  } catch (erro) {
    await connection.rollback();
    console.error(erro);
    res
      .status(500)
      .json({ erro: 'Erro ao realizar venda.', detalhes: erro.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /vendas  -> lista com filtros + paginação
router.get('/', async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search = '',
      data_inicio = '',
      data_fim = '',
    } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;

    const offset = (page - 1) * limit;
    const params = [];
    const whereClauses = [];

    // filtro por busca (nome do cliente ou id da venda)
    if (search) {
      whereClauses.push(`(c.nome_cliente LIKE ? OR v.id_venda = ?)`);
      params.push(`%${search}%`, search);
    }

    // filtro por intervalo de datas
    if (data_inicio && data_fim) {
      whereClauses.push('DATE(v.data_venda) BETWEEN ? AND ?');
      params.push(data_inicio, data_fim);
    }

    // NÃO mostrar vendas canceladas
    whereClauses.push(`v.status <> 'CANCELADA'`);

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // dados da página
    const sqlDados = `
      SELECT v.id_venda, v.data_venda, v.valor_total, c.nome_cliente
      FROM Vendas v
      JOIN Clientes c ON v.id_cliente = c.id_cliente
      ${whereSql}
      ORDER BY v.data_venda DESC
      LIMIT ? OFFSET ?
    `;
    const [vendas] = await pool
      .promise()
      .query(sqlDados, [...params, limit, offset]);

    // total de registros para calcular totalPaginas
    const sqlCount = `
      SELECT COUNT(*) AS total
      FROM Vendas v
      JOIN Clientes c ON v.id_cliente = c.id_cliente
      ${whereSql}
    `;
    const [countRows] = await pool.promise().query(sqlCount, params);
    const totalRegistros = countRows[0].total;
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    res.json({ vendas, totalPaginas });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// GET /vendas/stats -> estatísticas do período (usa a procedure)
router.get('/stats', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res
        .status(400)
        .json({ erro: 'Parâmetros data_inicio e data_fim são obrigatórios.' });
    }

    // Chama a stored procedure: CALL sp_get_vendas_stats_range(?, ?)
    // Ela já está filtrando status = 'ATIVA'
    const [rows] = await pool
      .promise()
      .query('CALL sp_get_vendas_stats_range(?, ?)', [data_inicio, data_fim]);

    // mysql2 com CALL geralmente retorna [[resultRows], meta]
    let row = {};
    if (Array.isArray(rows)) {
      if (Array.isArray(rows[0])) {
        row = rows[0][0] || {};
      } else {
        row = rows[0] || {};
      }
    }

    const stats = {
      vendas_periodo: Number(row.vendas_periodo || 0),
      faturado_periodo: Number(row.faturado_periodo || 0),
      ticket_medio_periodo: Number(row.ticket_medio_periodo || 0),
    };

    res.json(stats);
  } catch (erro) {
    console.error(erro);
    res
      .status(500)
      .json({ erro: 'Erro ao buscar estatísticas.', detalhes: erro.message });
  }
});

// GET /vendas/:id -> detalhes da venda + itens
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sqlVenda = `
      SELECT v.*, c.nome_cliente
      FROM Vendas v
      JOIN Clientes c ON v.id_cliente = c.id_cliente
      WHERE v.id_venda = ?
    `;
    const [vendas] = await pool.promise().query(sqlVenda, [id]);

    if (vendas.length === 0) {
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }

    const sqlItens = `
      SELECT iv.*, p.nome_produto
      FROM ItensVenda iv
      JOIN Produtos p ON iv.id_produto = p.id_produto
      WHERE iv.id_venda = ?
    `;
    const [itens] = await pool.promise().query(sqlItens, [id]);

    const vendaCompleta = vendas[0];
    vendaCompleta.itens = itens;

    res.json(vendaCompleta);
  } catch (erro) {
    console.error(erro);
    return res
      .status(500)
      .json({ erro: 'Erro ao buscar detalhes da venda' });
  }
});

// PUT /vendas/:id - Atualizar venda
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.promise().getConnection();

  try {
    const { id_cliente, produtos } = req.body;

    if (!id_cliente || !produtos || produtos.length === 0) {
      return res
        .status(400)
        .json({ erro: 'ID do cliente e lista de produtos são obrigatórios.' });
    }

    await connection.beginTransaction();

    // verifica se a venda existe
    const [vendas] = await connection.query(
      'SELECT id_venda FROM Vendas WHERE id_venda = ?',
      [id]
    );

    if (vendas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Venda não encontrada.' });
    }

    // atualiza cliente e volta status para ATIVA
    const sqlUpdateVenda = `
      UPDATE Vendas
      SET id_cliente = ?, status = 'ATIVA'
      WHERE id_venda = ?
    `;
    await connection.query(sqlUpdateVenda, [id_cliente, id]);

    // insere novos itens (triggers cuidam de estoque e valor_total)
    for (const item of produtos) {
      const sqlItemVenda = `
        INSERT INTO ItensVenda (id_venda, id_produto, quantidade)
        VALUES (?, ?, ?)
      `;
      await connection.query(sqlItemVenda, [
        id,
        item.id_produto,
        item.quantidade,
      ]);
    }

    await connection.commit();
    res.json({ message: 'Venda atualizada com sucesso.', id_venda: id });
  } catch (erro) {
    await connection.rollback();
    console.error(erro);
    res
      .status(500)
      .json({ erro: 'Erro ao atualizar venda.', detalhes: erro.message });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /vendas/:id - Excluir venda e reverter estoque (via trigger)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [vendas] = await connection.query(
      'SELECT id_venda FROM Vendas WHERE id_venda = ?',
      [id]
    );

    if (vendas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }

    await connection.commit();
    res.json({ message: 'Venda excluída com sucesso e estoque revertido.' });
  } catch (erro) {
    await connection.rollback();
    console.error(erro);
    res
      .status(500)
      .json({ erro: 'Erro ao excluir venda', detalhes: erro.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
