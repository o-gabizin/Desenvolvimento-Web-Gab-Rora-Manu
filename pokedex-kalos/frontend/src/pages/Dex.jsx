import { useEffect, useState } from 'react';
import {
  API,
  REGIOES,
  TIPOS,
  obterRegiaoPorId,
  obterImagemPokemon,
  carregarCatalogoCompleto,
  buscarDetalhesPokemon,
} from '../constants';

const NOMES_STATUS = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Atq. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidade',
};

function Dex() {
  const [pokemons, setPokemons] = useState([]);
  const [busca, setBusca] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('todas');
  const [tipo1Filtro, setTipo1Filtro] = useState('todos');
  const [tipo2Filtro, setTipo2Filtro] = useState('todos');
  const [regioesMinimizadas, setRegioesMinimizadas] = useState({});
  const [erro, setErro] = useState('');

  const [pokemonSelecionado, setPokemonSelecionado] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [modoShiny, setModoShiny] = useState(false);

  const [times, setTimes] = useState([]);
  const [timeEscolhidoId, setTimeEscolhidoId] = useState('');
  const [apelido, setApelido] = useState('');
  const [habilidadeEscolhida, setHabilidadeEscolhida] = useState('');
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    carregarCatalogoCompleto()
      .then((lista) => setPokemons(lista))
      .catch(() => setErro('Não foi possível carregar os Pokémon. Verifique sua internet.'));
  }, []);

  function alternarRegiao(regiaoId) {
    setRegioesMinimizadas((anterior) => ({
      ...anterior,
      [regiaoId]: !anterior[regiaoId],
    }));
  }

  async function abrirModalDetalhes(pokemon) {
    setPokemonSelecionado(pokemon);
    setDetalhes(null);
    setModoShiny(false);
    setApelido('');
    setAviso(null);

    try {
      const respostaTimes = await fetch(`${API}/times`);
      if (respostaTimes.ok) {
        const listaTimes = await respostaTimes.json();
        setTimes(listaTimes);
        if (listaTimes.length > 0 && !timeEscolhidoId) {
          setTimeEscolhidoId(String(listaTimes[0].id));
        }
      }
    } catch {
      // Back-end offline
    }

    try {
      const dados = await buscarDetalhesPokemon(pokemon.id);
      setDetalhes(dados);
      setHabilidadeEscolhida(dados.abilities[0]?.ability.name || '');
    } catch {
      setAviso({ tipo: 'msg-erro', texto: 'Erro ao carregar detalhes na PokéAPI.' });
    }
  }

  async function adicionarAoTime(e) {
    e.preventDefault();
    if (!timeEscolhidoId) {
      setAviso({ tipo: 'msg-erro', texto: 'Selecione um time primeiro.' });
      return;
    }

    try {
      const resposta = await fetch(`${API}/times/${timeEscolhidoId}/pokemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon_id: pokemonSelecionado.id,
          apelido: apelido.trim() || null,
          shiny: modoShiny,
          habilidade: habilidadeEscolhida || null,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao adicionar Pokémon');
      }

      setAviso({ tipo: 'msg-sucesso', texto: 'Pokémon adicionado ao time!' });
      setApelido('');
    } catch (err) {
      setAviso({ tipo: 'msg-erro', texto: err.message });
    }
  }

  function limparFiltros() {
    setBusca('');
    setRegiaoFiltro('todas');
    setTipo1Filtro('todos');
    setTipo2Filtro('todos');
  }

  const termo = busca.trim().toLowerCase();
  const pokemonsFiltrados = pokemons.filter((pokemon) => {
    const bateBusca =
      termo === '' ||
      pokemon.nome.includes(termo) ||
      String(pokemon.id).includes(termo);

    const bateRegiao = regiaoFiltro === 'todas' || pokemon.regiaoId === regiaoFiltro;
    const bateTipo1 = tipo1Filtro === 'todos' || pokemon.tipos.includes(tipo1Filtro);
    const bateTipo2 = tipo2Filtro === 'todos' || pokemon.tipos.includes(tipo2Filtro);

    return bateBusca && bateRegiao && bateTipo1 && bateTipo2;
  });

  const secoesPorRegiao = REGIOES.map((regiao) => ({
    ...regiao,
    pokemonsDaRegiao: pokemonsFiltrados.filter((p) => p.regiaoId === regiao.id),
  })).filter((secao) => secao.pokemonsDaRegiao.length > 0);

  const temFiltroAtivo =
    termo !== '' ||
    regiaoFiltro !== 'todas' ||
    tipo1Filtro !== 'todos' ||
    tipo2Filtro !== 'todos';

  if (erro) return <p className="container msg-erro">{erro}</p>;
  if (pokemons.length === 0) return <p className="container">Carregando Pokédex...</p>;

  return (
    <div className="container">
      <h1>Pokédex</h1>

      <div className="card linha" style={{ marginBottom: 20 }}>
        <input
          placeholder="Buscar nome ou nº..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select value={regiaoFiltro} onChange={(e) => setRegiaoFiltro(e.target.value)}>
          <option value="todas">Todas as Regiões</option>
          {REGIOES.map((regiao) => (
            <option key={regiao.id} value={regiao.id}>
              {regiao.nome}
            </option>
          ))}
        </select>

        <select value={tipo1Filtro} onChange={(e) => setTipo1Filtro(e.target.value)}>
          <option value="todos">Tipagem 1 (Todas)</option>
          {Object.entries(TIPOS).map(([chave, info]) => (
            <option key={chave} value={chave}>
              {info.nome}
            </option>
          ))}
        </select>

        <select value={tipo2Filtro} onChange={(e) => setTipo2Filtro(e.target.value)}>
          <option value="todos">Tipagem 2 (Todas)</option>
          {Object.entries(TIPOS).map(([chave, info]) => (
            <option key={chave} value={chave} disabled={chave === tipo1Filtro}>
              {info.nome}
            </option>
          ))}
        </select>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros}>
            Limpar
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 14 }}>
          {pokemonsFiltrados.length} Pokémon
        </span>
      </div>

      {secoesPorRegiao.length === 0 && (
        <p style={{ color: '#666' }}>Nenhum Pokémon encontrado com esses filtros.</p>
      )}

      {secoesPorRegiao.map((secao) => {
        const minimizada = Boolean(regioesMinimizadas[secao.id]);

        return (
          <section key={secao.id} style={{ marginBottom: minimizada ? 12 : 28 }}>
            <div
              className="card espaco-entre"
              onClick={() => alternarRegiao(secao.id)}
              style={{
                borderLeft: `6px solid ${secao.cor}`,
                marginBottom: minimizada ? 0 : 14,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <strong>
                {minimizada ? '▶' : '▼'} {secao.nome} (#{secao.inicio}–#{secao.fim})
              </strong>
              <span>{secao.pokemonsDaRegiao.length}</span>
            </div>

            {!minimizada && (
              <div className="grade-dex">
                {secao.pokemonsDaRegiao.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    className="card card-pokemon"
                    onClick={() => abrirModalDetalhes(pokemon)}
                  >
                    <img
                      src={obterImagemPokemon(pokemon.id)}
                      alt={pokemon.nome}
                      width="110"
                      height="110"
                      loading="lazy"
                    />
                    <p className="capitalizar" style={{ margin: '6px 0', fontWeight: 600 }}>
                      #{pokemon.id} {pokemon.nome}
                    </p>
                    <div className="linha" style={{ justifyContent: 'center', gap: 4 }}>
                      {pokemon.tipos.map((chaveTipo) => (
                        <span
                          key={chaveTipo}
                          className="etiqueta-tipo"
                          style={{ background: TIPOS[chaveTipo]?.cor || '#777' }}
                        >
                          {TIPOS[chaveTipo]?.nome || chaveTipo}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {pokemonSelecionado && (
        <div className="modal-fundo" onClick={() => setPokemonSelecionado(null)}>
          <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
            <div className="espaco-entre">
              <h2 className="capitalizar" style={{ margin: 0 }}>
                #{pokemonSelecionado.id} {pokemonSelecionado.nome} (
                {obterRegiaoPorId(pokemonSelecionado.id).nome})
              </h2>
              <button onClick={() => setPokemonSelecionado(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <img
                src={obterImagemPokemon(pokemonSelecionado.id, modoShiny)}
                onError={(e) => {
                  e.currentTarget.src = obterImagemPokemon(pokemonSelecionado.id, false);
                }}
                alt={pokemonSelecionado.nome}
                width="150"
                height="150"
              />
              <div>
                <button
                  type="button"
                  onClick={() => setModoShiny(!modoShiny)}
                  style={{ background: modoShiny ? '#f1c40f' : '#fff', fontWeight: 600 }}
                >
                  {modoShiny ? 'Ver Forma Normal' : 'Ver Forma Shiny'}
                </button>
              </div>
            </div>

            {!detalhes ? (
              <p>Carregando detalhes...</p>
            ) : (
              <>
                <div className="linha" style={{ justifyContent: 'center', marginBottom: 12 }}>
                  {detalhes.types.map((item) => {
                    const chave = item.type.name;
                    return (
                      <span
                        key={chave}
                        className="etiqueta-tipo"
                        style={{ background: TIPOS[chave]?.cor || '#777' }}
                      >
                        {TIPOS[chave]?.nome || chave}
                      </span>
                    );
                  })}
                </div>

                <p style={{ fontSize: 14 }}>
                  <strong>Altura:</strong> {detalhes.height / 10} m •{' '}
                  <strong>Peso:</strong> {detalhes.weight / 10} kg
                </p>

                <p className="capitalizar" style={{ fontSize: 14 }}>
                  <strong>Habilidades:</strong>{' '}
                  {detalhes.abilities
                    .map((item) => `${item.ability.name}${item.is_hidden ? ' (Oculta)' : ''}`)
                    .join(', ')}
                </p>

                <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  {detalhes.stats.map((item) => (
                    <div key={item.stat.name} className="linha" style={{ fontSize: 13 }}>
                      <span style={{ width: 75 }}>{NOMES_STATUS[item.stat.name]}</span>
                      <strong style={{ width: 30 }}>{item.base_stat}</strong>
                      <div className="barra-fundo">
                        <div
                          className="barra-preenchimento"
                          style={{ width: `${Math.min(100, item.base_stat / 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={adicionarAoTime}
                  style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'grid', gap: 8 }}
                >
                  <strong>Adicionar a um Time</strong>

                  {times.length === 0 ? (
                    <span style={{ fontSize: 13 }}>
                      Crie um time na aba Meus Times primeiro.
                    </span>
                  ) : (
                    <>
                      <div className="linha">
                        <select
                          value={timeEscolhidoId}
                          onChange={(e) => setTimeEscolhidoId(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          {times.map((time) => (
                            <option key={time.id} value={time.id}>
                              {time.nome}
                            </option>
                          ))}
                        </select>

                        <input
                          placeholder="Apelido (opcional)"
                          value={apelido}
                          onChange={(e) => setApelido(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>

                      <select
                        className="capitalizar"
                        value={habilidadeEscolhida}
                        onChange={(e) => setHabilidadeEscolhida(e.target.value)}
                      >
                        {detalhes.abilities.map((item) => (
                          <option key={item.ability.name} value={item.ability.name}>
                            {item.ability.name}
                            {item.is_hidden ? ' (Oculta)' : ''}
                          </option>
                        ))}
                      </select>

                      <label className="linha" style={{ fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={modoShiny}
                          onChange={(e) => setModoShiny(e.target.checked)}
                        />
                        Shiny
                      </label>

                      <button type="submit">Adicionar</button>
                    </>
                  )}

                  {aviso && (
                    <p className={aviso.tipo} style={{ margin: 0 }}>
                      {aviso.texto}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dex;