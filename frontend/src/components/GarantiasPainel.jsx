import { useState } from "react";
import GarantiaCard from "./GarantiaCard";
import EstadoVazio from "./EstadoVazio";
import {
  TIPOS_GARANTIA,
  indiceCoberturaTotal,
  rotuloTipoGarantia,
  somaValorGarantias,
  temGrausEmAberto,
  tipoSemValor,
} from "../utils/garantiaModel";
import useAbaAtiva from "../utils/useAbaAtiva";
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
  const { ativoId, setAtivoId, selecionarVizinho } = useAbaAtiva(garantias);

  const removerGarantia = (garantiaId) => {
    selecionarVizinho(garantiaId);
    acoes.remover(garantiaId);
  };

  const garantiaAtiva = garantias.find((garantia) => garantia.id === ativoId) || null;

  const somaValores = somaValorGarantias(garantias, valorOperacao);
  const indiceTotal = indiceCoberturaTotal(garantias, valorOperacao);
  const temAval = garantias.some((g) => tipoSemValor(g.tipo));

  return (
    <div className="garantias-painel">
      <div className="cartao">
        <h2>Garantias</h2>
        <p className="cartao-descricao">
          Cadastre uma ou mais garantias da operação. Cada tipo tem seu próprio checklist de documentos e
          modelo de texto jurídico, editáveis no painel de Administração.
        </p>

        <div className="garantias-resumo">
          <span>
            Valor total das garantias: <strong>{formatarMoeda(somaValores)}</strong>
            {temAval && <small> (o aval cobre toda a operação)</small>}
          </span>
          <span>
            Cobertura total: <strong>{formatarPercentual(indiceTotal)}</strong>
            {temGrausEmAberto(garantias) && <small> (considera os graus em aberto)</small>}
          </span>
        </div>

        <div className="garantias-adicionar">
          <label className="sr-only" htmlFor="garantia-tipo-novo">
            Tipo da nova garantia
          </label>
          <select id="garantia-tipo-novo" value={tipoNovo} onChange={(e) => setTipoNovo(e.target.value)}>
            {TIPOS_GARANTIA.map((t) => (
              <option key={t.chave} value={t.chave}>
                {t.rotulo}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primario" onClick={() => acoes.adicionar(tipoNovo)}>
            + Adicionar garantia
          </button>
        </div>
      </div>

      {garantias.length === 0 && (
        <EstadoVazio
          icone="⛨"
          titulo="Nenhuma garantia cadastrada"
          descricao="Escolha o tipo acima e adicione a primeira garantia da operação. O checklist de documentos aparece em seguida."
        >
          <button type="button" className="btn" onClick={() => acoes.adicionar(tipoNovo)}>
            + Adicionar {rotuloTipoGarantia(tipoNovo).toLowerCase()}
          </button>
        </EstadoVazio>
      )}

      {garantias.length > 0 && (
        <nav className="garantias-abas" aria-label="Garantias da operação">
          {garantias.map((garantia, indice) => (
            <button
              key={garantia.id}
              type="button"
              className={garantia.id === ativoId ? "ativa" : ""}
              aria-current={garantia.id === ativoId ? "true" : undefined}
              onClick={() => setAtivoId(garantia.id)}
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
          onAdicionarGrau={() => acoes.adicionarGrau(garantiaAtiva.id)}
          onRemoverGrau={(grauId) => acoes.removerGrau(garantiaAtiva.id, grauId)}
          onMudarCampoGrau={(grauId, campo, valor) => acoes.mudarCampoGrau(garantiaAtiva.id, grauId, campo, valor)}
          onRemover={() => removerGarantia(garantiaAtiva.id)}
        />
      )}
    </div>
  );
}
