import {
  descreverAnaliseMatricula,
  descreverMatriculaParecer,
  formatarDataBr,
  grauEstaAberto,
  resumirMatricula,
  rotuloSituacaoGrau,
} from "./analiseMatricula";
import { coletarRevisao } from "./revisao";
import { criarOperacaoVazia } from "./operacaoModel";
import gerarParecerTexto from "./gerarParecerTexto";
import { normalizarOperacao } from "./operacaoModel";
import { novaGarantia, novoGrau, tipoTemAnaliseMatricula } from "./garantiaModel";

const grau = (status, valor) => ({ id: `g_${status}_${valor}`, registro: "R-1", grau: "1º", valor: String(valor), vencimento: "", contrato: "", status });

// Cenario que reproduz as formulas da planilha (aba HIPOTECA - ALIENACAO IMOVEL):
//   G15 = COUNTIF(status="ABERTO - CREDISUL")      I15 = SUMIF(...)   [hipoteca Credisul]
//   H15 = COUNTIF(status="ABERTO - OUTRA IF")      J15 = SUMIF(...)   [hipoteca outra IF]
//   G16/H16/I16/J16 = idem para as alienacoes     K15 = I16 + J16
//   F13 = G15 + H15   F15 = G16 + H16             G13 (valor tomado) = I15 + J15 + K15
//   J5 = J3 + J4 (operacao + valor tomado)        J6 = J2 * 100 / J5
const hipoteca = (extras = {}) => ({
  ...novaGarantia("hipoteca"),
  valor: "600000", // J2: valor da avaliacao do imovel
  graus: [
    grau("aberto_credisul", 100000),
    grau("aberto_outra_if", 50000),
    grau("aberto_alienacao_credisul", 30000),
    grau("cancelado", 999999), // cancelado nunca entra nas somas
  ],
  ...extras,
});

describe("resumirMatricula (mesma logica das formulas da planilha)", () => {
  const r = resumirMatricula(hipoteca(), "200000");

  test("conta e soma por situacao, ignorando cancelados", () => {
    expect(r.hipotecaCredisul).toEqual({ quantidade: 1, valor: 100000 });
    expect(r.hipotecaOutraIf).toEqual({ quantidade: 1, valor: 50000 });
    expect(r.alienacaoCredisul).toEqual({ quantidade: 1, valor: 30000 });
    expect(r.alienacaoOutraIf).toEqual({ quantidade: 0, valor: 0 });
    expect(r.cancelados).toBe(1);
  });

  test("graus de hipoteca abertos (F13) e alienacoes abertas (F15)", () => {
    expect(r.grausDeHipotecaAbertos).toBe(2);
    expect(r.alienacoesAbertas).toBe(1);
  });

  test("valor tomado (G13) = soma dos valores em aberto", () => {
    expect(r.valorTomado).toBe(180000);
  });

  test("total do risco (J5) e cobertura (J6)", () => {
    expect(r.totalRisco).toBe(380000);
    expect(r.cobertura).toBeCloseTo(600000 / 380000, 10); // 157,89%
  });

  test("grau desta operacao: hipoteca = graus de hipoteca abertos + 1", () => {
    expect(r.grauDestaOperacao).toBe(3);
  });

  test("grau desta operacao: alienacao de imovel = alienacoes abertas + 1", () => {
    const alienacao = resumirMatricula({ ...hipoteca(), tipo: "alienacao_imovel" }, "200000");
    expect(alienacao.grauDestaOperacao).toBe(2);
  });

  test("outra proposta de credito entra no segundo total e na segunda cobertura (J7, J8, J9)", () => {
    const comOutra = resumirMatricula(hipoteca({ outraProposta: "120000" }), "200000");
    expect(comOutra.totalRiscoComOutraProposta).toBe(500000);
    expect(comOutra.coberturaComOutraProposta).toBeCloseTo(600000 / 500000, 10);
  });

  test("sem outra proposta nao ha segundo total", () => {
    expect(r.totalRiscoComOutraProposta).toBeNull();
    expect(r.coberturaComOutraProposta).toBeNull();
  });
});

