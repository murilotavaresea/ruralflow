// Filtra os itens de um catalogo (Proponente ou Documentos) pela fonte de recurso e pela
// linha selecionadas na Proposta. As duas marcacoes sao independentes uma da outra:
// - `item.fontes`: "todas" (padrao) ou uma lista de fontes (ex: ["bndes","fco"]).
// - `item.linhas`: "todas" (padrao) ou uma lista de ids de linha (ja unicos globalmente,
//   entao nao precisa saber a qual fonte pertencem pra filtrar).
// Um item so aparece se passar nos dois filtros ao mesmo tempo. Grupos que ficarem sem
// nenhum item visivel somem da lista (evita cabecalho de grupo vazio).
export function filtrarGruposPorFonteELinha(grupos, fonte, linhaId) {
  return grupos
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => {
        const passaFonte =
          item.fontes === "todas" || item.fontes === undefined || (fonte ? item.fontes.includes(fonte) : false);
        if (!passaFonte) return false;
        if (item.linhas === "todas" || item.linhas === undefined) return true;
        return linhaId ? item.linhas.includes(linhaId) : false;
      }),
    }))
    .filter((grupo) => grupo.itens.length > 0);
}
