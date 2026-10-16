import { rotuloPrograma } from "./operacaoModel";
import {
  indiceCoberturaGarantia,
  indiceCoberturaTotal,
  rotuloTipoGarantia,
  tipoSemValor,
  tipoTemAnaliseMatricula,
} from "./garantiaModel";
import { descreverAnaliseMatricula, descreverImovelGarantia } from "./analiseMatricula";

function formatarMoeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero === 0) return null;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Recompoe o texto corrido do parecer a partir dos campos preenchidos — equivalente ao que
// a aba PARECER do Excel monta com CONCAT/IF encadeados, mas escrito do zero como uma unica
// funcao de composicao (sem as referencias quebradas do arquivo original).
export default function gerarParecerTexto(operacao, capacidade) {
  const { proponente, proposta } = operacao;
  const linhas = [];

  linhas.push(`PARECER TÉCNICO - ANÁLISE DE OPERAÇÃO DE CRÉDITO RURAL`);
  linhas.push(`Fonte de recurso: ${rotuloPrograma(proposta.programa)}`);
  linhas.push("");

  if (proponente.nome) {
    linhas.push(
      `Proponente: ${proponente.nome}${proponente.documento ? ` (${proponente.documento})` : ""}.`
    );
  }
  if (proponente.setorAtuacao) linhas.push(`Setor de atuação: ${proponente.setorAtuacao}.`);
  if (proponente.risco || proponente.pd || proponente.score) {
    const partes = [];
    if (proponente.risco) partes.push(`risco ${proponente.risco}`);
    if (proponente.pd) partes.push(`PD ${proponente.pd}`);
    if (proponente.score) partes.push(`score ${proponente.score}`);
    linhas.push(`Classificação de risco: ${partes.join(", ")}.`);
  }
  const renda = formatarMoeda(proponente.rendaAnual);
  if (renda) linhas.push(`Renda anual informada: ${renda}.`);

  linhas.push("");
  if (proposta.linhaCreditoDescricao || proposta.finalidade) {
    linhas.push(
      `Proposta: linha "${proposta.linhaCreditoDescricao || "a definir"}", finalidade "${
        proposta.finalidade || "a definir"
      }".`
    );
  }
  const valorOperacao = formatarMoeda(proposta.valorOperacao);
  if (valorOperacao) {
    const prazo = proposta.prazoMeses ? `${proposta.prazoMeses} meses` : "prazo a definir";
    const carencia = proposta.carenciaMeses ? `${proposta.carenciaMeses} meses de carência` : "sem carência informada";
    linhas.push(`Valor da operação: ${valorOperacao}, ${prazo}, ${carencia}.`);
  }
  if (proposta.taxaAnual) linhas.push(`Taxa de juros: ${proposta.taxaAnual}% a.a.`);
  if (proposta.municipio) linhas.push(`Município do empreendimento: ${proposta.municipio}.`);

  if (capacidade?.beneficiario) {
    linhas.push("");
    const { rendaLiquida, indice } = capacidade.beneficiario;
    const rendaLiquidaFmt = formatarMoeda(rendaLiquida);
    if (rendaLiquidaFmt) {
      const indiceTexto =
        indice === null
          ? "não foi possível calcular (confira valor da operação, taxa e prazo)"
          : `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
      linhas.push(
        `Capacidade de pagamento do beneficiário: renda líquida estimada em ${rendaLiquidaFmt}, índice de capacidade de ${indiceTexto}.`
      );
    }
  }

  const imoveis = operacao.areaBeneficiada || [];
  if (imoveis.length > 0) {
    linhas.push("");
    linhas.push("Área beneficiada:");
    imoveis.forEach((imovel, indice) => {
      const nomes = (imovel.proprietarios || []).map((p) => p.nome).filter(Boolean).join(", ");
      const areaTexto = imovel.areaBeneficiadaHa ? `${imovel.areaBeneficiadaHa} ha beneficiados` : "área não informada";
      linhas.push(
        `  - ${imovel.nomeImovel || `Imóvel ${indice + 1}`} (matrícula ${imovel.matricula || "não informada"}, ${
          imovel.municipio || "município não informado"
        }): ${areaTexto}${nomes ? `, proprietário(s): ${nomes}` : ""}.`
      );
    });
  }

  const garantias = operacao.garantias || [];
  if (garantias.length > 0) {
    linhas.push("");
    linhas.push("Garantias:");
    garantias.forEach((g) => {
      const indice = indiceCoberturaGarantia(g, proposta.valorOperacao);
      const coberturaTexto = indice === null ? "" : ` (cobertura de ${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`;
      const nomes = (g.garantidores || []).map((gd) => gd.nome).filter(Boolean).join(", ");
      // o aval nao tem valor proprio: cobre a operacao toda
      const valorTexto = tipoSemValor(g.tipo)
        ? "cobre a totalidade da operação"
        : formatarMoeda(g.valor) || "valor não informado";
      linhas.push(
        `  - ${rotuloTipoGarantia(g.tipo)}: ${valorTexto}${coberturaTexto}${nomes ? `, garantidor(es): ${nomes}` : ""}.`
      );
      // analise dos graus ja registrados na matricula (hipoteca / alienacao de imovel)
      const imovel = tipoTemAnaliseMatricula(g.tipo) ? descreverImovelGarantia(g) : null;
      if (imovel) linhas.push(`    ${imovel}`);
      const analise = tipoTemAnaliseMatricula(g.tipo) ? descreverAnaliseMatricula(g, proposta.valorOperacao) : null;
      if (analise) {
        linhas.push(`    ${analise.resumo}`);
        analise.graus.forEach((grau) => linhas.push(`      - ${grau}`));
      }
    });
    const indiceTotal = indiceCoberturaTotal(garantias, proposta.valorOperacao);
    if (indiceTotal !== null) {
      linhas.push(
        `  Cobertura total das garantias: ${(indiceTotal * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%.`
      );
    }
  }

  linhas.push("");
  linhas.push(
    "[Preencher observações adicionais sobre pendências e recomendação final antes de encaminhar o parecer.]"
  );

  return linhas.join("\n");
}
