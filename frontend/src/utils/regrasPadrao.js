// Copia local das regras iniciais (as mesmas de backend/config/regras_parecer.py). So e usada
// quando o backend esta fora do ar, pra a ferramenta continuar gerando o parecer offline —
// mesmo papel do referenciaFallback.js. Com o backend no ar, quem vale e o que foi configurado
// na Administracao.
export const REGRAS_PADRAO = [
  {
    id: "reg_padrao_risco",
    nome: "Risco R7 ou acima",
    ativa: true,
    campo: "proponente_risco",
    operador: "maior_igual",
    valor: "7",
    fontes: "todas",
    impedeContratacao: false,
    textoParecer: "Cooperado com risco {risco}: a operação deve ser deliberada pelas alçadas competentes.",
    textoDevolutiva: "",
  },
  {
    id: "reg_padrao_qrsa",
    nome: "QRSA Alto",
    ativa: true,
    campo: "proponente_qrsa",
    operador: "igual",
    valor: "Alto",
    fontes: "todas",
    impedeContratacao: false,
    textoParecer: "QRSA Alto: submeter ao Nível 4.",
    textoDevolutiva: "",
  },
];
