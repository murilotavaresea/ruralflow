// Analise dos graus ja registrados na matricula de um imovel oferecido em garantia (hipoteca ou
// alienacao de imovel). Reproduz a secao "ANALISE MATRICULA QUANDO HIPOTECA OU ALIENACAO" da
// planilha-modelo (aba "HIPOTECA - ALIENACAO IMOVEL"), com a mesma logica das formulas:
//   - cada grau tem uma situacao (lista suspensa da planilha: coluna "STATUS - IF");
//   - COUNTIF/SUMIF por situacao -> quantidades e valores de graus em aberto;
//   - valor tomado        = soma dos valores dos graus em aberto (cancelado nao entra);
//   - total do risco      = valor desta proposta + valor tomado;
//   - cobertura           = valor da avaliacao / total do risco;
//   - grau desta operacao = (graus de hipoteca em aberto + 1) ou (alienacoes em aberto + 1).

// `campo` = onde o grau e somado no resumo; null = nao conta como grau em aberto.
export const SITUACOES_GRAU = [
  { valor: "aberto_credisul", rotulo: "Aberto - Credisul", campo: "hipotecaCredisul" },
  { valor: "aberto_outra_if", rotulo: "Aberto - Outra IF", campo: "hipotecaOutraIf" },
  { valor: "aberto_alienacao_credisul", rotulo: "Aberto - Alienação/Credisul", campo: "alienacaoCredisul" },
  { valor: "aberto_alienacao_outra_if", rotulo: "Aberto - Alienação/Outra IF", campo: "alienacaoOutraIf" },
  { valor: "cancelado", rotulo: "Cancelado", campo: null },
];

const SITUACAO_POR_VALOR = Object.fromEntries(SITUACOES_GRAU.map((s) => [s.valor, s]));

export function rotuloSituacaoGrau(valor) {
  return SITUACAO_POR_VALOR[valor]?.rotulo || "";
}

export function grauEstaAberto(grau) {
  return Boolean(SITUACAO_POR_VALOR[grau?.status]?.campo);
}

const vazio = () => ({ quantidade: 0, valor: 0 });

// `garantia` precisa ser de um tipo com analise de matricula; `valorOperacao` e o valor desta
// proposta de credito (o mesmo para todas as matriculas da operacao).
export function resumirMatricula(garantia, valorOperacao) {
  const graus = Array.isArray(garantia?.graus) ? garantia.graus : [];
  const faixas = {
    hipotecaCredisul: vazio(),
    hipotecaOutraIf: vazio(),
    alienacaoCredisul: vazio(),
    alienacaoOutraIf: vazio(),
  };
  let cancelados = 0;
  let semSituacao = 0;

  graus.forEach((grau) => {
    const situacao = SITUACAO_POR_VALOR[grau.status];
    if (!situacao) {
      semSituacao += 1;
    } else if (!situacao.campo) {
      cancelados += 1;
    } else {
      faixas[situacao.campo].quantidade += 1;
      faixas[situacao.campo].valor += Number(grau.valor) || 0;
    }
  });

  const grausDeHipotecaAbertos = faixas.hipotecaCredisul.quantidade + faixas.hipotecaOutraIf.quantidade;
  const alienacoesAbertas = faixas.alienacaoCredisul.quantidade + faixas.alienacaoOutraIf.quantidade;
  const valorTomado = Object.values(faixas).reduce((soma, faixa) => soma + faixa.valor, 0);

  const avaliacao = Number(garantia?.valor) || 0;
  const operacao = Number(valorOperacao) || 0;
  const outraProposta = Number(garantia?.outraProposta) || 0;

  // Sem o valor da operacao a conta nao faz sentido (so o valor tomado nao e "o risco").
  const totalRisco = operacao > 0 ? operacao + valorTomado : null;
  const cobertura = totalRisco && avaliacao > 0 ? avaliacao / totalRisco : null;
  const totalRiscoComOutraProposta = totalRisco && outraProposta > 0 ? totalRisco + outraProposta : null;
  const coberturaComOutraProposta =
    totalRiscoComOutraProposta && avaliacao > 0 ? avaliacao / totalRiscoComOutraProposta : null;

  const ehAlienacao = garantia?.tipo === "alienacao_imovel";
  const grauDestaOperacao = (ehAlienacao ? alienacoesAbertas : grausDeHipotecaAbertos) + 1;

  return {
    ...faixas,
    grausDeHipotecaAbertos,
    alienacoesAbertas,
    cancelados,
    semSituacao,
    valorTomado,
    totalRisco,
    cobertura,
    outraProposta,
    totalRiscoComOutraProposta,
    coberturaComOutraProposta,
    grauDestaOperacao,
    temGraus: graus.length > 0,
  };
}

