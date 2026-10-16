// Entrada numerica com mascara pt-BR (1.234.567,89) sem perder a compatibilidade com o que ja
// existe salvo: o valor guardado na operacao continua sendo uma string com ponto decimal e sem
// separador de milhar ("1234567.89"), exatamente o que um <input type="number"> devolvia —
// entao Number(valor) segue funcionando em todo calculo, no parecer e no PDF.
//
// A string guardada pode terminar em "." (usuario acabou de digitar a virgula) ou ter zeros a
// direita ("10.50"); isso e proposital, senao nao daria pra digitar "10,50" digito a digito.

const ARMAZENADO_VALIDO = /^\d*\.?\d*$/;

// Aceita o que ja estava salvo (numero, "1e5" de um input number antigo, string com ponto) e
// devolve a forma canonica, ou "" se nao der pra aproveitar.
export function normalizarArmazenado(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const texto = typeof valor === "number" ? String(valor) : String(valor).trim();
  if (ARMAZENADO_VALIDO.test(texto)) return texto;
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero < 0) return "";
  return String(numero);
}

function agruparMilhares(inteiro) {
  return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// "1234567.5" -> "1.234.567,5"
export function formatarParaExibicao(armazenado, decimais = 2) {
  const texto = normalizarArmazenado(armazenado);
  if (texto === "") return "";
  const [inteiroBruto, decimal] = texto.split(".");
  const inteiro = (inteiroBruto || "0").replace(/^0+(?=\d)/, "");
  const temSeparador = decimais > 0 && texto.includes(".");
  if (!temSeparador) return agruparMilhares(inteiro || "0");
  return `${agruparMilhares(inteiro || "0")},${(decimal || "").slice(0, decimais)}`;
}

// Texto digitado/colado no campo -> forma canonica. Regras:
// - a virgula e o separador decimal; pontos antes dela sao milhar e somem;
// - sem virgula, um "." no FIM do texto vira decimal (teclado numerico ABNT2 manda "." e a
//   mascara nunca gera "." solto no fim, entao nao ha ambiguidade com milhar);
// - qualquer outro caractere e descartado; decimais alem do limite sao cortados.
export function interpretarEntrada(texto, decimais = 2) {
  const bruto = String(texto ?? "").replace(/[^\d.,]/g, "");
  if (bruto === "") return "";

  if (decimais <= 0) return bruto.replace(/\D/g, "");

  let posicaoDecimal = bruto.indexOf(",");
  if (posicaoDecimal < 0 && bruto.endsWith(".")) posicaoDecimal = bruto.length - 1;

  if (posicaoDecimal < 0) return bruto.replace(/\D/g, "");

  const inteiro = bruto.slice(0, posicaoDecimal).replace(/\D/g, "");
  const decimal = bruto.slice(posicaoDecimal + 1).replace(/\D/g, "").slice(0, decimais);
  return `${inteiro || "0"}.${decimal}`;
}

// Quantos caracteres "significativos" (digitos e virgula) existem no texto — usado pra
// recolocar o cursor no lugar certo depois que a mascara reescreve o campo.
export function contarSignificativos(texto) {
  return (String(texto).match(/[\d,]/g) || []).length;
}

// Posicao no texto de exibicao em que restam `restantes` caracteres significativos a direita.
export function posicaoPorSignificativosRestantes(exibicao, restantes) {
  let encontrados = 0;
  for (let posicao = exibicao.length; posicao > 0; posicao -= 1) {
    if (encontrados === restantes) return posicao;
    if (/[\d,]/.test(exibicao[posicao - 1])) encontrados += 1;
  }
  return 0;
}
