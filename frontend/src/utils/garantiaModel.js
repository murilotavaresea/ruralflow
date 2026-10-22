import { resumirMatricula } from "./analiseMatricula";

export const TIPOS_GARANTIA = [
  // analiseMatricula: o imovel tem matricula, cujos graus ja registrados precisam ser avaliados
  // (aba "HIPOTECA - ALIENACAO IMOVEL" da planilha-modelo).
  { chave: "hipoteca", rotulo: "Hipoteca", temGrau: true, analiseMatricula: true },
  { chave: "alienacao_imovel", rotulo: "Alienação de imóvel", temGrau: true, analiseMatricula: true },
  { chave: "alienacao_movel", rotulo: "Alienação de bem móvel", temGrau: true },
  { chave: "penhor_pecuario", rotulo: "Penhor pecuário", temGrau: true },
  { chave: "penhor_agricola", rotulo: "Penhor agrícola", temGrau: true },
  // Aval e garantia pessoal: cobre a operacao inteira, entao nao tem valor proprio.
  { chave: "aval", rotulo: "Aval", temGrau: false, semValor: true },
];

export function rotuloTipoGarantia(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.rotulo || tipo;
}

export function tipoTemGrau(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.temGrau ?? true;
}

// Hipoteca e alienacao de imovel: pedem a analise dos graus ja existentes na matricula.
export function tipoTemAnaliseMatricula(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.analiseMatricula ?? false;
}

// Garantias sem valor proprio (aval): a tela nao pede valor e a cobertura e sempre 100%.
export function tipoSemValor(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.semValor ?? false;
}

// Cobertura da operacao por uma garantia (1 = 100%); null quando nao da pra calcular.
// Hipoteca / alienacao de imovel: o que ja esta em aberto na matricula entra no risco, ou seja,
// cobertura = avaliacao / (valor da operacao + valor tomado), como na planilha-modelo.
export function indiceCoberturaGarantia(garantia, valorOperacao) {
  if (tipoSemValor(garantia.tipo)) return 1;
  const operacao = Number(valorOperacao) || 0;
  if (!operacao) return null;
  const tomado = tipoTemAnaliseMatricula(garantia.tipo) ? resumirMatricula(garantia, operacao).valorTomado : 0;
  return (Number(garantia.valor) || 0) / (operacao + tomado);
}

// Alguma garantia de imovel tem grau em aberto na matricula (a cobertura ja o considera).
export function temGrausEmAberto(garantias) {
  return (garantias || []).some((g) => {
    if (!tipoTemAnaliseMatricula(g.tipo)) return false;
    const resumo = resumirMatricula(g, 0);
    return resumo.grausDeHipotecaAbertos + resumo.alienacoesAbertas > 0;
  });
}

// Soma das coberturas das garantias reais (sem o aval); null sem o valor da operacao.
export function indiceCoberturaReais(garantias, valorOperacao) {
  const operacao = Number(valorOperacao) || 0;
  if (!operacao) return null;
  return (garantias || [])
    .filter((g) => !tipoSemValor(g.tipo))
    .reduce((soma, g) => soma + (indiceCoberturaGarantia(g, operacao) || 0), 0);
}

// Soma dos valores das garantias. O aval conta como o valor da operacao (cobre tudo) e uma
// unica vez: mais de um aval nao aumenta a cobertura, so acrescenta garantidores.
export function somaValorGarantias(garantias, valorOperacao) {
  const lista = garantias || [];
  const reais = lista
    .filter((g) => !tipoSemValor(g.tipo))
    .reduce((soma, g) => soma + (Number(g.valor) || 0), 0);
  const temAval = lista.some((g) => tipoSemValor(g.tipo));
  return reais + (temAval ? Number(valorOperacao) || 0 : 0);
}

// Cobertura total (1 = 100%): soma da cobertura de cada garantia (ja considerando os graus em
// aberto dos imoveis); o aval conta 100%, uma unica vez. Sem valor de operacao informado ainda,
// so se sabe que um aval ja cobre 100%.
export function indiceCoberturaTotal(garantias, valorOperacao) {
  const operacao = Number(valorOperacao) || 0;
  const temAval = (garantias || []).some((g) => tipoSemValor(g.tipo));
  if (operacao > 0) return indiceCoberturaReais(garantias, operacao) + (temAval ? 1 : 0);
  return temAval ? 1 : null;
}

function novoId(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Um registro (grau) ja existente na matricula oferecida em garantia.
export function novoGrau() {
  return { id: novoId("grau"), registro: "", grau: "", valor: "", vencimento: "", contrato: "", status: "" };
}

export function novoGarantidor() {
  return { id: novoId("grt"), nome: "", documento: "", checklist: {} };
}

export function novaGarantia(tipo) {
  return {
    id: novoId("gar"),
    tipo,
    valor: "",
    grau: "",
    // caracterizacao do imovel oferecido (hipoteca / alienacao de imovel)
    nomeImovel: "",
    matricula: "",
    ccir: "",
    nirfCib: "",
    areaTotal: "",
    car: "",
    municipio: "",
    outraProposta: "",
    graus: [],
    checklist: {},
    garantidores: [novoGarantidor()],
  };
}
