import { useMemo, useRef, useState } from "react";
import CampoNumerico from "./CampoNumerico";
import { PROGRAMAS, criarOperacaoVazia } from "../utils/operacaoModel";
import {
  CAMPOS_REGRA,
  avaliarCondicao,
  campoDaRegra,
  exibirValorDeTeste,
  lerNumero,
  montarTextoRegra,
  operadorSemValor,
  operadoresDoTipo,
  rotuloOperador,
  variaveisDesconhecidas,
  variaveisDisponiveis,
} from "../utils/regrasModel";
import "./Campos.css";
import "./AdminRegras.css";

const GRUPOS = [...new Set(CAMPOS_REGRA.map((campo) => campo.grupo))];
const OPERADOR_INICIAL = { numero: "maior_igual", lista: "igual", texto: "igual" };
const SUFIXOS = { percentual: "%", meses: "meses" };

const REGRA_NOVA = {
  nome: "",
  ativa: true,
  campo: CAMPOS_REGRA[0].chave,
  operador: OPERADOR_INICIAL.numero,
  valor: "",
  fontes: "todas",
  impedeContratacao: false,
  textoParecer: "",
  textoDevolutiva: "",
};

function ValorDaCondicao({ campo, operador, valor, onChange }) {
  if (operadorSemValor(operador)) {
    return <span className="campo-dica">Esta condição não precisa de valor.</span>;
  }
  if (campo.tipo === "numero") {
    return (
      <CampoNumerico
        valor={valor}
        onChange={onChange}
        prefixo={campo.unidade === "moeda" ? "R$" : undefined}
        sufixo={SUFIXOS[campo.unidade]}
        aria-label="Valor da condição"
        placeholder="0"
      />
    );
  }
  if (campo.tipo === "lista" && operador === "um_de") {
    const marcados = String(valor || "").split(";").filter(Boolean);
    const alternar = (opcao) => {
      const novos = marcados.includes(opcao) ? marcados.filter((m) => m !== opcao) : [...marcados, opcao];
      onChange(campo.opcoes.map((o) => o.valor).filter((v) => novos.includes(v)).join(";"));
    };
    return (
      <div className="regra-chips" role="group" aria-label="Valores da condição">
        {campo.opcoes.map((opcao) => {
          const marcada = marcados.includes(opcao.valor);
          return (
            <label key={opcao.valor} className={`chip${marcada ? " selecionado" : ""}`}>
              <input type="checkbox" checked={marcada} onChange={() => alternar(opcao.valor)} />
              {opcao.rotulo}
            </label>
          );
        })}
      </div>
    );
  }
  if (campo.tipo === "lista") {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)} aria-label="Valor da condição">
        <option value="">Selecione</option>
        {campo.opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    );
  }
  return <input type="text" value={valor} onChange={(e) => onChange(e.target.value)} aria-label="Valor da condição" />;
}

