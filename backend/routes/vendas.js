const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST - Registrar nova venda (usando async/await e transações)
router.post('/', async (req, res) => {
  const connection = await pool.promise().getConnection();
  
  try {
    const { id_cliente, produtos } = req.body;

    if (!id_cliente || !produtos || produtos.length === 0) {
        return res.status(400).json({ erro: "ID do cliente e lista de produtos são obrigatórios." });
    }

    await connection.beginTransaction();

    let valor_total = 0;
    for (const item of produtos) {
      const [rows] = await connection.query('SELECT preco_venda, quantidade_estoque FROM Produtos WHERE id_produto = ?', [item.id_produto]);
      if (rows.length === 0) throw new Error(`Produto com ID ${item.id_produto} não encontrado.`);
      
      const produtoDoBanco = rows[0];
      if (produtoDoBanco.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para o produto ID ${item.id_produto}. Em estoque: ${produtoDoBanco.quantidade_estoque}`);
      }
      valor_total += produtoDoBanco.preco_venda * item.quantidade;
    }

    const sqlVenda = 'INSERT INTO Vendas (id_cliente, valor_total, data_venda) VALUES (?, ?, NOW())';
    const [resultadoVenda] = await connection.query(sqlVenda, [id_cliente, valor_total]);
    const id_venda_criada = resultadoVenda.insertId;

    for (const item of produtos) {
      const [rows] = await connection.query('SELECT preco_venda FROM Produtos WHERE id_produto = ?', [item.id_produto]);
      const preco_unitario_seguro = rows[0].preco_venda;

      const sqlItemVenda = 'INSERT INTO ItensVenda (id_venda, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)';
      await connection.query(sqlItemVenda, [id_venda_criada, item.id_produto, item.quantidade, preco_unitario_seguro]);
      
      const sqlAtualizaEstoque = 'UPDATE Produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?';
      await connection.query(sqlAtualizaEstoque, [item.quantidade, item.id_produto]);
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Venda realizada com sucesso!', id_venda: id_venda_criada });

  } catch (erro) {
    await connection.rollback();
    console.error(erro);
    res.status(500).json({ erro: "Erro ao realizar venda.", detalhes: erro.message });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const sql = `
        SELECT v.id_venda, v.data_venda, v.valor_total, c.nome_cliente 
        FROM Vendas v 
        JOIN Clientes c ON v.id_cliente = c.id_cliente 
        ORDER BY v.data_venda DESC
    `;
    const [resultados] = await pool.promise().query(sql);
    res.json(resultados);
  } catch(erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao buscar vendas" });
  }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sqlVenda = `SELECT v.*, c.nome_cliente FROM Vendas v JOIN Clientes c ON v.id_cliente = c.id_cliente WHERE v.id_venda = ?`;
        const [vendas] = await pool.promise().query(sqlVenda, [id]);

        if (vendas.length === 0) {
            return res.status(404).json({ erro: "Venda não encontrada" });
        }
        
        const sqlItens = `SELECT iv.*, p.nome_produto FROM ItensVenda iv JOIN Produtos p ON iv.id_produto = p.id_produto WHERE iv.id_venda = ?`;
        const [itens] = await pool.promise().query(sqlItens, [id]);
        
        const vendaCompleta = vendas[0];
        vendaCompleta.itens = itens;
        res.json(vendaCompleta);

    } catch(erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao buscar detalhes da venda" });
    }
});

// PUT - Atualizar venda existente (editar itens e cliente)
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

    // 2) Busca itens atuais da venda para devolver estoque
    const [itensAntigos] = await connection.query(
      'SELECT id_produto, quantidade FROM ItensVenda WHERE id_venda = ?',
      [id]
    );

    // 3) Devolve estoque dos itens antigos
    for (const item of itensAntigos) {
      await connection.query(
        'UPDATE Produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id_produto = ?',
        [item.quantidade, item.id_produto]
      );
    }

    // 4) Remove itens antigos da venda
    await connection.query('DELETE FROM ItensVenda WHERE id_venda = ?', [id]);

    // 5) Valida produtos novos e calcula valor_total
    let valor_total = 0;

    for (const item of produtos) {
      const [rows] = await connection.query(
        'SELECT preco_venda, quantidade_estoque FROM Produtos WHERE id_produto = ?',
        [item.id_produto]
      );

      if (rows.length === 0) {
        throw new Error(`Produto com ID ${item.id_produto} não encontrado.`);
      }

      const produtoDoBanco = rows[0];

      if (produtoDoBanco.quantidade_estoque < item.quantidade) {
        throw new Error(
          `Estoque insuficiente para o produto ID ${item.id_produto}. Em estoque: ${produtoDoBanco.quantidade_estoque}`
        );
      }

      valor_total += produtoDoBanco.preco_venda * item.quantidade;
    }

    // 6) Atualiza a venda (cliente e valor_total)
    const sqlUpdateVenda =
      'UPDATE Vendas SET id_cliente = ?, valor_total = ? WHERE id_venda = ?';
    await connection.query(sqlUpdateVenda, [id_cliente, valor_total, id]);

    // 7) Insere novos itens e baixa estoque novamente
    for (const item of produtos) {
      const [rows] = await connection.query(
        'SELECT preco_venda FROM Produtos WHERE id_produto = ?',
        [item.id_produto]
      );
      const preco_unitario_seguro = rows[0].preco_venda;

      const sqlItemVenda =
        'INSERT INTO ItensVenda (id_venda, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)';
      await connection.query(sqlItemVenda, [
        id,
        item.id_produto,
        item.quantidade,
        preco_unitario_seguro,
      ]);

      const sqlAtualizaEstoque =
        'UPDATE Produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?';
      await connection.query(sqlAtualizaEstoque, [
        item.quantidade,
        item.id_produto,
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

// DELETE - Excluir venda e reverter estoque
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1) Verifica se a venda existe
    const [vendas] = await connection.query(
      'SELECT id_venda FROM Vendas WHERE id_venda = ?',
      [id]
    );
    
    console.log("vendas: ", vendas)
    if (vendas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }

    // 2) Busca itens da venda para repor estoque
    const [itens] = await connection.query(
      'SELECT id_produto, quantidade FROM ItensVenda WHERE id_venda = ?',
      [id]
    );

    // 3) Repor estoque produto a produto
    for (const item of itens) {
      await connection.query(
        'UPDATE Produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id_produto = ?',
        [item.quantidade, item.id_produto]
      );
    }

    // 4) Excluir itens da venda (se não houver ON DELETE CASCADE)
    await connection.query('DELETE FROM ItensVenda WHERE id_venda = ?', [id]);

    // 5) Excluir a venda
    await connection.query('DELETE FROM Vendas WHERE id_venda = ?', [id]);

    await connection.commit();
    res.json({ message: 'Venda excluída com sucesso e estoque revertido.' });
  } catch (erro) {
    await connection.rollback();
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao excluir venda', detalhes: erro.message });
  } finally {
    connection.release();
  }
});


module.exports = router;