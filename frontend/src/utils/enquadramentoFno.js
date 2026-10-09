function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function buscarMunicipios(municipios, termo) {
  const alvo = normalizar(termo);
  if (!alvo) return [];
  return municipios
    .filter((m) => normalizar(m.municipio).includes(alvo))
    .slice(0, 20);
}

// Replica a formula G49 da aba PROPONENTE do Excel original.
export function classificarPorte(rendaAnual, faixasPorte) {
  const renda = Number(rendaAnual);
  if (!Number.isFinite(renda)) return null;

  for (const faixa of faixasPorte) {
    if (faixa.limite_maximo === null || renda <= faixa.limite_maximo) {
      return faixa.porte;
    }
  }
  return null;
}

export function buscarPrazoPorEmpreendimento(tipo, tabela) {
  return tabela.find((item) => item.tipo === tipo) || null;
}
