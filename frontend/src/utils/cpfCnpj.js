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
