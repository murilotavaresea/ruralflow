import { useEffect, useRef, useState } from "react";
import GarantiaCard from "./GarantiaCard";
import { TIPOS_GARANTIA, rotuloTipoGarantia } from "../utils/garantiaModel";
import { calcularIndiceGarantia } from "../utils/capacidadePagamento";
import "./GarantiasPainel.css";

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarPercentual(indice) {
  if (indice === null) return "-";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

// Rotulo da aba: tipo da garantia + a posicao dela entre as garantias do mesmo tipo
// (ex: "Hipoteca 1", "Hipoteca 2", "Aval 1"), pra diferenciar quando ha mais de uma do
// mesmo tipo.
function rotuloAbaGarantia(garantia, indice, garantias) {
  const indiceNoTipo = garantias.slice(0, indice + 1).filter((g) => g.tipo === garantia.tipo).length;
  return `${rotuloTipoGarantia(garantia.tipo)} ${indiceNoTipo}`;
}

export default function GarantiasPainel({ garantias, checklistGarantiasDef, valorOperacao, acoes }) {
  const [tipoNovo, setTipoNovo] = useState(TIPOS_GARANTIA[0].chave);

  // So uma garantia fica visivel por vez (abas em vez de empilhar todas pra baixo, que
  // poluia muito a tela com varias garantias cadastradas). Mesmo padrao do painel de area
  // beneficiada.
  const [garantiaAtivaId, setGarantiaAtivaId] = useState(garantias[0]?.id ?? null);
  const quantidadeAnterior = useRef(garantias.length);

  useEffect(() => {
    const cresceu = garantias.length > quantidadeAnterior.current;
    quantidadeAnterior.current = garantias.length;

    if (cresceu) {
      // Garantia nova: pula automaticamente pra ela, ja que e o unico jeito de "ver" o que
      // acabou de ser criado agora que so uma fica visivel por vez.
      setGarantiaAtivaId(garantias[garantias.length - 1].id);
      return;
    }

    if (garantias.length === 0) {
      setGarantiaAtivaId(null);
    } else if (!garantias.some((garantia) => garantia.id === garantiaAtivaId)) {
      // Rede de seguranca pra qualquer outro jeito do id ativo sumir da lista — volta pra
      // primeira.
      setGarantiaAtivaId(garantias[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garantias]);

  const removerGarantia = (garantiaId) => {
    if (garantiaId === garantiaAtivaId) {
      const indiceRemovido = garantias.findIndex((garantia) => garantia.id === garantiaId);
      const restantes = garantias.filter((garantia) => garantia.id !== garantiaId);
      const proxima = restantes[Math.min(indiceRemovido, restantes.length - 1)];
      setGarantiaAtivaId(proxima ? proxima.id : null);
    }
    acoes.remover(garantiaId);
  };

  const garantiaAtiva = garantias.find((garantia) => garantia.id === garantiaAtivaId) || null;

  const somaValores = garantias.reduce((soma, g) => soma + (Number(g.valor) || 0), 0);
  const indiceTotal = calcularIndiceGarantia(somaValores, valorOperacao);

  return (
    <div className="garantias-painel">
      <div className="cartao">
        <h2>Garantias</h2>
        <p className="cartao-descricao">
          Cadastre uma ou mais garantias da operação. Cada tipo tem seu próprio checklist de
          documentos e modelo de texto jurídico, editáveis no painel de Administração.
        </p>

        <div className="garantias-resumo">
          <span>
            Valor total das garantias: <strong>{formatarMoeda(somaValores)}</strong>
          </span>
          <span>
            Cobertura total: <strong>{formatarPercentual(indiceTotal)}</strong>
          </span>
        </div>

        <div className="garantias-adicionar">
          <select value={tipoNovo} onChange={(e) => setTipoNovo(e.target.value)}>
            {TIPOS_GARANTIA.map((t) => (
              <option key={t.chave} value={t.chave}>
                {t.rotulo}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => acoes.adicionar(tipoNovo)}>
            + Adicionar garantia
          </button>
        </div>
      </div>

      {garantias.length === 0 && <p className="cartao-descricao">Nenhuma garantia cadastrada ainda.</p>}

      {garantias.length > 0 && (
        <nav className="garantias-abas">
          {garantias.map((garantia, indice) => (
            <button
              key={garantia.id}
              type="button"
              className={garantia.id === garantiaAtivaId ? "ativa" : ""}
              onClick={() => setGarantiaAtivaId(garantia.id)}
            >
              {rotuloAbaGarantia(garantia, indice, garantias)}
            </button>
          ))}
        </nav>
      )}

      {garantiaAtiva && (
        <GarantiaCard
          garantia={garantiaAtiva}
          checklistDef={checklistGarantiasDef[garantiaAtiva.tipo]}
          valorOperacao={valorOperacao}
          onMudarCampo={(campo, valor) => acoes.mudarCampo(garantiaAtiva.id, campo, valor)}
          onMudarChecklistBem={(chave, estado) => acoes.mudarChecklistBem(garantiaAtiva.id, chave, estado)}
          onAdicionarGarantidor={() => acoes.adicionarGarantidor(garantiaAtiva.id)}
          onRemoverGarantidor={(garantidorId) => acoes.removerGarantidor(garantiaAtiva.id, garantidorId)}
          onMudarCampoGarantidor={(garantidorId, campo, valor) =>
            acoes.mudarCampoGarantidor(garantiaAtiva.id, garantidorId, campo, valor)
          }
          onMudarChecklistGarantidor={(garantidorId, chave, estado) =>
            acoes.mudarChecklistGarantidor(garantiaAtiva.id, garantidorId, chave, estado)
          }
          onRemover={() => removerGarantia(garantiaAtiva.id)}
        />
      )}
    </div>
  );
}
