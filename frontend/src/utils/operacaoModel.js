import { filtrarGruposPorFonteELinha } from "./linhaModel";

// "Fontes de recurso" reais da operacao (nao confundir com "linha", que e a categoria de
// checklist dentro de cada uma — ver utils/linhaModel.js). FCO Rural/Empresarial nao sao mais
// fontes separadas: viram linhas dentro de "fco" (ver normalizarOperacao abaixo pra quem
// tinha operacao salva com o formato antigo).
export const PROGRAMAS = [
  { chave: "bndes", rotulo: "BNDES" },
  { chave: "fno", rotulo: "FNO" },
  { chave: "fco", rotulo: "FCO" },
  { chave: "controlado", rotulo: "Controlado" },
  { chave: "livre", rotulo: "Livre" },
];

export const PERIODICIDADES = ["Anual", "Semestral", "Trimestral", "Mensal"];

export function criarOperacaoVazia() {
  const agora = new Date().toISOString();
  return {
    versao: 1,
    criadoEm: agora,
    atualizadoEm: agora,
    proponente: {
      nome: "",
      documento: "",
      setorAtuacao: "",
      risco: "",
      pd: "",
      qrsa: "",
      score: "",
      rendaAnual: "",
      patrimonioAvaliado: "",
      checklist: {},
    },
    proposta: {
      programa: "bndes",
      linhaChecklist: "",
      linhaCreditoCodigo: "",
      linhaCreditoDescricao: "",
      finalidade: "",
      valorOperacao: "",
      prazoMeses: "",
      carenciaMeses: "",
      taxaAnual: "",
      tipoCedula: "",
      seguroPrestamista: "",
      periodicidadePagamento: "Anual",
      municipio: "",
      tipoEmpreendimento: "",
      limiteFinanciavelManual: "",
    },
    capacidadePagamento: {
      despesasPercentualPadrao: 50,
      beneficiario: { rendaBruta: "", despesasPercentual: "" },
      avalistas: [],
    },
    checklistDocumental: {},
    garantias: [],
    areaBeneficiada: [],
    parecerTexto: "",
    parecerEditadoManualmente: false,
    devolutivaTextoFinal: "",
    devolutivaEditadaManualmente: false,
  };
}

export function novoAvalista() {
  return { nome: "", rendaBruta: "", despesasPercentual: "" };
}

// Preenche com os valores padrao qualquer campo que uma operacao salva antes de uma
// funcionalidade nova (ex: localStorage de uma versao anterior do app, ou um .json
// exportado antigo) nao tenha — sem isso, abrir uma operacao salva antes do modulo de
// Garantias (ou de qualquer campo novo futuro) quebra a tela com "Cannot read properties of
// undefined".
// v1.3 tinha "FCO Rural" e "FCO Empresarial" como programas separados; na v1.4 viraram
// linhas dentro de um unico programa "fco". Quem tinha operacao salva com o valor antigo
// precisa reescolher a linha (Rural/Empresarial) uma vez — o id antigo de linha nao existe
// mais do jeito que era, entao limpa o campo em vez de manter um id invalido.
function normalizarProposta(proposta, padrao) {
  const base = { ...padrao, ...proposta };
  if (base.programa === "fco_rural" || base.programa === "fco_empresarial") {
    return { ...base, programa: "fco", linhaChecklist: "" };
  }
  return base;
}

// v1.4 e anteriores guardavam o checklist Documental separado por programa:
// {programa: {itemChave: estado}}. Na v1.5 o catalogo de itens virou unico (ver
// utils/linhaModel.js), entao o estado tambem achata pra {itemChave: estado} — ids de item
// ja sao unicos globalmente, sem risco de colisao entre programas diferentes.
const _PROGRAMAS_CHAVES_CONHECIDAS = ["bndes", "fno", "fco", "controlado", "livre", "fco_rural", "fco_empresarial"];

function normalizarChecklistDocumental(checklistDocumental) {
  const chaves = Object.keys(checklistDocumental || {});
  const pareceFormatoAntigo =
    chaves.length > 0 && chaves.every((chave) => _PROGRAMAS_CHAVES_CONHECIDAS.includes(chave));
  if (!pareceFormatoAntigo) return checklistDocumental || {};

  const achatado = {};
  Object.values(checklistDocumental).forEach((porItem) => {
    Object.entries(porItem || {}).forEach(([itemChave, estado]) => {
      achatado[itemChave] = estado;
    });
  });
  return achatado;
}

export function normalizarOperacao(operacao) {
  const vazia = criarOperacaoVazia();
  if (!operacao) return vazia;
  return {
    ...vazia,
    ...operacao,
    proponente: { ...vazia.proponente, ...operacao.proponente },
    proposta: normalizarProposta(operacao.proposta, vazia.proposta),
    capacidadePagamento: {
      ...vazia.capacidadePagamento,
      ...operacao.capacidadePagamento,
      beneficiario: {
        ...vazia.capacidadePagamento.beneficiario,
        ...operacao.capacidadePagamento?.beneficiario,
      },
    },
    checklistDocumental: normalizarChecklistDocumental(operacao.checklistDocumental),
    garantias: operacao.garantias || [],
    areaBeneficiada: operacao.areaBeneficiada || [],
  };
}

