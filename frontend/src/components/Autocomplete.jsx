import { useEffect, useId, useState } from "react";
import "./Campos.css";

function semAcento(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Destaca (em negrito) o trecho que casou com o que foi digitado, ignorando acentos e
// maiusculas — "sao paulo" destaca em "São Paulo".
function destacar(rotulo, termo) {
  const alvo = semAcento(termo).trim().toLowerCase();
  if (!alvo) return rotulo;
  const posicao = semAcento(rotulo).toLowerCase().indexOf(alvo);
  if (posicao < 0 || semAcento(rotulo).length !== rotulo.length) return rotulo;
  return (
    <>
      {rotulo.slice(0, posicao)}
      <mark>{rotulo.slice(posicao, posicao + alvo.length)}</mark>
      {rotulo.slice(posicao + alvo.length)}
    </>
  );
}

// Campo de texto com lista de sugestoes (padrao ARIA "combobox"): setas navegam, Enter escolhe,
// Esc fecha, e o leitor de tela anuncia a quantidade de opcoes. As sugestoes vem prontas do
// componente pai (`sugestoes`: [{ id, rotulo, detalhe? }]); aqui so ha a interacao.
export default function Autocomplete({
  rotulo,
  obrigatorio = false,
  valor,
  onChangeTexto,
  sugestoes,
  onSelecionar,
  placeholder,
  dica,
  classe = "",
}) {
  const id = useId();
  const idLista = `${id}-lista`;
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);

  const mostrar = aberto && sugestoes.length > 0;
  const assinatura = sugestoes.map((sugestao) => sugestao.id).join("|");

  useEffect(() => {
    setAtivo(-1);
  }, [assinatura]);

  useEffect(() => {
    if (ativo >= 0) document.getElementById(`${id}-op-${ativo}`)?.scrollIntoView({ block: "nearest" });
  }, [ativo, id]);

  const escolher = (sugestao) => {
    onSelecionar(sugestao);
    setAberto(false);
    setAtivo(-1);
  };

  const aoTeclar = (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (!mostrar) setAberto(true);
      else setAtivo((indice) => (indice + 1) % sugestoes.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (mostrar) setAtivo((indice) => (indice <= 0 ? sugestoes.length - 1 : indice - 1));
    } else if (evento.key === "Enter" && mostrar && ativo >= 0) {
      evento.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (evento.key === "Escape" && mostrar) {
      evento.preventDefault();
      evento.stopPropagation();
      setAberto(false);
    }
  };

  return (
    <div className={`campo autocomplete ${classe}`.trim()}>
      <div className="campo-rotulo-linha">
        <label htmlFor={id} className={`campo-rotulo${obrigatorio ? " obrigatorio" : ""}`}>
          {rotulo}
        </label>
        {dica && <span className="campo-status ok">{dica}</span>}
      </div>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={mostrar && ativo >= 0 ? `${id}-op-${ativo}` : undefined}
        autoComplete="off"
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => {
          onChangeTexto(evento.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
      />
      {mostrar && (
        <ul className="autocomplete-lista" id={idLista} role="listbox" aria-label={rotulo}>
          {sugestoes.map((sugestao, indice) => (
            <li
              key={sugestao.id}
              id={`${id}-op-${indice}`}
              role="option"
              aria-selected={indice === ativo}
              className={indice === ativo ? "ativa" : ""}
              // mouseDown (e nao click) com preventDefault: o campo nao perde o foco antes da escolha
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(sugestao);
              }}
              onMouseEnter={() => setAtivo(indice)}
            >
              <span>{destacar(sugestao.rotulo, valor)}</span>
              {sugestao.detalhe && <small>{sugestao.detalhe}</small>}
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only" aria-live="polite">
        {mostrar ? `${sugestoes.length} sugestões disponíveis` : ""}
      </span>
    </div>
  );
}
