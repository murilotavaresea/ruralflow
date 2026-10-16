import {
  contarSignificativos,
  formatarParaExibicao,
  interpretarEntrada,
  normalizarArmazenado,
  posicaoPorSignificativosRestantes,
} from "./numero";

describe("interpretarEntrada", () => {
  test("virgula e o decimal e os pontos de milhar somem", () => {
    expect(interpretarEntrada("1.234,5", 2)).toBe("1234.5");
    expect(interpretarEntrada("1.234.567", 2)).toBe("1234567");
  });

  test("virgula recem-digitada fica pendente para continuar a digitacao", () => {
    expect(interpretarEntrada("1.234,", 2)).toBe("1234.");
  });

  test("ponto no fim do texto (teclado numerico) vira decimal", () => {
    expect(interpretarEntrada("1.234.", 2)).toBe("1234.");
    expect(interpretarEntrada("12.", 2)).toBe("12.");
  });

  test("corta os decimais alem do limite", () => {
    expect(interpretarEntrada("12,345", 2)).toBe("12.34");
  });

  test("descarta letras e simbolos", () => {
    expect(interpretarEntrada("R$ 1a2b", 2)).toBe("12");
    expect(interpretarEntrada("abc", 2)).toBe("");
    expect(interpretarEntrada("", 2)).toBe("");
  });

  test("campo inteiro ignora separador decimal", () => {
    expect(interpretarEntrada("60", 0)).toBe("60");
    expect(interpretarEntrada("12,", 0)).toBe("12");
  });

  test("virgula sozinha vira 0 antes do separador", () => {
    expect(interpretarEntrada(",5", 2)).toBe("0.5");
  });
});

describe("formatarParaExibicao", () => {
  test("agrupa milhares e usa virgula decimal", () => {
    expect(formatarParaExibicao("1234567.5", 2)).toBe("1.234.567,5");
    expect(formatarParaExibicao("0.05", 2)).toBe("0,05");
    expect(formatarParaExibicao("850000", 2)).toBe("850.000");
  });

  test("mostra a virgula pendente e os zeros a direita enquanto se digita", () => {
    expect(formatarParaExibicao("1234.", 2)).toBe("1.234,");
    expect(formatarParaExibicao("10.50", 2)).toBe("10,50");
  });

  test("aproveita valores antigos salvos por input number", () => {
    expect(formatarParaExibicao(1234.5, 2)).toBe("1.234,5");
    expect(formatarParaExibicao("1e5", 2)).toBe("100.000");
    expect(formatarParaExibicao("-3", 2)).toBe("");
    expect(formatarParaExibicao("abc", 2)).toBe("");
  });

  test("vazio continua vazio e zeros a esquerda somem", () => {
    expect(formatarParaExibicao("", 2)).toBe("");
    expect(formatarParaExibicao(undefined, 2)).toBe("");
    expect(formatarParaExibicao("007", 0)).toBe("7");
  });

  test("ida e volta preserva o valor", () => {
    ["0", "12", "1234.5", "1234567.89", "0.5"].forEach((armazenado) => {
      expect(interpretarEntrada(formatarParaExibicao(armazenado, 2), 2)).toBe(armazenado);
    });
  });
});

describe("normalizarArmazenado", () => {
  test("numero e string equivalentes dao a mesma forma", () => {
    expect(normalizarArmazenado(150000)).toBe("150000");
    expect(normalizarArmazenado(" 12.5 ")).toBe("12.5");
  });
});

describe("posicao do cursor", () => {
  test("conta so digitos e virgula", () => {
    expect(contarSignificativos("1.234,56")).toBe(7); // 6 digitos + a virgula
  });

  test("encontra a posicao a partir do fim", () => {
    expect(posicaoPorSignificativosRestantes("1.234", 0)).toBe(5);
    expect(posicaoPorSignificativosRestantes("1.234", 1)).toBe(4);
    expect(posicaoPorSignificativosRestantes("1.234", 3)).toBe(2);
    expect(posicaoPorSignificativosRestantes("1.234", 4)).toBe(0);
  });
});
