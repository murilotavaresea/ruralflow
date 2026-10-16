export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function detectarTipoDocumento(valor) {
  const digitos = somenteDigitos(valor);
  if (digitos.length === 11) return "CPF";
  if (digitos.length === 14) return "CNPJ";
  return "";
}

export function formatarDocumento(valor) {
  const digitos = somenteDigitos(valor).slice(0, 14);

  if (digitos.length <= 11) {
    return digitos
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digitos
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function digitoVerificador(digitos, pesos) {
  const soma = digitos.reduce((acumulado, digito, indice) => acumulado + digito * pesos[indice], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validarCpf(digitos) {
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const numeros = digitos.split("").map(Number);
  const d1 = digitoVerificador(numeros.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(numeros.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === numeros[9] && d2 === numeros[10];
}

function validarCnpj(digitos) {
  if (/^(\d)\1{13}$/.test(digitos)) return false;
  const numeros = digitos.split("").map(Number);
  const d1 = digitoVerificador(numeros.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(numeros.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === numeros[12] && d2 === numeros[13];
}

// Confere os digitos verificadores. `valido` e null enquanto o documento ainda nao tem 11
// (CPF) nem 14 (CNPJ) digitos — nesse caso nao ha o que afirmar, so que esta incompleto.
export function validarDocumento(valor) {
  const digitos = somenteDigitos(valor);
  if (digitos.length === 11) return { tipo: "CPF", valido: validarCpf(digitos), digitos: 11 };
  if (digitos.length === 14) return { tipo: "CNPJ", valido: validarCnpj(digitos), digitos: 14 };
  return { tipo: "", valido: null, digitos: digitos.length };
}
