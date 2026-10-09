// Replica a logica da aba "CAPACIDADE BNDES" do Excel original: taxa periodica composta a
// partir da taxa anual, parcela via formula de anuidade (PMT), e capacidade de pagamento
// como renda liquida dividida pelo total pago por ano.
//
// Diferenca deliberada em relacao ao Excel original: o Excel usa 3 parcelas/ano para
// periodicidade "Trimestral" (deveria ser 4) tanto no divisor da capacidade quanto no
// numero de parcelas. Aqui usamos os valores financeiramente corretos (4 parcelas/ano no
// trimestral) — ver PERIODOS_POR_ANO abaixo.

const DIAS_POR_PERIODO = {
  Anual: 365,
  Semestral: 180,
  Trimestral: 90,
  Mensal: 30,
};

const MESES_POR_PERIODO = {
  Anual: 12,
  Semestral: 6,
  Trimestral: 3,
  Mensal: 1,
};

const PERIODOS_POR_ANO = {
  Anual: 1,
  Semestral: 2,
  Trimestral: 4,
  Mensal: 12,
};

export function taxaPeriodica(taxaAnualPercentual, periodicidade) {
  const dias = DIAS_POR_PERIODO[periodicidade];
  const taxaInformada = Number(taxaAnualPercentual);
  if (!dias || !Number.isFinite(taxaInformada)) return 0;
  const taxaAnual = taxaInformada / 100;
  return Math.pow(1 + taxaAnual, dias / 365) - 1;
}

export function numeroParcelas(prazoMeses, carenciaMeses, periodicidade) {
  const mesesPorPeriodo = MESES_POR_PERIODO[periodicidade];
  if (!mesesPorPeriodo) return 0;
  const meses = Math.max((Number(prazoMeses) || 0) - (Number(carenciaMeses) || 0), 0);
  return meses / mesesPorPeriodo;
}

export function periodosPorAno(periodicidade) {
  return PERIODOS_POR_ANO[periodicidade] || 1;
}

// Formula de anuidade padrao (equivalente ao PMT do Excel): parcela que amortiza
// `valorOperacao` em `n` parcelas a uma taxa periodica `taxa`.
export function valorParcela({ valorOperacao, taxaAnualPercentual, prazoMeses, carenciaMeses, periodicidade }) {
  const taxa = taxaPeriodica(taxaAnualPercentual, periodicidade);
  const n = numeroParcelas(prazoMeses, carenciaMeses, periodicidade);
  const valor = Number(valorOperacao) || 0;

  if (!n || !valor) return 0;
  if (taxa === 0) return valor / n;

  return (valor * taxa) / (1 - Math.pow(1 + taxa, -n));
}

// Renda liquida = renda bruta - despesas (50% da renda bruta por padrao, editavel).
// Capacidade de pagamento = renda liquida / (parcela x parcelas por ano) - 1.
// Indice > 0 significa que a renda liquida cobre a parcela anual com folga.
export function calcularCapacidade({ rendaBruta, despesasPercentual = 50, parcela, periodicidade }) {
  const renda = Number(rendaBruta) || 0;
  const despesas = renda * ((Number(despesasPercentual) || 0) / 100);
  const rendaLiquida = renda - despesas;
  const totalAnual = (Number(parcela) || 0) * periodosPorAno(periodicidade);

  const indice = rendaLiquida > 0 && totalAnual > 0 ? rendaLiquida / totalAnual - 1 : null;

  return { rendaLiquida, despesas, indice };
}

// Indice de garantia / percentual de cobertura, equivalente a I17 da aba CAPACIDADE BNDES:
// valor da garantia dividido pelo valor da operacao.
export function calcularIndiceGarantia(valorGarantia, valorOperacao) {
  const garantia = Number(valorGarantia) || 0;
  const operacao = Number(valorOperacao) || 0;
  if (!operacao) return null;
  return garantia / operacao;
}
