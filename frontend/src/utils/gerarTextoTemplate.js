const PADRAO_CAMPO = /\{([a-zA-Z0-9_]+)\}/g;

// Extrai os nomes dos campos {assim} de um modelo de texto, na ordem em que aparecem, sem
// repetir. Usado tanto no admin (pra mostrar quais campos o modelo vai pedir) quanto na
// operacao (pra desenhar o formulario desses campos).
export function extrairCampos(template) {
  const encontrados = [];
  const vistos = new Set();
  let resultado;
  PADRAO_CAMPO.lastIndex = 0;
  while ((resultado = PADRAO_CAMPO.exec(template || "")) !== null) {
    const chave = resultado[1];
    if (!vistos.has(chave)) {
      vistos.add(chave);
      encontrados.push(chave);
    }
  }
  return encontrados;
}

export function rotuloCampo(chave) {
  return chave
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

// Substitui {chave} pelo valor preenchido; campos sem valor ficam com o proprio marcador
// destacado, pra ficar obvio que falta preencher.
export function montarTextoFinal(template, camposTexto = {}) {
  if (!template) return "";
  return template.replace(PADRAO_CAMPO, (correspondencia, chave) => {
    const valor = camposTexto[chave];
    return valor && String(valor).trim() ? valor : `[${chave}]`;
  });
}
