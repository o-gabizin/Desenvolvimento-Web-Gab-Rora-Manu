const express = require('express');
const pool = require('../db');

const router = express.Router();

// Listar todos os times
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM times ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar times' });
  }
});

// Buscar um time pelo id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM times WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar time' });
  }
});

// Criar time
router.post('/', async (req, res) => {
  const { nome, treinador } = req.body;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'O nome do time é obrigatório' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO times (nome, treinador) VALUES ($1, $2) RETURNING *',
      [nome.trim(), treinador || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar time' });
  }
});

// Editar time
router.put('/:id', async (req, res) => {
  const { nome, treinador } = req.body;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'O nome do time é obrigatório' });
  }
  try {
    const result = await pool.query(
      'UPDATE times SET nome = $1, treinador = $2 WHERE id = $3 RETURNING *',
      [nome.trim(), treinador || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao editar time' });
  }
});

// Excluir time (os pokémon dele são apagados junto, por causa do ON DELETE CASCADE)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM times WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir time' });
  }
});

module.exports = router;