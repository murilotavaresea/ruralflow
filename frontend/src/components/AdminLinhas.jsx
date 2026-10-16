import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import config from "../config";
import { useUi } from "./UiFeedback";
import { rotuloPrograma } from "../utils/operacaoModel";
import { mensagemDeErro } from "../utils/erros";
import "./AdminLinhas.css";

// Gerencia as modalidades (categorias de checklist, ex: Custeio/Investimento) de uma fonte de
// recurso — mesmo padrao de interacao das listas de grupo em AdminChecklist.jsx, so que mais
// simples (sem itens aninhados). No codigo e na API continuam sendo "linhas".
export default function AdminLinhas({ programa, onAlterado }) {
  const { toast, confirmar } = useUi();
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const edicaoEncerrada = useRef(false);

  const base = `${config.API_BASE_URL}/admin/linhas/${programa}`;

  const carregar = useCallback(async () => {
    try {
      const resposta = await axios.get(`${config.REFERENCIA_URL}/checklist`);
      setLinhas(resposta.data.linhas?.[programa] || []);
    } catch (e) {
      toast({ tipo: "erro", mensagem: `Não foi possível carregar as modalidades: ${mensagemDeErro(e)}` });
    } finally {
      setCarregando(false);
    }
  }, [programa, toast]);

  useEffect(() => {
    carregar();
    setEditandoId(null);
  }, [carregar]);

  const executar = async (acao, sucesso) => {
    try {
      await acao();
      if (sucesso) toast({ tipo: "sucesso", mensagem: sucesso });
      await carregar();
      onAlterado?.();
      return true;
    } catch (e) {
      toast({ tipo: "erro", mensagem: `Não foi possível concluir a operação: ${mensagemDeErro(e)}` });
      await carregar();
      return false;
    }
  };

  const criar = async (e) => {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    const ok = await executar(() => axios.post(base, { nome }), `Modalidade "${nome}" criada.`);
    if (ok) setNovoNome("");
  };

  const renomear = async (linha, nomeDigitado) => {
    const nome = nomeDigitado.trim();
    setEditandoId(null);
    if (!nome || nome === linha.nome) return;
    await executar(() => axios.put(`${base}/${linha.id}`, { nome }), "Modalidade renomeada.");
  };

  const excluir = async (linha) => {
    const resposta = await confirmar({
      titulo: "Excluir esta modalidade?",
      mensagem: `Os itens marcados especificamente para "${linha.nome}" deixam de aparecer nela.`,
      confirmarRotulo: "Excluir modalidade",
      perigo: true,
    });
    if (resposta !== "confirmar") return;
    await executar(() => axios.delete(`${base}/${linha.id}`), "Modalidade excluída.");
  };

  const mover = async (indice, direcao) => {
    const ids = linhas.map((l) => l.id);
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    await executar(() => axios.put(`${base}/reordenar`, { ordem: ids }));
  };

  if (carregando) return null;

  return (
    <div className="admin-linhas">
      <h3>Modalidades de {rotuloPrograma(programa)}</h3>
      <p className="admin-linhas-descricao">
        Categorias do checklist (Custeio, Investimento…). Ao editar um item, você escolhe se ele é comum a
        todas as modalidades ou específico de alguma delas.
      </p>

      <ul className="admin-linhas-lista">
        {linhas.length === 0 && <li className="admin-linhas-vazio">Nenhuma modalidade cadastrada.</li>}
        {linhas.map((linha, indice) => (
          <li key={linha.id}>
            {editandoId === linha.id ? (
              <input
                type="text"
                defaultValue={linha.nome}
                aria-label={`Novo nome da modalidade ${linha.nome}`}
                autoFocus
                onBlur={(e) => {
                  if (edicaoEncerrada.current) {
                    edicaoEncerrada.current = false;
                    return;
                  }
                  renomear(linha, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    edicaoEncerrada.current = true;
                    renomear(linha, e.target.value);
                  } else if (e.key === "Escape") {
                    edicaoEncerrada.current = true;
                    setEditandoId(null);
                  }
                }}
              />
            ) : (
              <span>{linha.nome}</span>
            )}
            <div className="admin-linhas-acoes">
              <button
                type="button"
                className="btn btn-pequeno"
                onClick={() => {
                  edicaoEncerrada.current = false;
                  setEditandoId(linha.id);
                }}
                aria-label={`Renomear a modalidade ${linha.nome}`}
              >
                Renomear
              </button>
              <button
                type="button"
                className="btn btn-pequeno"
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
                aria-label={`Mover ${linha.nome} para cima`}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-pequeno"
                onClick={() => mover(indice, 1)}
                disabled={indice === linhas.length - 1}
                aria-label={`Mover ${linha.nome} para baixo`}
              >
                ↓
              </button>
              <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => excluir(linha)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form className="admin-linhas-novo" onSubmit={criar}>
        <label className="sr-only" htmlFor="admin-linhas-novo-nome">
          Nome da nova modalidade
        </label>
        <input
          id="admin-linhas-novo-nome"
          type="text"
          placeholder="Nome da nova modalidade"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="btn btn-primario" disabled={!novoNome.trim()}>
          + Nova modalidade
        </button>
      </form>
    </div>
  );
}
