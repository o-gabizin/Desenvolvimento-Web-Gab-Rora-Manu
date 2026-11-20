import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  API,
  TIPOS,
  CAMPOS_EV,
  ICONES_TIME,
  obterRegiaoPorId,
  obterImagemPokemon,
  obterImagemIconeTime,
  carregarCatalogoCompleto,
  buscarDetalhesPokemon,
} from '../constants';

const STAT_PARA_EV = {
  hp: 'ev_hp',
  attack: 'ev_atk',
  defense: 'ev_def',
  'special-attack': 'ev_spa',
  'special-defense': 'ev_spd',
  speed: 'ev_spe',
};

function Times() {
  // 1. Estados dos times
  const [times, setTimes] = useState([]);
  const [nomeTime, setNomeTime] = useState('');
  const [treinador, setTreinador] = useState('');
  const [iconeTime, setIconeTime] = useState('poke-ball');
  const [timeEmEdicaoId, setTimeEmEdicaoId] = useState(null);
  const [erroGeral, setErroGeral] = useState('');

  // 2. Catálogo geral (nomes e tipos) e cache de habilidades/stats por espécie
  const [catalogo, setCatalogo] = useState([]);
  const [detalhesPorPokemon, setDetalhesPorPokemon] = useState({});

  // 3. Estados do time aberto (membros da equipe)
  const [timeAbertoId, setTimeAbertoId] = useState(null);
  const [membros, setMembros] = useState([]);
  const [erroMembro, setErroMembro] = useState('');

  // 4. Estados do formulário de edição de um membro da equipe
  const [membroEmEdicaoId, setMembroEmEdicaoId] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});

  async function carregarTimes() {
    try {
      const resposta = await fetch(`${API}/times`);
      if (!resposta.ok) throw new Error();
      setTimes(await resposta.json());
      setErroGeral('');
    } catch {
      setErroGeral('Erro ao conectar com a API. Verifique se o back-end está rodando.');
    }
  }

  async function carregarMembrosDoTime(timeId) {
    const resposta = await fetch(`${API}/times/${timeId}/pokemon`);
    if (resposta.ok) {
      setMembros(await resposta.json());
    }
  }

  async function garantirDetalhesEspecie(pokemonId) {
    if (detalhesPorPokemon[pokemonId]) {
      return detalhesPorPokemon[pokemonId];
    }

    const dados = await buscarDetalhesPokemon(pokemonId);
    const info = {
      habilidades: dados.abilities.map((item) => ({
        nome: item.ability.name,
        oculta: item.is_hidden,
      })),
      stats: dados.stats.map((item) => ({
        chaveEv: STAT_PARA_EV[item.stat.name],
        valor: item.base_stat,
      })),
    };

    setDetalhesPorPokemon((anterior) => ({
      ...anterior,
      [pokemonId]: info,
    }));

    return info;
  }

  useEffect(() => {
    carregarTimes();
    carregarCatalogoCompleto()
      .then((lista) => setCatalogo(lista))
      .catch(() => {});
  }, []);

  // === Ações do CRUD de Times ===

  function iniciarEdicaoTime(time) {
    setTimeEmEdicaoId(time.id);
    setNomeTime(time.nome);
    setTreinador(time.treinador || '');
    setIconeTime(time.icone || 'poke-ball');
  }

  function cancelarEdicaoTime() {
    setTimeEmEdicaoId(null);
    setNomeTime('');
    setTreinador('');
    setIconeTime('poke-ball');
  }

  async function salvarTime(e) {
    e.preventDefault();
    if (!nomeTime.trim()) {
      setErroGeral('Informe o nome do time.');
      return;
    }

    const url = timeEmEdicaoId ? `${API}/times/${timeEmEdicaoId}` : `${API}/times`;
    const metodo = timeEmEdicaoId ? 'PUT' : 'POST';

    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeTime, treinador, icone: iconeTime }),
    });

    if (!resposta.ok) {
      setErroGeral('Erro ao salvar o time.');
      return;
    }

    cancelarEdicaoTime();
    carregarTimes();
  }

  async function duplicarTime(time) {
    try {
      const respMembros = await fetch(`${API}/times/${time.id}/pokemon`);
      const listaMembros = respMembros.ok ? await respMembros.json() : [];

      const respNovoTime = await fetch(`${API}/times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: `${time.nome} (Cópia)`,
          treinador: time.treinador || '',
          icone: time.icone || 'poke-ball',
        }),
      });

      if (!respNovoTime.ok) throw new Error();
      const novoTime = await respNovoTime.json();

      for (const membro of listaMembros) {
        await fetch(`${API}/times/${novoTime.id}/pokemon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pokemon_id: membro.pokemon_id,
            apelido: membro.apelido,
            shiny: membro.shiny,
            habilidade: membro.habilidade,
            nivel: membro.nivel,
            ev_hp: membro.ev_hp,
            ev_atk: membro.ev_atk,
            ev_def: membro.ev_def,
            ev_spa: membro.ev_spa,
            ev_spd: membro.ev_spd,
            ev_spe: membro.ev_spe,
          }),
        });
      }

      carregarTimes();
    } catch {
      setErroGeral('Erro ao duplicar o time.');
    }
  }

  async function excluirTime(id) {
    if (!window.confirm('Excluir este time e todos os Pokémon dele?')) return;

    await fetch(`${API}/times/${id}`, { method: 'DELETE' });
    if (timeAbertoId === id) setTimeAbertoId(null);
    carregarTimes();
  }

  function alternarAberturaTime(id) {
    if (timeAbertoId === id) {
      setTimeAbertoId(null);
      return;
    }
    setTimeAbertoId(id);
    setMembroEmEdicaoId(null);
    setErroMembro('');
    carregarMembrosDoTime(id);
  }

  // === Ações de Edição, Ordenação e Atalhos dos Pokémon ===

  async function iniciarEdicaoMembro(membro) {
    setMembroEmEdicaoId(membro.id);
    setErroMembro('');
    setDadosEdicao({
      ...membro,
      apelido: membro.apelido || '',
      habilidade: membro.habilidade || '',
    });

    await garantirDetalhesEspecie(membro.pokemon_id).catch(() => {});
  }

  function moverMembro(indiceAtual, direcao) {
    const novoIndice = indiceAtual + direcao;
    if (novoIndice < 0 || novoIndice >= membros.length) return;

    const copia = [...membros];
    const [removido] = copia.splice(indiceAtual, 1);
    copia.splice(novoIndice, 0, removido);
    setMembros(copia);
  }

  function zerarEvsEdicao() {
    setDadosEdicao((anterior) => ({
      ...anterior,
      ev_hp: 0,
      ev_atk: 0,
      ev_def: 0,
      ev_spa: 0,
      ev_spd: 0,
      ev_spe: 0,
    }));
  }

  async function distribuirEvsAutomatico() {
    try {
      const info = await garantirDetalhesEspecie(dadosEdicao.pokemon_id);
      const ordenados = [...info.stats].sort((a, b) => b.valor - a.valor);

      const novosEvs = {
        ev_hp: 0,
        ev_atk: 0,
        ev_def: 0,
        ev_spa: 0,
        ev_spd: 0,
        ev_spe: 0,
      };

      if (ordenados[0]) novosEvs[ordenados[0].chaveEv] = 252;
      if (ordenados[1]) novosEvs[ordenados[1].chaveEv] = 252;
      if (ordenados[2]) novosEvs[ordenados[2].chaveEv] = 4;

      setDadosEdicao((anterior) => ({ ...anterior, ...novosEvs }));
    } catch {
      setErroMembro('Não foi possível calcular os EVs automáticos.');
    }
  }

  const somaEvsEdicao = CAMPOS_EV.reduce(
    (soma, campo) => soma + Number(dadosEdicao[campo.chave] || 0),
    0
  );

  async function salvarEdicaoMembro(e) {
    e.preventDefault();
    if (somaEvsEdicao > 510) {
      setErroMembro(`A soma dos EVs não pode passar de 510 (atual: ${somaEvsEdicao}).`);
      return;
    }

    const resposta = await fetch(`${API}/time-pokemon/${membroEmEdicaoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dadosEdicao,
        apelido: dadosEdicao.apelido.trim() || null,
        habilidade: dadosEdicao.habilidade || null,
        nivel: Number(dadosEdicao.nivel),
      }),
    });

    const dados = await resposta.json();
    if (!resposta.ok) {
      setErroMembro(dados.erro || 'Erro ao salvar alterações.');
      return;
    }

    setMembroEmEdicaoId(null);
    carregarMembrosDoTime(timeAbertoId);
  }

  async function removerMembro(membroId) {
    if (!window.confirm('Remover este Pokémon do time?')) return;

    await fetch(`${API}/time-pokemon/${membroId}`, { method: 'DELETE' });
    carregarMembrosDoTime(timeAbertoId);
  }

  const contagemTiposEquipe = {};
  for (const membro of membros) {
    const especie = catalogo.find((p) => p.id === membro.pokemon_id);
    for (const tipo of especie?.tipos || []) {
      contagemTiposEquipe[tipo] = (contagemTiposEquipe[tipo] || 0) + 1;
    }
  }

  return (
    <div className="container">
      <h1>Meus Times</h1>

      {/* Formulário para criar ou editar um time */}
      <form onSubmit={salvarTime} className="card" style={{ marginBottom: 20, display: 'grid', gap: 12 }}>
        <div className="linha">
          <input
            placeholder="Nome do time"
            value={nomeTime}
            onChange={(e) => setNomeTime(e.target.value)}
          />
          <input
            placeholder="Treinador"
            value={treinador}
            onChange={(e) => setTreinador(e.target.value)}
          />
          <button type="submit">{timeEmEdicaoId ? 'Salvar' : 'Criar time'}</button>
          {timeEmEdicaoId && (
            <button type="button" onClick={cancelarEdicaoTime}>
              Cancelar
            </button>
          )}
        </div>

        {/* Seletor visual de Ícone da Equipe */}
        <div className="linha" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, color: '#666' }}>Ícone:</span>
          {ICONES_TIME.map((item) => {
            const selecionado = iconeTime === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.nome}
                onClick={() => setIconeTime(item.id)}
                style={{
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: selecionado ? '2px solid #c0392b' : '1px solid #ddd',
                  background: selecionado ? '#fdecea' : '#fff',
                }}
              >
                <img
                  src={obterImagemIconeTime(item.id)}
                  alt={item.nome}
                  width="26"
                  height="26"
                />
              </button>
            );
          })}
        </div>
      </form>

      {erroGeral && <p className="msg-erro">{erroGeral}</p>}

      {/* Lista de Times */}
      <div style={{ display: 'grid', gap: 14 }}>
        {times.map((time) => {
          const estaAberto = timeAbertoId === time.id;

          return (
            <div key={time.id} className="card">
              <div className="espaco-entre">
                <div className="linha" style={{ gap: 12 }}>
                  <img
                    src={obterImagemIconeTime(time.icone)}
                    alt="Ícone do time"
                    width="36"
                    height="36"
                  />
                  <div>
                    <strong>{time.nome}</strong>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      Treinador: {time.treinador || '—'}
                    </div>
                  </div>
                </div>

                <div className="linha">
                  <button onClick={() => alternarAberturaTime(time.id)}>
                    {estaAberto ? 'Fechar' : 'Gerenciar Pokémon'}
                  </button>
                  {timeEmEdicaoId !== time.id && (
                    <button onClick={() => iniciarEdicaoTime(time)}>Editar</button>
                  )}
                  <button onClick={() => duplicarTime(time)}>Duplicar</button>
                  <button onClick={() => excluirTime(time.id)}>Excluir</button>
                </div>
              </div>

              {/* Painel interno da equipe quando o time está aberto */}
              {estaAberto && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #eee' }}>
                  <div className="espaco-entre" style={{ marginBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>Equipe ({membros.length}/6)</h3>
                    {membros.length < 6 && (
                      <Link to="/" style={{ fontSize: 13 }}>
                        + Adicionar Pokémon pela Dex
                      </Link>
                    )}
                  </div>

                  {Object.keys(contagemTiposEquipe).length > 0 && (
                    <div className="linha" style={{ marginBottom: 14, fontSize: 12 }}>
                      <span style={{ color: '#666' }}>Tipagens na equipe:</span>
                      {Object.entries(contagemTiposEquipe).map(([chaveTipo, qtd]) => (
                        <span
                          key={chaveTipo}
                          className="etiqueta-tipo"
                          style={{ background: TIPOS[chaveTipo]?.cor || '#777' }}
                        >
                          {TIPOS[chaveTipo]?.nome || chaveTipo} ×{qtd}
                        </span>
                      ))}
                    </div>
                  )}

                  {erroMembro && <p className="msg-erro">{erroMembro}</p>}

                  {membros.length === 0 && (
                    <p style={{ fontSize: 14, color: '#666' }}>
                      Nenhum Pokémon neste time ainda. Use a <Link to="/">Dex</Link> para escolher
                      e adicionar.
                    </p>
                  )}

                  <div className="grade-equipe">
                    {membros.map((membro, indice) => {
                      const dadosEspecie = catalogo.find((p) => p.id === membro.pokemon_id);
                      const nomeEspecie = dadosEspecie ? dadosEspecie.nome : `#${membro.pokemon_id}`;
                      const tiposEspecie = dadosEspecie?.tipos || [];
                      const estaEditandoMembro = membroEmEdicaoId === membro.id;

                      const somaEvsSalvos = CAMPOS_EV.reduce(
                        (total, campo) => total + Number(membro[campo.chave] || 0),
                        0
                      );

                      const exibirShiny = estaEditandoMembro ? dadosEdicao.shiny : membro.shiny;
                      const habilidadesDisponiveis =
                        detalhesPorPokemon[membro.pokemon_id]?.habilidades || [];

                      return (
                        <div key={membro.id} className="card" style={{ background: '#fafafa' }}>
                          <div className="linha">
                            <img
                              src={obterImagemPokemon(membro.pokemon_id, exibirShiny)}
                              onError={(e) => {
                                e.currentTarget.src = obterImagemPokemon(membro.pokemon_id, false);
                              }}
                              alt={nomeEspecie}
                              width="68"
                              height="68"
                            />
                            <div style={{ fontSize: 13 }}>
                              <strong className="capitalizar">
                                #{indice + 1} {membro.apelido || nomeEspecie} {membro.shiny && '✨'}
                              </strong>
                              <div className="capitalizar" style={{ color: '#666' }}>
                                #{membro.pokemon_id} {nomeEspecie} (
                                {obterRegiaoPorId(membro.pokemon_id).nome}) • Nv {membro.nivel}
                              </div>

                              {tiposEspecie.length > 0 && (
                                <div className="linha" style={{ gap: 4, margin: '4px 0' }}>
                                  {tiposEspecie.map((chaveTipo) => (
                                    <span
                                      key={chaveTipo}
                                      className="etiqueta-tipo"
                                      style={{ background: TIPOS[chaveTipo]?.cor || '#777' }}
                                    >
                                      {TIPOS[chaveTipo]?.nome || chaveTipo}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {membro.habilidade && (
                                <div className="capitalizar">Habilidade: {membro.habilidade}</div>
                              )}
                              <div>
                                EVs: {CAMPOS_EV.map((campo) => membro[campo.chave]).join('/')} (
                                {somaEvsSalvos}/510)
                              </div>
                            </div>
                          </div>

                          {!estaEditandoMembro ? (
                            <div className="espaco-entre" style={{ marginTop: 10 }}>
                              <div className="linha">
                                <button onClick={() => iniciarEdicaoMembro(membro)}>Editar</button>
                                <button onClick={() => removerMembro(membro.id)}>Remover</button>
                              </div>

                              <div className="linha" style={{ gap: 4 }}>
                                <button
                                  type="button"
                                  title="Mover para antes"
                                  disabled={indice === 0}
                                  onClick={() => moverMembro(indice, -1)}
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  title="Mover para depois"
                                  disabled={indice === membros.length - 1}
                                  onClick={() => moverMembro(indice, 1)}
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          ) : (
                            <form
                              onSubmit={salvarEdicaoMembro}
                              style={{ marginTop: 10, display: 'grid', gap: 8 }}
                            >
                              <input
                                placeholder="Apelido"
                                value={dadosEdicao.apelido}
                                onChange={(e) =>
                                  setDadosEdicao({ ...dadosEdicao, apelido: e.target.value })
                                }
                              />

                              <select
                                className="capitalizar"
                                value={dadosEdicao.habilidade}
                                onChange={(e) =>
                                  setDadosEdicao({ ...dadosEdicao, habilidade: e.target.value })
                                }
                              >
                                <option value="">Habilidade padrão</option>
                                {habilidadesDisponiveis.map((hab) => (
                                  <option key={hab.nome} value={hab.nome}>
                                    {hab.nome}
                                    {hab.oculta ? ' (Oculta)' : ''}
                                  </option>
                                ))}
                              </select>

                              <div className="linha">
                                <label className="linha" style={{ fontSize: 13 }}>
                                  <input
                                    type="checkbox"
                                    checked={dadosEdicao.shiny}
                                    onChange={(e) =>
                                      setDadosEdicao({ ...dadosEdicao, shiny: e.target.checked })
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
                                    value={dadosEdicao.nivel}
                                    onChange={(e) =>
                                      setDadosEdicao({ ...dadosEdicao, nivel: e.target.value })
                                    }
                                    style={{ width: 65 }}
                                  />
                                </label>
                              </div>

                              <div className="espaco-entre">
                                <span style={{ fontSize: 12, fontWeight: 600 }}>
                                  EVs ({somaEvsEdicao}/510):
                                </span>
                                <div className="linha" style={{ gap: 4 }}>
                                  <button
                                    type="button"
                                    onClick={distribuirEvsAutomatico}
                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                  >
                                    252 / 252 / 4
                                  </button>
                                  <button
                                    type="button"
                                    onClick={zerarEvsEdicao}
                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                  >
                                    Zerar
                                  </button>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: 6,
                                }}
                              >
                                {CAMPOS_EV.map((campo) => (
                                  <label key={campo.chave} style={{ fontSize: 11 }}>
                                    {campo.label}
                                    <input
                                      type="number"
                                      min={0}
                                      max={252}
                                      value={dadosEdicao[campo.chave]}
                                      onChange={(e) =>
                                        setDadosEdicao({
                                          ...dadosEdicao,
                                          [campo.chave]: Number(e.target.value) || 0,
                                        })
                                      }
                                      style={{ width: '100%' }}
                                    />
                                  </label>
                                ))}
                              </div>

                              <div className="linha">
                                <button type="submit" disabled={somaEvsEdicao > 510}>
                                  Salvar
                                </button>
                                <button type="button" onClick={() => setMembroEmEdicaoId(null)}>
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