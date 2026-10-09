export const TIPOS_GARANTIA = [
  { chave: "hipoteca", rotulo: "Hipoteca", temGrau: true },
  { chave: "alienacao_imovel", rotulo: "Alienação de imóvel", temGrau: true },
  { chave: "alienacao_movel", rotulo: "Alienação de bem móvel", temGrau: true },
  { chave: "penhor_pecuario", rotulo: "Penhor pecuário", temGrau: true },
  { chave: "penhor_agricola", rotulo: "Penhor agrícola", temGrau: true },
  { chave: "aval", rotulo: "Aval", temGrau: false },
];

export function rotuloTipoGarantia(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.rotulo || tipo;
}

export function tipoTemGrau(tipo) {
  return TIPOS_GARANTIA.find((t) => t.chave === tipo)?.temGrau ?? true;
}

function novoId(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function novoGarantidor() {
  return { id: novoId("grt"), nome: "", documento: "", checklist: {} };
}

export function novaGarantia(tipo) {
  return {
    id: novoId("gar"),
    tipo,
    valor: "",
    grau: "",
    checklist: {},
    garantidores: [novoGarantidor()],
  };
}
