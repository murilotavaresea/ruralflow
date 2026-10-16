// Texto amigavel para um erro de requisicao (axios): prefere a mensagem que o backend mandou
// em { erro: "..." } e cai em mensagens genericas quando o servidor nem respondeu.
export function mensagemDeErro(erro) {
  const doServidor = erro?.response?.data?.erro;
  if (doServidor) return doServidor;
  if (erro?.response) return `o servidor respondeu com erro ${erro.response.status}`;
  if (erro?.request) return "o servidor não respondeu — o backend está rodando?";
  return erro?.message || "erro desconhecido";
}