describe("casos de borda", () => {
  test("matricula sem graus: valor tomado zero, risco = a operacao, grau desta operacao = 1", () => {
    const resumo = resumirMatricula({ ...novaGarantia("hipoteca"), valor: "400000" }, "200000");
    expect(resumo.valorTomado).toBe(0);
    expect(resumo.totalRisco).toBe(200000);
    expect(resumo.cobertura).toBe(2);
    expect(resumo.grauDestaOperacao).toBe(1);
    expect(resumo.temGraus).toBe(false);
  });

  test("sem valor da operacao nao ha como calcular risco nem cobertura", () => {
    const resumo = resumirMatricula(hipoteca(), "");
    expect(resumo.totalRisco).toBeNull();
    expect(resumo.cobertura).toBeNull();
  });

  test("sem valor de avaliacao nao ha cobertura (em vez de 0%)", () => {
    expect(resumirMatricula(hipoteca({ valor: "" }), "200000").cobertura).toBeNull();
  });

  test("grau sem situacao escolhida e contado a parte e nao entra nas somas", () => {
    const resumo = resumirMatricula({ ...novaGarantia("hipoteca"), valor: "1", graus: [grau("", 777)] }, "10");
    expect(resumo.semSituacao).toBe(1);
    expect(resumo.valorTomado).toBe(0);
  });

  test("valor do grau em texto vazio ou invalido conta como zero", () => {
    const resumo = resumirMatricula({ ...novaGarantia("hipoteca"), graus: [grau("aberto_credisul", ""), grau("aberto_credisul", "abc")] }, "10");
    expect(resumo.hipotecaCredisul).toEqual({ quantidade: 2, valor: 0 });
  });

  test("garantia sem lista de graus (dado antigo) nao quebra", () => {
    expect(resumirMatricula({ tipo: "hipoteca" }, "100").grausDeHipotecaAbertos).toBe(0);
  });
});

describe("situacoes", () => {
  test("rotulos como na lista suspensa da planilha", () => {
    expect(rotuloSituacaoGrau("aberto_credisul")).toBe("Aberto - Credisul");
    expect(rotuloSituacaoGrau("cancelado")).toBe("Cancelado");
    expect(rotuloSituacaoGrau("")).toBe("");
  });

  test("grau aberto x cancelado x sem situacao", () => {
    expect(grauEstaAberto(grau("aberto_outra_if", 1))).toBe(true);
    expect(grauEstaAberto(grau("cancelado", 1))).toBe(false);
    expect(grauEstaAberto(grau("", 1))).toBe(false);
  });
});

describe("modelo", () => {
  test("so hipoteca e alienacao de imovel tem analise de matricula", () => {
    expect(tipoTemAnaliseMatricula("hipoteca")).toBe(true);
    expect(tipoTemAnaliseMatricula("alienacao_imovel")).toBe(true);
    expect(tipoTemAnaliseMatricula("aval")).toBe(false);
    expect(tipoTemAnaliseMatricula("penhor_agricola")).toBe(false);
  });

  test("nova garantia nasce com matricula, graus e outra proposta", () => {
    const g = novaGarantia("hipoteca");
    expect(g).toMatchObject({ matricula: "", outraProposta: "", graus: [] });
    expect(novoGrau()).toMatchObject({ registro: "", grau: "", valor: "", vencimento: "", contrato: "", status: "" });
  });

  test("operacao antiga (garantia sem os campos novos) e completada ao abrir", () => {
    const op = normalizarOperacao({ garantias: [{ id: "g", tipo: "hipoteca", valor: "1000" }] });
    expect(op.garantias[0]).toMatchObject({ matricula: "", outraProposta: "", graus: [] });
  });

  test("grau salvo so com alguns campos recebe os demais vazios", () => {
    const op = normalizarOperacao({ garantias: [{ id: "g", tipo: "hipoteca", graus: [{ id: "x", valor: "5" }] }] });
    expect(op.garantias[0].graus[0]).toEqual({ id: "x", registro: "", grau: "", valor: "5", vencimento: "", contrato: "", status: "" });
  });
});

describe("formatarDataBr", () => {
  test("converte ISO para dd/mm/aaaa e tolera vazio", () => {
    expect(formatarDataBr("2027-12-10")).toBe("10/12/2027");
    expect(formatarDataBr("")).toBe("");
    expect(formatarDataBr(undefined)).toBe("");
    expect(formatarDataBr("2027-12")).toBe("");
  });
});

