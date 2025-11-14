const express = require('express');
const router = express.Router();
const pool = require('../config/database');

const TABELA_ITENS = 'ItensVenda'; // ou 'Itens_Venda', dependendo de como está no banco

// POST - Registrar nova venda
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

    // 1) Cria a venda (data_venda = NOW(), valor_total será calculado por triggers)
    const sqlVenda =
      'INSERT INTO Vendas (id_cliente, data_venda) VALUES (?, NOW())';
    const [resultadoVenda] = await connection.query(sqlVenda, [id_cliente]);
    const id_venda_criada = resultadoVenda.insertId;

    // 2) Insere os itens
    //    - Trigger BEFORE INSERT em ItensVenda valida estoque e define preco_unitario
    //    - Trigger AFTER INSERT baixa o estoque
    //    - Trigger AFTER INSERT recalcula valor_total da venda
    const sqlItemVenda = `INSERT INTO ${TABELA_ITENS} (id_venda, id_produto, quantidade) VALUES (?, ?, ?)`;

    for (const item of produtos) {
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

// GET - Listar vendas
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.id_venda,
        v.data_venda,
        v.valor_total,
        c.nome_cliente 
      FROM Vendas v 
      JOIN Clientes c ON v.id_cliente = c.id_cliente 
      ORDER BY v.data_venda DESC
    `;
    const [resultados] = await pool.promise().query(sql);
    res.json(resultados);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// GET - Detalhar venda (com itens)
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
      FROM ${TABELA_ITENS} iv
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

// PUT - Atualizar venda (cliente + itens)
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

    // 1) Verifica se a venda existe
    const [vendas] = await connection.query(
      'SELECT id_venda FROM Vendas WHERE id_venda = ?',
      [id]
    );

    if (vendas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Venda não encontrada.' });
    }

    // 2) Remove itens antigos (triggers de AFTER DELETE em ItensVenda repõem estoque e recalculam total)
    await connection.query(`DELETE FROM ${TABELA_ITENS} WHERE id_venda = ?`, [
      id,
    ]);

    // 3) Atualiza o cliente da venda
    const sqlUpdateVenda =
      'UPDATE Vendas SET id_cliente = ? WHERE id_venda = ?';
    await connection.query(sqlUpdateVenda, [id_cliente, id]);

    // 4) Insere novos itens (triggers cuidam de estoque, preço e valor_total)
    const sqlItemVenda = `INSERT INTO ${TABELA_ITENS} (id_venda, id_produto, quantidade) VALUES (?, ?, ?)`;

    for (const item of produtos) {
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

// DELETE - Excluir venda
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Exclui itens (triggers AFTER DELETE em ItensVenda repõem estoque e recalculam total)
    await connection.query(`DELETE FROM ${TABELA_ITENS} WHERE id_venda = ?`, [
      id,
    ]);

    // Exclui a venda
    await connection.query('DELETE FROM Vendas WHERE id_venda = ?', [id]);

    await connection.commit();
    res.json({ message: 'Venda excluída com sucesso.' });
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
