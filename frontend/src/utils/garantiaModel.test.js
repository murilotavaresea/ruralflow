import { criarOperacaoVazia } from "./operacaoModel";
import gerarParecerTexto from "./gerarParecerTexto";
import {
  indiceCoberturaGarantia,
  indiceCoberturaTotal,
  somaValorGarantias,
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
