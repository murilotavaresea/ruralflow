const STORAGE_KEY = "ruralflow:operacao:v1";

export function salvarOperacao(operacao) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operacao));
  } catch (erro) {
    console.error("Nao foi possivel salvar a operacao no navegador.", erro);
  }
}

export function carregarOperacao() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    return bruto ? JSON.parse(bruto) : null;
  } catch (erro) {
    console.error("Nao foi possivel carregar a operacao salva.", erro);
    return null;
  }
}

export function limparOperacaoSalva() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportarOperacao(operacao) {
  const nomeProponente = (operacao?.proponente?.nome || "operacao")
    .trim()
    .replace(/[^\w\-]+/g, "_")
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
        resolve(JSON.parse(leitor.result));
      } catch (erro) {
        reject(new Error("Arquivo invalido: nao parece ser uma operacao exportada pelo RuralFlow."));
      }
    };
    leitor.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
    leitor.readAsText(arquivo, "utf-8");
  });
}
