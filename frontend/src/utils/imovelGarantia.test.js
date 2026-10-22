import { descreverImovelGarantia } from "./analiseMatricula";
import { novaGarantia } from "./garantiaModel";
import { criarOperacaoVazia, normalizarOperacao } from "./operacaoModel";
import gerarParecerTexto from "./gerarParecerTexto";

describe("descreverImovelGarantia", () => {
  test("monta a linha com o que foi preenchido, sem repetir a matricula", () => {
    const g = {
      ...novaGarantia("hipoteca"),
      nomeImovel: "Fazenda Boa Vista",
      matricula: "12.345",
      municipio: "Rio Verde",
      areaTotal: "120.5",
      ccir: "950.1",
      nirfCib: "1.234.567-8",
      car: "GO-123",
    };
    expect(descreverImovelGarantia(g)).toBe(
      'Imóvel "Fazenda Boa Vista": município de Rio Verde, área total de 120,5 ha, CCIR 950.1, NIRF/CIB 1.234.567-8, CAR GO-123.'
    );
  });

  test("omite os campos vazios", () => {
    expect(descreverImovelGarantia({ ...novaGarantia("hipoteca"), municipio: "Jataí" })).toBe("Imóvel: município de Jataí.");
    expect(descreverImovelGarantia({ ...novaGarantia("hipoteca"), nomeImovel: "Sítio X" })).toBe('Imóvel "Sítio X".');
  });

  test("devolve null enquanto nada foi preenchido (matricula sozinha nao conta: ela abre a linha da analise)", () => {
    expect(descreverImovelGarantia(novaGarantia("hipoteca"))).toBeNull();
    expect(descreverImovelGarantia({ ...novaGarantia("hipoteca"), matricula: "1" })).toBeNull();
    expect(descreverImovelGarantia(undefined)).toBeNull();
  });
});

describe("modelo e normalizacao", () => {
  test("nova garantia nasce com os campos de caracterizacao do imovel", () => {
    expect(novaGarantia("hipoteca")).toMatchObject({
      nomeImovel: "",
      matricula: "",
      ccir: "",
      nirfCib: "",
      areaTotal: "",
      car: "",
      municipio: "",
    });
  });

  test("garantia antiga recebe os campos novos vazios sem perder o que ja tinha", () => {
    const op = normalizarOperacao({ garantias: [{ id: "g", tipo: "hipoteca", valor: "900", matricula: "77" }] });
    expect(op.garantias[0]).toMatchObject({ valor: "900", matricula: "77", nomeImovel: "", ccir: "", municipio: "", areaTotal: "" });
  });
});

describe("parecer", () => {
  test("o parecer nao traz a caracterizacao do imovel (nome, municipio, area, CCIR, NIRF, CAR)", () => {
    const op = criarOperacaoVazia();
    op.proposta.valorOperacao = "200000";
    op.garantias = [
      {
        ...novaGarantia("hipoteca"),
        valor: "500000",
        matricula: "999",
        nomeImovel: "Fazenda Esperança",
        municipio: "Mineiros",
        areaTotal: "300",
      },
    ];
    const texto = gerarParecerTexto(op, { beneficiario: { rendaLiquida: 0, indice: null } });
    expect(texto).not.toMatch(/Fazenda Esperança|Mineiros|300 ha|CCIR|NIRF|CAR /);
    expect(texto).toContain("matrícula 999");
  });

  test("aval nunca ganha linha de imovel", () => {
    const op = criarOperacaoVazia();
    op.garantias = [{ ...novaGarantia("aval"), nomeImovel: "ignorado" }];
    const texto = gerarParecerTexto(op, { beneficiario: { rendaLiquida: 0, indice: null } });
    expect(texto).not.toMatch(/Imóvel "ignorado"/);
  });
});
