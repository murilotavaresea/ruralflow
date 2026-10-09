import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import AdminItemForm from "./AdminItemForm";
import { PROGRAMAS } from "../utils/operacaoModel";
import "./AdminChecklist.css";

// caminhoApi: segmento de URL depois de /admin/checklist/, ex: "proponente", "documentos",
// "garantias/bem/hipoteca", "area_beneficiada/bem".
// caminhoLeitura: array de chaves para navegar na resposta de /referencia/checklist ate
// chegar na lista de grupos, ex: ["proponente"], ["documentos"],
// ["garantias","hipoteca","bem"], ["area_beneficiada","bem"].
export default function AdminChecklist({ caminhoApi, caminhoLeitura }) {
  const [grupos, setGrupos] = useState([]);
  const [linhasPorFonte, setLinhasPorFonte] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [itemEmEdicao, setItemEmEdicao] = useState(null); // { grupoId, itemId | "novo" }

  const base = `${config.API_BASE_URL}/admin/checklist/${caminhoApi}`;
  // Proponente, Documentos e Area Beneficiada tem o conceito de fonte/linha (BNDES/FNO/...
  // /Custeio, Investimento...); so Garantias nao varia por fonte nem linha (varia por tipo).
  const usaFonteLinha =
    caminhoLeitura[0] === "proponente" || caminhoLeitura[0] === "documentos" || caminhoLeitura[0] === "area_beneficiada";

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await axios.get(`${config.REFERENCIA_URL}/checklist`);
      const dados = caminhoLeitura.reduce((atual, chave) => (atual ? atual[chave] : undefined), resposta.data);
      setGrupos(dados || []);
      setLinhasPorFonte(usaFonteLinha ? resposta.data.linhas || {} : {});
    } catch (e) {
      setErro("Nao foi possivel carregar os itens. O backend esta rodando?");
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminhoApi, caminhoLeitura.join(".")]);

  useEffect(() => {
    carregar();
    setItemEmEdicao(null);
    setGrupoEditando(null);
  }, [carregar]);

  const criarGrupo = async (e) => {
    e.preventDefault();
    if (!novoGrupoNome.trim()) return;
    await axios.post(`${base}/grupos`, { nome: novoGrupoNome.trim() });
    setNovoGrupoNome("");
    carregar();
  };

  const renomearGrupo = async (grupoId, nome) => {
    if (!nome.trim()) return;
    await axios.put(`${base}/grupos/${grupoId}`, { nome: nome.trim() });
    setGrupoEditando(null);
    carregar();
  };

  const excluirGrupo = async (grupoId) => {
    if (!window.confirm("Excluir este grupo e todos os itens dentro dele?")) return;
    await axios.delete(`${base}/grupos/${grupoId}`);
    carregar();
  };

  const moverGrupo = async (indice, direcao) => {
    const novaOrdem = [...grupos];
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[indice], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[indice]];
    await axios.put(`${base}/grupos/reordenar`, { ordem: novaOrdem.map((g) => g.id) });
    carregar();
  };

  const salvarItem = async (grupoId, itemId, dados) => {
    if (itemId === "novo") {
      await axios.post(`${base}/grupos/${grupoId}/itens`, dados);
    } else {
      await axios.put(`${base}/itens/${itemId}`, dados);
    }
    setItemEmEdicao(null);
    carregar();
  };

  const excluirItem = async (itemId) => {
    if (!window.confirm("Excluir este item?")) return;
    await axios.delete(`${base}/itens/${itemId}`);
    carregar();
  };

  const moverItem = async (grupo, indice, direcao) => {
    const novaOrdem = [...grupo.itens];
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[indice], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[indice]];
    await axios.put(`${base}/grupos/${grupo.id}/itens/reordenar`, { ordem: novaOrdem.map((i) => i.id) });
    carregar();
  };

  if (carregando) return <p className="cartao-descricao">Carregando...</p>;
  if (erro) return <p className="admin-erro">{erro}</p>;

  return (
    <div className="admin-checklist">
      {grupos.map((grupo, indiceGrupo) => (
        <section className="admin-grupo" key={grupo.id}>
          <div className="admin-grupo-cabecalho">
            {grupoEditando === grupo.id ? (
              <input
                type="text"
                defaultValue={grupo.nome}
                autoFocus
                onBlur={(e) => renomearGrupo(grupo.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && renomearGrupo(grupo.id, e.target.value)}
              />
            ) : (
              <h3 onClick={() => setGrupoEditando(grupo.id)} title="Clique para renomear">
                {grupo.nome}
              </h3>
            )}
            <div className="admin-grupo-acoes">
              <button type="button" onClick={() => moverGrupo(indiceGrupo, -1)} disabled={indiceGrupo === 0}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => moverGrupo(indiceGrupo, 1)}
                disabled={indiceGrupo === grupos.length - 1}
              >
                ↓
              </button>
              <button type="button" className="admin-acao-perigo" onClick={() => excluirGrupo(grupo.id)}>
                Excluir grupo
              </button>
            </div>
          </div>

          <ul className="admin-item-lista">
            {grupo.itens.map((item, indiceItem) => (
              <li key={item.id}>
                {itemEmEdicao?.grupoId === grupo.id && itemEmEdicao?.itemId === item.id ? (
                  <AdminItemForm
                    valorInicial={item}
                    fontesDisponiveis={usaFonteLinha ? PROGRAMAS.map((p) => ({ chave: p.chave, rotulo: p.rotulo })) : []}
                    linhasPorFonte={linhasPorFonte}
                    onSalvar={(dados) => salvarItem(grupo.id, item.id, dados)}
                    onCancelar={() => setItemEmEdicao(null)}
                  />
                ) : (
                  <div className="admin-item-linha">
                    <span className="admin-item-tipo">{item.tipo === "texto" ? "Texto" : "Check"}</span>
                    <span className="admin-item-nome">{item.nome}</span>
                    <div className="admin-item-acoes">
                      <button type="button" onClick={() => moverItem(grupo, indiceItem, -1)} disabled={indiceItem === 0}>
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moverItem(grupo, indiceItem, 1)}
                        disabled={indiceItem === grupo.itens.length - 1}
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => setItemEmEdicao({ grupoId: grupo.id, itemId: item.id })}>
                        Editar
                      </button>
                      <button type="button" className="admin-acao-perigo" onClick={() => excluirItem(item.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}

            <li>
              {itemEmEdicao?.grupoId === grupo.id && itemEmEdicao?.itemId === "novo" ? (
                <AdminItemForm
                  fontesDisponiveis={usaFonteLinha ? PROGRAMAS.map((p) => ({ chave: p.chave, rotulo: p.rotulo })) : []}
                  linhasPorFonte={linhasPorFonte}
                  onSalvar={(dados) => salvarItem(grupo.id, "novo", dados)}
                  onCancelar={() => setItemEmEdicao(null)}
                  textoBotao="Criar item"
                />
              ) : (
                <button
                  type="button"
                  className="admin-botao-adicionar"
                  onClick={() => setItemEmEdicao({ grupoId: grupo.id, itemId: "novo" })}
                >
                  + Novo item
                </button>
              )}
            </li>
          </ul>
        </section>
      ))}

      <form className="admin-novo-grupo" onSubmit={criarGrupo}>
        <input
          type="text"
          placeholder="Nome do novo grupo"
          value={novoGrupoNome}
          onChange={(e) => setNovoGrupoNome(e.target.value)}
        />
        <button type="submit" className="admin-botao-primario">
          + Novo grupo
        </button>
      </form>
    </div>
  );
}
