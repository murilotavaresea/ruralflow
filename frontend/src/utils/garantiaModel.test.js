import { criarOperacaoVazia } from "./operacaoModel";
import gerarParecerTexto from "./gerarParecerTexto";
import {
  indiceCoberturaGarantia,
  indiceCoberturaTotal,
  somaValorGarantias,
  temGrausEmAberto,
  tipoSemValor,
} from "./garantiaModel";

const aval = (extra = {}) => ({ id: "a", tipo: "aval", valor: "", checklist: {}, garantidores: [], ...extra });
const hipoteca = (valor) => ({ id: "h", tipo: "hipoteca", valor, checklist: {}, garantidores: [] });

describe("tipoSemValor", () => {
  test("so o aval nao tem valor proprio", () => {
    expect(tipoSemValor("aval")).toBe(true);
    expect(tipoSemValor("hipoteca")).toBe(false);
    expect(tipoSemValor("penhor_agricola")).toBe(false);
  });
});

describe("indiceCoberturaGarantia", () => {
  test("aval cobre 100% mesmo sem valor da operacao ou com valor legado digitado", () => {
    expect(indiceCoberturaGarantia(aval(), "500000")).toBe(1);
    expect(indiceCoberturaGarantia(aval(), "")).toBe(1);
    expect(indiceCoberturaGarantia(aval({ valor: "1" }), "500000")).toBe(1);
  });

  test("garantia real e valor / valor da operacao", () => {
    expect(indiceCoberturaGarantia(hipoteca("250000"), "500000")).toBe(0.5);
  });

  test("sem valor de operacao nao da pra calcular a cobertura de garantia real", () => {
    expect(indiceCoberturaGarantia(hipoteca("250000"), "")).toBeNull();
  });
});

describe("cobertura considera os graus em aberto da matricula", () => {
  const grau = (status, valor) => ({ id: `g_${status}_${valor}`, valor: String(valor), status });
  const imovel = (tipo, valor, graus) => ({ ...hipoteca(valor), tipo, graus });

  test("imovel: avaliacao / (operacao + valor tomado) - o caso 1,5 mi, operacao 500 mil, grau de 250 mil = 200%", () => {
    const g = imovel("hipoteca", "1500000", [grau("aberto_outra_if", 250000)]);
    expect(indiceCoberturaGarantia(g, "500000")).toBe(2);
  });

  test("graus cancelados ou sem situacao nao entram; sem graus e igual a avaliacao / operacao", () => {
    expect(indiceCoberturaGarantia(imovel("hipoteca", "1500000", [grau("cancelado", 900000), grau("", 100000)]), "500000")).toBe(3);
    expect(indiceCoberturaGarantia(imovel("hipoteca", "1500000", []), "500000")).toBe(3);
  });

  test("alienacao de imovel tambem considera; outros tipos nao tem analise de matricula", () => {
    expect(indiceCoberturaGarantia(imovel("alienacao_imovel", "1000000", [grau("aberto_alienacao_credisul", 500000)]), "500000")).toBe(1);
    expect(indiceCoberturaGarantia(imovel("penhor_agricola", "1000000", [grau("aberto_credisul", 500000)]), "500000")).toBe(2);
  });

  test("total soma a cobertura de cada garantia (ja com graus) e o aval vale 100% uma vez", () => {
    const comGrau = imovel("hipoteca", "1500000", [grau("aberto_credisul", 250000)]); // 200%
    const semGrau = imovel("hipoteca", "250000", []); // 50%
    expect(indiceCoberturaTotal([comGrau, semGrau], "500000")).toBeCloseTo(2.5, 5);
    expect(indiceCoberturaTotal([comGrau, semGrau, aval(), aval({ id: "b" })], "500000")).toBeCloseTo(3.5, 5);
  });

  test("temGrausEmAberto: so conta grau em aberto de imovel", () => {
    expect(temGrausEmAberto([imovel("hipoteca", "1", [grau("aberto_credisul", 1)])])).toBe(true);
    expect(temGrausEmAberto([imovel("hipoteca", "1", [grau("cancelado", 1)]), aval()])).toBe(false);
    expect(temGrausEmAberto(undefined)).toBe(false);
  });
});

describe("somaValorGarantias e indiceCoberturaTotal", () => {
  test("aval conta como o valor da operacao, uma unica vez", () => {
    expect(somaValorGarantias([aval()], "500000")).toBe(500000);
    expect(somaValorGarantias([aval(), aval({ id: "b" })], "500000")).toBe(500000);
  });

  test("soma garantias reais com o aval", () => {
    expect(somaValorGarantias([hipoteca("300000"), aval()], "500000")).toBe(800000);
    expect(indiceCoberturaTotal([hipoteca("300000"), aval()], "500000")).toBeCloseTo(1.6, 5);
  });

  test("so garantias reais: valor / operacao; nenhuma garantia: 0%", () => {
    expect(indiceCoberturaTotal([hipoteca("250000")], "500000")).toBe(0.5);
    expect(indiceCoberturaTotal([], "500000")).toBe(0);
  });

  test("sem valor de operacao, um aval ja garante 100%; sem aval nao ha o que dizer", () => {
    expect(indiceCoberturaTotal([aval()], "")).toBe(1);
    expect(indiceCoberturaTotal([hipoteca("1000")], "")).toBeNull();
  });
});

describe("parecer com aval", () => {
  test("descreve o aval como cobrindo a operacao toda, sem 'valor nao informado'", () => {
    const operacao = criarOperacaoVazia();
    operacao.proposta.valorOperacao = "200000";
    operacao.garantias = [aval({ garantidores: [{ id: "g", nome: "Fulano de Tal", checklist: {} }] })];
    const texto = gerarParecerTexto(operacao, { beneficiario: { rendaLiquida: 0, indice: null } });
    expect(texto).toMatch(/Aval: cobre a totalidade da operação \(cobertura de 100%\), garantidor\(es\): Fulano de Tal/);
    expect(texto).not.toMatch(/valor não informado/);
    expect(texto).toMatch(/Cobertura total das garantias: 100%/);
  });
});
