import gerarParecerTexto from "./gerarParecerTexto";
import gerarDevolutivaTexto from "./gerarDevolutivaTexto";
import { coletarRevisao } from "./revisao";
import { avaliarRegras } from "./regrasModel";
import { REGRAS_PADRAO } from "./regrasPadrao";
import { criarOperacaoVazia, normalizarOperacao, operacaoEstaVazia } from "./operacaoModel";

const checklistVazio = { proponente: [], documentos: [], garantias: {}, areaBeneficiada: { bem: [], proprietario: [] }, linhas: {} };
const capacidade = { beneficiario: { rendaLiquida: 0, indice: null } };

const operacaoCom = (proponente = {}, proposta = {}) => {
  const op = criarOperacaoVazia();
  Object.assign(op.proponente, proponente);
  Object.assign(op.proposta, proposta);
  return op;
};

const regraImpeditiva = {
  id: "reg_imp",
  nome: "Perda esperada acima de 9,05%",
  ativa: true,
  campo: "proponente_perda_esperada",
  operador: "maior",
  valor: "9.05",
  fontes: "todas",
  impedeContratacao: true,
  textoParecer: "",
  textoDevolutiva: "Perda esperada acima do limite da CCI 1.803/2024.",
};

describe("parecer com regras", () => {
  test("mensagens acionadas aparecem juntas, no fim, antes do trecho a preencher", () => {
    const texto = gerarParecerTexto(operacaoCom(), capacidade, ["Mensagem A.", "Mensagem B."]);
    const linhas = texto.split("\n");
    const titulo = linhas.indexOf("Alçadas e condicionantes:");
    expect(titulo).toBeGreaterThan(-1);
    expect(linhas[titulo + 1]).toBe("  - Mensagem A.");
    expect(linhas[titulo + 2]).toBe("  - Mensagem B.");
    expect(texto.indexOf("Alçadas e condicionantes:")).toBeLessThan(texto.indexOf("[Preencher observações"));
  });

  test("sem regras acionadas o parecer nao muda (nenhum titulo solto)", () => {
    expect(gerarParecerTexto(operacaoCom(), capacidade)).not.toContain("Alçadas e condicionantes");
    expect(gerarParecerTexto(operacaoCom(), capacidade, [])).toBe(gerarParecerTexto(operacaoCom(), capacidade));
  });

  test("os dois exemplos: risco R12 e QRSA Alto levam cada um a sua mensagem", () => {
    const op = operacaoCom({ risco: "R12", qrsa: "Alto" });
    const mensagens = avaliarRegras(op, REGRAS_PADRAO)
      .filter((r) => r.estado === "acionada")
      .map((r) => r.textoParecer);
    const texto = gerarParecerTexto(op, capacidade, mensagens);
    expect(texto).toContain("  - Cooperado com risco R12: a operação deve ser deliberada pelas alçadas competentes.");
    expect(texto).toContain("  - QRSA Alto: submeter ao Nível 4.");
  });
});

describe("devolutiva com regras", () => {
  test("a mensagem entra sob 'Condicionantes' e a devolutiva deixa de dizer que nao ha nada", () => {
    const texto = gerarDevolutivaTexto(criarOperacaoVazia(), checklistVazio, ["Enviar ata do comitê."]);
    expect(texto).toContain("Condicionantes\n  - Enviar ata do comitê.");
    expect(texto).not.toContain("Nenhuma pendência");
  });

  test("sem pendencias e sem regras continua com a mensagem padrao", () => {
    expect(gerarDevolutivaTexto(criarOperacaoVazia(), checklistVazio)).toContain("Nenhuma pendência marcada");
  });
});

