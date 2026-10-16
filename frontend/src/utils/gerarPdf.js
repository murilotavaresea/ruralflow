import jsPDF from "jspdf";
import { montarTextoFinal } from "./gerarTextoTemplate";
import { rotuloTipoGarantia, tipoSemValor, tipoTemAnaliseMatricula } from "./garantiaModel";
import { descreverAnaliseMatricula, descreverImovelGarantia } from "./analiseMatricula";
import { filtrarGruposPorFonteELinha } from "./linhaModel";
import { rotuloPrograma } from "./operacaoModel";
import { coletarRevisao } from "./revisao";

const PAGE_WIDTH = 210;
const MARGIN_X = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const HEADER_HEIGHT = 24;
const FOOTER_Y = 286;
const CORPO_INICIO_Y = HEADER_HEIGHT + 12;

// Cores (RGB). Os tons dos chips de status sao os mesmos "solid" do tema claro do app, que
// passam de 4,5:1 contra o texto branco.
const COR_TEXTO = [78, 69, 75];
const COR_TEXTO_SUAVE = [101, 91, 98];
const COR_CABECALHO = [78, 69, 75];
const COR_STATUS = {
  ok: [46, 118, 80],
  na: [95, 88, 96],
  pendente: [143, 82, 0],
};
const ROTULO_STATUS = { ok: "OK", na: "N/A", pendente: "Pendente" };
const COR_TRILHA = [226, 224, 225];

// As fontes padrao do PDF (Helvetica) cobrem Latin-1: acentos e cedilha do portugues saem
// corretos. O que fica de fora (travessoes, aspas curvas, setas, simbolos) e trocado por um
// equivalente simples em vez de virar lixo no papel.
const SUBSTITUICOES = [
  [/[–—−]/g, "-"],
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/…/g, "..."],
  [/[•●∙]/g, "-"],
  [/→/g, "->"],
  [/←/g, "<-"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/[✓✔]/g, "ok"],
];

export function paraLatin1(valor) {
  let texto = String(valor ?? "");
  SUBSTITUICOES.forEach(([padrao, troca]) => {
    texto = texto.replace(padrao, troca);
  });
  return Array.from(texto)
    .map((caractere) => {
      if (caractere.codePointAt(0) <= 0xff) return caractere;
      const base = caractere.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return base.length === 1 && base.codePointAt(0) <= 0xff ? base : "?";
    })
    .join("");
}

function moeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || valor === "" || valor === null || valor === undefined) return "-";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentual(indice) {
  if (indice === null || indice === undefined) return "-";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function nomeDeArquivo(prefixo, nome) {
  const limpo = String(nome || "operacao")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^\w-]+/g, "_")
    .toLowerCase();
  return `${prefixo}_${limpo || "operacao"}.pdf`;
}

function desenharCabecalho(doc, subtitulo) {
  doc.setFillColor(...COR_CABECALHO);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(248, 250, 246);
  doc.text(paraLatin1("RuralFlow - Checklist de Análise de Crédito Rural"), MARGIN_X, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 224);
  doc.text(paraLatin1(subtitulo), MARGIN_X, 20);
}

