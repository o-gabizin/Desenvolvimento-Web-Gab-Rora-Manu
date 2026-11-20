const express = require('express');
const pool = require('../db');

const router = express.Router();

const CAMPOS_EV = ['ev_hp', 'ev_atk', 'ev_def', 'ev_spa', 'ev_spd', 'ev_spe'];

const EASTER_EGGS = [258, 259, 260, 303]; // linha do Swampert + Mawile

function pokemonPermitido(id) {
  return (id >= 650 && id <= 721) || EASTER_EGGS.includes(id);
}

// Valida e normaliza os dados recebidos. Devolve { erro } ou { dados }
function validar(body) {
  const pokemon_id = Number(body.pokemon_id);
  const nivel = body.nivel === undefined ? 50 : Number(body.nivel);

  if (!Number.isInteger(pokemon_id) || !pokemonPermitido(pokemon_id)) {
    return { erro: 'pokemon_id inválido: use Pokémon de Kalos (650 a 721) ou os extras permitidos' };
  }
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 100) {
    return { erro: 'O nível deve ser entre 1 e 100' };
  }

  const evs = {};
  let total = 0;
  for (const campo of CAMPOS_EV) {
    const valor = body[campo] === undefined ? 0 : Number(body[campo]);
    if (!Number.isInteger(valor) || valor < 0 || valor > 252) {
      return { erro: `${campo} deve ser um número inteiro entre 0 e 252` };
    }
    evs[campo] = valor;
    total += valor;
  }
  if (total > 510) {
    return { erro: `A soma dos EVs não pode passar de 510 (atual: ${total})` };
  }

  return {
    dados: {
      pokemon_id,
      apelido: body.apelido ? String(body.apelido).trim() : null,
      nivel,
      natureza: body.natureza || null,
      ...evs,
    },
  };
}

// Listar os pokémon de um time
router.get('/times/:id/pokemon', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM time_pokemon WHERE time_id = $1 ORDER BY id',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar pokémon do time' });
  }
});

// Adicionar pokémon ao time (máximo 6)
router.post('/times/:id/pokemon', async (req, res) => {
  const { erro, dados } = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const time = await pool.query('SELECT id FROM times WHERE id = $1', [req.params.id]);
    if (time.rows.length === 0) {
      return res.status(404).json({ erro: 'Time não encontrado' });
    }

    const contagem = await pool.query(
      'SELECT COUNT(*) FROM time_pokemon WHERE time_id = $1',
      [req.params.id]
    );
    if (Number(contagem.rows[0].count) >= 6) {
      return res.status(400).json({ erro: 'O time já tem 6 pokémon' });
    }

    const result = await pool.query(
      `INSERT INTO time_pokemon
        (time_id, pokemon_id, apelido, nivel, natureza,
         ev_hp, ev_atk, ev_def, ev_spa, ev_spd, ev_spe)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.params.id, dados.pokemon_id, dados.apelido, dados.nivel, dados.natureza,
        dados.ev_hp, dados.ev_atk, dados.ev_def, dados.ev_spa, dados.ev_spd, dados.ev_spe,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao adicionar pokémon' });
  }
});

// Editar pokémon (o front deve enviar todos os campos)
router.put('/time-pokemon/:id', async (req, res) => {
  const { erro, dados } = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const result = await pool.query(
      `UPDATE time_pokemon SET
        pokemon_id=$1, apelido=$2, nivel=$3, natureza=$4,
        ev_hp=$5, ev_atk=$6, ev_def=$7, ev_spa=$8, ev_spd=$9, ev_spe=$10
       WHERE id=$11
       RETURNING *`,
      [
        dados.pokemon_id, dados.apelido, dados.nivel, dados.natureza,
        dados.ev_hp, dados.ev_atk, dados.ev_def, dados.ev_spa, dados.ev_spd, dados.ev_spe,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Pokémon não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao editar pokémon' });
  }
});

// Remover pokémon do time
router.delete('/time-pokemon/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM time_pokemon WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Pokémon não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover pokémon' });
  }
});

module.exports = router;