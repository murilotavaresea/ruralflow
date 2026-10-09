import jsPDF from "jspdf";
import { montarTextoFinal } from "./gerarTextoTemplate";
import { rotuloTipoGarantia } from "./garantiaModel";
import { filtrarGruposPorFonteELinha } from "./linhaModel";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const HEADER_HEIGHT = 24;
const FOOTER_Y = 286;

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function desenharCabecalho(doc, subtitulo) {
  doc.setFillColor(78, 69, 75);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(248, 250, 246);
  doc.text("RuralFlow - Checklist de Analise de Credito Rural", MARGIN_X, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 224);
  doc.text(normalizarTexto(subtitulo), MARGIN_X, 20);
}

function desenharRodape(doc, pagina, totalPaginas) {
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  doc.setDrawColor(220, 229, 225);
  doc.line(MARGIN_X, FOOTER_Y, PAGE_WIDTH - MARGIN_X, FOOTER_Y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(106, 100, 106);
  doc.text(`Gerado via RuralFlow em ${dataHoje}`, MARGIN_X, FOOTER_Y + 5);
  doc.text(`Pagina ${pagina} de ${totalPaginas}`, PAGE_WIDTH - MARGIN_X, FOOTER_Y + 5, {
    align: "right",
  });
}

const STATUS_ROTULO = { ok: "OK", na: "N/A", pendente: "Pendente" };

export function gerarPdfOperacao(
  operacao,
  checklistProponenteDef,
  checklistDocumentosDef,
  checklistGarantiasDef = {},
  checklistAreaBeneficiadaDef = { bem: [], proprietario: [] }
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = HEADER_HEIGHT + 12;
  const linhaAltura = 5.2;

  const novaPaginaSeNecessario = (alturaNecessaria = linhaAltura) => {
    if (y + alturaNecessaria > FOOTER_Y - 4) {
      doc.addPage();
      y = HEADER_HEIGHT + 12;
    }
  };

  const escreverTitulo = (texto) => {
    novaPaginaSeNecessario(9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(78, 69, 75);
    doc.text(normalizarTexto(texto), MARGIN_X, y);
    y += 7;
  };

  const escreverSubtitulo = (texto) => {
    novaPaginaSeNecessario(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(101, 91, 98);
    doc.text(normalizarTexto(texto), MARGIN_X, y);
    y += 5.5;
  };

  const escreverParagrafo = (texto) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(78, 69, 75);
    const linhas = doc.splitTextToSize(normalizarTexto(texto), CONTENT_WIDTH);
    linhas.forEach((linha) => {
      novaPaginaSeNecessario();
      doc.text(linha, MARGIN_X, y);
      y += linhaAltura;
    });
    y += 2;
  };

  const escreverItemChecklist = (item, estado) => {
    novaPaginaSeNecessario();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(78, 69, 75);
    const rotuloStatus = `[${STATUS_ROTULO[estado.status] || "Pendente"}]`;
    doc.text(rotuloStatus, MARGIN_X, y);

    doc.setFont("helvetica", "normal");
    const textoItem = estado.observacao ? `${item.nome} - ${estado.observacao}` : item.nome;
    const linhas = doc.splitTextToSize(normalizarTexto(textoItem), CONTENT_WIDTH - 20);
    linhas.forEach((linha, indice) => {
      if (indice > 0) novaPaginaSeNecessario();
      doc.text(linha, MARGIN_X + 20, y);
      y += linhaAltura;
    });

    if (item.tipo === "texto" && item.template) {
      const textoFinal = montarTextoFinal(item.template, estado.camposTexto);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(101, 91, 98);
      const linhasTexto = doc.splitTextToSize(normalizarTexto(textoFinal), CONTENT_WIDTH - 20);
      linhasTexto.forEach((linha) => {
        novaPaginaSeNecessario();
        doc.text(linha, MARGIN_X + 20, y);
        y += linhaAltura;
      });
    }
  };

  desenharCabecalho(doc, operacao.proponente.nome || "Operacao sem proponente definido");

  escreverTitulo("Proponente");
  escreverParagrafo(
    `${operacao.proponente.nome || "-"} (${operacao.proponente.documento || "documento nao informado"})`
  );
  escreverParagrafo(`Setor de atuacao: ${operacao.proponente.setorAtuacao || "-"}`);

  escreverTitulo("Proposta");
  escreverParagrafo(`Linha de credito: ${operacao.proposta.linhaCreditoDescricao || "-"}`);
  escreverParagrafo(`Finalidade: ${operacao.proposta.finalidade || "-"}`);
  escreverParagrafo(
    `Valor: ${operacao.proposta.valorOperacao || "-"} | Prazo: ${operacao.proposta.prazoMeses || "-"} meses | Carencia: ${
      operacao.proposta.carenciaMeses || "-"
    } meses | Taxa: ${operacao.proposta.taxaAnual || "-"}% a.a.`
  );

  const grupoProponente = filtrarGruposPorFonteELinha(
    checklistProponenteDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  escreverTitulo("Checklist do proponente");
  grupoProponente.forEach((grupo) => {
    escreverSubtitulo(grupo.nome);
    grupo.itens.forEach((item) => {
      const estado = operacao.proponente.checklist[item.chave] || {};
      escreverItemChecklist(item, estado);
    });
  });

  const grupoDocumental = filtrarGruposPorFonteELinha(
    checklistDocumentosDef,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  escreverTitulo(`Demais documentos - ${operacao.proposta.programa.toUpperCase()}`);
  grupoDocumental.forEach((grupo) => {
    escreverSubtitulo(grupo.nome);
    grupo.itens.forEach((item) => {
      const estado = operacao.checklistDocumental[item.chave] || {};
      escreverItemChecklist(item, estado);
    });
  });

  if ((operacao.areaBeneficiada || []).length > 0) {
    const grupoAreaBeneficiadaBem = filtrarGruposPorFonteELinha(
      checklistAreaBeneficiadaDef.bem,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    );
    const grupoAreaBeneficiadaProprietario = filtrarGruposPorFonteELinha(
      checklistAreaBeneficiadaDef.proprietario,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    );
    escreverTitulo("Área beneficiada");
    operacao.areaBeneficiada.forEach((imovel, indice) => {
      escreverSubtitulo(`${imovel.nomeImovel || `Imóvel ${indice + 1}`} - matrícula ${imovel.matricula || "-"}`);
      grupoAreaBeneficiadaBem.forEach((grupo) => {
        grupo.itens.forEach((item) => {
          const estado = imovel.checklist[item.chave] || {};
          escreverItemChecklist(item, estado);
        });
      });
      imovel.proprietarios.forEach((proprietario) => {
        escreverParagrafo(
          `Proprietário: ${proprietario.nome || "-"} (${proprietario.documento || "documento nao informado"})`
        );
        grupoAreaBeneficiadaProprietario.forEach((grupo) => {
          grupo.itens.forEach((item) => {
            const estado = proprietario.checklist[item.chave] || {};
            escreverItemChecklist(item, estado);
          });
        });
      });
    });
  }

  if ((operacao.garantias || []).length > 0) {
    escreverTitulo("Garantias");
    operacao.garantias.forEach((garantia, indice) => {
      const def = checklistGarantiasDef[garantia.tipo] || { bem: [], proprietario: [] };
      escreverSubtitulo(
        `Garantia ${indice + 1} - ${rotuloTipoGarantia(garantia.tipo)} - R$ ${garantia.valor || "-"}`
      );
      def.bem.forEach((grupo) => {
        grupo.itens.forEach((item) => {
          const estado = garantia.checklist[item.chave] || {};
          escreverItemChecklist(item, estado);
        });
      });
      garantia.garantidores.forEach((garantidor) => {
        escreverParagrafo(`Garantidor: ${garantidor.nome || "-"} (${garantidor.documento || "documento nao informado"})`);
        def.proprietario.forEach((grupo) => {
          grupo.itens.forEach((item) => {
            const estado = garantidor.checklist[item.chave] || {};
            escreverItemChecklist(item, estado);
          });
        });
      });
    });
  }

  escreverTitulo("Parecer");
  escreverParagrafo(operacao.parecerTexto || "-");

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    desenharRodape(doc, pagina, totalPaginas);
  }

  const nomeArquivo = `parecer_${(operacao.proponente.nome || "operacao").trim().replace(/[^\w\-]+/g, "_").toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}

// Export mais simples: so o texto consolidado da devolutiva, no mesmo estilo visual.
export function gerarPdfDevolutiva(operacao, textoDevolutiva) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = HEADER_HEIGHT + 12;
  const linhaAltura = 5.2;

  desenharCabecalho(doc, `Devolutiva - ${operacao.proponente.nome || "Operacao sem proponente definido"}`);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(78, 69, 75);
  const linhas = doc.splitTextToSize(normalizarTexto(textoDevolutiva || "-"), CONTENT_WIDTH);
  linhas.forEach((linha) => {
    if (y + linhaAltura > FOOTER_Y - 4) {
      doc.addPage();
      y = HEADER_HEIGHT + 12;
    }
    doc.text(linha, MARGIN_X, y);
    y += linhaAltura;
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    desenharRodape(doc, pagina, totalPaginas);
  }

  const nomeArquivo = `devolutiva_${(operacao.proponente.nome || "operacao").trim().replace(/[^\w\-]+/g, "_").toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}
