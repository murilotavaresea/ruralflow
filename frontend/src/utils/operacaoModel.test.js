import {
  contarItens,
  criarOperacaoVazia,
  normalizarOperacao,
  operacaoEstaVazia,
  progressoGeral,
} from "./operacaoModel";

const grupos = [
  {
    id: "g1",
    nome: "Documentos",
    itens: [
      { id: "i1", chave: "i1", nome: "A", fontes: "todas", linhas: "todas" },
      { id: "i2", chave: "i2", nome: "B", fontes: "todas", linhas: "todas" },
      { id: "i3", chave: "i3", nome: "C", fontes: "todas", linhas: "todas" },
      { id: "i4", chave: "i4", nome: "D", fontes: "todas", linhas: "todas" },
    ],
  },
];

describe("contarItens", () => {
  test("separa OK, N/A, pendente e nao avaliados", () => {
    const contagem = contarItens(grupos, {
      i1: { status: "ok" },
      i2: { status: "na" },
      i3: { status: "pendente" },
    });
    expect(contagem).toMatchObject({ ok: 1, na: 1, pendente: 1, naoAvaliados: 1, totalItens: 4, preenchidos: 3 });
    expect(contagem.percentual).toBe(75);
  });

  test("ignora marcacoes de itens que nao estao mais na lista (progresso nunca passa de 100%)", () => {
    const contagem = contarItens(grupos, {
      i1: { status: "ok" },
      i2: { status: "ok" },
      i3: { status: "ok" },
      i4: { status: "ok" },
      antigo: { status: "ok" },
      outroAntigo: { status: "pendente" },
    });
    expect(contagem.ok).toBe(4);
    expect(contagem.pendente).toBe(0);
    expect(contagem.percentual).toBe(100);
  });

  test("status vazio conta como nao avaliado", () => {
    expect(contarItens(grupos, { i1: { status: "" } }).naoAvaliados).toBe(4);
  });

  test("lista vazia nao divide por zero", () => {
    expect(contarItens([], {})).toMatchObject({ totalItens: 0, percentual: 0 });
  });
});

describe("progressoGeral", () => {
  test("soma proponente, documentos, garantias e area beneficiada", () => {
    const operacao = normalizarOperacao({
      ...criarOperacaoVazia(),
      proponente: { checklist: { i1: { status: "ok" } } },
      checklistDocumental: { i2: { status: "pendente" } },
      garantias: [{ id: "gar1", tipo: "aval", checklist: { i1: { status: "na" } }, garantidores: [] }],
    });
    const progresso = progressoGeral(operacao, grupos, grupos, { aval: { bem: grupos, proprietario: [] } }, {
      bem: [],
      proprietario: [],
    });
    expect(progresso.totalItens).toBe(12);
    expect(progresso.ok).toBe(1);
    expect(progresso.pendente).toBe(1);
    expect(progresso.na).toBe(1);
    expect(progresso.naoAvaliados).toBe(9);
  });
});

describe("normalizarOperacao", () => {
  test("aceita lixo e devolve operacao vazia", () => {
    expect(normalizarOperacao(null).proponente.nome).toBe("");
    expect(normalizarOperacao([1, 2]).proponente.nome).toBe("");
    expect(normalizarOperacao("texto").garantias).toEqual([]);
  });

  test("completa garantias e imoveis importados sem checklist ou listas", () => {
    const operacao = normalizarOperacao({
      garantias: [{ id: "g", tipo: "aval" }],
      areaBeneficiada: [{ id: "i", proprietarios: [{ id: "p" }] }],
    });
    expect(operacao.garantias[0].checklist).toEqual({});
    expect(operacao.garantias[0].garantidores).toEqual([]);
    expect(operacao.areaBeneficiada[0].checklist).toEqual({});
    expect(operacao.areaBeneficiada[0].proprietarios[0].checklist).toEqual({});
  });

  test("garante um id e preserva o existente", () => {
    expect(normalizarOperacao({ proponente: {}, proposta: {} }).id).toMatch(/^op_/);
    expect(normalizarOperacao({ id: "op_fixo" }).id).toBe("op_fixo");
  });

  test("converte os programas antigos de FCO", () => {
    const operacao = normalizarOperacao({ proposta: { programa: "fco_rural", linhaChecklist: "x" } });
    expect(operacao.proposta.programa).toBe("fco");
    expect(operacao.proposta.linhaChecklist).toBe("");
  });
});

describe("operacaoEstaVazia", () => {
  test("operacao nova esta vazia", () => {
    expect(operacaoEstaVazia(criarOperacaoVazia())).toBe(true);
  });

  test("qualquer dado preenchido tira a operacao do estado vazio", () => {
    const comNome = criarOperacaoVazia();
    comNome.proponente.nome = "Maria";
    expect(operacaoEstaVazia(comNome)).toBe(false);

    const comItem = criarOperacaoVazia();
    comItem.checklistDocumental = { x: { status: "ok" } };
    expect(operacaoEstaVazia(comItem)).toBe(false);

    const comGarantia = criarOperacaoVazia();
    comGarantia.garantias = [{ id: "g" }];
    expect(operacaoEstaVazia(comGarantia)).toBe(false);
  });
});
