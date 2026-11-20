export const API = 'http://localhost:3001';
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

export const TIPOS = {
  normal: { nome: 'Normal', cor: '#A8A77A' },
  fire: { nome: 'Fogo', cor: '#EE8130' },
  water: { nome: 'Água', cor: '#6390F0' },
  electric: { nome: 'Elétrico', cor: '#F7D02C' },
  grass: { nome: 'Planta', cor: '#7AC74C' },
  ice: { nome: 'Gelo', cor: '#96D9D6' },
  fighting: { nome: 'Lutador', cor: '#C22E28' },
  poison: { nome: 'Venenoso', cor: '#A33EA1' },
  ground: { nome: 'Terrestre', cor: '#E2BF65' },
  flying: { nome: 'Voador', cor: '#A98FF3' },
  psychic: { nome: 'Psíquico', cor: '#F95587' },
  bug: { nome: 'Inseto', cor: '#A6B91A' },
  rock: { nome: 'Pedra', cor: '#B6A136' },
  ghost: { nome: 'Fantasma', cor: '#735797' },
  dragon: { nome: 'Dragão', cor: '#6F35FC' },
  dark: { nome: 'Sombrio', cor: '#705746' },
  steel: { nome: 'Aço', cor: '#B7B7CE' },
  fairy: { nome: 'Fada', cor: '#D685AD' },
};

export const CAMPOS_EV = [
  { chave: 'ev_hp', label: 'HP' },
  { chave: 'ev_atk', label: 'Ataque' },
  { chave: 'ev_def', label: 'Defesa' },
  { chave: 'ev_spa', label: 'Atq. Esp.' },
  { chave: 'ev_spd', label: 'Def. Esp.' },
  { chave: 'ev_spe', label: 'Velocidade' },
];

export function obterRegiaoPorId(id) {
  return REGIOES.find((regiao) => id >= regiao.inicio && id <= regiao.fim) || REGIOES[0];
}

export function obterImagemPokemon(id, shiny = false) {
  const pasta = shiny ? 'official-artwork/shiny' : 'official-artwork';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${pasta}/${id}.png`;
}

let catalogoEmCache = null;
const detalhesEmCache = {};

export async function carregarCatalogoCompleto() {
  if (catalogoEmCache) return catalogoEmCache;

  const chavesTipos = Object.keys(TIPOS);

  const [respostaLista, ...respostasTipos] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMONS}`),
    ...chavesTipos.map((tipo) => fetch(`https://pokeapi.co/api/v2/type/${tipo}`)),
  ]);

  if (!respostaLista.ok) {
    throw new Error('Falha ao carregar lista de Pokémon');
  }

  const dadosLista = await respostaLista.json();
  const mapaTiposPorId = {};

  for (let i = 0; i < chavesTipos.length; i++) {
    const respostaTipo = respostasTipos[i];
    if (!respostaTipo || !respostaTipo.ok) continue;

    const dadosTipo = await respostaTipo.json();
    const chaveTipo = chavesTipos[i];

    for (const item of dadosTipo.pokemon) {
      const partesUrl = item.pokemon.url.split('/').filter(Boolean);
      const id = Number(partesUrl[partesUrl.length - 1]);

      if (id >= 1 && id <= TOTAL_POKEMONS) {
        if (!mapaTiposPorId[id]) mapaTiposPorId[id] = [];
        mapaTiposPorId[id].push({ slot: item.slot, tipo: chaveTipo });
      }
    }
  }

  catalogoEmCache = dadosLista.results.map((pokemon, indice) => {
    const id = indice + 1;
    const tiposBrutos = mapaTiposPorId[id] || [];
    const tiposOrdenados = tiposBrutos
      .sort((a, b) => a.slot - b.slot)
      .map((item) => item.tipo);

    return {
      id,
      nome: pokemon.name,
      regiaoId: obterRegiaoPorId(id).id,
      tipos: tiposOrdenados,
    };
  });

  return catalogoEmCache;
}

export async function buscarDetalhesPokemon(id) {
  if (detalhesEmCache[id]) return detalhesEmCache[id];

  const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!resposta.ok) {
    throw new Error('Erro ao carregar detalhes do Pokémon');
  }

  detalhesEmCache[id] = await resposta.json();
  return detalhesEmCache[id];
}

export const ICONES_TIME = [
  { id: 'poke-ball', nome: 'Poké Ball' },
  { id: 'great-ball', nome: 'Great Ball' },
  { id: 'ultra-ball', nome: 'Ultra Ball' },
  { id: 'master-ball', nome: 'Master Ball' },
  { id: 'premier-ball', nome: 'Premier Ball' },
  { id: 'luxury-ball', nome: 'Luxury Ball' },
  { id: 'cherish-ball', nome: 'Cherish Ball' },
  { id: 'dusk-ball', nome: 'Dusk Ball' },
  { id: 'quick-ball', nome: 'Quick Ball' },
  { id: 'key-stone', nome: 'Key Stone' },
  { id: 'rare-candy', nome: 'Rare Candy' },
  { id: 'leftovers', nome: 'Leftovers' },
];

export function obterImagemIconeTime(iconeId = 'poke-ball') {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${iconeId || 'poke-ball'}.png`;
}