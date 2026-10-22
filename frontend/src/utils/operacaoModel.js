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

export function rotuloPrograma(chave) {
  return PROGRAMAS.find((p) => p.chave === chave)?.rotulo || chave || "";
}

export function novoIdOperacao() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `op_${crypto.randomUUID()}`;
  }
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function criarOperacaoVazia() {
  const agora = new Date().toISOString();
  return {
    id: novoIdOperacao(),
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
      // dados de risco que as "regras do parecer" (Administracao) podem usar
      perdaEsperada: "",
      estagio3: "", // "SIM" | "NAO" | ""
      parteRelacionada: "", // "SIM" | "NAO" | ""
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

// Uma operacao "em branco" nao precisa ocupar lugar na lista de operacoes salvas: so o que o
// analista de fato preencheu conta. Serve pra "Nova operacao" nao deixar um rastro de
// operacoes vazias cada vez que e clicado.
export function operacaoEstaVazia(operacao) {
  if (!operacao) return true;
  const { proponente = {}, proposta = {} } = operacao;
  const camposTexto = [
    proponente.nome,
    proponente.documento,
    proponente.setorAtuacao,
    proponente.risco,
    proponente.pd,
    proponente.qrsa,
    proponente.score,
    proponente.rendaAnual,
    proponente.patrimonioAvaliado,
    proponente.perdaEsperada,
    proponente.estagio3,
    proponente.parteRelacionada,
    proposta.linhaCreditoDescricao,
    proposta.finalidade,
    proposta.valorOperacao,
    proposta.prazoMeses,
    proposta.carenciaMeses,
    proposta.taxaAnual,
    proposta.tipoCedula,
    proposta.municipio,
  ];
  if (camposTexto.some((valor) => String(valor ?? "").trim() !== "")) return false;
  if ((operacao.garantias || []).length > 0 || (operacao.areaBeneficiada || []).length > 0) return false;
  if (Object.keys(proponente.checklist || {}).length > 0) return false;
  if (Object.keys(operacao.checklistDocumental || {}).length > 0) return false;
  return true;
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

const comoLista = (valor) => (Array.isArray(valor) ? valor : []);
const comoObjeto = (valor) => (valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {});

// Garantias/imoveis importados de um .json antigo (ou editado a mao) podem vir sem
// checklist ou sem a lista de garantidores/proprietarios; telas e PDF assumem que existem.
// campos de um grau da matricula (garantias salvas antes da analise de matricula nao os tem)
const GRAU_PADRAO = { registro: "", grau: "", valor: "", vencimento: "", contrato: "", status: "" };

function normalizarGarantia(garantia) {
  return {
    ...garantia,
    nomeImovel: garantia?.nomeImovel ?? "",
    matricula: garantia?.matricula ?? "",
    ccir: garantia?.ccir ?? "",
    nirfCib: garantia?.nirfCib ?? "",
    areaTotal: garantia?.areaTotal ?? "",
    car: garantia?.car ?? "",
    municipio: garantia?.municipio ?? "",
    outraProposta: garantia?.outraProposta ?? "",
    graus: comoLista(garantia?.graus).map((g, indice) => ({ id: `grau_migrado_${indice}`, ...GRAU_PADRAO, ...g })),
    checklist: comoObjeto(garantia?.checklist),
    garantidores: comoLista(garantia?.garantidores).map((g) => ({ ...g, checklist: comoObjeto(g?.checklist) })),
  };
}

function normalizarImovel(imovel) {
  return {
    ...imovel,
    checklist: comoObjeto(imovel?.checklist),
    proprietarios: comoLista(imovel?.proprietarios).map((p) => ({ ...p, checklist: comoObjeto(p?.checklist) })),
  };
}

export function normalizarOperacao(operacao) {
  const vazia = criarOperacaoVazia();
  if (!operacao || typeof operacao !== "object" || Array.isArray(operacao)) return vazia;
  return {
    ...vazia,
    ...operacao,
    id: operacao.id || vazia.id,
    proponente: {
      ...vazia.proponente,
      ...operacao.proponente,
      checklist: comoObjeto(operacao.proponente?.checklist),
    },
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
    garantias: comoLista(operacao.garantias).map(normalizarGarantia),
    areaBeneficiada: comoLista(operacao.areaBeneficiada).map(normalizarImovel),
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

// --- contagem de progresso ------------------------------------------------------------
//
// Conta so os itens que estao de fato na lista (grupos ja filtrados por fonte/linha). O estado
// guardado na operacao pode ter marcacoes de itens que nao aparecem mais (ex: o analista
// trocou a fonte de recurso); contar essas fazia o progresso passar de 100%.

export function contarItens(grupos, estado) {
  const contagem = { ok: 0, na: 0, pendente: 0, naoAvaliados: 0, totalItens: 0 };
  (grupos || []).forEach((grupo) => {
    (grupo.itens || []).forEach((item) => {
      contagem.totalItens += 1;
      const status = estado?.[item.chave]?.status;
      if (status === "ok") contagem.ok += 1;
      else if (status === "na") contagem.na += 1;
      else if (status === "pendente") contagem.pendente += 1;
      else contagem.naoAvaliados += 1;
    });
  });
  const preenchidos = contagem.ok + contagem.na + contagem.pendente;
  const percentual = contagem.totalItens > 0 ? Math.round((preenchidos / contagem.totalItens) * 100) : 0;
  return { ...contagem, preenchidos, percentual };
}

function somarContagens(lista) {
  const soma = { ok: 0, na: 0, pendente: 0, naoAvaliados: 0, totalItens: 0 };
  lista.forEach((c) => {
    soma.ok += c.ok;
    soma.na += c.na;
    soma.pendente += c.pendente;
    soma.naoAvaliados += c.naoAvaliados;
    soma.totalItens += c.totalItens;
  });
  const preenchidos = soma.ok + soma.na + soma.pendente;
  const percentual = soma.totalItens > 0 ? Math.round((preenchidos / soma.totalItens) * 100) : 0;
  return { ...soma, preenchidos, percentual };
}

export function progressoChecklistProponente(operacao, checklistProponenteDef) {
  const grupos = filtrarGruposPorFonteELinha(
    checklistProponenteDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  return contarItens(grupos, operacao.proponente.checklist);
}

export function progressoChecklistDocumental(operacao, checklistDocumentosDef) {
  const grupos = filtrarGruposPorFonteELinha(
    checklistDocumentosDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  return contarItens(grupos, operacao.checklistDocumental);
}

// Soma o checklist do bem + de todos os garantidores de todas as garantias da operacao.
export function progressoChecklistGarantias(operacao, checklistGarantiasDef) {
  const contagens = [];
  (operacao.garantias || []).forEach((garantia) => {
    const def = checklistGarantiasDef?.[garantia.tipo] || { bem: [], proprietario: [] };
    contagens.push(contarItens(def.bem, garantia.checklist));
    (garantia.garantidores || []).forEach((garantidor) => {
      contagens.push(contarItens(def.proprietario, garantidor.checklist));
    });
  });
  return somarContagens(contagens);
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
  const contagens = [];
  (operacao.areaBeneficiada || []).forEach((imovel) => {
    contagens.push(contarItens(def.bem, imovel.checklist));
    (imovel.proprietarios || []).forEach((proprietario) => {
      contagens.push(contarItens(def.proprietario, proprietario.checklist));
    });
  });
  return somarContagens(contagens);
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
  const total = somarContagens([proponente, documentos, garantias, areaBeneficiada]);
  return { ...total, proponente, documentos, garantias, areaBeneficiada };
}
