import { useEffect, useState } from 'react';
import {
  TOTAL_POKEMONS,
  REGIOES,
  TIPOS_POKEMON,
  regiaoDoPokemon,
  imagemDoPokemon,
  API,
} from '../constants';

const MAPA_TIPOS = Object.fromEntries(TIPOS_POKEMON.map((t) => [t.chave, t]));

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
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Estados do modal de detalhes
  const [pokemonSelecionado, setPokemonSelecionado] = useState(null);
  const [cacheDetalhes, setCacheDetalhes] = useState({});
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [previewShiny, setPreviewShiny] = useState(false);

  // Estados para adicionar o Pokémon a um time direto dos detalhes
  const [times, setTimes] = useState([]);
  const [timeEscolhido, setTimeEscolhido] = useState('');
  const [apelido, setApelido] = useState('');
  const [habilidadeEscolhida, setHabilidadeEscolhida] = useState('');
  const [mensagemTime, setMensagemTime] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    async function carregar() {
      try {
        const [respostaLista, ...respostasTipos] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMONS}&offset=0`),
          ...TIPOS_POKEMON.map((t) => fetch(`https://pokeapi.co/api/v2/type/${t.chave}`)),
        ]);

        if (!respostaLista.ok) {
          throw new Error('Falha na PokéAPI');
        }

        const dadosLista = await respostaLista.json();
        const tiposPorId = {};

        for (let i = 0; i < TIPOS_POKEMON.length; i++) {
          const respTipo = respostasTipos[i];
          if (!respTipo || !respTipo.ok) continue;

          const dadosTipo = await respTipo.json();
          const chaveTipo = TIPOS_POKEMON[i].chave;

          for (const entrada of dadosTipo.pokemon) {
            const partes = entrada.pokemon.url.split('/').filter(Boolean);
            const id = Number(partes[partes.length - 1]);
            if (id >= 1 && id <= TOTAL_POKEMONS) {
              if (!tiposPorId[id]) tiposPorId[id] = [];
              tiposPorId[id].push({ slot: entrada.slot, chave: chaveTipo });
            }
          }
        }

        const listaCompleta = dadosLista.results.map((p, i) => {
          const partes = p.url.split('/').filter(Boolean);
          const id = Number(partes[partes.length - 1]) || i + 1;
          const regiao = regiaoDoPokemon(id);
          const tiposOrdenados = (tiposPorId[id] || [])
            .sort((a, b) => a.slot - b.slot)
            .map((t) => t.chave);

          return {
            id,
            nome: p.name,
            regiaoId: regiao.id,
            tipos: tiposOrdenados,
          };
        });

        setPokemons(listaCompleta);
      } catch {
        setErro('Não foi possível carregar os Pokémon. Verifique sua internet.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function abrirDetalhes(pokemon) {
    setPokemonSelecionado(pokemon);
    setPreviewShiny(false);
    setApelido('');
    setMensagemTime({ tipo: '', texto: '' });

    try {
      const respTimes = await fetch(`${API}/times`);
      if (respTimes.ok) {
        const listaTimes = await respTimes.json();
        setTimes(listaTimes);
        if (listaTimes.length > 0 && !timeEscolhido) {
          setTimeEscolhido(String(listaTimes[0].id));
        }
      }
    } catch {
      // Back-end offline não impede ver detalhes da PokéAPI
    }

    if (cacheDetalhes[pokemon.id]) {
      const primeiraHab = cacheDetalhes[pokemon.id].abilities?.[0]?.ability?.name || '';
      setHabilidadeEscolhida(primeiraHab);
      return;
    }

    setHabilidadeEscolhida('');
    setCarregandoDetalhes(true);
    try {
      const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
      if (!resp.ok) throw new Error();
      const dados = await resp.json();
      setCacheDetalhes((prev) => ({ ...prev, [pokemon.id]: dados }));
      setHabilidadeEscolhida(dados.abilities?.[0]?.ability?.name || '');
    } catch {
      setMensagemTime({ tipo: 'erro', texto: 'Erro ao carregar detalhes na PokéAPI.' });
    } finally {
      setCarregandoDetalhes(false);
    }
  }

  async function adicionarAoTime(e) {
    e.preventDefault();
    if (!timeEscolhido) {
      setMensagemTime({ tipo: 'erro', texto: 'Crie ou selecione um time primeiro.' });
      return;
    }

    try {
      const resp = await fetch(`${API}/times/${timeEscolhido}/pokemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon_id: pokemonSelecionado.id,
          apelido: apelido.trim() || null,
          shiny: previewShiny,
          habilidade: habilidadeEscolhida || null,
        }),
      });
      const dados = await resp.json();
      if (!resp.ok) {
        throw new Error(dados.erro || 'Erro ao adicionar ao time');
      }
      setMensagemTime({ tipo: 'sucesso', texto: 'Pokémon adicionado ao time!' });
      setApelido('');
    } catch (err) {
      setMensagemTime({ tipo: 'erro', texto: err.message });
    }
  }

  function limparFiltros() {
    setBusca('');
    setRegiaoFiltro('todas');
    setTipoFiltro('todos');
  }

  const filtrados = pokemons.filter((p) => {
    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === '' ||
      p.nome.toLowerCase().includes(termo) ||
      String(p.id).includes(termo);
    const bateRegiao = regiaoFiltro === 'todas' || p.regiaoId === regiaoFiltro;
    const bateTipo = tipoFiltro === 'todos' || p.tipos.includes(tipoFiltro);

    return bateBusca && bateRegiao && bateTipo;
  });

  const secoesPorRegiao = REGIOES.map((regiao) => ({
    ...regiao,
    lista: filtrados.filter((p) => p.regiaoId === regiao.id),
  })).filter((secao) => secao.lista.length > 0);

  const temFiltroAtivo =
    busca.trim() !== '' || regiaoFiltro !== 'todas' || tipoFiltro !== 'todos';

  const detalhesAtuais = pokemonSelecionado ? cacheDetalhes[pokemonSelecionado.id] : null;

  if (carregando) return <p style={{ padding: 20 }}>Carregando Pokédex Nacional...</p>;
  if (erro) return <p style={{ padding: 20 }}>{erro}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokédex Nacional</h1>

      {/* Barra de Filtros */}
      <div
        style={{
          background: 'white',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nome ou número..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ padding: 8, width: 230 }}
        />

        <select
          value={regiaoFiltro}
          onChange={(e) => setRegiaoFiltro(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="todas">Todas as Regiões</option>
          {REGIOES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome} (#{r.inicio}–#{r.fim})
            </option>
          ))}
        </select>

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="todos">Todas as Tipagens</option>
          {TIPOS_POKEMON.map((t) => (
            <option key={t.chave} value={t.chave}>
              {t.nome}
            </option>
          ))}
        </select>

        {temFiltroAtivo && (
          <button
            type="button"
            onClick={limparFiltros}
            style={{ padding: '8px 12px', cursor: 'pointer' }}
          >
            Limpar Filtros
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 14, color: '#555' }}>
          Exibindo <strong>{filtrados.length}</strong> Pokémon
        </span>
      </div>

      {secoesPorRegiao.length === 0 && (
        <p style={{ color: '#666' }}>Nenhum Pokémon encontrado com os filtros selecionados.</p>
      )}

      {/* Listagem separada por Região */}
      <div style={{ display: 'grid', gap: 32 }}>
        {secoesPorRegiao.map((secao) => (
          <section key={secao.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                background: 'white',
                padding: '12px 16px',
                borderRadius: 12,
                borderLeft: `6px solid ${secao.cor}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{secao.nome}</h2>
                <span style={{ fontSize: 13, color: '#666' }}>
                  #{String(secao.inicio).padStart(3, '0')} – #{String(secao.fim).padStart(3, '0')}
                </span>
              </div>
              <span
                style={{
                  background: '#f1f3f5',
                  color: '#333',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {secao.lista.length} Pokémon
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
                gap: 16,
              }}
            >
              {secao.lista.map((p) => (
                <div
                  key={p.id}
                  onClick={() => abrirDetalhes(p)}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <img
                    src={imagemDoPokemon(p.id)}
                    alt={p.nome}
                    width="115"
                    height="115"
                    loading="lazy"
                  />
                  <p style={{ margin: '6px 0', textTransform: 'capitalize', fontWeight: 600 }}>
                    #{p.id} {p.nome}
                  </p>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {p.tipos.map((chaveTipo) => {
                      const infoTipo = MAPA_TIPOS[chaveTipo];
                      return (
                        <span
                          key={chaveTipo}
                          style={{
                            background: infoTipo?.cor || '#777',
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {infoTipo?.nome || chaveTipo}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {pokemonSelecionado && (
        <div
          onClick={() => setPokemonSelecionado(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, textTransform: 'capitalize' }}>
                  #{pokemonSelecionado.id} {pokemonSelecionado.nome}
                </h2>
                <span style={{ fontSize: 13, color: '#666' }}>
                  Região: {regiaoDoPokemon(pokemonSelecionado.id).nome}
                </span>
              </div>
              <button
                onClick={() => setPokemonSelecionado(null)}
                style={{
                  border: 'none',
                  background: '#eee',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <img
                src={imagemDoPokemon(pokemonSelecionado.id, previewShiny)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = imagemDoPokemon(pokemonSelecionado.id, false);
                }}
                alt={pokemonSelecionado.nome}
                width="160"
                height="160"
              />
              <div>
                <button
                  type="button"
                  onClick={() => setPreviewShiny((prev) => !prev)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    background: previewShiny ? '#f1c40f' : '#f8f9fa',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {previewShiny ? '✨ Forma Shiny (Ativa)' : 'Ver Forma Shiny'}
                </button>
              </div>
            </div>

            {carregandoDetalhes && <p>Carregando informações...</p>}

            {detalhesAtuais && (
              <>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                  {detalhesAtuais.types.map((t) => {
                    const infoTipo = MAPA_TIPOS[t.type.name];
                    return (
                      <span
                        key={t.type.name}
                        style={{
                          background: infoTipo?.cor || '#777',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {infoTipo?.nome || t.type.name}
                      </span>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: '#f8f9fa',
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 14,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <strong>Altura:</strong> {(detalhesAtuais.height / 10).toFixed(1)} m
                  </div>
                  <div>
                    <strong>Peso:</strong> {(detalhesAtuais.weight / 10).toFixed(1)} kg
                  </div>
                </div>

                <div style={{ marginBottom: 14, fontSize: 14 }}>
                  <strong>Habilidades: </strong>
                  <span style={{ textTransform: 'capitalize' }}>
                    {detalhesAtuais.abilities
                      .map((a) => `${a.ability.name}${a.is_hidden ? ' (Oculta)' : ''}`)
                      .join(', ')}
                  </span>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <strong>Status Base:</strong>
                  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    {detalhesAtuais.stats.map((s) => (
                      <div
                        key={s.stat.name}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                      >
                        <span style={{ width: 78 }}>{NOMES_STATUS[s.stat.name] || s.stat.name}</span>
                        <span style={{ width: 32, fontWeight: 600 }}>{s.base_stat}</span>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: '#eee',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, (s.base_stat / 200) * 100)}%`,
                              height: '100%',
                              background: s.base_stat >= 100 ? '#27ae60' : '#3498db',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Formulário rápido para adicionar ao time */}
            <form
              onSubmit={adicionarAoTime}
              style={{
                borderTop: '1px solid #eee',
                paddingTop: 14,
                display: 'grid',
                gap: 8,
              }}
            >
              <strong>Adicionar a um Time</strong>
              {times.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                  Nenhum time encontrado. Crie um na aba Times.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      value={timeEscolhido}
                      onChange={(e) => setTimeEscolhido(e.target.value)}
                      style={{ padding: 8, flex: 1 }}
                    >
                      {times.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Apelido (opcional)"
                      value={apelido}
                      maxLength={50}
                      onChange={(e) => setApelido(e.target.value)}
                      style={{ padding: 8, flex: 1 }}
                    />
                  </div>

                  {detalhesAtuais?.abilities?.length > 0 && (
                    <select
                      value={habilidadeEscolhida}
                      onChange={(e) => setHabilidadeEscolhida(e.target.value)}
                      style={{ padding: 8, textTransform: 'capitalize' }}
                    >
                      {detalhesAtuais.abilities.map((a) => (
                        <option key={a.ability.name} value={a.ability.name}>
                          Habilidade: {a.ability.name}
                          {a.is_hidden ? ' (Oculta)' : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={previewShiny}
                      onChange={(e) => setPreviewShiny(e.target.checked)}
                    />
                    Adicionar como Shiny ✨
                  </label>
                  <button type="submit" style={{ padding: '8px 14px', cursor: 'pointer' }}>
                    Adicionar ao Time
                  </button>
                </>
              )}

              {mensagemTime.texto && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: mensagemTime.tipo === 'erro' ? '#c0392b' : '#27ae60',
                  }}
                >
                  {mensagemTime.texto}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dex;