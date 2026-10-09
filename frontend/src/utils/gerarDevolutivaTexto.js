import { rotuloTipoGarantia } from "./garantiaModel";
import { filtrarGruposPorFonteELinha } from "./linhaModel";

function linhasPendentes(grupos, estado) {
  const linhas = [];
  grupos.forEach((grupo) => {
    const itensPendentesComTexto = grupo.itens.filter((item) => {
      const estadoItem = estado[item.chave];
      return estadoItem?.status === "pendente" && estadoItem?.devolutivaTexto?.trim();
    });

    if (itensPendentesComTexto.length === 0) return;

    linhas.push(`${grupo.nome}:`);
    itensPendentesComTexto.forEach((item) => {
      linhas.push(`  - ${item.nome}: ${estado[item.chave].devolutivaTexto.trim()}`);
    });
  });
  return linhas;
}

// Junta o texto de devolutiva de todos os itens "Pendente" (Proponente, Demais Documentos da
// fonte/linha selecionada, Área Beneficiada e Garantias), agrupados por secao — igual ao
// papel da aba DEVOLUTIVAS do Excel original, so que montado automaticamente a partir do que
// ja foi marcado no checklist, em vez de copiado a mao.
export default function gerarDevolutivaTexto(operacao, checklistDefs) {
  const blocos = [];

  const secoesFixas = [
    {
      titulo: "Proponente",
      grupos: filtrarGruposPorFonteELinha(
        checklistDefs.proponente,
        operacao.proposta.programa,
        operacao.proposta.linhaChecklist
      ),
      estado: operacao.proponente.checklist,
    },
    {
      titulo: `Demais documentos (${operacao.proposta.programa})`,
      grupos: filtrarGruposPorFonteELinha(
        checklistDefs.documentos,
        operacao.proposta.programa,
        operacao.proposta.linhaChecklist
      ),
      estado: operacao.checklistDocumental,
    },
  ];

  secoesFixas.forEach((secao) => {
    const linhas = linhasPendentes(secao.grupos, secao.estado);
    if (linhas.length > 0) blocos.push(`${secao.titulo}\n${linhas.join("\n")}`);
  });

  const defAreaBeneficiadaBruta = checklistDefs.areaBeneficiada || { bem: [], proprietario: [] };
  const defAreaBeneficiada = {
    bem: filtrarGruposPorFonteELinha(
      defAreaBeneficiadaBruta.bem,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    ),
    proprietario: filtrarGruposPorFonteELinha(
      defAreaBeneficiadaBruta.proprietario,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    ),
  };

  (operacao.areaBeneficiada || []).forEach((imovel, indice) => {
    const def = defAreaBeneficiada;
    const nomeImovel = imovel.nomeImovel || `Imóvel ${indice + 1}`;

    const linhasImovel = linhasPendentes(def.bem, imovel.checklist);
    if (linhasImovel.length > 0) blocos.push(`Área beneficiada - ${nomeImovel}\n${linhasImovel.join("\n")}`);

    (imovel.proprietarios || []).forEach((proprietario) => {
      const linhasProprietario = linhasPendentes(def.proprietario, proprietario.checklist);
      if (linhasProprietario.length > 0) {
        const nome = proprietario.nome || "sem nome informado";
        blocos.push(`Área beneficiada - ${nomeImovel} - proprietário ${nome}\n${linhasProprietario.join("\n")}`);
      }
    });
  });

  (operacao.garantias || []).forEach((garantia, indice) => {
    const def = checklistDefs.garantias?.[garantia.tipo] || { bem: [], proprietario: [] };
    const tituloGarantia = `Garantia ${indice + 1} - ${rotuloTipoGarantia(garantia.tipo)}`;

    const linhasBem = linhasPendentes(def.bem, garantia.checklist);
    if (linhasBem.length > 0) blocos.push(`${tituloGarantia} (bem)\n${linhasBem.join("\n")}`);

    (garantia.garantidores || []).forEach((garantidor) => {
      const linhasGarantidor = linhasPendentes(def.proprietario, garantidor.checklist);
      if (linhasGarantidor.length > 0) {
        const nome = garantidor.nome || "sem nome informado";
        blocos.push(`${tituloGarantia} - garantidor ${nome}\n${linhasGarantidor.join("\n")}`);
      }
    });
  });

  if (blocos.length === 0) {
    return "Nenhuma pendencia marcada para devolutiva no momento.";
  }

  return ["DEVOLUTIVA - PENDENCIAS PARA REGULARIZACAO", "", ...blocos].join("\n\n");
}
