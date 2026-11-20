require('dotenv').config();
const express = require('express');
const cors = require('cors');
const timesRoutes = require('./routes/times');
const timePokemonRoutes = require('./routes/timePokemon');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API Pokedex Kalos funcionando' });
});

app.use('/times', timesRoutes);
app.use('/', timePokemonRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});