import { useEffect, useState } from 'react';
import {
  API,
  TOTAL_POKEMONS,
  REGIOES,
  CAMPOS_EV,
  regiaoDoPokemon,
  imagemDoPokemon,
} from '../constants';

function Times() {
  const [times, setTimes] = useState([]);
  const [nome, setNome] = useState('');
  const [treinador, setTreinador] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  // Catálogo completo (1 a 1025) e cache de habilidades por espécie
  const [catalogo, setCatalogo] = useState([]);
  const [habilidadesCache, setHabilidadesCache] = useState({});

  // Time atualmente aberto para gerenciar Pokémon
  const [timeAtivoId, setTimeAtivoId] = useState(null);
  const [pokemonsDoTime, setPokemonsDoTime] = useState([]);
  const [erroPokemon, setErroPokemon] = useState('');

  // Formulário de adicionar Pokémon ao time
  const [regiaoSelect, setRegiaoSelect] = useState('todas');
  const [novoPokemonId, setNovoPokemonId] = useState(1);
  const [novoApelido, setNovoApelido] = useState('');
  const [novaHabilidade, setNovaHabilidade] = useState('');
  const [novoShiny, setNovoShiny] = useState(false);

  // Formulário de edição de um Pokémon do time (apelido, shiny, habilidade, EVs)
  const [editandoPokemonId, setEditandoPokemonId] = useState(null);
  const [formPokemon, setFormPokemon] = useState({
    apelido: '',
    shiny: false,
    habilidade: '',
    nivel: 50,
    ev_hp: 0,
    ev_atk: 0,
    ev_def: 0,
    ev_spa: 0,
    ev_spd: 0,
    ev_spe: 0,
  });

  async function garantirHabilidades(pokemonId) {
    if (habilidadesCache[pokemonId]) {
      return habilidadesCache[pokemonId];
    }
    try {
      const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!resp.ok) return [];
      const dados = await resp.json();
      const lista = dados.abilities.map((a) => ({
        nome: a.ability.name,
        oculta: a.is_hidden,
      }));
      setHabilidadesCache((prev) => ({ ...prev, [pokemonId]: lista }));
      return lista;
    } catch {
      return [];
    }
  }

  async function carregarTimes() {
    try {
      const resposta = await fetch(`${API}/times`);
      if (!resposta.ok) throw new Error();
      setTimes(await resposta.json());
      setErro('');
    } catch {
      setErro('Não foi possível falar com a API. O back-end está rodando?');
    }
  }

  async function carregarCatalogo() {
    try {
      const resposta = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMONS}&offset=0`
      );
      if (!resposta.ok) return;

      const dados = await resposta.json();
      const lista = dados.results.map((p, i) => {
        const partes = p.url.split('/').filter(Boolean);
        const id = Number(partes[partes.length - 1]) || i + 1;
        return {
          id,
          nome: p.name,
          regiaoId: regiaoDoPokemon(id).id,
        };
      });
      setCatalogo(lista);
    } catch {
      // Se falhar, ainda exibe os IDs normalmente
    }
  }

  async function carregarPokemonsDoTime(timeId) {
    try {
      const resposta = await fetch(`${API}/times/${timeId}/pokemon`);
      if (!resposta.ok) throw new Error();
      setPokemonsDoTime(await resposta.json());
      setErroPokemon('');
    } catch {
      setErroPokemon('Erro ao carregar os Pokémon deste time.');
    }
  }

  useEffect(() => {
    carregarTimes();
    carregarCatalogo();
  }, []);

  useEffect(() => {
    if (!timeAtivoId) return;
    let ativo = true;
    garantirHabilidades(novoPokemonId).then((lista) => {
      if (ativo) {
        setNovaHabilidade(lista[0]?.nome || '');
      }
    });
    return () => {
      ativo = false;
    };
  }, [novoPokemonId, timeAtivoId]);

  function aoMudarRegiaoSelect(novaRegiao) {
    setRegiaoSelect(novaRegiao);
    if (novaRegiao === 'todas') {
      setNovoPokemonId(1);
    } else {
      const encontrada = REGIOES.find((r) => r.id === novaRegiao);
      if (encontrada) setNovoPokemonId(encontrada.inicio);
    }
  }

  function limparFormularioTime() {
    setNome('');
    setTreinador('');
    setEditandoId(null);
  }

  async function salvarTime(e) {
    e.preventDefault();
    if (nome.trim() === '') {
      setErro('O nome do time é obrigatório');
      return;
    }

    const url = editandoId ? `${API}/times/${editandoId}` : `${API}/times`;
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, treinador }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json();
        throw new Error(dados.erro || 'Erro ao salvar');
      }
      limparFormularioTime();
      carregarTimes();
    } catch (err) {
      setErro(err.message);
    }
  }

  function comecarEdicaoTime(time) {
    setEditandoId(time.id);
    setNome(time.nome);
    setTreinador(time.treinador || '');
  }

  async function excluirTime(id) {
    if (!window.confirm('Excluir este time e todos os Pokémon dele?')) return;
    try {
      const resposta = await fetch(`${API}/times/${id}`, { method: 'DELETE' });
      if (!resposta.ok) throw new Error();
      if (timeAtivoId === id) {
        setTimeAtivoId(null);
        setPokemonsDoTime([]);
      }
      carregarTimes();
    } catch {
      setErro('Erro ao excluir o time');
    }
  }

  function alternarTimeAtivo(id) {
    if (timeAtivoId === id) {
      setTimeAtivoId(null);
      setPokemonsDoTime([]);
      setEditandoPokemonId(null);
      return;
    }
    setTimeAtivoId(id);
    setEditandoPokemonId(null);
    setErroPokemon('');
    carregarPokemonsDoTime(id);
  }

  async function adicionarPokemon(e) {
    e.preventDefault();
    setErroPokemon('');
    try {
      const resposta = await fetch(`${API}/times/${timeAtivoId}/pokemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon_id: Number(novoPokemonId),
          apelido: novoApelido.trim() || null,
          shiny: novoShiny,
          habilidade: novaHabilidade || null,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao adicionar Pokémon');
      }
      setNovoApelido('');
      setNovoShiny(false);
      carregarPokemonsDoTime(timeAtivoId);
    } catch (err) {
      setErroPokemon(err.message);
    }
  }

  async function comecarEdicaoPokemon(tp) {
    setEditandoPokemonId(tp.id);
    setErroPokemon('');
    setFormPokemon({
      apelido: tp.apelido || '',
      shiny: Boolean(tp.shiny),
      habilidade: tp.habilidade || '',
      nivel: tp.nivel ?? 50,
      ev_hp: tp.ev_hp ?? 0,
      ev_atk: tp.ev_atk ?? 0,
      ev_def: tp.ev_def ?? 0,
      ev_spa: tp.ev_spa ?? 0,
      ev_spd: tp.ev_spd ?? 0,
      ev_spe: tp.ev_spe ?? 0,
    });
    await garantirHabilidades(tp.pokemon_id);
  }

  function atualizarEv(campo, valorBruto) {
    const numero = valorBruto === '' ? 0 : Number(valorBruto);
    setFormPokemon((prev) => ({
      ...prev,
      [campo]: Number.isNaN(numero) ? 0 : numero,
    }));
  }

  const totalEvs = CAMPOS_EV.reduce((soma, c) => soma + Number(formPokemon[c.chave] || 0), 0);

  async function salvarEdicaoPokemon(e, tp) {
    e.preventDefault();
    setErroPokemon('');

    if (totalEvs > 510) {
      setErroPokemon(`A soma dos EVs não pode passar de 510 (atual: ${totalEvs})`);
      return;
    }

    try {
      const resposta = await fetch(`${API}/time-pokemon/${tp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon_id: tp.pokemon_id,
          apelido: formPokemon.apelido.trim() || null,
          shiny: formPokemon.shiny,
          habilidade: formPokemon.habilidade || null,
          nivel: Number(formPokemon.nivel),
          natureza: tp.natureza || null,
          ev_hp: Number(formPokemon.ev_hp),
          ev_atk: Number(formPokemon.ev_atk),
          ev_def: Number(formPokemon.ev_def),
          ev_spa: Number(formPokemon.ev_spa),
          ev_spd: Number(formPokemon.ev_spd),
          ev_spe: Number(formPokemon.ev_spe),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao editar Pokémon');
      }
      setEditandoPokemonId(null);
      carregarPokemonsDoTime(timeAtivoId);
    } catch (err) {
      setErroPokemon(err.message);
    }
  }

  async function removerPokemon(pokemonRowId) {
    if (!window.confirm('Remover este Pokémon do time?')) return;
    try {
      const resposta = await fetch(`${API}/time-pokemon/${pokemonRowId}`, {
        method: 'DELETE',
      });
      if (!resposta.ok) throw new Error();
      if (editandoPokemonId === pokemonRowId) {
        setEditandoPokemonId(null);
      }
      carregarPokemonsDoTime(timeAtivoId);
    } catch {
      setErroPokemon('Erro ao remover Pokémon');
    }
  }

  function nomeDaEspecie(pokemonId) {
    const encontrado = catalogo.find((c) => c.id === pokemonId);
    return encontrado ? encontrado.nome : `Pokémon #${pokemonId}`;
  }

  const catalogoFiltrado =
    regiaoSelect === 'todas'
      ? catalogo
      : catalogo.filter((p) => p.regiaoId === regiaoSelect);

  const habilidadesNovoPokemon = habilidadesCache[novoPokemonId] || [];

  return (
    <div style={{ padding: 20 }}>
      <h1>Meus Times</h1>

      <form
        onSubmit={salvarTime}
        style={{
          background: 'white',
          padding: 16,
          borderRadius: 12,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Nome do time"
          value={nome}
          maxLength={50}
          onChange={(e) => setNome(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Treinador"
          value={treinador}
          maxLength={50}
          onChange={(e) => setTreinador(e.target.value)}
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>
          {editandoId ? 'Salvar alterações' : 'Criar time'}
        </button>
        {editandoId && (
          <button type="button" onClick={limparFormularioTime} style={{ padding: '8px 16px' }}>
            Cancelar
          </button>
        )}
      </form>

      {erro && <p style={{ color: '#c0392b' }}>{erro}</p>}

      {times.length === 0 && !erro && <p>Nenhum time criado ainda.</p>}

      <div style={{ display: 'grid', gap: 16 }}>
        {times.map((t) => {
          const aberto = timeAtivoId === t.id;

          return (
            <div
              key={t.id}
              style={{
                background: 'white',
                padding: 16,
                borderRadius: 12,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <strong>{t.nome}</strong>
                  <div style={{ color: '#666' }}>Treinador: {t.treinador || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => alternarTimeAtivo(t.id)}>
                    {aberto ? 'Fechar Time' : 'Gerenciar Pokémon'}
                  </button>
                  <button onClick={() => comecarEdicaoTime(t)}>Editar</button>
                  <button onClick={() => excluirTime(t.id)}>Excluir</button>
                </div>
              </div>

              {aberto && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid #eee',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    Pokémon do Time ({pokemonsDoTime.length}/6)
                  </h3>

                  {erroPokemon && <p style={{ color: '#c0392b' }}>{erroPokemon}</p>}

                  {/* Formulário para adicionar Pokémon */}
                  {pokemonsDoTime.length < 6 && (
                    <form
                      onSubmit={adicionarPokemon}
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        background: '#f8f9fa',
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 16,
                      }}
                    >
                      <select
                        value={regiaoSelect}
                        onChange={(e) => aoMudarRegiaoSelect(e.target.value)}
                        style={{ padding: 8 }}
                      >
                        <option value="todas">Todas as Regiões</option>
                        {REGIOES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nome}
                          </option>
                        ))}
                      </select>

                      <select
                        value={novoPokemonId}
                        onChange={(e) => setNovoPokemonId(Number(e.target.value))}
                        style={{ padding: 8, textTransform: 'capitalize' }}
                      >
                        {catalogoFiltrado.length > 0 ? (
                          catalogoFiltrado.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.id} {p.nome}
                            </option>
                          ))
                        ) : (
                          <option value={1}>#1 Bulbasaur</option>
                        )}
                      </select>

                      <input
                        type="text"
                        placeholder="Apelido (opcional)"
                        value={novoApelido}
                        maxLength={50}
                        onChange={(e) => setNovoApelido(e.target.value)}
                        style={{ padding: 8 }}
                      />

                      <select
                        value={novaHabilidade}
                        onChange={(e) => setNovaHabilidade(e.target.value)}
                        style={{ padding: 8, textTransform: 'capitalize' }}
                      >
                        {habilidadesNovoPokemon.length === 0 ? (
                          <option value="">Carregando habilidades...</option>
                        ) : (
                          habilidadesNovoPokemon.map((h) => (
                            <option key={h.nome} value={h.nome}>
                              {h.nome}
                              {h.oculta ? ' (Oculta)' : ''}
                            </option>
                          ))
                        )}
                      </select>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={novoShiny}
                          onChange={(e) => setNovoShiny(e.target.checked)}
                        />
                        Shiny ✨
                      </label>

                      <button type="submit" style={{ padding: '8px 14px' }}>
                        Adicionar Pokémon
                      </button>
                    </form>
                  )}

                  {pokemonsDoTime.length === 0 && (
                    <p style={{ color: '#666' }}>Este time ainda não possui Pokémon.</p>
                  )}

                  {/* Lista de Pokémon do Time */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {pokemonsDoTime.map((tp) => {
                      const emEdicao = editandoPokemonId === tp.id;
                      const especie = nomeDaEspecie(tp.pokemon_id);
                      const habilidadesDisponiveis = habilidadesCache[tp.pokemon_id] || [];
                      const somaEvAtual = CAMPOS_EV.reduce(
                        (acc, c) => acc + Number(tp[c.chave] || 0),
                        0
                      );

                      return (
                        <div
                          key={tp.id}
                          style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 10,
                            padding: 12,
                            background: '#fafafa',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={imagemDoPokemon(
                                tp.pokemon_id,
                                emEdicao ? formPokemon.shiny : tp.shiny
                              )}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = imagemDoPokemon(tp.pokemon_id, false);
                              }}
                              alt={especie}
                              width="72"
                              height="72"
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                {tp.apelido ? tp.apelido : especie}{' '}
                                {tp.shiny && <span title="Shiny">✨</span>}
                              </div>
                              <div style={{ fontSize: 13, color: '#666', textTransform: 'capitalize' }}>
                                #{tp.pokemon_id} {especie} ({regiaoDoPokemon(tp.pokemon_id).nome}) • Nível {tp.nivel}
                              </div>
                              {tp.habilidade && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: '#444',
                                    textTransform: 'capitalize',
                                    marginTop: 2,
                                  }}
                                >
                                  Habilidade: {tp.habilidade}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                                EVs: {tp.ev_hp}/{tp.ev_atk}/{tp.ev_def}/{tp.ev_spa}/{tp.ev_spd}/
                                {tp.ev_spe} ({somaEvAtual}/510)
                              </div>
                            </div>
                          </div>

                          {!emEdicao ? (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button onClick={() => comecarEdicaoPokemon(tp)}>
                                Editar
                              </button>
                              <button onClick={() => removerPokemon(tp.id)}>Remover</button>
                            </div>
                          ) : (
                            <form
                              onSubmit={(e) => salvarEdicaoPokemon(e, tp)}
                              style={{
                                marginTop: 12,
                                paddingTop: 10,
                                borderTop: '1px solid #ddd',
                                display: 'grid',
                                gap: 8,
                              }}
                            >
                              <label style={{ fontSize: 13 }}>
                                Nome / Apelido:
                                <input
                                  type="text"
                                  placeholder={especie}
                                  value={formPokemon.apelido}
                                  maxLength={50}
                                  onChange={(e) =>
                                    setFormPokemon({ ...formPokemon, apelido: e.target.value })
                                  }
                                  style={{
                                    width: '100%',
                                    padding: 6,
                                    marginTop: 2,
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </label>

                              <label style={{ fontSize: 13 }}>
                                Habilidade:
                                <select
                                  value={formPokemon.habilidade}
                                  onChange={(e) =>
                                    setFormPokemon({ ...formPokemon, habilidade: e.target.value })
                                  }
                                  style={{
                                    width: '100%',
                                    padding: 6,
                                    marginTop: 2,
                                    boxSizing: 'border-box',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  <option value="">Padrão / Não definida</option>
                                  {habilidadesDisponiveis.map((h) => (
                                    <option key={h.nome} value={h.nome}>
                                      {h.nome}
                                      {h.oculta ? ' (Oculta)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 13,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formPokemon.shiny}
                                    onChange={(e) =>
                                      setFormPokemon({ ...formPokemon, shiny: e.target.checked })
                                    }
                                  />
                                  Shiny ✨
                                </label>

                                <label style={{ fontSize: 13 }}>
                                  Nível:{' '}
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={formPokemon.nivel}
                                    onChange={(e) =>
                                      setFormPokemon({ ...formPokemon, nivel: e.target.value })
                                    }
                                    style={{ width: 60, padding: 4 }}
                                  />
                                </label>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    color: totalEvs > 510 ? '#c0392b' : '#333',
                                  }}
                                >
                                  EVs (Total: {totalEvs} / 510)
                                </div>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 6,
                                  }}
                                >
                                  {CAMPOS_EV.map((c) => (
                                    <label key={c.chave} style={{ fontSize: 12 }}>
                                      {c.label}
                                      <input
                                        type="number"
                                        min={0}
                                        max={252}
                                        value={formPokemon[c.chave]}
                                        onChange={(e) => atualizarEv(c.chave, e.target.value)}
                                        style={{
                                          width: '100%',
                                          padding: 4,
                                          boxSizing: 'border-box',
                                        }}
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button type="submit" disabled={totalEvs > 510}>
                                  Salvar
                                </button>
                                <button type="button" onClick={() => setEditandoPokemonId(null)}>
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Times;