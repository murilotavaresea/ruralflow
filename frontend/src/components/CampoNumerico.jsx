import { useLayoutEffect, useRef } from "react";
import {
  contarSignificativos,
  formatarParaExibicao,
  interpretarEntrada,
  normalizarArmazenado,
  posicaoPorSignificativosRestantes,
} from "../utils/numero";
import "./Campos.css";

// Campo de numero com mascara pt-BR (milhar com ponto, decimal com virgula). O valor que sobe
// pro estado continua sendo uma string "1234.56" — ver utils/numero.js — entao nenhum calculo
// existente muda. Deve ser usado dentro de um <label className="campo"> ou receber um `id` com
// <label htmlFor>.
//
// decimais=0 -> inteiro (prazo em meses); decimais=2 -> dinheiro/percentual.
export default function CampoNumerico({
  valor,
  onChange,
  decimais = 2,
  prefixo,
  sufixo,
  maximo,
  onBlur,
  ...resto
}) {
  const inputRef = useRef(null);
  const restantes = useRef(null);
  const exibicao = formatarParaExibicao(valor, decimais);

  // A mascara reescreve o texto (insere pontos), o que jogaria o cursor pro fim. Guardamos
  // quantos caracteres significativos ficaram a direita do cursor e recolocamos depois.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (restantes.current === null || !input || document.activeElement !== input) return;
    const posicao = posicaoPorSignificativosRestantes(exibicao, restantes.current);
    input.setSelectionRange(posicao, posicao);
    restantes.current = null;
  });

  const aoMudar = (evento) => {
    const bruto = evento.target.value;
    const cursor = evento.target.selectionStart ?? bruto.length;
    const aDireita = contarSignificativos(bruto.slice(cursor));

    const novo = interpretarEntrada(bruto, decimais);
    const estourou = maximo !== undefined && novo !== "" && Number(novo) > maximo;
    const atual = normalizarArmazenado(valor);

    if (estourou || novo === atual) {
      // Nada muda no estado (caractere invalido, ou acima do maximo): o React devolve o texto
      // antigo e o cursor iria pro fim; recolocamos onde o usuario estava.
      restantes.current = null;
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input || document.activeElement !== input) return;
        const posicao = posicaoPorSignificativosRestantes(exibicao, aDireita);
        input.setSelectionRange(posicao, posicao);
      });
      return;
    }

    restantes.current = aDireita;
    onChange(novo);
  };

  const aoSair = (evento) => {
    // Arruma o que ficou "pela metade": "1234." vira "1234"; dinheiro ganha os dois decimais.
    const atual = normalizarArmazenado(valor);
    if (atual.endsWith(".") && decimais > 0) {
      onChange(atual.slice(0, -1));
    } else if (decimais === 2 && atual.includes(".") && atual.split(".")[1].length === 1) {
      onChange(`${atual}0`);
    }
    if (onBlur) onBlur(evento);
  };

  return (
    <div className={`campo-numerico${prefixo ? " com-prefixo" : ""}${sufixo ? " com-sufixo" : ""}`}>
      {prefixo && (
        <span className="campo-numerico-prefixo" aria-hidden="true">
          {prefixo}
        </span>
      )}
      <input
        {...resto}
        ref={inputRef}
        type="text"
        inputMode={decimais > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={exibicao}
        onChange={aoMudar}
        onBlur={aoSair}
      />
      {sufixo && (
        <span className="campo-numerico-sufixo" aria-hidden="true">
          {sufixo}
        </span>
      )}
    </div>
  );
}
