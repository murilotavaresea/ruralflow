import { criarOperacaoVazia } from "./operacaoModel";
import { novaGarantia } from "./garantiaModel";
import { REGRAS_PADRAO } from "./regrasPadrao";
import {
  avaliarCondicao,
  avaliarRegra,
  avaliarRegras,
  campoDaRegra,
  descreverCondicao,
  lerNumero,
  montarTextoRegra,
  operadoresDoTipo,
  rotuloOperador,
  textosUnicos,
  variaveisDisponiveis,
} from "./regrasModel";

const regra = (extras = {}) => ({
  id: "reg_teste",
  nome: "teste",
  ativa: true,
  campo: "proponente_risco",
  operador: "maior_igual",
  valor: "7",
  fontes: "todas",
  impedeContratacao: false,
  textoParecer: "Risco {risco}: deliberar.",
  textoDevolutiva: "",
  ...extras,
});

const operacaoCom = (ajustes = {}) => {
  const op = criarOperacaoVazia();
  Object.assign(op.proponente, ajustes.proponente);
  Object.assign(op.proposta, ajustes.proposta);
  if (ajustes.garantias) op.garantias = ajustes.garantias;
  return op;
};

const estado = (r, op, contexto) => avaliarRegra(r, op, contexto).estado;

describe("lerNumero", () => {
  test("aceita formato brasileiro, ponto decimal e numero", () => {
    expect(lerNumero("1.234,5")).toBe(1234.5);
    expect(lerNumero("9,05")).toBe(9.05);
    expect(lerNumero("9.05")).toBe(9.05);
    expect(lerNumero("7")).toBe(7);
    expect(lerNumero(7)).toBe(7);
    expect(lerNumero("R$ 450.000,00")).toBe(450000);
  });

  test("vazio e texto sem numero viram null", () => {
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("   ")).toBeNull();
    expect(lerNumero("alto")).toBeNull();
    expect(lerNumero(null)).toBeNull();
    expect(lerNumero(undefined)).toBeNull();
  });
});

describe("regra de risco (numero extraido do texto digitado)", () => {
  test.each([
    ["R7", "acionada"],
    ["r7", "acionada"],
    ["R 7", "acionada"],
    ["7", "acionada"],
    ["R8", "acionada"],
    ["R12", "acionada"],
    ["R6", "nao_acionada"],
    ["R1", "nao_acionada"],
  ])("risco %s com 'maior ou igual a 7' -> %s", (risco, esperado) => {
    expect(estado(regra(), operacaoCom({ proponente: { risco } }))).toBe(esperado);
  });

  test("o limite respeita maior x maior_igual", () => {
    const op = operacaoCom({ proponente: { risco: "R7" } });
    expect(estado(regra({ operador: "maior" }), op)).toBe("nao_acionada");
    expect(estado(regra({ operador: "maior_igual" }), op)).toBe("acionada");
    expect(estado(regra({ operador: "menor" }), op)).toBe("nao_acionada");
    expect(estado(regra({ operador: "menor_igual" }), op)).toBe("acionada");
    expect(estado(regra({ operador: "igual" }), op)).toBe("acionada");
    expect(estado(regra({ operador: "diferente" }), op)).toBe("nao_acionada");
  });

  test("risco em branco ou sem numero NAO e 'nao acionada': e 'nao avaliada' (faltou o dado)", () => {
    expect(estado(regra(), operacaoCom({ proponente: { risco: "" } }))).toBe("nao_avaliada");
    expect(estado(regra(), operacaoCom({ proponente: { risco: "   " } }))).toBe("nao_avaliada");
    expect(estado(regra(), operacaoCom({ proponente: { risco: "alto" } }))).toBe("nao_avaliada");
  });
});