function desenharRodape(doc, pagina, totalPaginas) {
  const agora = new Date();
  const data = `${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  doc.setDrawColor(220, 229, 225);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, FOOTER_Y, PAGE_WIDTH - MARGIN_X, FOOTER_Y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COR_TEXTO_SUAVE);
  doc.text(paraLatin1(`Gerado via RuralFlow em ${data}`), MARGIN_X, FOOTER_Y + 5);
  doc.text(paraLatin1(`Página ${pagina} de ${totalPaginas}`), PAGE_WIDTH - MARGIN_X, FOOTER_Y + 5, {
    align: "right",
  });
}

function numerarPaginas(doc) {
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    desenharRodape(doc, pagina, totalPaginas);
  }
}

// Escritor sequencial: guarda a posicao vertical, quebra de pagina e os estilos de texto
// usados pelos dois PDFs.
function criarEscritor(doc) {
  const linhaAltura = 5.2;
  const estado = { y: CORPO_INICIO_Y };

  const novaPaginaSeNecessario = (alturaNecessaria = linhaAltura) => {
    if (estado.y + alturaNecessaria > FOOTER_Y - 4) {
      doc.addPage();
      estado.y = CORPO_INICIO_Y;
    }
  };

  const titulo = (texto) => {
    novaPaginaSeNecessario(14);
    estado.y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COR_TEXTO);
    doc.text(paraLatin1(texto), MARGIN_X, estado.y);
    doc.setDrawColor(...COR_TRILHA);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, estado.y + 1.8, PAGE_WIDTH - MARGIN_X, estado.y + 1.8);
    estado.y += 8;
  };

  const subtitulo = (texto) => {
    novaPaginaSeNecessario(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.text(paraLatin1(texto), MARGIN_X, estado.y);
    estado.y += 5.5;
  };

  const paragrafo = (texto, { recuo = 0, estilo = "normal", cor = COR_TEXTO, tamanho = 9.5 } = {}) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(paraLatin1(texto), CONTENT_WIDTH - recuo);
    linhas.forEach((linha) => {
      novaPaginaSeNecessario();
      doc.text(linha, MARGIN_X + recuo, estado.y);
      estado.y += linhaAltura;
    });
    estado.y += 1.5;
  };

  // "Rotulo ......... valor" em duas colunas.
  const chaveValor = (chave, valor) => {
    const larguraChave = 44;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const linhas = doc.splitTextToSize(paraLatin1(valor || "-"), CONTENT_WIDTH - larguraChave);
    novaPaginaSeNecessario(linhas.length * linhaAltura);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.text(paraLatin1(chave), MARGIN_X, estado.y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COR_TEXTO);
    linhas.forEach((linha) => {
      doc.text(linha, MARGIN_X + larguraChave, estado.y);
      estado.y += linhaAltura;
    });
  };

  const espaco = (mm) => {
    estado.y += mm;
  };

  return { doc, estado, linhaAltura, novaPaginaSeNecessario, titulo, subtitulo, paragrafo, chaveValor, espaco };
}

// Chip arredondado com o status do item (substitui o "[OK]" em texto simples).
function desenharChip(doc, status, x, y) {
  const largura = 17;
  const altura = 4.6;
  const topo = y - 3.5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  if (COR_STATUS[status]) {
    doc.setFillColor(...COR_STATUS[status]);
    doc.roundedRect(x, topo, largura, altura, 1.2, 1.2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(ROTULO_STATUS[status], x + largura / 2, y - 0.2, { align: "center" });
  } else {
    doc.setDrawColor(...COR_TEXTO_SUAVE);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, topo, largura, altura, 1.2, 1.2, "S");
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.text("Sem aval.", x + largura / 2, y - 0.2, { align: "center" });
  }
}

// Barra segmentada (OK / N.A. / Pendente / sem avaliacao) desenhada com retangulos.
function desenharBarra(doc, x, y, largura, totais) {
  const altura = 3.4;
  doc.setFillColor(...COR_TRILHA);
  doc.roundedRect(x, y, largura, altura, 1.2, 1.2, "F");
  if (totais.totalItens <= 0) return;
  let cursor = x;
  ["ok", "na", "pendente"].forEach((chave) => {
    const quantidade = totais[chave];
    if (!quantidade) return;
    const larguraSegmento = (quantidade / totais.totalItens) * largura;
    doc.setFillColor(...COR_STATUS[chave]);
    doc.rect(cursor, y, larguraSegmento, altura, "F");
    cursor += larguraSegmento;
  });
}

function nomeDaModalidade(checklist, programa, linhaId) {
  if (!linhaId) return "";
  return checklist?.linhas?.[programa]?.find((linha) => linha.id === linhaId)?.nome || "";
}

function escreverResumo(escritor, operacao, checklist, revisao) {
  const { doc } = escritor;
  const { proponente, proposta } = operacao;
  const { numeros, totais, secoes } = revisao;

  escritor.titulo("Resumo da análise");

  const documento = proponente.documento ? ` (${proponente.documento})` : "";
  escritor.chaveValor("Proponente", `${proponente.nome || "-"}${documento}`);
  escritor.chaveValor("Setor de atuação", proponente.setorAtuacao);
  const modalidade = nomeDaModalidade(checklist, proposta.programa, proposta.linhaChecklist);
  escritor.chaveValor("Fonte de recurso", `${rotuloPrograma(proposta.programa)}${modalidade ? ` - ${modalidade}` : ""}`);
  escritor.chaveValor("Linha de crédito", proposta.linhaCreditoDescricao);
  escritor.chaveValor("Finalidade", proposta.finalidade);
  escritor.chaveValor("Valor da operação", moeda(proposta.valorOperacao));
  escritor.chaveValor(
    "Prazo / carência",
    `${proposta.prazoMeses || "-"} meses / ${proposta.carenciaMeses || "0"} meses`
  );
  escritor.chaveValor(
    "Taxa",
    proposta.taxaAnual ? `${Number(proposta.taxaAnual).toLocaleString("pt-BR")}% a.a. (${proposta.periodicidadePagamento})` : "-"
  );
  escritor.chaveValor("Parcela estimada", numeros.parcela > 0 ? moeda(numeros.parcela) : "-");
  escritor.chaveValor(
    "Garantias",
    numeros.somaGarantias > 0
      ? `${moeda(numeros.somaGarantias)} - cobertura de ${percentual(numeros.coberturaGarantias)}`
      : "-"
  );

  // situacao dos checklists
  escritor.titulo("Situação dos checklists");
  escritor.novaPaginaSeNecessario(30);
  desenharBarra(doc, MARGIN_X, escritor.estado.y - 1, CONTENT_WIDTH, totais);
  escritor.espaco(7);
  escritor.paragrafo(
    `${totais.percentual}% avaliado  |  ${totais.ok} OK  |  ${totais.na} N/A  |  ${totais.pendente} pendente(s)  |  ${totais.naoAvaliados} sem avaliação`,
    { estilo: "bold", tamanho: 9 }
  );

  const colunas = { ok: 118, na: 136, pendente: 158, sem: PAGE_WIDTH - MARGIN_X };
  const cabecalhoTabela = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.text("Seção", MARGIN_X, escritor.estado.y);
    doc.text("OK", colunas.ok, escritor.estado.y, { align: "right" });
    doc.text("N/A", colunas.na, escritor.estado.y, { align: "right" });
    doc.text("Pendente", colunas.pendente, escritor.estado.y, { align: "right" });
    doc.text("Sem aval.", colunas.sem, escritor.estado.y, { align: "right" });
    escritor.espaco(5);
  };
  escritor.novaPaginaSeNecessario(40);
  cabecalhoTabela();
  secoes.forEach((secao) => {
    escritor.novaPaginaSeNecessario();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_TEXTO);
    doc.text(paraLatin1(secao.titulo), MARGIN_X, escritor.estado.y);
    doc.text(String(secao.ok), colunas.ok, escritor.estado.y, { align: "right" });
    doc.text(String(secao.na), colunas.na, escritor.estado.y, { align: "right" });
    if (secao.pendente > 0) doc.setFont("helvetica", "bold");
    doc.text(String(secao.pendente), colunas.pendente, escritor.estado.y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(String(secao.naoAvaliados), colunas.sem, escritor.estado.y, { align: "right" });
    escritor.espaco(escritor.linhaAltura);
  });
  escritor.espaco(2);

  // pontos de atencao
  const pontos = [
    ...revisao.camposFaltando.map((campo) => `Campo obrigatório em branco: ${campo.rotulo}.`),
    ...revisao.avisos.map((aviso) => aviso.texto),
  ];
  if (pontos.length > 0) {
    escritor.titulo("Pontos de atenção");
    pontos.forEach((ponto) => escritor.paragrafo(`- ${ponto}`, { recuo: 2 }));
  }

  // pendencias
  const secoesComPendencia = secoes.filter((secao) => secao.pendencias.length > 0);
  if (secoesComPendencia.length > 0) {
    escritor.titulo("Pendências para devolutiva");
    secoesComPendencia.forEach((secao) => {
      escritor.subtitulo(`${secao.titulo} (${secao.pendencias.length})`);
      secao.pendencias.forEach((pendencia) => {
        const contexto = pendencia.contexto ? `${pendencia.contexto} - ` : "";
        const texto = pendencia.texto ? `: ${pendencia.texto}` : " (sem texto de devolutiva)";
        escritor.paragrafo(`- ${contexto}${pendencia.nome}${texto}`, { recuo: 3, tamanho: 9 });
      });
    });
  }
}

function escreverItemChecklist(escritor, item, estadoItem) {
  const { doc } = escritor;
  const estado = estadoItem || {};
  const recuo = 21;

  escritor.novaPaginaSeNecessario();
  desenharChip(doc, estado.status, MARGIN_X, escritor.estado.y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_TEXTO);
  const linhasNome = doc.splitTextToSize(paraLatin1(item.nome), CONTENT_WIDTH - recuo);
  linhasNome.forEach((linha, indice) => {
    if (indice > 0) escritor.novaPaginaSeNecessario();
    doc.text(linha, MARGIN_X + recuo, escritor.estado.y);
    escritor.estado.y += escritor.linhaAltura;
  });

  const complemento = (texto, estilo = "italic") => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(8.5);
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.splitTextToSize(paraLatin1(texto), CONTENT_WIDTH - recuo).forEach((linha) => {
      escritor.novaPaginaSeNecessario();
      doc.text(linha, MARGIN_X + recuo, escritor.estado.y);
      escritor.estado.y += escritor.linhaAltura - 0.4;
    });
  };

  if (estado.observacao) complemento(`Obs.: ${estado.observacao}`);
  if (item.tipo === "texto" && item.template) {
    complemento(montarTextoFinal(item.template, estado.camposTexto));
  }
  if (estado.status === "pendente" && estado.devolutivaTexto) {
    complemento(`Devolutiva: ${estado.devolutivaTexto}`);
  }
  escritor.espaco(0.6);
}

function escreverGrupos(escritor, grupos, estado) {
  grupos.forEach((grupo) => {
    escritor.subtitulo(grupo.nome);
    grupo.itens.forEach((item) => escreverItemChecklist(escritor, item, estado?.[item.chave]));
    escritor.espaco(1);
  });
}

// Relatorio completo da operacao: pagina de resumo (numeros, situacao dos checklists, pontos de
// atencao e pendencias), os checklists item a item e, por fim, o parecer. `checklist` e o objeto
// `referencia.checklist` da tela (proponente, documentos, garantias, areaBeneficiada, linhas).
export function gerarPdfOperacao(operacao, checklist) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const escritor = criarEscritor(doc);
  const { proponente, proposta } = operacao;
  const revisao = coletarRevisao(operacao, checklist);
  const filtrar = (grupos) => filtrarGruposPorFonteELinha(grupos || [], proposta.programa, proposta.linhaChecklist);

  desenharCabecalho(
    doc,
    `${proponente.nome || "Operação sem proponente definido"}  |  ${rotuloPrograma(proposta.programa)}`
  );

  escreverResumo(escritor, operacao, checklist, revisao);

  doc.addPage();
  escritor.estado.y = CORPO_INICIO_Y;

  escritor.titulo("Checklist do proponente");
  escreverGrupos(escritor, filtrar(checklist?.proponente), proponente.checklist);

  escritor.titulo(`Demais documentos - ${rotuloPrograma(proposta.programa)}`);
  escreverGrupos(escritor, filtrar(checklist?.documentos), operacao.checklistDocumental);

  const imoveis = operacao.areaBeneficiada || [];
  if (imoveis.length > 0) {
    const grupoBem = filtrar(checklist?.areaBeneficiada?.bem);
    const grupoProprietario = filtrar(checklist?.areaBeneficiada?.proprietario);
    escritor.titulo("Área beneficiada");
    imoveis.forEach((imovel, indice) => {
      escritor.subtitulo(`${imovel.nomeImovel || `Imóvel ${indice + 1}`} - matrícula ${imovel.matricula || "-"}`);
      escreverGrupos(escritor, grupoBem, imovel.checklist);
      (imovel.proprietarios || []).forEach((proprietario) => {
        escritor.paragrafo(
          `Proprietário: ${proprietario.nome || "-"} (${proprietario.documento || "documento não informado"})`,
          { estilo: "bold" }
        );
        escreverGrupos(escritor, grupoProprietario, proprietario.checklist);
      });
    });
  }

  const garantias = operacao.garantias || [];
  if (garantias.length > 0) {
    escritor.titulo("Garantias");
    garantias.forEach((garantia, indice) => {
      const def = checklist?.garantias?.[garantia.tipo] || { bem: [], proprietario: [] };
      const valorTexto = tipoSemValor(garantia.tipo) ? "cobre toda a operação" : moeda(garantia.valor);
      escritor.subtitulo(`Garantia ${indice + 1} - ${rotuloTipoGarantia(garantia.tipo)} - ${valorTexto}`);
      const analise = tipoTemAnaliseMatricula(garantia.tipo)
        ? descreverAnaliseMatricula(garantia, operacao.proposta.valorOperacao)
        : null;
      const imovel = tipoTemAnaliseMatricula(garantia.tipo) ? descreverImovelGarantia(garantia) : null;
      if (imovel) escritor.paragrafo(imovel, { tamanho: 9 });
      if (analise) {
        escritor.paragrafo(analise.resumo, { tamanho: 9 });
        analise.graus.forEach((grau) => escritor.paragrafo(`- ${grau}`, { recuo: 4, tamanho: 8.5 }));
      }
      escreverGrupos(escritor, def.bem, garantia.checklist);
      (garantia.garantidores || []).forEach((garantidor) => {
        escritor.paragrafo(
          `Garantidor: ${garantidor.nome || "-"} (${garantidor.documento || "documento não informado"})`,
          { estilo: "bold" }
        );
        escreverGrupos(escritor, def.proprietario, garantidor.checklist);
      });
    });
  }

  escritor.titulo("Parecer");
  escritor.paragrafo(operacao.parecerTexto || "-");

  numerarPaginas(doc);
  doc.save(nomeDeArquivo("relatorio", proponente.nome));
}

// Export mais simples: so o texto consolidado da devolutiva, no mesmo estilo visual.
export function gerarPdfDevolutiva(operacao, textoDevolutiva) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const escritor = criarEscritor(doc);

  desenharCabecalho(doc, `Devolutiva - ${operacao.proponente.nome || "Operação sem proponente definido"}`);
  escritor.paragrafo(textoDevolutiva || "-");

  numerarPaginas(doc);
  doc.save(nomeDeArquivo("devolutiva", operacao.proponente.nome));
}
