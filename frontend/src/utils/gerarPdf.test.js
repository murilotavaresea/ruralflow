// O jsPDF precisa de TextEncoder, que o jsdom nao tem; aqui so se testa a sanitizacao de texto.
jest.mock("jspdf", () => function JsPdfFalso() {});

import { paraLatin1 } from "./gerarPdf";

describe("paraLatin1", () => {
  test("mantem acentos e cedilha (Latin-1)", () => {
    expect(paraLatin1("Análise de Crédito — Área beneficiada ação")).toBe("Análise de Crédito - Área beneficiada ação");
  });

  test("troca pontuacao fora do Latin-1 por equivalentes simples", () => {
    expect(paraLatin1("“aspas” e ‘simples’…")).toBe('"aspas" e \'simples\'...');
    expect(paraLatin1("a → b • c")).toBe("a -> b - c");
  });

  test("simbolos sem equivalente viram ?", () => {
    expect(paraLatin1("ok 😀")).toBe("ok ?");
  });

  test("aceita null e undefined", () => {
    expect(paraLatin1(null)).toBe("");
    expect(paraLatin1(undefined)).toBe("");
  });
});