describe("descreverAnaliseMatricula (texto do parecer e do PDF)", () => {
  test("resume a matricula e lista cada grau com a situacao", () => {
    const g = hipoteca({ matricula: "12.345" });
    g.graus[0] = { ...g.graus[0], registro: "R-5", grau: "1º", vencimento: "2027-12-10", contrato: "C-77" };
    const texto = descreverAnaliseMatricula(g, "200000");
    expect(texto.resumo).toMatch(/^Matrícula 12\.345: graus de hipoteca em aberto: 2; alienações em aberto: 1; valor tomado: R\$\s180\.000,00/);
    expect(texto.resumo).toMatch(/total do risco respaldado: R\$\s380\.000,00; cobertura: 157,9%/);
    expect(texto.resumo).toMatch(/grau desta operação: 3º\.$/);
    expect(texto.graus).toHaveLength(4);
    expect(texto.graus[0]).toMatch(/^1º \(registro R-5\): R\$\s100\.000,00, vencimento 10\/12\/2027, contrato C-77 - Aberto - Credisul$/);
    expect(texto.graus[3]).toMatch(/- Cancelado$/);
  });

  test("devolve null enquanto nada foi preenchido", () => {
    expect(descreverAnaliseMatricula(novaGarantia("hipoteca"), "100")).toBeNull();
  });

  test("grau sem situacao aparece como 'situação não informada'", () => {
    const g = { ...novaGarantia("hipoteca"), graus: [grau("", 10)] };
    expect(descreverAnaliseMatricula(g, "100").graus[0]).toMatch(/situação não informada$/);
  });

});

describe("parecer: garantia de imovel so com o essencial", () => {
  const capacidade = { beneficiario: { rendaLiquida: 0, indice: null } };
  const parecer = (garantia, valorOperacao = "500000") => {
    const op = criarOperacaoVazia();
    op.proposta.valorOperacao = valorOperacao;
    op.garantias = [garantia];
    return gerarParecerTexto(op, capacidade);
  };
  const trecho = (texto) => texto.slice(texto.indexOf("Garantias:"), texto.indexOf("  Cobertura total"));

  test("sem graus em aberto: uma linha com tipo, avaliacao, matricula e cobertura (nada zerado)", () => {
    const texto = trecho(parecer({ ...novaGarantia("hipoteca"), valor: "1500000", matricula: "1111" }));
    expect(texto).toMatch(/^Garantias:\n {2}- Hipoteca: avaliação de R\$\s1\.500\.000,00, matrícula 1111 \(cobertura de 300%\)\.\n$/);
    expect(texto).not.toMatch(/em aberto|valor tomado|total do risco|grau desta operação|alienações/);
  });

  test("com graus em aberto: so o que esta em aberto, uma linha abaixo; cancelado e zerado ficam de fora", () => {
    const g = {
      ...novaGarantia("hipoteca"),
      valor: "1500000",
      matricula: "1111",
      graus: [grau("aberto_credisul", 500000), grau("cancelado", 900000)],
    };
    const texto = trecho(parecer(g));
    // a cobertura (150% = 1,5 mi / (500 mil + 500 mil)) ja considera o grau em aberto e aparece uma so vez
    expect(texto).toMatch(/- Hipoteca: avaliação de R\$\s1\.500\.000,00, matrícula 1111 \(cobertura de 150%\)\.\n/);
    expect(texto).toMatch(/\n {4}Graus em aberto: 1 grau de hipoteca \(Credisul\); valor tomado R\$\s500\.000,00\.\n/);
    expect(texto).not.toMatch(/cobertura considerando/);
    expect(texto).not.toMatch(/alienaç|cancelado|registro/i);
  });

  test("plural e alienacao aparecem so quando existem", () => {
    const texto = trecho(parecer(hipoteca({ valor: "800000", matricula: "5" }), "200000"));
    expect(texto).toContain("Graus em aberto: 2 graus de hipoteca (1 Credisul, 1 outra IF); 1 alienação (Credisul); valor tomado");
  });

  test("garantia de imovel sem matricula ou sem valor nao inventa nada", () => {
    expect(trecho(parecer({ ...novaGarantia("hipoteca"), valor: "100000" }))).toMatch(
      /- Hipoteca: avaliação de R\$\s100\.000,00 \(cobertura de 20%\)\.\n/
    );
    expect(trecho(parecer({ ...novaGarantia("hipoteca"), matricula: "7" }))).toContain(
      "- Hipoteca: avaliação não informada, matrícula 7 (cobertura de 0%)."
    );
  });

  test("garantidores continuam aparecendo no fim da linha", () => {
    const g = { ...novaGarantia("hipoteca"), valor: "1000000", matricula: "9", garantidores: [{ id: "x", nome: "Maria Souza" }] };
    expect(trecho(parecer(g))).toMatch(/matrícula 9 \(cobertura de 200%\), garantidor\(es\): Maria Souza\.\n/);
  });

  test("outras garantias (penhor, etc.) seguem como antes", () => {
    expect(trecho(parecer({ ...novaGarantia("penhor_pecuario"), valor: "250000" }))).toMatch(
      /- Penhor pecuário: R\$\s250\.000,00 \(cobertura de 50%\)\.\n/
    );
  });
});

