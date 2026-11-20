import { useEffect, useState } from 'react';
import {
  KALOS_PRIMEIRO,
  KALOS_QUANTIDADE,
  EASTER_EGGS,
  imagemDoPokemon,
} from '../constants';

function Dex() {
  const [pokemons, setPokemons] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const [respostaKalos, ...respostasExtras] = await Promise.all([
          fetch(
            `https://pokeapi.co/api/v2/pokemon?offset=${KALOS_PRIMEIRO - 1}&limit=${KALOS_QUANTIDADE}`
          ),
          ...EASTER_EGGS.map((id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)),
        ]);

        if (!respostaKalos.ok || respostasExtras.some((r) => !r.ok)) {
          throw new Error('Falha na PokéAPI');
        }

        const dadosKalos = await respostaKalos.json();
        const dadosExtras = await Promise.all(respostasExtras.map((r) => r.json()));

        const kalos = dadosKalos.results.map((p, i) => ({
          id: KALOS_PRIMEIRO + i,
          nome: p.name,
        }));
        const extras = dadosExtras.map((p) => ({ id: p.id, nome: p.name }));

        setPokemons([...kalos, ...extras]);
      } catch (e) {
        setErro('Não foi possível carregar os Pokémon. Verifique sua internet.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const filtrados = pokemons.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) return <p style={{ padding: 20 }}>Carregando...</p>;
  if (erro) return <p style={{ padding: 20 }}>{erro}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dex de Kalos</h1>
      <input
        type="text"
        placeholder="Buscar pelo nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ padding: 8, width: 250, marginBottom: 20 }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        {filtrados.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={imagemDoPokemon(p.id)}
              alt={p.nome}
              width="120"
              height="120"
              loading="lazy"
            />
            <p style={{ margin: '8px 0 0', textTransform: 'capitalize' }}>
              #{p.id} {p.nome}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dex;