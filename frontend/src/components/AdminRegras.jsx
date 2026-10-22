import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import RegraForm from "./RegraForm";
import { useUi } from "./UiFeedback";
import { campoDaRegra, descreverCondicao } from "../utils/regrasModel";
import { rotuloPrograma } from "../utils/operacaoModel";
import { mensagemDeErro } from "../utils/erros";
import "./AdminRegras.css";

function resumoDeEscopo(regra) {
  if (regra.fontes === "todas") return "Todas as fontes";
  const fontes = Array.isArray(regra.fontes) ? regra.fontes : [];
  return fontes.length > 0 ? fontes.map(rotuloPrograma).join(" · ") : "Nenhuma fonte";
}

// "Regras do parecer": cada regra olha UM dado da operacao e, quando a condicao e verdadeira, leva
// uma mensagem ao Parecer, outra a Devolutiva e/ou marca que a contratacao esta impedida.
export default function AdminRegras() {
  const { toast, confirmar } = useUi();
  const [regras, setRegras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(null); // id da regra | "nova"

  const base = `${config.API_BASE_URL}/admin/regras`;

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCarregando(true);
    setErro("");
    try {
      const resposta = await axios.get(`${config.REFERENCIA_URL}/checklist`);
      setRegras(Array.isArray(resposta.data.regras) ? resposta.data.regras : []);
    } catch (e) {
      setErro(`Não foi possível carregar as regras: ${mensagemDeErro(e)}`);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const executar = async (acao, sucesso) => {
    try {
      await acao();
      if (sucesso) toast({ tipo: "sucesso", mensagem: sucesso });
      await carregar({ silencioso: true });
      return true;
    } catch (e) {
      toast({ tipo: "erro", mensagem: `Não foi possível concluir a operação: ${mensagemDeErro(e)}` });
      await carregar({ silencioso: true });
      return false;
    }
  };

  const salvar = async (regraAtual, dados) => {
    const ok = await executar(
      () => (regraAtual ? axios.put(`${base}/${regraAtual.id}`, dados) : axios.post(base, dados)),
      regraAtual ? "Regra salva." : "Regra criada."
    );
    if (ok) setEditando(null);
  };

  const alternarAtiva = (regra) =>
    executar(() => axios.put(`${base}/${regra.id}`, { ativa: !regra.ativa }), regra.ativa ? "Regra desativada." : "Regra ativada.");

  const excluir = async (regra) => {
    const resposta = await confirmar({
      titulo: "Excluir esta regra?",
      mensagem: `A regra "${regra.nome}" será excluída e deixa de valer em todas as operações. Para só pausá-la, use "Ativa".`,
      confirmarRotulo: "Excluir regra",
      perigo: true,
    });
    if (resposta !== "confirmar") return;
    await executar(() => axios.delete(`${base}/${regra.id}`), "Regra excluída.");
  };

  const mover = async (indice, direcao) => {
    const ids = regras.map((r) => r.id);
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    setRegras((atuais) => ids.map((id) => atuais.find((r) => r.id === id)));
    await executar(() => axios.put(`${base}/reordenar`, { ordem: ids }));
  };

  if (carregando) {
    return (
      <p className="cartao-descricao" role="status">
        Carregando…
      </p>
    );
  }
  if (erro) {
    return (
      <div className="admin-erro" role="alert">
        <p>{erro}</p>
        <button type="button" className="btn btn-pequeno" onClick={() => carregar()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="admin-regras">
      <div className="admin-regras-topo">
        <p className="cartao-descricao">
          Cada regra olha <strong>um dado</strong> da operação. Quando a condição é verdadeira, ela leva uma mensagem
          ao <strong>Parecer</strong>, outra à <strong>Devolutiva</strong> e/ou avisa que a contratação está{" "}
          <strong>impedida</strong>. Vale na hora, em toda operação. A ordem aqui é a ordem das mensagens no Parecer.
        </p>
        {editando !== "nova" && (
          <button type="button" className="btn btn-primario" onClick={() => setEditando("nova")}>
            + Nova regra
          </button>
        )}
      </div>

      {editando === "nova" && (
        <div className="admin-regra editando">
          <RegraForm regra={null} onSalvar={(dados) => salvar(null, dados)} onCancelar={() => setEditando(null)} />
        </div>
      )}

      {regras.length === 0 && editando !== "nova" && (
        <p className="cartao-descricao">Nenhuma regra ainda. Crie a primeira no botão acima.</p>
      )}

      <ul className="admin-regras-lista">
        {regras.map((regra, indice) => (
          <li key={regra.id} className={`admin-regra${regra.ativa ? "" : " inativa"}${editando === regra.id ? " editando" : ""}`}>
            {editando === regra.id ? (
              <RegraForm regra={regra} onSalvar={(dados) => salvar(regra, dados)} onCancelar={() => setEditando(null)} />
            ) : (
              <>
                <label className="admin-regra-ativa" title={regra.ativa ? "Regra ativa" : "Regra desativada"}>
                  <input type="checkbox" checked={regra.ativa} onChange={() => alternarAtiva(regra)} />
                  <span>Ativa</span>
                </label>

                <div className="admin-regra-corpo">
                  <strong className="admin-regra-nome">{regra.nome}</strong>
                  <span className="admin-regra-condicao">
                    {campoDaRegra(regra.campo) ? (
                      <>Quando {descreverCondicao(regra)}</>
                    ) : (
                      <span className="admin-regra-aviso">⚠ O dado “{regra.campo}” não existe mais; edite a regra.</span>
                    )}
                  </span>
                  <span className="admin-regra-efeitos">
                    {regra.textoParecer && <span className="admin-regra-selo">Parecer</span>}
                    {regra.textoDevolutiva && <span className="admin-regra-selo">Devolutiva</span>}
                    {regra.impedeContratacao && <span className="admin-regra-selo perigo">Impede a contratação</span>}
                    {!regra.textoParecer && !regra.textoDevolutiva && !regra.impedeContratacao && (
                      <span className="admin-regra-selo aviso">Sem efeito</span>
                    )}
                    <span className="admin-regra-escopo">{resumoDeEscopo(regra)}</span>
                  </span>
                  {regra.textoParecer && <span className="admin-regra-texto">“{regra.textoParecer}”</span>}
                </div>

                <div className="admin-regra-acoes">
                  <button
                    type="button"
                    className="btn btn-pequeno"
                    onClick={() => mover(indice, -1)}
                    disabled={indice === 0}
                    aria-label={`Mover a regra ${regra.nome} para cima`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-pequeno"
                    onClick={() => mover(indice, 1)}
                    disabled={indice === regras.length - 1}
                    aria-label={`Mover a regra ${regra.nome} para baixo`}
                  >
                    ↓
                  </button>
                  <button type="button" className="btn btn-pequeno" onClick={() => setEditando(regra.id)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => excluir(regra)}>
                    Excluir
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
