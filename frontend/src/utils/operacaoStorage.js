import { novoIdOperacao, operacaoEstaVazia } from "./operacaoModel";

// Varias operacoes salvas no navegador. Cada operacao fica na propria chave (gravar uma nao
// reescreve as outras) e um indice pequeno guarda so o que a lista "Operacoes" precisa mostrar.
// Tudo continua sincrono de proposito: o estado inicial da tela e lido direto daqui.
const CHAVE_V1 = "ruralflow:operacao:v1"; // formato antigo: uma unica operacao
const CHAVE_INDICE = "ruralflow:operacoes:indice";
const CHAVE_ATIVA = "ruralflow:operacoes:ativa";
const PREFIXO_OPERACAO = "ruralflow:operacoes:op:";

function ler(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch (erro) {
    console.error(`Nao foi possivel ler "${chave}" do navegador.`, erro);
    return null;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    console.error(`Nao foi possivel gravar "${chave}" no navegador.`, erro);
    return false;
  }
}

function remover(chave) {
  try {
    localStorage.removeItem(chave);
  } catch (erro) {
    console.error(`Nao foi possivel remover "${chave}" do navegador.`, erro);
  }
}

function resumir(operacao) {
  return {
    id: operacao.id,
    nome: operacao.proponente?.nome || "",
    documento: operacao.proponente?.documento || "",
    programa: operacao.proposta?.programa || "",
    valorOperacao: operacao.proposta?.valorOperacao || "",
    criadoEm: operacao.criadoEm,
    atualizadoEm: operacao.atualizadoEm,
  };
}

function lerIndice() {
  const indice = ler(CHAVE_INDICE);
  return Array.isArray(indice) ? indice.filter((entrada) => entrada && entrada.id) : [];
}

// Mais recentemente alteradas primeiro.
export function listarOperacoes() {
  return lerIndice().sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
}

export function definirOperacaoAtiva(id) {
  gravar(CHAVE_ATIVA, id);
}

// Grava a operacao (e a registra no indice). Uma operacao ainda em branco nao e gravada —
// evita encher a lista de "operacoes" vazias —, a nao ser que ela ja exista salva e o analista
// tenha apagado tudo, caso em que o estado vazio precisa sobrescrever o antigo.
export function salvarOperacao(operacao) {
  const indice = lerIndice();
  const jaSalva = indice.some((entrada) => entrada.id === operacao.id);
  if (!jaSalva && operacaoEstaVazia(operacao)) {
    definirOperacaoAtiva(operacao.id);
    return true;
  }

  const gravada = { ...operacao, atualizadoEm: new Date().toISOString() };
  if (!gravar(PREFIXO_OPERACAO + operacao.id, gravada)) return false;

  const restante = indice.filter((entrada) => entrada.id !== operacao.id);
  if (!gravar(CHAVE_INDICE, [resumir(gravada), ...restante])) return false;
  definirOperacaoAtiva(operacao.id);
  return true;
}

// Leitura sem efeitos colaterais (nao muda a operacao ativa) — usada pra exportar/desfazer.
export function lerOperacaoSalva(id) {
  return ler(PREFIXO_OPERACAO + id);
}

export function abrirOperacao(id) {
  const operacao = ler(PREFIXO_OPERACAO + id);
  if (operacao) definirOperacaoAtiva(id);
  return operacao;
}

export function excluirOperacao(id) {
  remover(PREFIXO_OPERACAO + id);
  gravar(
    CHAVE_INDICE,
    lerIndice().filter((entrada) => entrada.id !== id)
  );
  if (ler(CHAVE_ATIVA) === id) remover(CHAVE_ATIVA);
}

// Quem usava a versao com uma operacao so (chave v1) nao perde nada: a operacao antiga vira a
// primeira da lista. A chave antiga so e apagada depois que a nova foi gravada com sucesso.
function migrarFormatoAntigo() {
  if (lerIndice().length > 0) return;
  const antiga = ler(CHAVE_V1);
  if (!antiga || typeof antiga !== "object" || Array.isArray(antiga)) return;
  const migrada = { ...antiga, id: antiga.id || novoIdOperacao() };
  if (operacaoEstaVazia(migrada)) {
    remover(CHAVE_V1);
    return;
  }
  if (salvarOperacao(migrada)) remover(CHAVE_V1);
}

// Operacao que estava aberta da ultima vez. `null` quando nao ha nenhuma (ou quando a ultima
// aberta era uma operacao ainda em branco, que nunca chegou a ser gravada).
export function carregarOperacaoAtiva() {
  migrarFormatoAntigo();
  const id = ler(CHAVE_ATIVA);
  if (id) return ler(PREFIXO_OPERACAO + id);
  const maisRecente = listarOperacoes()[0];
  return maisRecente ? ler(PREFIXO_OPERACAO + maisRecente.id) : null;
}

export function exportarOperacao(operacao) {
  const nomeProponente = (operacao?.proponente?.nome || "operacao")
    .trim()
    .replace(/[^\w-]+/g, "_")
    .toLowerCase();
  const dataHoje = new Date().toISOString().slice(0, 10);

  const blob = new Blob([JSON.stringify(operacao, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `ruralflow_${nomeProponente}_${dataHoje}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importarOperacao(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const dados = JSON.parse(leitor.result);
        if (!dados || typeof dados !== "object" || Array.isArray(dados) || !dados.proponente || !dados.proposta) {
          throw new Error("formato inesperado");
        }
        resolve(dados);
      } catch (erro) {
        reject(new Error("Arquivo inválido: não parece ser uma operação exportada pelo RuralFlow."));
      }
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    leitor.readAsText(arquivo, "utf-8");
  });
}
