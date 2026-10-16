import { formatarDocumento, validarDocumento } from "./cpfCnpj";

describe("validarDocumento", () => {
  test("CPF com digitos verificadores corretos", () => {
    expect(validarDocumento("529.982.247-25")).toMatchObject({ tipo: "CPF", valido: true });
    expect(validarDocumento("52998224725")).toMatchObject({ tipo: "CPF", valido: true });
  });

  test("CPF com digito errado ou repetido e invalido", () => {
    expect(validarDocumento("529.982.247-26").valido).toBe(false);
    expect(validarDocumento("111.111.111-11").valido).toBe(false);
  });

  test("CNPJ com digitos verificadores corretos", () => {
    expect(validarDocumento("11.222.333/0001-81")).toMatchObject({ tipo: "CNPJ", valido: true });
  });

  test("CNPJ com digito errado ou repetido e invalido", () => {
    expect(validarDocumento("11.222.333/0001-82").valido).toBe(false);
    expect(validarDocumento("00.000.000/0000-00").valido).toBe(false);
  });

  test("documento incompleto nao e nem valido nem invalido", () => {
    expect(validarDocumento("")).toMatchObject({ tipo: "", valido: null, digitos: 0 });
    expect(validarDocumento("123.456")).toMatchObject({ valido: null, digitos: 6 });
    expect(validarDocumento("123456789012")).toMatchObject({ valido: null, digitos: 12 });
  });
});

describe("formatarDocumento", () => {
  test("aplica a mascara de CPF e de CNPJ", () => {
    expect(formatarDocumento("52998224725")).toBe("529.982.247-25");
    expect(formatarDocumento("11222333000181")).toBe("11.222.333/0001-81");
  });
});