function moedaBr(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentualBr(indice) {
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

// Texto da analise da matricula para o parecer e o PDF: uma linha de resumo e uma linha por grau
// (o equivalente do campo "ANOTACOES: 1o / 2o" da planilha). Devolve null se nada foi preenchido.
export function descreverAnaliseMatricula(garantia, valorOperacao) {
  const resumo = resumirMatricula(garantia, valorOperacao);
  const matricula = String(garantia?.matricula || "").trim();
  if (!matricula && !resumo.temGraus) return null;

  const partes = [
    `graus de hipoteca em aberto: ${resumo.grausDeHipotecaAbertos}`,
    `alienações em aberto: ${resumo.alienacoesAbertas}`,
    `valor tomado: ${moedaBr(resumo.valorTomado)}`,
  ];
  if (resumo.totalRisco !== null) {
    partes.push(`total do risco respaldado: ${moedaBr(resumo.totalRisco)}`);
    if (resumo.cobertura !== null) partes.push(`cobertura: ${percentualBr(resumo.cobertura)}`);
  }
  if (resumo.totalRiscoComOutraProposta !== null) {
    const cobertura =
      resumo.coberturaComOutraProposta !== null ? `, cobertura ${percentualBr(resumo.coberturaComOutraProposta)}` : "";
    partes.push(
      `com outra proposta de ${moedaBr(resumo.outraProposta)}: risco ${moedaBr(resumo.totalRiscoComOutraProposta)}${cobertura}`
    );
  }
  partes.push(`grau desta operação: ${resumo.grauDestaOperacao}º`);

  const graus = (garantia.graus || []).map((grau, indice) => {
    const rotulo = String(grau.grau || "").trim() || `${indice + 1}º`;
    const registro = grau.registro ? ` (registro ${grau.registro})` : "";
    const valor = Number(grau.valor) > 0 ? moedaBr(grau.valor) : "valor não informado";
    const vencimento = grau.vencimento ? `, vencimento ${formatarDataBr(grau.vencimento)}` : "";
    const contrato = grau.contrato ? `, contrato ${grau.contrato}` : "";
    return `${rotulo}${registro}: ${valor}${vencimento}${contrato} - ${rotuloSituacaoGrau(grau.status) || "situação não informada"}`;
  });

  return { resumo: `Matrícula ${matricula || "não informada"}: ${partes.join("; ")}.`, graus };
}

// Versao enxuta para o PARECER: so o que o analista leva para a deliberacao. Devolve
// { matricula, graus }: o numero da matricula ("" se nao informado) e uma frase com os graus que
// estao EM ABERTO ("" quando nao ha nenhum). O que esta zerado nao entra na frase. A cobertura
// nao se repete aqui: a da garantia (indiceCoberturaGarantia) ja considera esses graus.
// A analise completa continua em descreverAnaliseMatricula (PDF).
export function descreverMatriculaParecer(garantia, valorOperacao) {
  const resumo = resumirMatricula(garantia, valorOperacao);
  // de quem e o grau: so Credisul, so outra IF ou os dois (com a contagem de cada)
  const deQuem = (credisul, outra) => {
    if (credisul > 0 && outra > 0) return ` (${credisul} Credisul, ${outra} ${outra > 1 ? "outras IFs" : "outra IF"})`;
    return credisul > 0 ? " (Credisul)" : " (outra IF)";
  };
  const partes = [];
  if (resumo.grausDeHipotecaAbertos > 0) {
    const n = resumo.grausDeHipotecaAbertos;
    partes.push(
      `${n} ${n > 1 ? "graus" : "grau"} de hipoteca${deQuem(resumo.hipotecaCredisul.quantidade, resumo.hipotecaOutraIf.quantidade)}`
    );
  }
  if (resumo.alienacoesAbertas > 0) {
    const n = resumo.alienacoesAbertas;
    partes.push(
      `${n} ${n > 1 ? "alienações" : "alienação"}${deQuem(resumo.alienacaoCredisul.quantidade, resumo.alienacaoOutraIf.quantidade)}`
    );
  }
  if (resumo.valorTomado > 0) partes.push(`valor tomado ${moedaBr(resumo.valorTomado)}`);
  return {
    matricula: String(garantia?.matricula || "").trim(),
    graus: partes.length > 0 ? `Graus em aberto: ${partes.join("; ")}.` : "",
  };
}

// Caracterizacao do imovel oferecido em garantia, em uma linha (parecer e PDF). A matricula fica de
// fora porque ja abre a linha da analise dos graus. Devolve null se nada foi preenchido.
export function descreverImovelGarantia(garantia) {
  const campo = (valor) => String(valor ?? "").trim();
  const nome = campo(garantia?.nomeImovel);
  const partes = [];
  if (campo(garantia?.municipio)) partes.push(`município de ${campo(garantia.municipio)}`);
  if (Number(garantia?.areaTotal) > 0) {
    partes.push(`área total de ${Number(garantia.areaTotal).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`);
  }
  if (campo(garantia?.ccir)) partes.push(`CCIR ${campo(garantia.ccir)}`);
  if (campo(garantia?.nirfCib)) partes.push(`NIRF/CIB ${campo(garantia.nirfCib)}`);
  if (campo(garantia?.car)) partes.push(`CAR ${campo(garantia.car)}`);
  if (!nome && partes.length === 0) return null;
  return `Imóvel${nome ? ` "${nome}"` : ""}${partes.length > 0 ? `: ${partes.join(", ")}` : ""}.`;
}

export function formatarDataBr(iso) {
  const partes = String(iso || "").split("-");
  if (partes.length !== 3 || partes.some((p) => p === "")) return "";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
