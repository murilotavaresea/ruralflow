import { filtrarGruposPorFonteELinha } from "./linhaModel";
import { contarItens, rotuloPrograma } from "./operacaoModel";
import {
  numeroParcelas,
  periodosPorAno,
  valorParcela,
} from "./capacidadePagamento";
import { validarDocumento } from "./cpfCnpj";
import {
  indiceCoberturaTotal,
  rotuloTipoGarantia,
  somaValorGarantias,
  tipoSemValor,
  tipoTemAnaliseMatricula,
} from "./garantiaModel";
import { resumirMatricula } from "./analiseMatricula";
import { descreverCondicao } from "./regrasModel";

const estaVazio = (valor) => String(valor ?? "").trim() === "";

// Campos sem os quais o parecer nao faz sentido. Servem tanto pro asterisco nos formularios
// quanto pro indicador nas abas e pra tela de Revisao.
export const CAMPOS_OBRIGATORIOS = [
  { aba: "proponente", campo: "nome", rotulo: "Nome / razão social do proponente", obter: (op) => op.proponente.nome },
  { aba: "proponente", campo: "documento", rotulo: "CPF / CNPJ do proponente", obter: (op) => op.proponente.documento },
  { aba: "proposta", campo: "valorOperacao", rotulo: "Valor da operação", obter: (op) => op.proposta.valorOperacao },
  { aba: "proposta", campo: "prazoMeses", rotulo: "Prazo (meses)", obter: (op) => op.proposta.prazoMeses },
  { aba: "proposta", campo: "taxaAnual", rotulo: "Taxa de juros (% a.a.)", obter: (op) => op.proposta.taxaAnual },
];

export function camposObrigatoriosFaltando(operacao) {
  return CAMPOS_OBRIGATORIOS.filter((campo) => estaVazio(campo.obter(operacao))).map(
    ({ aba, campo, rotulo }) => ({ aba, campo, rotulo })
  );
}

export function contarTrechosAPreencher(texto) {
  return (String(texto ?? "").match(/\[[^\]\n]+\]/g) || []).length;
}

function coletarPendencias(grupos, estado, contexto) {
  const pendencias = [];
  grupos.forEach((grupo) => {
    grupo.itens.forEach((item) => {
      const estadoItem = estado?.[item.chave];
      if (estadoItem?.status === "pendente") {
        pendencias.push({
          contexto,
          grupo: grupo.nome,
          nome: item.nome,
          texto: (estadoItem.devolutivaTexto || "").trim(),
        });
      }
    });
  });
  return pendencias;
}

function somarContagem(destino, contagem) {
  destino.ok += contagem.ok;
  destino.na += contagem.na;
  destino.pendente += contagem.pendente;
  destino.naoAvaliados += contagem.naoAvaliados;
  destino.totalItens += contagem.totalItens;
}

function novaSecao(chave, titulo, aba) {
  return { chave, titulo, aba, ok: 0, na: 0, pendente: 0, naoAvaliados: 0, totalItens: 0, pendencias: [] };
}

function finalizarSecao(secao) {
  const preenchidos = secao.ok + secao.na + secao.pendente;
  return { ...secao, percentual: secao.totalItens > 0 ? Math.round((preenchidos / secao.totalItens) * 100) : 0 };
}