// Editor de uma regra: QUANDO <dado> <condicao> <valor>, VALE PARA <fontes>, ENTAO <efeitos>.
export default function RegraForm({ regra, onSalvar, onCancelar }) {
  const [dados, setDados] = useState({ ...(regra || REGRA_NOVA) });
  const [usarParecer, setUsarParecer] = useState(regra ? Boolean(regra.textoParecer) : true);
  const [usarDevolutiva, setUsarDevolutiva] = useState(regra ? Boolean(regra.textoDevolutiva) : false);
  const [valorTeste, setValorTeste] = useState("");
  const [salvando, setSalvando] = useState(false);
  const refParecer = useRef(null);
  const refDevolutiva = useRef(null);
  const ultimoFoco = useRef("parecer");

  const campo = campoDaRegra(dados.campo) || CAMPOS_REGRA[0];
  const operadores = operadoresDoTipo(campo.tipo);
  const mudar = (chave, valor) => setDados((atual) => ({ ...atual, [chave]: valor }));

  const trocarCampo = (chave) => {
    const novo = campoDaRegra(chave);
    setDados((atual) => {
      const mesmoTipo = campo.tipo === novo.tipo;
      return {
        ...atual,
        campo: chave,
        operador: mesmoTipo ? atual.operador : OPERADOR_INICIAL[novo.tipo],
        valor: mesmoTipo && novo.tipo !== "lista" ? atual.valor : "",
      };
    });
    setValorTeste("");
  };

  const trocarOperador = (operador) => {
    setDados((atual) => ({
      ...atual,
      operador,
      valor: operadorSemValor(operador) || (operador === "um_de") !== (atual.operador === "um_de") ? "" : atual.valor,
    }));
  };

  const fontesMarcadas = Array.isArray(dados.fontes) ? dados.fontes : [];
  const todasAsFontes = dados.fontes === "todas";
  const alternarFonte = (chave) =>
    mudar("fontes", fontesMarcadas.includes(chave) ? fontesMarcadas.filter((f) => f !== chave) : [...fontesMarcadas, chave]);

  // inserir {variavel} onde o cursor estiver no ultimo texto em que se mexeu
  const inserirVariavel = (nome) => {
    const paraDevolutiva = ultimoFoco.current === "devolutiva";
    const chave = paraDevolutiva ? "textoDevolutiva" : "textoParecer";
    (paraDevolutiva ? setUsarDevolutiva : setUsarParecer)(true);
    const elemento = (paraDevolutiva ? refDevolutiva : refParecer).current;
    const atual = dados[chave] || "";
    const inicio = elemento ? elemento.selectionStart : atual.length;
    const fim = elemento ? elemento.selectionEnd : atual.length;
    const marcador = `{${nome}}`;
    mudar(chave, atual.slice(0, inicio) + marcador + atual.slice(fim));
    requestAnimationFrame(() => {
      const alvo = (paraDevolutiva ? refDevolutiva : refParecer).current;
      if (!alvo) return;
      alvo.focus();
      alvo.setSelectionRange(inicio + marcador.length, inicio + marcador.length);
    });
  };

  const todasVariaveis = variaveisDisponiveis();
  const principais = [todasVariaveis[0], todasVariaveis[1], todasVariaveis.find((v) => v.nome === campo.variavel)];

  // --- teste ao vivo ---------------------------------------------------------------------
  const teste = useMemo(() => {
    const resultado = avaliarCondicao(campo, dados.operador, dados.valor, valorTeste);
    if (resultado !== "sim") return { resultado };
    const demonstracao = criarOperacaoVazia();
    demonstracao.proponente.nome = "Fulano de Tal";
    const opcoes = {
      sobrescritas: { [campo.variavel]: exibirValorDeTeste(campo, valorTeste) },
      marcarVazios: true,
    };
    return {
      resultado,
      parecer: usarParecer ? montarTextoRegra(dados.textoParecer, demonstracao, undefined, opcoes).trim() : "",
      devolutiva: usarDevolutiva ? montarTextoRegra(dados.textoDevolutiva, demonstracao, undefined, opcoes).trim() : "",
    };
  }, [campo, dados, valorTeste, usarParecer, usarDevolutiva]);

  // --- validacao -----------------------------------------------------------------------------
  const problemas = [];
  if (!dados.nome.trim()) problemas.push("Dê um nome à regra.");
  if (!operadorSemValor(dados.operador)) {
    if (campo.tipo === "numero" && lerNumero(dados.valor) === null) problemas.push("Informe o valor da condição (um número).");
    if (campo.tipo !== "numero" && !String(dados.valor || "").trim()) problemas.push("Informe o valor da condição.");
  }
  if (Array.isArray(dados.fontes) && dados.fontes.length === 0) problemas.push("Marque ao menos uma fonte de recurso (ou “Todas”).");
  if (usarParecer && !dados.textoParecer.trim()) problemas.push("Escreva o texto do Parecer ou desmarque essa opção.");
  if (usarDevolutiva && !dados.textoDevolutiva.trim()) problemas.push("Escreva o texto da Devolutiva ou desmarque essa opção.");
  if (!(usarParecer || usarDevolutiva || dados.impedeContratacao)) {
    problemas.push("Escolha o que a regra faz: texto no Parecer, texto na Devolutiva ou impedir a contratação.");
  }
  const desconhecidas = [
    ...(usarParecer ? variaveisDesconhecidas(dados.textoParecer) : []),
    ...(usarDevolutiva ? variaveisDesconhecidas(dados.textoDevolutiva) : []),
  ];
  [...new Set(desconhecidas)].forEach((nome) => problemas.push(`Variável desconhecida: {${nome}}. Use as sugeridas abaixo do texto.`));

  const salvar = async (evento) => {
    evento.preventDefault();
    if (problemas.length > 0 || salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        nome: dados.nome.trim(),
        ativa: dados.ativa,
        campo: dados.campo,
        operador: dados.operador,
        valor: operadorSemValor(dados.operador) ? "" : String(dados.valor ?? ""),
        fontes: dados.fontes,
        impedeContratacao: dados.impedeContratacao,
        textoParecer: usarParecer ? dados.textoParecer.trim() : "",
        textoDevolutiva: usarDevolutiva ? dados.textoDevolutiva.trim() : "",
      });
    } finally {
      setSalvando(false);
    }
  };

  const mensagemTeste = {
    sim: "Acionada",
    nao: "Não acionada",
    sem_dado: "Sem dado: a regra não seria avaliada (aparece como pendência na Revisão)",
    invalida: "Condição incompleta: falta o valor da regra",
  }[teste.resultado];

  return (
    <form className="regra-form" onSubmit={salvar}>
      <label className="campo obrigatorio">
        <span>Nome da regra</span>
        <input
          type="text"
          value={dados.nome}
          onChange={(e) => mudar("nome", e.target.value)}
          placeholder="Ex.: Risco R7 ou acima"
          autoFocus
        />
      </label>

      <fieldset className="regra-bloco">
        <legend>Quando</legend>
        <div className="grade-campos colunas-3">
          <label className="campo">
            <span>Dado da operação</span>
            <select value={dados.campo} onChange={(e) => trocarCampo(e.target.value)}>
              {GRUPOS.map((grupo) => (
                <optgroup key={grupo} label={grupo}>
                  {CAMPOS_REGRA.filter((c) => c.grupo === grupo).map((c) => (
                    <option key={c.chave} value={c.chave}>
                      {c.rotulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Condição</span>
            <select value={dados.operador} onChange={(e) => trocarOperador(e.target.value)}>
              {operadores.map((operador) => (
                <option key={operador} value={operador}>
                  {rotuloOperador(operador, campo.tipo)}
                </option>
              ))}
            </select>
          </label>
          <div className="campo">
            <span>Valor</span>
            <ValorDaCondicao
              campo={campo}
              operador={dados.operador}
              valor={dados.valor}
              onChange={(valor) => mudar("valor", valor)}
            />
          </div>
        </div>
        {campo.dica && <p className="campo-dica">{campo.dica}</p>}
      </fieldset>

      <fieldset className="regra-bloco">
        <legend>Vale para</legend>
        <div className="regra-chips">
          <label className={`chip${todasAsFontes ? " selecionado" : ""}`}>
            <input
              type="checkbox"
              checked={todasAsFontes}
              onChange={(e) => mudar("fontes", e.target.checked ? "todas" : [])}
            />
            Todas as fontes
          </label>
          {PROGRAMAS.map((programa) => {
            const marcada = fontesMarcadas.includes(programa.chave);
            return (
              <label key={programa.chave} className={`chip${marcada ? " selecionado" : ""}`}>
                <input type="checkbox" checked={marcada} onChange={() => alternarFonte(programa.chave)} />
                {programa.rotulo}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="regra-bloco">
        <legend>Então</legend>

        <label className="regra-efeito">
          <input type="checkbox" checked={usarParecer} onChange={(e) => setUsarParecer(e.target.checked)} />
          <span>Incluir esta mensagem no Parecer</span>
        </label>
        {usarParecer && (
          <textarea
            ref={refParecer}
            rows={2}
            value={dados.textoParecer}
            onChange={(e) => mudar("textoParecer", e.target.value)}
            onFocus={() => (ultimoFoco.current = "parecer")}
            aria-label="Mensagem do Parecer"
            placeholder="Ex.: Cooperado com risco {risco}: a operação deve ser deliberada pelas alçadas competentes."
          />
        )}

        <label className="regra-efeito">
          <input type="checkbox" checked={usarDevolutiva} onChange={(e) => setUsarDevolutiva(e.target.checked)} />
          <span>Incluir esta mensagem na Devolutiva</span>
        </label>
        {usarDevolutiva && (
          <textarea
            ref={refDevolutiva}
            rows={2}
            value={dados.textoDevolutiva}
            onChange={(e) => mudar("textoDevolutiva", e.target.value)}
            onFocus={() => (ultimoFoco.current = "devolutiva")}
            aria-label="Mensagem da Devolutiva"
            placeholder="Ex.: Encaminhar a ata de deliberação do comitê."
          />
        )}

        <label className="regra-efeito">
          <input
            type="checkbox"
            checked={dados.impedeContratacao}
            onChange={(e) => mudar("impedeContratacao", e.target.checked)}
          />
          <span>
            <strong>Impede a contratação</strong> — alerta em vermelho na operação e na Revisão (não escreve nada no
            Parecer por conta própria)
          </span>
        </label>

        <div className="regra-variaveis">
          <span>Preencher com o dado da operação:</span>
          {principais.map((variavel) => (
            <button key={variavel.nome} type="button" className="chip" onClick={() => inserirVariavel(variavel.nome)} title={variavel.descricao}>
              {`{${variavel.nome}}`}
            </button>
          ))}
          <details>
            <summary>todas as variáveis</summary>
            <div className="regra-chips">
              {todasVariaveis.map((variavel) => (
                <button key={variavel.nome} type="button" className="chip" onClick={() => inserirVariavel(variavel.nome)} title={variavel.descricao}>
                  {`{${variavel.nome}}`}
                </button>
              ))}
            </div>
          </details>
        </div>
      </fieldset>

      <fieldset className="regra-bloco regra-teste">
        <legend>Testar</legend>
        <div className="regra-teste-linha">
          <label className="campo">
            <span>Se {campo.rotulo.toLowerCase()} fosse…</span>
            {campo.tipo === "lista" ? (
              <select value={valorTeste} onChange={(e) => setValorTeste(e.target.value)}>
                <option value="">(em branco)</option>
                {campo.opcoes.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={valorTeste}
                onChange={(e) => setValorTeste(e.target.value)}
                placeholder={campo.chave === "proponente_risco" ? "Ex.: R8" : "Digite um valor de teste"}
              />
            )}
          </label>
          <p className={`regra-teste-resultado ${teste.resultado}`} role="status">
            {mensagemTeste}
          </p>
        </div>
        {teste.resultado === "sim" && (teste.parecer || teste.devolutiva || dados.impedeContratacao) && (
          <ul className="regra-teste-saidas">
            {teste.parecer && (
              <li>
                <strong>Parecer:</strong> {teste.parecer}
              </li>
            )}
            {teste.devolutiva && (
              <li>
                <strong>Devolutiva:</strong> {teste.devolutiva}
              </li>
            )}
            {dados.impedeContratacao && (
              <li>
                <strong>Alerta:</strong> impede a contratação
              </li>
            )}
          </ul>
        )}
      </fieldset>

      {problemas.length > 0 && (
        <ul className="regra-problemas" aria-live="polite">
          {problemas.map((problema) => (
            <li key={problema}>{problema}</li>
          ))}
        </ul>
      )}

      <div className="regra-form-acoes">
        <button type="button" className="btn" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={problemas.length > 0 || salvando}>
          {salvando ? "Salvando…" : "Salvar regra"}
        </button>
      </div>
    </form>
  );
}
