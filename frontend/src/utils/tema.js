// Tema claro/escuro. "auto" segue o sistema operacional (nenhum atributo no <html>); "claro" e
// "escuro" forcam via data-theme, que o index.css reconhece. A preferencia e so um conforto
// do navegador, entao qualquer falha no localStorage cai em "auto".

const CHAVE = "ruralflow:tema";

export const TEMAS = ["auto", "claro", "escuro"];

export function lerTema() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return TEMAS.includes(salvo) ? salvo : "auto";
  } catch (erro) {
    return "auto";
  }
}

export function aplicarTema(tema) {
  const raiz = document.documentElement;
  if (tema === "claro") raiz.setAttribute("data-theme", "light");
  else if (tema === "escuro") raiz.setAttribute("data-theme", "dark");
  else raiz.removeAttribute("data-theme");
}

export function salvarTema(tema) {
  try {
    localStorage.setItem(CHAVE, tema);
  } catch (erro) {
    // sem persistencia: o tema vale so ate recarregar a pagina
  }
}

export function proximoTema(atual) {
  return TEMAS[(TEMAS.indexOf(atual) + 1) % TEMAS.length];
}