// Junta tudo que o analista precisa conferir antes de fechar a analise: campos em branco,
// pontos de atencao, situacao de cada checklist (com os itens pendentes) e os numeros-chave
// da operacao. Usado pela aba "Revisao" e pelo resumo do PDF.
// `resultadosRegras`: o que `avaliarRegras` (utils/regrasModel.js) devolveu para esta operacao.
export function coletarRevisao(operacao, checklist, resultadosRegras = []) {
  const { proposta, proponente } = operacao;
  const filtrar = (grupos) => filtrarGruposPorFonteELinha(grupos || [], proposta.programa, proposta.linhaChecklist);

  const secaoProponente = novaSecao("proponente", "Proponente", "proponente");
  const gruposProponente = filtrar(checklist?.proponente);
  somarContagem(secaoProponente, contarItens(gruposProponente, proponente.checklist));
  secaoProponente.pendencias.push(...coletarPendencias(gruposProponente, proponente.checklist, ""));

  const secaoArea = novaSecao("area_beneficiada", "Área beneficiada", "area_beneficiada");
  const defArea = {
    bem: filtrar(checklist?.areaBeneficiada?.bem),
    proprietario: filtrar(checklist?.areaBeneficiada?.proprietario),
  };
  (operacao.areaBeneficiada || []).forEach((imovel, indice) => {
    const nomeImovel = imovel.nomeImovel || `Imóvel ${indice + 1}`;
    somarContagem(secaoArea, contarItens(defArea.bem, imovel.checklist));
    secaoArea.pendencias.push(...coletarPendencias(defArea.bem, imovel.checklist, nomeImovel));
    (imovel.proprietarios || []).forEach((proprietario) => {
      const nome = proprietario.nome || "sem nome informado";
      somarContagem(secaoArea, contarItens(defArea.proprietario, proprietario.checklist));
      secaoArea.pendencias.push(
        ...coletarPendencias(defArea.proprietario, proprietario.checklist, `${nomeImovel} · proprietário ${nome}`)
      );
    });
  });

  const secaoGarantias = novaSecao("garantias", "Garantias", "garantias");
  (operacao.garantias || []).forEach((garantia, indice) => {
    const def = checklist?.garantias?.[garantia.tipo] || { bem: [], proprietario: [] };
    const titulo = `Garantia ${indice + 1} · ${rotuloTipoGarantia(garantia.tipo)}`;
    somarContagem(secaoGarantias, contarItens(def.bem, garantia.checklist));
    secaoGarantias.pendencias.push(...coletarPendencias(def.bem, garantia.checklist, titulo));
    (garantia.garantidores || []).forEach((garantidor) => {
      const nome = garantidor.nome || "sem nome informado";
      somarContagem(secaoGarantias, contarItens(def.proprietario, garantidor.checklist));
      secaoGarantias.pendencias.push(
        ...coletarPendencias(def.proprietario, garantidor.checklist, `${titulo} · garantidor ${nome}`)
      );
    });
  });

  const secaoDocumentos = novaSecao("documentos", "Demais documentos", "checklist");
  const gruposDocumentos = filtrar(checklist?.documentos);
  somarContagem(secaoDocumentos, contarItens(gruposDocumentos, operacao.checklistDocumental));
  secaoDocumentos.pendencias.push(...coletarPendencias(gruposDocumentos, operacao.checklistDocumental, ""));

  const secoes = [secaoProponente, secaoArea, secaoGarantias, secaoDocumentos].map(finalizarSecao);

  const totais = { ok: 0, na: 0, pendente: 0, naoAvaliados: 0, totalItens: 0 };
  secoes.forEach((secao) => somarContagem(totais, secao));
  const preenchidos = totais.ok + totais.na + totais.pendente;
  totais.percentual = totais.totalItens > 0 ? Math.round((preenchidos / totais.totalItens) * 100) : 0;

  // --- numeros-chave --------------------------------------------------------------
  const valorOperacao = Number(proposta.valorOperacao) || 0;
  const prazoMeses = Number(proposta.prazoMeses) || 0;
  const carenciaMeses = Number(proposta.carenciaMeses) || 0;
  const parcela = valorParcela({
    valorOperacao: proposta.valorOperacao,
    taxaAnualPercentual: proposta.taxaAnual,
    prazoMeses: proposta.prazoMeses,
    carenciaMeses: proposta.carenciaMeses,
    periodicidade: proposta.periodicidadePagamento,
  });
  const somaGarantias = somaValorGarantias(operacao.garantias, valorOperacao);
  const numeros = {
    valorOperacao,
    prazoMeses,
    carenciaMeses,
    taxaAnual: Number(proposta.taxaAnual) || 0,
    parcela,
    numeroParcelas: numeroParcelas(prazoMeses, carenciaMeses, proposta.periodicidadePagamento),
    totalAnual: parcela * periodosPorAno(proposta.periodicidadePagamento),
    somaGarantias,
    coberturaGarantias:
      (operacao.garantias || []).length > 0 ? indiceCoberturaTotal(operacao.garantias, valorOperacao) : null,
  };

  // --- pontos de atencao ----------------------------------------------------------
  const avisos = [];
  if (prazoMeses > 0 && carenciaMeses >= prazoMeses) {
    avisos.push({
      aba: "proposta",
      texto: `A carência (${carenciaMeses} meses) é igual ou maior que o prazo (${prazoMeses} meses): não sobram parcelas a amortizar.`,
    });
  }
  if (validarDocumento(proponente.documento).valido === false) {
    avisos.push({ aba: "proponente", texto: "O CPF/CNPJ do proponente tem dígitos verificadores inválidos." });
  }
  if (proposta.programa === "fno" && estaVazio(proposta.municipio)) {
    avisos.push({ aba: "proposta", texto: "Enquadramento FNO: município do empreendimento não informado." });
  }
  if ((operacao.areaBeneficiada || []).length === 0) {
    avisos.push({ aba: "area_beneficiada", texto: "Nenhum imóvel cadastrado na área beneficiada." });
  }
  if ((operacao.garantias || []).length === 0) {
    avisos.push({ aba: "garantias", texto: "Nenhuma garantia cadastrada." });
  }
  (operacao.garantias || []).forEach((garantia, indice) => {
    if (tipoTemAnaliseMatricula(garantia.tipo)) {
      const nomeGarantia = `Garantia ${indice + 1} (${rotuloTipoGarantia(garantia.tipo)})`;
      if (!String(garantia.matricula || "").trim()) {
        avisos.push({ aba: "garantias", texto: `${nomeGarantia}: matrícula não informada.` });
      }
      const { semSituacao } = resumirMatricula(garantia, valorOperacao);
      if (semSituacao > 0) {
        avisos.push({
          aba: "garantias",
          texto: `${nomeGarantia}: ${semSituacao} grau${semSituacao > 1 ? "s" : ""} da matrícula sem situação (aberto ou cancelado); ${semSituacao > 1 ? "não entram" : "não entra"} no valor tomado.`,
        });
      }
    }
    if (!tipoSemValor(garantia.tipo) && !(Number(garantia.valor) > 0)) {
      avisos.push({
        aba: "garantias",
        texto: `Garantia ${indice + 1} (${rotuloTipoGarantia(garantia.tipo)}) sem valor informado.`,
      });
    }
  });
  const documentosInvalidos =
    (operacao.garantias || []).reduce(
      (soma, g) => soma + (g.garantidores || []).filter((gd) => validarDocumento(gd.documento).valido === false).length,
      0
    ) +
    (operacao.areaBeneficiada || []).reduce(
      (soma, i) => soma + (i.proprietarios || []).filter((p) => validarDocumento(p.documento).valido === false).length,
      0
    );
  if (documentosInvalidos > 0) {
    avisos.push({
      aba: "garantias",
      texto: `${documentosInvalidos} CPF/CNPJ de garantidores ou proprietários com dígitos verificadores inválidos.`,
    });
  }
  // Item Pendente sem texto de devolutiva nao entra na Devolutiva (ver gerarDevolutivaTexto).
  const pendenciasSemTexto = secoes.reduce(
    (soma, secao) => soma + secao.pendencias.filter((pendencia) => pendencia.texto === "").length,
    0
  );
  if (pendenciasSemTexto > 0) {
    avisos.push({
      aba: "devolutiva",
      texto: `${pendenciasSemTexto} ${pendenciasSemTexto > 1 ? "itens pendentes estão" : "item pendente está"} sem texto de devolutiva e não ${pendenciasSemTexto > 1 ? "aparecem" : "aparece"} na Devolutiva.`,
    });
  }
  const trechosParecer = contarTrechosAPreencher(operacao.parecerTexto);
  if (trechosParecer > 0) {
    avisos.push({
      aba: "parecer",
      texto: `O parecer ainda tem ${trechosParecer} trecho${trechosParecer > 1 ? "s" : ""} entre [colchetes] para preencher.`,
    });
  }

  // --- regras do parecer ----------------------------------------------------------------
  const acionadas = resultadosRegras
    .filter((r) => r.estado === "acionada")
    .map((r) => ({
      id: r.regra.id,
      nome: r.regra.nome,
      condicao: descreverCondicao(r.regra),
      encontrado: r.encontrado,
      textoParecer: r.textoParecer,
      textoDevolutiva: r.textoDevolutiva,
      impede: Boolean(r.regra.impedeContratacao),
      aba: r.campo.aba,
    }));
  const impedimentos = acionadas.filter((r) => r.impede);
  const naoAvaliadas = resultadosRegras
    .filter((r) => r.estado === "nao_avaliada")
    .map((r) => ({ id: r.regra.id, nome: r.regra.nome, campo: r.campo.rotulo, aba: r.campo.aba }));
  const invalidas = resultadosRegras.filter((r) => r.estado === "invalida").map((r) => ({ id: r.regra.id, nome: r.regra.nome }));

  // impedimentos primeiro: sao o que o analista nao pode deixar passar
  impedimentos.reverse().forEach((r) => {
    avisos.unshift({
      aba: r.aba,
      impede: true,
      texto: `A regra "${r.nome}" impede a contratação: ${r.condicao}${r.encontrado ? ` (informado: ${r.encontrado})` : ""}.`,
    });
  });
  naoAvaliadas.forEach((r) => {
    avisos.push({ aba: r.aba, texto: `Regra "${r.nome}" não avaliada: ${r.campo} não preenchido.` });
  });
  invalidas.forEach((r) => {
    avisos.push({ aba: "revisao", texto: `A regra "${r.nome}" está com a configuração inválida; revise na Administração.` });
  });
  // Parecer editado a mao deixa de acompanhar os dados: uma regra que dispara depois nao entra sozinha.
  if (operacao.parecerEditadoManualmente) {
    const ausentes = acionadas.filter((r) => r.textoParecer && !String(operacao.parecerTexto || "").includes(r.textoParecer));
    if (ausentes.length > 0) {
      avisos.push({
        aba: "parecer",
        texto: `${ausentes.length} regra${ausentes.length > 1 ? "s acionadas não estão" : " acionada não está"} no texto do Parecer (editado manualmente).`,
      });
    }
  }

  const camposFaltando = camposObrigatoriosFaltando(operacao);

  return {
    regras: { acionadas, impedimentos: acionadas.filter((r) => r.impede), naoAvaliadas, invalidas },
    fonte: rotuloPrograma(proposta.programa),
    camposFaltando,
    avisos,
    secoes,
    totais,
    numeros,
    resumo: {
      camposFaltando: camposFaltando.length,
      avisos: avisos.length,
      impedimentos: impedimentos.length,
      pendencias: totais.pendente,
      naoAvaliados: totais.naoAvaliados,
      pronto: camposFaltando.length === 0 && totais.naoAvaliados === 0,
    },
  };
}