describe("revisao com regras", () => {
  const revisar = (op, regras) => coletarRevisao(op, checklistVazio, avaliarRegras(op, regras));

  test("lista as acionadas com o motivo e o que foi informado", () => {
    const revisao = revisar(operacaoCom({ risco: "R9", qrsa: "Alto" }), REGRAS_PADRAO);
    expect(revisao.regras.acionadas.map((r) => r.nome)).toEqual(["Risco R7 ou acima", "QRSA Alto"]);
    expect(revisao.regras.acionadas[0]).toMatchObject({ condicao: "Risco (número) é maior ou igual a 7", encontrado: "R9", impede: false });
  });

  test("regra que impede a contratacao vira o primeiro aviso e conta no resumo", () => {
    const op = operacaoCom({ perdaEsperada: "10" });
    const revisao = revisar(op, [...REGRAS_PADRAO, regraImpeditiva]);
    expect(revisao.resumo.impedimentos).toBe(1);
    expect(revisao.regras.impedimentos).toHaveLength(1);
    expect(revisao.avisos[0].texto).toBe('A regra \"Perda esperada acima de 9,05%\" impede a contratação: Perda esperada (PE) é maior que 9,05% (informado: 10%).');
    expect(revisao.avisos[0].aba).toBe("proponente");
    expect(revisao.avisos[0].impede).toBe(true);
    expect(revisao.avisos.slice(1).every((aviso) => !aviso.impede)).toBe(true);
  });

  test("sem impedimento o resumo e zero", () => {
    expect(revisar(operacaoCom({ perdaEsperada: "5" }), [regraImpeditiva]).resumo.impedimentos).toBe(0);
  });

  test("dado faltando vira aviso 'nao avaliada' em vez de passar em silencio", () => {
    const revisao = revisar(operacaoCom(), REGRAS_PADRAO);
    const textos = revisao.avisos.map((a) => a.texto);
    expect(textos).toContain('Regra "Risco R7 ou acima" não avaliada: Risco (número) não preenchido.');
    expect(textos).toContain('Regra "QRSA Alto" não avaliada: QRSA não preenchido.');
    expect(revisao.regras.naoAvaliadas).toHaveLength(2);
  });

  test("regra com configuracao quebrada e sinalizada", () => {
    const quebrada = { ...REGRAS_PADRAO[0], id: "reg_x", nome: "Antiga", campo: "campo_que_sumiu" };
    const revisao = revisar(operacaoCom(), [quebrada]);
    expect(revisao.avisos.map((a) => a.texto)).toContain('A regra "Antiga" está com a configuração inválida; revise na Administração.');
  });

  test("regras inativas ou de outra fonte nao geram nada", () => {
    const inativa = { ...REGRAS_PADRAO[0], ativa: false };
    const outraFonte = { ...REGRAS_PADRAO[1], fontes: ["fno"] };
    const revisao = revisar(operacaoCom({ risco: "R12", qrsa: "Alto" }, { programa: "bndes" }), [inativa, outraFonte]);
    expect(revisao.regras.acionadas).toEqual([]);
    expect(revisao.regras.naoAvaliadas).toEqual([]);
  });

  test("parecer editado a mao: avisa quando uma regra acionada nao esta no texto", () => {
    const op = operacaoCom({ risco: "R10" });
    op.parecerEditadoManualmente = true;
    op.parecerTexto = "Texto escrito pelo analista.";
    const aviso = revisar(op, [REGRAS_PADRAO[0]]).avisos.find((a) => a.aba === "parecer");
    expect(aviso.texto).toMatch(/1 regra acionada não está no texto do Parecer/);

    op.parecerTexto = "Cooperado com risco R10: a operação deve ser deliberada pelas alçadas competentes.";
    expect(revisar(op, [REGRAS_PADRAO[0]]).avisos.find((a) => a.aba === "parecer")).toBeUndefined();
  });

  test("parecer automatico nao precisa desse aviso (ele se atualiza sozinho)", () => {
    const op = operacaoCom({ risco: "R10" });
    op.parecerEditadoManualmente = false;
    op.parecerTexto = "";
    expect(revisar(op, [REGRAS_PADRAO[0]]).avisos.find((a) => a.aba === "parecer")).toBeUndefined();
  });
});

describe("novos dados do proponente", () => {
  test("operacao nova nasce com os tres campos vazios", () => {
    expect(criarOperacaoVazia().proponente).toMatchObject({ perdaEsperada: "", estagio3: "", parteRelacionada: "" });
  });

  test("operacao salva antes desta versao ganha os campos ao abrir, sem perder o resto", () => {
    const antiga = normalizarOperacao({ proponente: { nome: "Maria", risco: "R5" }, proposta: {} });
    expect(antiga.proponente).toMatchObject({ nome: "Maria", risco: "R5", perdaEsperada: "", estagio3: "", parteRelacionada: "" });
  });

  test("preencher qualquer um deles tira a operacao do estado vazio", () => {
    for (const campo of ["perdaEsperada", "estagio3", "parteRelacionada"]) {
      const op = criarOperacaoVazia();
      expect(operacaoEstaVazia(op)).toBe(true);
      op.proponente[campo] = campo === "perdaEsperada" ? "6.5" : "SIM";
      expect(operacaoEstaVazia(op)).toBe(false);
    }
  });
});