describe("regra de QRSA (lista)", () => {
  const qrsa = regra({ campo: "proponente_qrsa", operador: "igual", valor: "Alto", textoParecer: "QRSA Alto: submeter ao Nível 4." });

  test("ignora maiuscula e acento", () => {
    for (const valor of ["Alto", "alto", "ALTO", " Alto "]) {
      expect(estado(qrsa, operacaoCom({ proponente: { qrsa: valor } }))).toBe("acionada");
    }
    expect(estado(qrsa, operacaoCom({ proponente: { qrsa: "Médio" } }))).toBe("nao_acionada");
    expect(estado(qrsa, operacaoCom({ proponente: { qrsa: "Baixo" } }))).toBe("nao_acionada");
  });

  test("operacao antiga com 'Medio' (sem acento) casa com a regra 'Médio'", () => {
    const medio = regra({ campo: "proponente_qrsa", operador: "igual", valor: "Médio" });
    expect(estado(medio, operacaoCom({ proponente: { qrsa: "Medio" } }))).toBe("acionada");
  });

  test("QRSA em branco: nao avaliada", () => {
    expect(estado(qrsa, operacaoCom({ proponente: { qrsa: "" } }))).toBe("nao_avaliada");
  });

  test("'um destes' aceita varios valores separados por ponto e virgula", () => {
    const r = regra({ campo: "proponente_qrsa", operador: "um_de", valor: "Médio;Alto" });
    expect(estado(r, operacaoCom({ proponente: { qrsa: "Alto" } }))).toBe("acionada");
    expect(estado(r, operacaoCom({ proponente: { qrsa: "medio" } }))).toBe("acionada");
    expect(estado(r, operacaoCom({ proponente: { qrsa: "Baixo" } }))).toBe("nao_acionada");
  });
});

describe("preenchido / em branco", () => {
  test("'em branco' dispara justamente quando falta o dado (nao e 'nao avaliada')", () => {
    const r = regra({ campo: "proponente_perda_esperada", operador: "vazio", valor: "" });
    expect(estado(r, operacaoCom({ proponente: { perdaEsperada: "" } }))).toBe("acionada");
    expect(estado(r, operacaoCom({ proponente: { perdaEsperada: "6.5" } }))).toBe("nao_acionada");
  });

  test("'preenchido' dispara quando ha dado", () => {
    const r = regra({ campo: "proponente_setor", operador: "preenchido", valor: "" });
    expect(estado(r, operacaoCom({ proponente: { setorAtuacao: "Pecuária" } }))).toBe("acionada");
    expect(estado(r, operacaoCom({ proponente: { setorAtuacao: "" } }))).toBe("nao_acionada");
  });
});

describe("escopo, ativacao e configuracao quebrada", () => {
  test("regra inativa nao avalia", () => {
    expect(estado(regra({ ativa: false }), operacaoCom({ proponente: { risco: "R12" } }))).toBe("inativa");
  });

  test("regra de outra fonte fica fora do escopo", () => {
    const r = regra({ fontes: ["fno"] });
    expect(estado(r, operacaoCom({ proponente: { risco: "R12" }, proposta: { programa: "bndes" } }))).toBe("fora_do_escopo");
    expect(estado(r, operacaoCom({ proponente: { risco: "R12" }, proposta: { programa: "fno" } }))).toBe("acionada");
  });

  test("dado que nao existe mais no catalogo = invalida (nao derruba nada)", () => {
    expect(estado(regra({ campo: "campo_que_sumiu" }), operacaoCom())).toBe("invalida");
  });

  test("valor de referencia que nao e numero = invalida", () => {
    expect(estado(regra({ valor: "abc" }), operacaoCom({ proponente: { risco: "R7" } }))).toBe("invalida");
  });

  test("lista 'um destes' sem opcoes = invalida", () => {
    expect(estado(regra({ campo: "proponente_qrsa", operador: "um_de", valor: "" }), operacaoCom({ proponente: { qrsa: "Alto" } }))).toBe("invalida");
  });
});

