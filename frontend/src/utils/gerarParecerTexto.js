import { PROGRAMAS } from "./operacaoModel";
import { rotuloTipoGarantia } from "./garantiaModel";
import { calcularIndiceGarantia } from "./capacidadePagamento";

function formatarMoeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero === 0) return null;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rotuloPrograma(chave) {
  return PROGRAMAS.find((p) => p.chave === chave)?.rotulo || chave;
}

// Recompoe o texto corrido do parecer a partir dos campos preenchidos — equivalente ao que
// a aba PARECER do Excel monta com CONCAT/IF encadeados, mas escrito do zero como uma unica
// funcao de composicao (sem as referencias quebradas do arquivo original).
export default function gerarParecerTexto(operacao, capacidade) {
  const { proponente, proposta } = operacao;
  const linhas = [];

  linhas.push(`PARECER TECNICO - ANALISE DE OPERACAO DE CREDITO RURAL`);
  linhas.push(`Programa: ${rotuloPrograma(proposta.programa)}`);
  linhas.push("");

  if (proponente.nome) {
    linhas.push(
      `Proponente: ${proponente.nome}${proponente.documento ? ` (${proponente.documento})` : ""}.`
    );
  }
  if (proponente.setorAtuacao) linhas.push(`Setor de atuacao: ${proponente.setorAtuacao}.`);
  if (proponente.risco || proponente.pd || proponente.score) {
    const partes = [];
    if (proponente.risco) partes.push(`risco ${proponente.risco}`);
    if (proponente.pd) partes.push(`PD ${proponente.pd}`);
    if (proponente.score) partes.push(`score ${proponente.score}`);
    linhas.push(`Classificacao de risco: ${partes.join(", ")}.`);
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
    const carencia = proposta.carenciaMeses ? `${proposta.carenciaMeses} meses de carencia` : "sem carencia informada";
    linhas.push(`Valor da operacao: ${valorOperacao}, ${prazo}, ${carencia}.`);
  }
  if (proposta.taxaAnual) linhas.push(`Taxa de juros: ${proposta.taxaAnual}% a.a.`);
  if (proposta.municipio) linhas.push(`Municipio do empreendimento: ${proposta.municipio}.`);

  if (capacidade?.beneficiario) {
    linhas.push("");
    const { rendaLiquida, indice } = capacidade.beneficiario;
    const rendaLiquidaFmt = formatarMoeda(rendaLiquida);
    if (rendaLiquidaFmt) {
      const indiceTexto =
        indice === null
          ? "nao foi possivel calcular (confira valor da operacao, taxa e prazo)"
          : `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
      linhas.push(
        `Capacidade de pagamento do beneficiario: renda liquida estimada em ${rendaLiquidaFmt}, indice de capacidade de ${indiceTexto}.`
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
    const somaValores = garantias.reduce((soma, g) => soma + (Number(g.valor) || 0), 0);
    garantias.forEach((g) => {
      const valorFmt = formatarMoeda(g.valor) || "valor nao informado";
      const indice = calcularIndiceGarantia(g.valor, proposta.valorOperacao);
      const coberturaTexto = indice === null ? "" : ` (cobertura de ${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`;
      const nomes = (g.garantidores || []).map((gd) => gd.nome).filter(Boolean).join(", ");
      linhas.push(
        `  - ${rotuloTipoGarantia(g.tipo)}: ${valorFmt}${coberturaTexto}${nomes ? `, garantidor(es): ${nomes}` : ""}.`
      );
    });
    const indiceTotal = calcularIndiceGarantia(somaValores, proposta.valorOperacao);
    if (indiceTotal !== null) {
      linhas.push(
        `  Cobertura total das garantias: ${(indiceTotal * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%.`
      );
    }
  }

  linhas.push("");
  linhas.push(
    "[Preencher observacoes adicionais sobre pendencias e recomendacao final antes de encaminhar o parecer.]"
  );

  return linhas.join("\n");
}
