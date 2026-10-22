import { PERIODICIDADES, PROGRAMAS, rotuloPrograma } from "./operacaoModel";
import { indiceCoberturaReais, indiceCoberturaTotal, tipoSemValor } from "./garantiaModel";

// Regras do parecer. Cada regra liga UMA condicao sobre um dado da operacao a um efeito:
//
//   QUANDO <campo> <operador> <valor>      (vale para todas as fontes ou so algumas)
//   ENTAO  texto no Parecer / texto na Devolutiva / impede a contratacao
//
// As regras ficam no backend e sao editadas na Administracao; aqui ficam o CATALOGO de dados que
// podem acionar uma regra, os operadores e a avaliacao. A avaliacao distingue "nao acionada" de
// "nao avaliada" (faltou o dado): uma regra de alcada nao pode passar em silencio so porque o
// analista esqueceu de preencher o risco.

export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// "1.234,5" -> 1234.5 ; "7" -> 7 ; "" -> null. Aceita tambem o formato guardado ("1234.5").
export function lerNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const texto = String(valor ?? "").trim();
  if (texto === "" || !/\d/.test(texto)) return null;
  const limpo = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const numero = Number(limpo.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) ? numero : null;
}

// "R7" -> 7, "r 12" -> 12, "7" -> 7, "alto" -> null
function lerRisco(texto) {
  const achado = String(texto ?? "").match(/\d+(?:[.,]\d+)?/);
  return achado ? lerNumero(achado[0]) : null;
}

const SIM_NAO = [
  { valor: "SIM", rotulo: "Sim" },
  { valor: "NAO", rotulo: "Não" },
];

const sim = (condicao) => (condicao ? "SIM" : "NAO");

