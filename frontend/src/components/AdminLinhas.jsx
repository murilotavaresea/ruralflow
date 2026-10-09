import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import "./AdminLinhas.css";

// Gerencia as linhas (categorias de checklist, ex: Custeio/Investimento) de um programa —
// mesmo padrao de interacao das listas de grupo em AdminChecklist.jsx, so que mais simples
// (sem itens aninhados).
export default function AdminLinhas({ programa, onAlterado }) {
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const base = `${config.API_BASE_URL}/admin/linhas/${programa}`;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await axios.get(`${config.REFERENCIA_URL}/checklist`);
      setLinhas(resposta.data.linhas?.[programa] || []);
    } finally {
      setCarregando(false);
    }
  }, [programa]);

  useEffect(() => {
    carregar();
    setEditandoId(null);
  }, [carregar]);

  const criar = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    await axios.post(base, { nome: novoNome.trim() });
    setNovoNome("");
    await carregar();
    onAlterado?.();
  };

  const renomear = async (id, nome) => {
    if (!nome.trim()) return;
    await axios.put(`${base}/${id}`, { nome: nome.trim() });
    setEditandoId(null);
    await carregar();
    onAlterado?.();
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir esta linha? Itens marcados especificamente pra ela deixam de aparecer nela.")) return;
    await axios.delete(`${base}/${id}`);
    await carregar();
    onAlterado?.();
  };

  const mover = async (indice, direcao) => {
    const novaOrdem = [...linhas];
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[indice], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[indice]];
    await axios.put(`${base}/reordenar`, { ordem: novaOrdem.map((l) => l.id) });
    await carregar();
    onAlterado?.();
  };

  if (carregando) return null;

  return (
    <div className="admin-linhas">
      <h3>Linhas de {programa.toUpperCase()}</h3>
      <p className="admin-linhas-descricao">
        Categorias do checklist (Custeio, Investimento...). Ao editar um item, você escolhe se
        ele é comum a todas ou específico de alguma dessas linhas.
      </p>

      <ul className="admin-linhas-lista">
        {linhas.map((linha, indice) => (
          <li key={linha.id}>
            {editandoId === linha.id ? (
              <input
                type="text"
                defaultValue={linha.nome}
                autoFocus
                onBlur={(e) => renomear(linha.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && renomear(linha.id, e.target.value)}
              />
            ) : (
              <span onClick={() => setEditandoId(linha.id)} title="Clique para renomear">
                {linha.nome}
              </span>
            )}
            <div className="admin-linhas-acoes">
              <button type="button" onClick={() => mover(indice, -1)} disabled={indice === 0}>
                ↑
              </button>
              <button type="button" onClick={() => mover(indice, 1)} disabled={indice === linhas.length - 1}>
                ↓
              </button>
              <button type="button" className="admin-acao-perigo" onClick={() => excluir(linha.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form className="admin-linhas-novo" onSubmit={criar}>
        <input
          type="text"
          placeholder="Nome da nova linha"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="admin-botao-primario">
          + Nova linha
        </button>
      </form>
    </div>
  );
}