describe("descreverMatriculaParecer", () => {
  test("devolve matricula e frase vazia quando nada esta em aberto", () => {
    expect(descreverMatriculaParecer({ ...novaGarantia("hipoteca"), matricula: " 12 ", valor: "1" }, "100")).toEqual({
      matricula: "12",
      graus: "",
    });
    expect(descreverMatriculaParecer({ ...novaGarantia("hipoteca"), graus: [grau("cancelado", 5)] }, "100").graus).toBe("");
  });

  test("grau em aberto sem valor informado conta, mas nao inventa valor tomado", () => {
    const g = { ...novaGarantia("hipoteca"), valor: "1000", graus: [grau("aberto_outra_if", 0)] };
    expect(descreverMatriculaParecer(g, "100").graus).toBe("Graus em aberto: 1 grau de hipoteca (outra IF).");
  });

  test("diz de quem e cada grau em aberto: Credisul, outra IF ou os dois, para hipoteca e para alienacao", () => {
    const frase = (graus) => descreverMatriculaParecer({ ...novaGarantia("hipoteca"), valor: "1", graus }, "100").graus;
    expect(frase([grau("aberto_credisul", 1), grau("aberto_credisul", 2)])).toMatch(
      /^Graus em aberto: 2 graus de hipoteca \(Credisul\); valor tomado R\$\s3,00\.$/
    );
    expect(frase([grau("aberto_outra_if", 1)])).toMatch(/^Graus em aberto: 1 grau de hipoteca \(outra IF\)/);
    expect(frase([grau("aberto_credisul", 1), grau("aberto_outra_if", 1), grau("aberto_outra_if", 1)])).toMatch(
      /^Graus em aberto: 3 graus de hipoteca \(1 Credisul, 2 outras IFs\)/
    );
    expect(frase([grau("aberto_alienacao_outra_if", 1)])).toMatch(/^Graus em aberto: 1 alienação \(outra IF\)/);
    expect(frase([grau("aberto_alienacao_credisul", 1), grau("aberto_alienacao_outra_if", 1)])).toMatch(
      /^Graus em aberto: 2 alienações \(1 Credisul, 1 outra IF\)/
    );
    expect(frase([grau("aberto_credisul", 1), grau("cancelado", 5)])).not.toMatch(/outra IF/);
  });
});

describe("revisao: avisos da analise de matricula", () => {
  const checklist = { proponente: [], documentos: [], garantias: {}, areaBeneficiada: { bem: [], proprietario: [] }, linhas: {} };
  const avisos = (op) => coletarRevisao(op, checklist).avisos.map((a) => a.texto).join("\n");

  test("avisa matricula nao informada e grau sem situacao", () => {
    const op = criarOperacaoVazia();
    op.proposta.valorOperacao = "100000";
    op.garantias = [{ ...novaGarantia("hipoteca"), valor: "500000", graus: [grau("", 10)] }];
    expect(avisos(op)).toMatch(/matrícula não informada/);
    expect(avisos(op)).toMatch(/1 grau da matrícula sem situação/);
  });

  test("sem avisos de matricula quando esta preenchida e os graus tem situacao", () => {
    const op = criarOperacaoVazia();
    op.proposta.valorOperacao = "100000";
    op.garantias = [{ ...novaGarantia("hipoteca"), valor: "500000", matricula: "1", graus: [grau("cancelado", 10)] }];
    expect(avisos(op)).not.toMatch(/matrícula não informada/);
    expect(avisos(op)).not.toMatch(/sem situação/);
  });

  test("aval nao pede matricula", () => {
    const op = criarOperacaoVazia();
    op.garantias = [novaGarantia("aval")];
    expect(avisos(op)).not.toMatch(/matrícula/);
  });
});