function formatarNumero(valor, unidade) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  if (unidade === "moeda") return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (unidade === "percentual") return `${numero.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  if (unidade === "meses") return `${numero.toLocaleString("pt-BR")} ${numero === 1 ? "mês" : "meses"}`;
  return numero.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

// --- catalogo ---------------------------------------------------------------------------------
//
// chave:    identificador guardado na regra (nao mudar depois de publicado)
// tipo:     "numero" | "lista" | "texto" — define os operadores e o campo de valor na Administracao
// variavel: nome usado nos textos, {risco} etc.
// aba:      onde o analista corrige o dado (usado nos links da Revisao)
// obter:    le o dado da operacao; null / "" = nao preenchido

export const CAMPOS_REGRA = [
  {
    chave: "proponente_risco",
    grupo: "Proponente",
    rotulo: "Risco (número)",
    dica: 'Usa o número do que foi digitado: "R7", "r 7" e "7" valem 7.',
    tipo: "numero",
    variavel: "risco",
    aba: "proponente",
    obter: (op) => lerRisco(op.proponente.risco),
    exibir: (op) => String(op.proponente.risco || "").trim().toUpperCase(),
  },
  {
    chave: "proponente_qrsa",
    grupo: "Proponente",
    rotulo: "QRSA",
    tipo: "lista",
    opcoes: [
      { valor: "Baixo", rotulo: "Baixo" },
      { valor: "Médio", rotulo: "Médio" },
      { valor: "Alto", rotulo: "Alto" },
    ],
    variavel: "qrsa",
    aba: "proponente",
    obter: (op) => op.proponente.qrsa,
  },
  {
    chave: "proponente_perda_esperada",
    grupo: "Proponente",
    rotulo: "Perda esperada (PE)",
    tipo: "numero",
    unidade: "percentual",
    variavel: "perdaEsperada",
    aba: "proponente",
    obter: (op) => lerNumero(op.proponente.perdaEsperada),
  },
  {
    chave: "proponente_estagio3",
    grupo: "Proponente",
    rotulo: "Operação em Estágio 3",
    tipo: "lista",
    opcoes: SIM_NAO,
    variavel: "estagio3",
    aba: "proponente",
    obter: (op) => op.proponente.estagio3,
  },
  {
    chave: "proponente_parte_relacionada",
    grupo: "Proponente",
    rotulo: "Parte relacionada",
    tipo: "lista",
    opcoes: SIM_NAO,
    variavel: "parteRelacionada",
    aba: "proponente",
    obter: (op) => op.proponente.parteRelacionada,
  },
  {
    chave: "proponente_pd",
    grupo: "Proponente",
    rotulo: "PD",
    tipo: "numero",
    variavel: "pd",
    aba: "proponente",
    obter: (op) => lerNumero(op.proponente.pd),
  },
  {
    chave: "proponente_score",
    grupo: "Proponente",
    rotulo: "Score",
    tipo: "numero",
    variavel: "score",
    aba: "proponente",
    obter: (op) => lerNumero(op.proponente.score),
  },
  {
    chave: "proponente_renda_anual",
    grupo: "Proponente",
    rotulo: "Renda anual",
    tipo: "numero",
    unidade: "moeda",
    variavel: "rendaAnual",
    aba: "proponente",
    obter: (op) => lerNumero(op.proponente.rendaAnual),
  },
  {
    chave: "proponente_patrimonio",
    grupo: "Proponente",
    rotulo: "Patrimônio avaliado",
    tipo: "numero",
    unidade: "moeda",
    variavel: "patrimonio",
    aba: "proponente",
    obter: (op) => lerNumero(op.proponente.patrimonioAvaliado),
  },
  {
    chave: "proponente_setor",
    grupo: "Proponente",
    rotulo: "Setor de atuação",
    tipo: "texto",
    variavel: "setor",
    aba: "proponente",
    obter: (op) => op.proponente.setorAtuacao,
  },
  {
    chave: "proposta_fonte",
    grupo: "Proposta",
    rotulo: "Fonte de recurso",
    tipo: "lista",
    opcoes: PROGRAMAS.map((p) => ({ valor: p.chave, rotulo: p.rotulo })),
    variavel: "fonteRecurso",
    aba: "proposta",
    obter: (op) => op.proposta.programa,
  },
  {
    chave: "proposta_valor",
    grupo: "Proposta",
    rotulo: "Valor da operação",
    tipo: "numero",
    unidade: "moeda",
    variavel: "valorOperacao",
    aba: "proposta",
    obter: (op) => lerNumero(op.proposta.valorOperacao),
  },
  {
    chave: "proposta_prazo",
    grupo: "Proposta",
    rotulo: "Prazo",
    tipo: "numero",
    unidade: "meses",
    variavel: "prazo",
    aba: "proposta",
    obter: (op) => lerNumero(op.proposta.prazoMeses),
  },
  {
    chave: "proposta_carencia",
    grupo: "Proposta",
    rotulo: "Carência",
    tipo: "numero",
    unidade: "meses",
    variavel: "carencia",
    aba: "proposta",
    obter: (op) => lerNumero(op.proposta.carenciaMeses),
  },
  {
    chave: "proposta_taxa",
    grupo: "Proposta",
    rotulo: "Taxa de juros",
    tipo: "numero",
    unidade: "percentual",
    variavel: "taxa",
    aba: "proposta",
    obter: (op) => lerNumero(op.proposta.taxaAnual),
  },
  {
    chave: "proposta_periodicidade",
    grupo: "Proposta",
    rotulo: "Periodicidade de pagamento",
    tipo: "lista",
    opcoes: PERIODICIDADES.map((p) => ({ valor: p, rotulo: p })),
    variavel: "periodicidade",
    aba: "proposta",
    obter: (op) => op.proposta.periodicidadePagamento,
  },
  {
    chave: "proposta_seguro",
    grupo: "Proposta",
    rotulo: "Seguro prestamista",
    tipo: "lista",
    opcoes: SIM_NAO,
    variavel: "seguroPrestamista",
    aba: "proposta",
    obter: (op) => op.proposta.seguroPrestamista,
  },
  {
    chave: "garantias_possui_aval",
    grupo: "Garantias",
    rotulo: "Possui aval",
    tipo: "lista",
    opcoes: SIM_NAO,
    variavel: "possuiAval",
    aba: "garantias",
    obter: (op) => sim((op.garantias || []).some((g) => tipoSemValor(g.tipo))),
  },
  {
    chave: "garantias_quantidade",
    grupo: "Garantias",
    rotulo: "Quantidade de garantias",
    tipo: "numero",
    variavel: "quantidadeGarantias",
    aba: "garantias",
    obter: (op) => (op.garantias || []).length,
  },
  {
    chave: "garantias_cobertura_total",
    grupo: "Garantias",
    rotulo: "Cobertura total das garantias",
    dica: "Soma da cobertura de cada garantia (o aval conta 100%). Nos imóveis, já considera os graus em aberto: avaliação ÷ (operação + valor tomado).",
    tipo: "numero",
    unidade: "percentual",
    variavel: "coberturaTotal",
    aba: "garantias",
    obter: (op) => {
      const indice = indiceCoberturaTotal(op.garantias || [], op.proposta.valorOperacao);
      return indice === null ? null : indice * 100;
    },
  },
  {
    chave: "garantias_cobertura_reais",
    grupo: "Garantias",
    rotulo: "Cobertura só das garantias reais",
    dica: "Soma da cobertura das garantias reais (sem o aval), já considerando os graus em aberto dos imóveis. Ex.: regra dos 30% do CONSAD.",
    tipo: "numero",
    unidade: "percentual",
    variavel: "coberturaReais",
    aba: "garantias",
    obter: (op) => {
      const indice = indiceCoberturaReais(op.garantias || [], op.proposta.valorOperacao);
      return indice === null ? null : indice * 100;
    },
  },
  {
    chave: "checklist_pendentes",
    grupo: "Checklists",
    rotulo: "Itens pendentes (total)",
    tipo: "numero",
    variavel: "itensPendentes",
    aba: "revisao",
    obter: (op, contexto) => (contexto?.progresso ? contexto.progresso.pendente : null),
  },
  {
    chave: "checklist_nao_avaliados",
    grupo: "Checklists",
    rotulo: "Itens sem avaliação (total)",
    tipo: "numero",
    variavel: "itensSemAvaliacao",
    aba: "revisao",
    obter: (op, contexto) => (contexto?.progresso ? contexto.progresso.naoAvaliados : null),
  },
];

const CAMPO_POR_CHAVE = Object.fromEntries(CAMPOS_REGRA.map((campo) => [campo.chave, campo]));
const CAMPO_POR_VARIAVEL = Object.fromEntries(CAMPOS_REGRA.map((campo) => [campo.variavel, campo]));

export function campoDaRegra(chave) {
  return CAMPO_POR_CHAVE[chave] || null;
}

// --- operadores ------------------------------------------------------------------------------

const OPERADORES_POR_TIPO = {
  numero: ["igual", "diferente", "maior", "maior_igual", "menor", "menor_igual", "preenchido", "vazio"],
  lista: ["igual", "diferente", "um_de", "preenchido", "vazio"],
  texto: ["igual", "diferente", "preenchido", "vazio"],
};

const ROTULOS_OPERADOR = {
  igual: "é igual a",
  diferente: "é diferente de",
  maior: "é maior que",
  maior_igual: "é maior ou igual a",
  menor: "é menor que",
  menor_igual: "é menor ou igual a",
  um_de: "é um destes",
  preenchido: "está preenchido",
  vazio: "está em branco",
};

export function operadoresDoTipo(tipo) {
  return OPERADORES_POR_TIPO[tipo] || OPERADORES_POR_TIPO.texto;
}

export function rotuloOperador(operador, tipo) {
  if (tipo === "lista" && operador === "igual") return "é";
  if (tipo === "lista" && operador === "diferente") return "não é";
  return ROTULOS_OPERADOR[operador] || operador;
}

export function operadorSemValor(operador) {
  return operador === "preenchido" || operador === "vazio";
}

// --- formatacao -----------------------------------------------------------------------------

function rotuloDaOpcao(campo, valor) {
  const opcao = (campo.opcoes || []).find((o) => normalizarTexto(o.valor) === normalizarTexto(valor));
  return opcao ? opcao.rotulo : String(valor ?? "");
}

// Como o valor aparece nos textos ({risco} -> "R7") e na Revisao.
export function exibirValor(campo, valor, operacao) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (campo.exibir && operacao) return campo.exibir(operacao);
  if (campo.tipo === "numero") return formatarNumero(valor, campo.unidade);
  if (campo.tipo === "lista") return rotuloDaOpcao(campo, valor);
  return String(valor).trim();
}

// Valor de referencia da regra, como o analista le ("7", "Alto", "Alto; Médio").
export function exibirValorDaRegra(regra) {
  const campo = campoDaRegra(regra.campo);
  if (!campo || operadorSemValor(regra.operador)) return "";
  if (campo.tipo === "numero") {
    const numero = lerNumero(regra.valor);
    return numero === null ? String(regra.valor ?? "") : formatarNumero(numero, campo.unidade);
  }
  if (campo.tipo === "lista") {
    return String(regra.valor ?? "")
      .split(";")
      .filter((parte) => parte.trim() !== "")
      .map((parte) => rotuloDaOpcao(campo, parte.trim()))
      .join(", ");
  }
  return String(regra.valor ?? "");
}

export function descreverCondicao(regra) {
  const campo = campoDaRegra(regra.campo);
  if (!campo) return "Dado desconhecido";
  const valor = exibirValorDaRegra(regra);
  return `${campo.rotulo} ${rotuloOperador(regra.operador, campo.tipo)}${valor ? ` ${valor}` : ""}`;
}

// --- avaliacao ------------------------------------------------------------------------------

const vazio = (valor) => valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "");

function compararNumeros(operador, dado, referencia) {
  const iguais = Math.abs(dado - referencia) < 1e-9;
  switch (operador) {
    case "igual":
      return iguais;
    case "diferente":
      return !iguais;
    case "maior":
      return dado > referencia && !iguais;
    case "maior_igual":
      return dado > referencia || iguais;
    case "menor":
      return dado < referencia && !iguais;
    case "menor_igual":
      return dado < referencia || iguais;
    default:
      return null;
  }
}

// Resultado da condicao com um dado ja lido: "sim" | "nao" | "sem_dado" | "invalida".
// Exportada tambem para o teste ao vivo da tela de Administracao.
export function avaliarCondicao(campo, operador, valorDaRegra, dado) {
  if (operador === "preenchido") return vazio(dado) ? "nao" : "sim";
  if (operador === "vazio") return vazio(dado) ? "sim" : "nao";
  if (vazio(dado)) return "sem_dado";

  if (campo.tipo === "numero") {
    const referencia = lerNumero(valorDaRegra);
    const lido = lerNumero(dado);
    if (referencia === null) return "invalida";
    if (lido === null) return "sem_dado";
    const resultado = compararNumeros(operador, lido, referencia);
    return resultado === null ? "invalida" : resultado ? "sim" : "nao";
  }

  const lido = normalizarTexto(dado);
  if (operador === "igual") return lido === normalizarTexto(valorDaRegra) ? "sim" : "nao";
  if (operador === "diferente") return lido !== normalizarTexto(valorDaRegra) ? "sim" : "nao";
  if (operador === "um_de") {
    const lista = String(valorDaRegra ?? "").split(";").map(normalizarTexto).filter(Boolean);
    if (lista.length === 0) return "invalida";
    return lista.includes(lido) ? "sim" : "nao";
  }
  return "invalida";
}

export function regraVale(regra, operacao) {
  if (regra.fontes === "todas" || regra.fontes === undefined) return true;
  return Array.isArray(regra.fontes) && regra.fontes.includes(operacao.proposta.programa);
}

// {risco} etc. Variavel desconhecida fica como esta ({xyz}), pra o erro de digitacao aparecer.
// opcoes.sobrescritas: { nome: texto } para forcar o valor de variaveis (pre-visualizacao na
// Administracao); opcoes.marcarVazios: mostra [nome] no lugar do que nao estiver preenchido.
export function montarTextoRegra(modelo, operacao, contexto, opcoes = {}) {
  const { sobrescritas = {}, marcarVazios = false } = opcoes;
  return String(modelo ?? "").replace(/\{([a-zA-Z0-9_]+)\}/g, (marcador, nome) => {
    if (Object.prototype.hasOwnProperty.call(sobrescritas, nome)) return sobrescritas[nome];
    let texto;
    if (nome === "proponente") {
      texto = String(operacao.proponente.nome || "").trim() || "o proponente";
    } else if (nome === "fonte") {
      texto = rotuloPrograma(operacao.proposta.programa);
    } else {
      const campo = CAMPO_POR_VARIAVEL[nome];
      if (!campo) return marcador;
      texto = exibirValor(campo, campo.obter(operacao, contexto), operacao);
    }
    return texto === "" && marcarVazios ? `[${nome}]` : texto;
  });
}

// Variaveis usadas no texto que nao existem ({risko}, {xyz}), sem repeticao.
export function variaveisDesconhecidas(modelo) {
  const conhecidas = new Set(variaveisDisponiveis().map((v) => v.nome));
  const achadas = [...String(modelo ?? "").matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
  return [...new Set(achadas.filter((nome) => !conhecidas.has(nome)))];
}

// Como um valor DIGITADO no teste da Administracao aparece no texto ("r8" -> "R8", "9" -> "9,00%").
export function exibirValorDeTeste(campo, texto) {
  if (campo.exibir) return String(texto ?? "").trim().toUpperCase();
  return exibirValor(campo, campo.tipo === "numero" ? lerNumero(texto) : texto);
}

export function variaveisDisponiveis() {
  return [
    { nome: "proponente", descricao: "Nome do proponente" },
    { nome: "fonte", descricao: "Fonte de recurso" },
    ...CAMPOS_REGRA.map((campo) => ({ nome: campo.variavel, descricao: `${campo.grupo}: ${campo.rotulo}` })),
  ];
}

// Estados de cada regra:
//   acionada | nao_acionada | nao_avaliada (faltou o dado) | fora_do_escopo (outra fonte) |
//   inativa | invalida (configuracao quebrada, ex.: dado que nao existe mais)
export function avaliarRegra(regra, operacao, contexto) {
  const base = { regra, campo: campoDaRegra(regra.campo), textoParecer: "", textoDevolutiva: "", encontrado: "" };
  if (!regra.ativa) return { ...base, estado: "inativa" };
  if (!base.campo) return { ...base, estado: "invalida" };
  if (!regraVale(regra, operacao)) return { ...base, estado: "fora_do_escopo" };

  const dado = base.campo.obter(operacao, contexto);
  const encontrado = exibirValor(base.campo, dado, operacao);
  const resultado = avaliarCondicao(base.campo, regra.operador, regra.valor, dado);
  if (resultado === "invalida") return { ...base, encontrado, estado: "invalida" };
  if (resultado === "sem_dado") return { ...base, encontrado, estado: "nao_avaliada" };
  if (resultado === "nao") return { ...base, encontrado, estado: "nao_acionada" };

  return {
    ...base,
    encontrado,
    estado: "acionada",
    textoParecer: montarTextoRegra(regra.textoParecer, operacao, contexto).trim(),
    textoDevolutiva: montarTextoRegra(regra.textoDevolutiva, operacao, contexto).trim(),
  };
}

export function avaliarRegras(operacao, regras, contexto) {
  return (Array.isArray(regras) ? regras : []).map((regra) => avaliarRegra(regra, operacao, contexto));
}

// Textos sem repeticao, na ordem das regras.
export function textosUnicos(lista) {
  return [...new Set(lista.filter((texto) => texto && texto.trim() !== ""))];
}
