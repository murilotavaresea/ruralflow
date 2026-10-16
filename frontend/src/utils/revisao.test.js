import { criarOperacaoVazia } from "./operacaoModel";
import { camposObrigatoriosFaltando, coletarRevisao, contarTrechosAPreencher } from "./revisao";

const checklist = {
  proponente: [
    {
      id: "g1",
      nome: "Compliance",
      itens: [
        { id: "p1", chave: "p1", nome: "CNDU", fontes: "todas", linhas: "todas" },
        { id: "p2", chave: "p2", nome: "IBAMA", fontes: "todas", linhas: "todas" },
      ],
    },
  ],
  documentos: [
    {
      id: "g2",
      nome: "Documentos",
      itens: [{ id: "d1", chave: "d1", nome: "CNJ", fontes: ["fno"], linhas: "todas" }],
    },
  ],
  garantias: { aval: { bem: [], proprietario: [] } },
  areaBeneficiada: { bem: [], proprietario: [] },
  linhas: {},
};

describe("camposObrigatoriosFaltando", () => {
  test("operacao nova tem todos os campos obrigatorios em branco", () => {
    expect(camposObrigatoriosFaltando(criarOperacaoVazia()).map((c) => c.campo)).toEqual([
      "nome",
      "documento",
      "valorOperacao",
      "prazoMeses",
      "taxaAnual",
    ]);
  });

  test("some da lista quando preenchido", () => {
    const operacao = criarOperacaoVazia();
    operacao.proponente.nome = "Maria";
    operacao.proponente.documento = "529.982.247-25";
    operacao.proposta.valorOperacao = "100000";
    operacao.proposta.prazoMeses = "60";
    operacao.proposta.taxaAnual = "10";
    expect(camposObrigatoriosFaltando(operacao)).toEqual([]);
  });
});

describe("coletarRevisao", () => {
  const operacao = () => {
    const op = criarOperacaoVazia();
    op.proposta.programa = "fno";
    op.proponente.checklist = {
      p1: { status: "pendente", devolutivaTexto: "Enviar CNDU atualizada" },
      p2: { status: "ok" },
    };
    op.checklistDocumental = { d1: { status: "pendente", devolutivaTexto: "" } };
    return op;
  };

  test("conta situacao por secao e lista pendencias com o texto da devolutiva", () => {
    const revisao = coletarRevisao(operacao(), checklist);
    const proponente = revisao.secoes.find((s) => s.chave === "proponente");
    expect(proponente).toMatchObject({ ok: 1, pendente: 1, naoAvaliados: 0, percentual: 100 });
    expect(proponente.pendencias[0]).toMatchObject({ nome: "CNDU", texto: "Enviar CNDU atualizada" });
    expect(revisao.totais).toMatchObject({ ok: 1, pendente: 2, totalItens: 3 });
  });

  test("avisa de pendencia sem texto de devolutiva (ela nao aparece na Devolutiva)", () => {
    const revisao = coletarRevisao(operacao(), checklist);
    expect(revisao.avisos.some((a) => a.aba === "devolutiva")).toBe(true);
  });

  test("so conta itens da fonte escolhida", () => {
    const op = operacao();
    op.proposta.programa = "bndes"; // d1 e exclusivo do FNO
    const revisao = coletarRevisao(op, checklist);
    expect(revisao.secoes.find((s) => s.chave === "documentos").totalItens).toBe(0);
  });

  test("avisos: carencia >= prazo, sem garantias, sem imoveis e documento invalido", () => {
    const op = operacao();
    op.proposta.prazoMeses = "12";
    op.proposta.carenciaMeses = "12";
    op.proponente.documento = "111.111.111-11";
    const textos = coletarRevisao(op, checklist).avisos.map((a) => a.texto).join("\n");
    expect(textos).toMatch(/carência/);
    expect(textos).toMatch(/dígitos verificadores/);
    expect(textos).toMatch(/Nenhuma garantia/);
    expect(textos).toMatch(/Nenhum imóvel/);
    expect(textos).toMatch(/município/);
  });

  test("pronto so quando nao ha campo em branco nem item sem avaliacao", () => {
    expect(coletarRevisao(operacao(), checklist).resumo.pronto).toBe(false);
  });

  test("calcula parcela e cobertura das garantias", () => {
    const op = operacao();
    op.proposta.valorOperacao = "100000";
    op.proposta.prazoMeses = "12";
    op.proposta.taxaAnual = "0";
    op.proposta.periodicidadePagamento = "Mensal";
    op.garantias = [{ id: "g", tipo: "hipoteca", valor: "150000", checklist: {}, garantidores: [] }];
    const { numeros } = coletarRevisao(op, checklist);
    expect(numeros.parcela).toBeCloseTo(100000 / 12, 2);
    expect(numeros.somaGarantias).toBe(150000);
    expect(numeros.coberturaGarantias).toBeCloseTo(1.5, 5);
  });

  test("aval nao tem valor: cobre 100% da operacao e nao gera aviso de valor", () => {
    const op = operacao();
    op.proposta.valorOperacao = "100000";
    // valor legado digitado antes do campo sumir e ignorado
    op.garantias = [{ id: "g", tipo: "aval", valor: "999", checklist: {}, garantidores: [] }];
    const revisao = coletarRevisao(op, checklist);
    expect(revisao.numeros.somaGarantias).toBe(100000);
    expect(revisao.numeros.coberturaGarantias).toBeCloseTo(1, 5);
    expect(revisao.avisos.some((a) => /sem valor informado/.test(a.texto))).toBe(false);
  });

  test("garantia real sem valor continua gerando aviso", () => {
    const op = operacao();
    op.garantias = [{ id: "g", tipo: "hipoteca", valor: "", checklist: {}, garantidores: [] }];
    expect(coletarRevisao(op, checklist).avisos.some((a) => /sem valor informado/.test(a.texto))).toBe(true);
  });
});

describe("contarTrechosAPreencher", () => {
  test("conta trechos entre colchetes", () => {
    expect(contarTrechosAPreencher("a [x] b [y z] c")).toBe(2);
    expect(contarTrechosAPreencher("sem nada")).toBe(0);
    expect(contarTrechosAPreencher(undefined)).toBe(0);
  });
});
