// Filtra os itens de um catalogo (Proponente ou Documentos) pela fonte de recurso e pela
// linha selecionadas na Proposta. As duas marcacoes sao independentes uma da outra:
// - `item.fontes`: "todas" (padrao) ou uma lista de fontes (ex: ["bndes","fco"]).
// - `item.linhas`: "todas" (padrao) ou uma lista de ids de linha (ja unicos globalmente,
//   entao nao precisa saber a qual fonte pertencem pra filtrar).
// Um item so aparece se passar nos dois filtros ao mesmo tempo. Grupos que ficarem sem
// nenhum item visivel somem da lista (evita cabecalho de grupo vazio).

// Regra de visibilidade de um unico item — separada do filtro de grupos pra o painel de
// administracao poder mostrar "o que o analista veria" sem esconder os grupos vazios.
export function itemVisivel(item, fonte, linhaId) {
  const passaFonte =
    item.fontes === "todas" ||
    item.fontes === undefined ||
    (fonte && Array.isArray(item.fontes) ? item.fontes.includes(fonte) : false);
  if (!passaFonte) return false;
  if (item.linhas === "todas" || item.linhas === undefined) return true;
  return linhaId && Array.isArray(item.linhas) ? item.linhas.includes(linhaId) : false;
}

export function filtrarGruposPorFonteELinha(grupos, fonte, linhaId) {
  return grupos
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => itemVisivel(item, fonte, linhaId)),
    }))
    .filter((grupo) => grupo.itens.length > 0);
}
