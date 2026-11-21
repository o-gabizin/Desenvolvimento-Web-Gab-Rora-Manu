# Pokedex

Aplicação web para explorar a Pokédex (via PokéAPI) e montar **times de Pokémon**
(cadastro, listagem, edição e exclusão), com API REST própria.

## Equipe
- Gabriel Martins
- Aurora Zênite
- Manuella Bottega

## Tecnologias
- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express 5, PostgreSQL (`pg`)
- **API externa:** [PokéAPI](https://pokeapi.co) (catálogo, imagens e detalhes)

## Como rodar

### 1. Banco de dados
```bash
createdb pokedex
psql -d pokedex -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env     # preencher com os dados do seu PostgreSQL
npm install
npm start                # http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Descrição da API

Base URL: `http://localhost:3001` — requisições e respostas em JSON.

### Times

| Método | Rota | Descrição | Sucesso | Erros |
|--------|------|-----------|---------|-------|
| GET | `/times` | Lista todos os times (mais recentes primeiro) | 200 | 500 |
| POST | `/times` | Cria um time | 201 | 400 (nome obrigatório), 500 |
| PUT | `/times/:id` | Atualiza um time | 200 | 400, 404, 500 |
| DELETE | `/times/:id` | Exclui o time e seus Pokémon | 200 | 404, 500 |

**POST /times**
```json
// requisição
{ "nome": "Time Kalos", "treinador": "Gab", "icone": "poke-ball" }
// resposta 201
{ "id": 1, "nome": "Time Kalos", "treinador": "Gab", "icone": "poke-ball" }
```

### Pokémon do time

| Método | Rota | Descrição | Sucesso | Erros |
|--------|------|-----------|---------|-------|
| GET | `/times/:id/pokemon` | Lista os Pokémon de um time | 200 | 500 |
| POST | `/times/:id/pokemon` | Adiciona um Pokémon ao time | 201 | 400, 404, 500 |
| PUT | `/time-pokemon/:id` | Edita um Pokémon do time | 200 | 400, 404, 500 |
| DELETE | `/time-pokemon/:id` | Remove um Pokémon do time | 204 | 404, 500 |

**POST /times/:id/pokemon**
```json
{
  "pokemon_id": 658, "apelido": "Greninja", "shiny": false,
  "habilidade": "torrent", "nivel": 50, "natureza": "jolly",
  "ev_hp": 0, "ev_atk": 0, "ev_def": 0,
  "ev_spa": 252, "ev_spd": 4, "ev_spe": 252
}
```

**Regras de validação**
- `pokemon_id`: inteiro de 1 a 1025
- `nivel`: inteiro de 1 a 100 (padrão 50)
- cada EV: inteiro de 0 a 252; soma dos EVs ≤ 510
- máximo de 6 Pokémon por time

**Formato de erro:** `{ "erro": "mensagem" }`

## Banco de dados
Banco `pokedex`, com as tabelas `times` e `time_pokemon` (1:N, exclusão em cascata).
Ver `backend/schema.sql`.