describe("textos com variaveis", () => {
  test("{risco} mostra o que foi digitado, em maiusculas", () => {
    const resultado = avaliarRegra(regra(), operacaoCom({ proponente: { risco: "r8" } }));
    expect(resultado.textoParecer).toBe("Risco R8: deliberar.");
  });

  test("{proponente} usa o nome ou um padrao; {fonte} usa o rotulo", () => {
    const op = operacaoCom({ proponente: { nome: "Maria da Silva" }, proposta: { programa: "fno" } });
    expect(montarTextoRegra("{proponente} em {fonte}", op)).toBe("Maria da Silva em FNO");
    expect(montarTextoRegra("{proponente}", operacaoCom())).toBe("o proponente");
  });

  test("valores sao formatados conforme a unidade", () => {
    const op = operacaoCom({ proponente: { perdaEsperada: "9.05" }, proposta: { valorOperacao: "1500000", prazoMeses: "60" } });
    expect(montarTextoRegra("{perdaEsperada}", op)).toBe("9,05%");
    expect(montarTextoRegra("{valorOperacao}", op).replace(/\s/g, " ")).toBe("R$ 1.500.000,00");
    expect(montarTextoRegra("{prazo}", op)).toBe("60 meses");
  });

  test("variavel desconhecida fica visivel (erro de digitacao aparece)", () => {
    expect(montarTextoRegra("Veja {inexistente}", operacaoCom())).toBe("Veja {inexistente}");
  });

  test("regra que nao dispara nao gera texto; o texto vazio do efeito fica vazio", () => {
    expect(avaliarRegra(regra(), operacaoCom({ proponente: { risco: "R3" } })).textoParecer).toBe("");
    expect(avaliarRegra(regra({ textoParecer: "" }), operacaoCom({ proponente: { risco: "R9" } })).textoParecer).toBe("");
  });

  test("devolutiva e parecer sao textos independentes", () => {
    const r = regra({ textoParecer: "", textoDevolutiva: "Enviar ata do comitê." });
    const resultado = avaliarRegra(r, operacaoCom({ proponente: { risco: "R9" } }));
    expect(resultado.textoParecer).toBe("");
    expect(resultado.textoDevolutiva).toBe("Enviar ata do comitê.");
  });
});

describe("dados calculados das garantias e dos checklists", () => {
  test("possui aval", () => {
    const r = regra({ campo: "garantias_possui_aval", operador: "igual", valor: "SIM" });
    expect(estado(r, operacaoCom({ garantias: [novaGarantia("aval")] }))).toBe("acionada");
    expect(estado(r, operacaoCom({ garantias: [novaGarantia("hipoteca")] }))).toBe("nao_acionada");
    expect(estado(r, operacaoCom())).toBe("nao_acionada");
  });

  test("cobertura so das garantias reais ignora o aval (regra dos 30%)", () => {
    const r = regra({ campo: "garantias_cobertura_reais", operador: "menor", valor: "30" });
    const op = (valorReal) =>
      operacaoCom({
        proposta: { valorOperacao: "1000000" },
        garantias: [novaGarantia("aval"), { ...novaGarantia("hipoteca"), valor: valorReal }],
      });
    expect(estado(r, op("200000"))).toBe("acionada"); // 20% < 30%
    expect(estado(r, op("300000"))).toBe("nao_acionada"); // 30% nao e menor que 30%
    expect(estado(r, op("900000"))).toBe("nao_acionada");
  });

  test("a cobertura das garantias reais considera os graus em aberto do imovel", () => {
    const r = regra({ campo: "garantias_cobertura_reais", operador: "menor", valor: "30" });
    const grauAberto = { id: "g1", valor: "500000", status: "aberto_credisul" };
    const op = (graus) =>
      operacaoCom({
        proposta: { valorOperacao: "500000" },
        garantias: [{ ...novaGarantia("hipoteca"), valor: "200000", graus }],
      });
    expect(estado(r, op([]))).toBe("nao_acionada"); // 200 mil / 500 mil = 40%
    expect(estado(r, op([grauAberto]))).toBe("acionada"); // 200 mil / (500 mil + 500 mil) = 20%
  });

  test("sem valor de operacao nao da pra calcular a cobertura: nao avaliada", () => {
    const r = regra({ campo: "garantias_cobertura_reais", operador: "menor", valor: "30" });
    expect(estado(r, operacaoCom({ garantias: [] }))).toBe("nao_avaliada");
  });

  test("cobertura total: so aval = 100%", () => {
    const r = regra({ campo: "garantias_cobertura_total", operador: "maior_igual", valor: "100" });
    expect(estado(r, operacaoCom({ proposta: { valorOperacao: "500000" }, garantias: [novaGarantia("aval")] }))).toBe("acionada");
  });

  test("itens pendentes vem do progresso; sem contexto, nao avaliada", () => {
    const r = regra({ campo: "checklist_pendentes", operador: "maior", valor: "0" });
    expect(estado(r, operacaoCom(), { progresso: { pendente: 3, naoAvaliados: 1 } })).toBe("acionada");
    expect(estado(r, operacaoCom(), { progresso: { pendente: 0, naoAvaliados: 1 } })).toBe("nao_acionada");
    expect(estado(r, operacaoCom())).toBe("nao_avaliada");
  });
});

