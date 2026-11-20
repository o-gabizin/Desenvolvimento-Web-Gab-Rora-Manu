export const TOTAL_POKEMONS = 1025;

export const REGIOES = [
  { id: 'kanto', nome: 'Kanto', inicio: 1, fim: 151, cor: '#e74c3c' },
  { id: 'johto', nome: 'Johto', inicio: 152, fim: 251, cor: '#f39c12' },
  { id: 'hoenn', nome: 'Hoenn', inicio: 252, fim: 386, cor: '#27ae60' },
  { id: 'sinnoh', nome: 'Sinnoh', inicio: 387, fim: 493, cor: '#3498db' },
  { id: 'unova', nome: 'Unova', inicio: 494, fim: 649, cor: '#34495e' },
  { id: 'kalos', nome: 'Kalos', inicio: 650, fim: 721, cor: '#2980b9' },
  { id: 'alola', nome: 'Alola', inicio: 722, fim: 809, cor: '#e67e22' },
  { id: 'galar', nome: 'Galar', inicio: 810, fim: 898, cor: '#8e44ad' },
  { id: 'hisui', nome: 'Hisui', inicio: 899, fim: 905, cor: '#16a085' },
  { id: 'paldea', nome: 'Paldea', inicio: 906, fim: 1025, cor: '#c0392b' },
];

export function regiaoDoPokemon(id) {
  return REGIOES.find((r) => id >= r.inicio && id <= r.fim) || REGIOES[0];
}

export const TIPOS_POKEMON = [
  { chave: 'normal', nome: 'Normal', cor: '#A8A77A' },
  { chave: 'fire', nome: 'Fogo', cor: '#EE8130' },
  { chave: 'water', nome: 'Água', cor: '#6390F0' },
  { chave: 'electric', nome: 'Elétrico', cor: '#F7D02C' },
  { chave: 'grass', nome: 'Planta', cor: '#7AC74C' },
  { chave: 'ice', nome: 'Gelo', cor: '#96D9D6' },
  { chave: 'fighting', nome: 'Lutador', cor: '#C22E28' },
  { chave: 'poison', nome: 'Venenoso', cor: '#A33EA1' },
  { chave: 'ground', nome: 'Terrestre', cor: '#E2BF65' },
  { chave: 'flying', nome: 'Voador', cor: '#A98FF3' },
  { chave: 'psychic', nome: 'Psíquico', cor: '#F95587' },
  { chave: 'bug', nome: 'Inseto', cor: '#A6B91A' },
  { chave: 'rock', nome: 'Pedra', cor: '#B6A136' },
  { chave: 'ghost', nome: 'Fantasma', cor: '#735797' },
  { chave: 'dragon', nome: 'Dragão', cor: '#6F35FC' },
  { chave: 'dark', nome: 'Sombrio', cor: '#705746' },
  { chave: 'steel', nome: 'Aço', cor: '#B7B7CE' },
  { chave: 'fairy', nome: 'Fada', cor: '#D685AD' },
];

export const CAMPOS_EV = [
  { chave: 'ev_hp', label: 'HP' },
  { chave: 'ev_atk', label: 'Ataque' },
  { chave: 'ev_def', label: 'Defesa' },
  { chave: 'ev_spa', label: 'Atq. Esp.' },
  { chave: 'ev_spd', label: 'Def. Esp.' },
  { chave: 'ev_spe', label: 'Velocidade' },
];

export function imagemDoPokemon(id, shiny = false) {
  const pasta = shiny ? 'official-artwork/shiny' : 'official-artwork';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${pasta}/${id}.png`;
}

export const API = 'http://localhost:3001';