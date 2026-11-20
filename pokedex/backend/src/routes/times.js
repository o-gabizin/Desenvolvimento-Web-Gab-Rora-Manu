const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos os times
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM times ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar times.' });
  }
});

// Criar um novo time
router.post('/', async (req, res) => {
  const { nome, treinador, icone } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome do time é obrigatório.' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO times (nome, treinador, icone) VALUES ($1, $2, $3) RETURNING *',
      [nome.trim(), treinador ? treinador.trim() : null, icone || 'poke-ball']
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar time.' });
  }
});

// Atualizar um time existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, treinador, icone } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome do time é obrigatório.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE times SET nome = $1, treinador = $2, icone = $3 WHERE id = $4 RETURNING *',
      [nome.trim(), treinador ? treinador.trim() : null, icone || 'poke-ball', id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado.' });
    }

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar time.' });
  }
});

// Excluir um time
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query('DELETE FROM times WHERE id = $1 RETURNING *', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado.' });
    }

    res.json({ mensagem: 'Time excluído com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir time.' });
  }
});

module.exports = router;