describe("regras iniciais (as duas do exemplo)", () => {
  const op = (risco, qrsa) => operacaoCom({ proponente: { risco, qrsa } });

  test("R12 + QRSA Alto aciona as duas, cada uma com a sua mensagem", () => {
    const resultados = avaliarRegras(op("R12", "Alto"), REGRAS_PADRAO);
    expect(resultados.map((r) => r.estado)).toEqual(["acionada", "acionada"]);
    expect(resultados[0].textoParecer).toBe("Cooperado com risco R12: a operação deve ser deliberada pelas alçadas competentes.");
    expect(resultados[1].textoParecer).toBe("QRSA Alto: submeter ao Nível 4.");
  });

  test("R7 ja aciona; R6 nao", () => {
    expect(avaliarRegras(op("R7", "Baixo"), REGRAS_PADRAO).map((r) => r.estado)).toEqual(["acionada", "nao_acionada"]);
    expect(avaliarRegras(op("R6", "Baixo"), REGRAS_PADRAO).map((r) => r.estado)).toEqual(["nao_acionada", "nao_acionada"]);
  });

  test("sem risco e sem QRSA as duas ficam 'nao avaliadas'", () => {
    expect(avaliarRegras(op("", ""), REGRAS_PADRAO).map((r) => r.estado)).toEqual(["nao_avaliada", "nao_avaliada"]);
  });

  test("as duas regras aparecem independentes: nao ha combinacao nem hierarquia", () => {
    const resultados = avaliarRegras(op("R3", "Alto"), REGRAS_PADRAO);
    expect(resultados.map((r) => r.estado)).toEqual(["nao_acionada", "acionada"]);
  });
});

describe("apoio da tela", () => {
  test("operadores por tipo e rotulos", () => {
    expect(operadoresDoTipo("numero")).toContain("maior_igual");
    expect(operadoresDoTipo("lista")).not.toContain("maior");
    expect(rotuloOperador("igual", "lista")).toBe("é");
    expect(rotuloOperador("igual", "numero")).toBe("é igual a");
  });

  test("descricao da condicao", () => {
    expect(descreverCondicao(regra())).toBe("Risco (número) é maior ou igual a 7");
    expect(descreverCondicao(regra({ campo: "proponente_qrsa", operador: "igual", valor: "Alto" }))).toBe("QRSA é Alto");
    expect(descreverCondicao(regra({ campo: "proposta_valor", operador: "maior", valor: "450000" })).replace(/\s/g, " ")).toBe(
      "Valor da operação é maior que R$ 450.000,00"
    );
    expect(descreverCondicao(regra({ campo: "proponente_setor", operador: "vazio", valor: "" }))).toBe("Setor de atuação está em branco");
  });

  test("catalogo: toda variavel e chave sao unicas e todo campo de lista tem opcoes", () => {
    const variaveis = variaveisDisponiveis().map((v) => v.nome);
    expect(new Set(variaveis).size).toBe(variaveis.length);
    expect(campoDaRegra("proponente_qrsa").opcoes.length).toBe(3);
    expect(campoDaRegra("nao_existe")).toBeNull();
  });

  test("avaliarCondicao exportada: serve ao teste ao vivo da Administracao", () => {
    const risco = campoDaRegra("proponente_risco");
    expect(avaliarCondicao(risco, "maior_igual", "7", 9)).toBe("sim");
    expect(avaliarCondicao(risco, "maior_igual", "7", 5)).toBe("nao");
    expect(avaliarCondicao(risco, "maior_igual", "7", "")).toBe("sem_dado");
    expect(avaliarCondicao(risco, "maior_igual", "x", 9)).toBe("invalida");
  });

  test("textosUnicos remove repeticao e vazios, mantendo a ordem", () => {
    expect(textosUnicos(["a", "", "b", "a", "  ", "c"])).toEqual(["a", "b", "c"]);
  });
});
