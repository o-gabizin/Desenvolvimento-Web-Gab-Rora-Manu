-- Schema do banco "pokedex" (PostgreSQL)
-- Uso: psql -d pokedex -f backend/schema.sql

CREATE TABLE IF NOT EXISTS times (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  treinador  VARCHAR(100),
  icone      VARCHAR(50) DEFAULT 'poke-ball'
);

CREATE TABLE IF NOT EXISTS time_pokemon (
  id          SERIAL PRIMARY KEY,
  time_id     INTEGER NOT NULL REFERENCES times(id) ON DELETE CASCADE,
  pokemon_id  INTEGER NOT NULL CHECK (pokemon_id BETWEEN 1 AND 1025),
  apelido     VARCHAR(100),
  shiny       BOOLEAN DEFAULT FALSE,
  habilidade  VARCHAR(100),
  nivel       INTEGER DEFAULT 50 CHECK (nivel BETWEEN 1 AND 100),
  natureza    VARCHAR(50),
  ev_hp       INTEGER DEFAULT 0,
  ev_atk      INTEGER DEFAULT 0,
  ev_def      INTEGER DEFAULT 0,
  ev_spa      INTEGER DEFAULT 0,
  ev_spd      INTEGER DEFAULT 0,
  ev_spe      INTEGER DEFAULT 0
);
