function novoId(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function novoProprietario() {
  return { id: novoId("prp"), nome: "", documento: "", checklist: {} };
}

export function novoImovel() {
  return {
    id: novoId("imv"),
    matricula: "",
    ccir: "",
    nirfCib: "",
    nomeImovel: "",
    areaTotal: "",
    areaBeneficiadaHa: "",
    car: "",
    municipio: "",
    checklist: {},
    proprietarios: [novoProprietario()],
  };
}