// Estado padrao de um item de checklist (painel Proponente ou Documental) dentro de uma
// operacao. Status "" significa "ainda nao avaliado" — soh vira "ok"/"na"/"pendente" quando o
// analista clica num dos botoes; e importante nao nascer como "pendente", senao todo item
// nao avaliado mostraria a caixa de devolutiva desde o inicio. `camposTexto` so e usado
// quando o item e do tipo "texto" (ver ChecklistGrupo.jsx).
export function novoEstadoItem() {
  return { status: "", observacao: "", devolutivaTexto: "", camposTexto: {} };
}

function contarStatusChecklist(itensStatus, totalItens) {
  const valores = Object.values(itensStatus || {});
  const ok = valores.filter((i) => i?.status === "ok").length;
  const na = valores.filter((i) => i?.status === "na").length;
  const pendente = valores.filter((i) => i?.status === "pendente").length;
  const preenchidos = ok + na + pendente;
  const percentual = totalItens > 0 ? Math.round((preenchidos / totalItens) * 100) : 0;
  return { ok, na, pendente, totalItens, preenchidos, percentual };
}

export function progressoChecklistProponente(operacao, checklistProponenteDef) {
  const grupos = filtrarGruposPorFonteELinha(
    checklistProponenteDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  const totalItens = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  return contarStatusChecklist(operacao.proponente.checklist, totalItens);
}

export function progressoChecklistDocumental(operacao, checklistDocumentosDef) {
  const grupos = filtrarGruposPorFonteELinha(
    checklistDocumentosDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  const totalItens = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  return contarStatusChecklist(operacao.checklistDocumental, totalItens);
}

// Soma o checklist do bem + de todos os garantidores de todas as garantias da operacao.
export function progressoChecklistGarantias(operacao, checklistGarantiasDef) {
  let totalItens = 0;
  let preenchidos = 0;

  (operacao.garantias || []).forEach((garantia) => {
    const def = checklistGarantiasDef[garantia.tipo] || { bem: [], proprietario: [] };

    const totalBem = def.bem.reduce((soma, grupo) => soma + grupo.itens.length, 0);
    const contagemBem = contarStatusChecklist(garantia.checklist, totalBem);
    totalItens += contagemBem.totalItens;
    preenchidos += contagemBem.preenchidos;

    const totalGarantidor = def.proprietario.reduce((soma, grupo) => soma + grupo.itens.length, 0);
    (garantia.garantidores || []).forEach((garantidor) => {
      const contagemGarantidor = contarStatusChecklist(garantidor.checklist, totalGarantidor);
      totalItens += contagemGarantidor.totalItens;
      preenchidos += contagemGarantidor.preenchidos;
    });
  });

  const percentual = totalItens > 0 ? Math.round((preenchidos / totalItens) * 100) : 0;
  return { totalItens, preenchidos, percentual };
}

// Soma o checklist do imovel + de todos os proprietarios de todos os imoveis da operacao —
// mesma logica de progressoChecklistGarantias, sem a dimensao de tipo.
export function progressoChecklistAreaBeneficiada(operacao, checklistAreaBeneficiadaDef) {
  const defBruta = checklistAreaBeneficiadaDef || { bem: [], proprietario: [] };
  const def = {
    bem: filtrarGruposPorFonteELinha(defBruta.bem, operacao.proposta.programa, operacao.proposta.linhaChecklist),
    proprietario: filtrarGruposPorFonteELinha(
      defBruta.proprietario,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    ),
  };
  let totalItens = 0;
  let preenchidos = 0;

  const totalImovel = def.bem.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const totalProprietario = def.proprietario.reduce((soma, grupo) => soma + grupo.itens.length, 0);

  (operacao.areaBeneficiada || []).forEach((imovel) => {
    const contagemImovel = contarStatusChecklist(imovel.checklist, totalImovel);
    totalItens += contagemImovel.totalItens;
    preenchidos += contagemImovel.preenchidos;

    (imovel.proprietarios || []).forEach((proprietario) => {
      const contagemProprietario = contarStatusChecklist(proprietario.checklist, totalProprietario);
      totalItens += contagemProprietario.totalItens;
      preenchidos += contagemProprietario.preenchidos;
    });
  });

  const percentual = totalItens > 0 ? Math.round((preenchidos / totalItens) * 100) : 0;
  return { totalItens, preenchidos, percentual };
}

export function progressoGeral(
  operacao,
  checklistProponenteDef,
  checklistDocumentosDef,
  checklistGarantiasDef,
  checklistAreaBeneficiadaDef
) {
  const proponente = progressoChecklistProponente(operacao, checklistProponenteDef);
  const documentos = progressoChecklistDocumental(operacao, checklistDocumentosDef);
  const garantias = progressoChecklistGarantias(operacao, checklistGarantiasDef || {});
  const areaBeneficiada = progressoChecklistAreaBeneficiada(operacao, checklistAreaBeneficiadaDef);
  const totalItens = proponente.totalItens + documentos.totalItens + garantias.totalItens + areaBeneficiada.totalItens;
  const preenchidos =
    proponente.preenchidos + documentos.preenchidos + garantias.preenchidos + areaBeneficiada.preenchidos;
  const percentual = totalItens > 0 ? Math.round((preenchidos / totalItens) * 100) : 0;
  return { totalItens, preenchidos, percentual, proponente, documentos, garantias, areaBeneficiada };
}
