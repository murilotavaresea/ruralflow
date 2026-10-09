import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import {
  LINHAS_CREDITO_BNDES as LINHAS_CREDITO_FALLBACK,
  MUNICIPIOS_FNO as MUNICIPIOS_FALLBACK,
  CHECKLIST_PROPONENTE as CHECKLIST_PROPONENTE_FALLBACK,
  CHECKLIST_DOCUMENTOS as CHECKLIST_DOCUMENTOS_FALLBACK,
  CHECKLIST_GARANTIAS as CHECKLIST_GARANTIAS_FALLBACK,
  CHECKLIST_AREA_BENEFICIADA as CHECKLIST_AREA_BENEFICIADA_FALLBACK,
  LINHAS_CHECKLIST as LINHAS_CHECKLIST_FALLBACK,
  LINKS_UTEIS as LINKS_UTEIS_FALLBACK,
  FNO_REGRAS as FNO_REGRAS_FALLBACK,
} from "../config/referenciaFallback";

// O backend ja atribui um `id` estavel a cada grupo/item (veja backend/storage/checklist_store.py) —
// usamos esse id como chave no estado da operacao, para sobreviver a renomeacoes feitas no
// painel de administracao.
function comChave(grupos) {
  return grupos.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.map((item) => ({ ...item, chave: item.id })),
  }));
}

function processarChecklist(checklist) {
  const garantias = {};
  Object.entries(checklist.garantias || {}).forEach(([tipo, escopos]) => {
    garantias[tipo] = {
      bem: comChave(escopos.bem || []),
      proprietario: comChave(escopos.proprietario || []),
    };
  });

  return {
    // Proponente e Documentos sao catalogos unicos (lista flat de grupos) — cada item se
    // marca com `fontes`/`linhas` (ver utils/linhaModel.js) em vez de morar numa fonte
    // especifica; e o que permite um item ser comum a mais de uma fonte de recurso.
    proponente: comChave(checklist.proponente),
    documentos: comChave(checklist.documentos),
    garantias,
    areaBeneficiada: {
      bem: comChave(checklist.area_beneficiada?.bem || []),
      proprietario: comChave(checklist.area_beneficiada?.proprietario || []),
    },
    // "linhas" aqui e a categoria de checklist (Custeio/Investimento/...) por programa — nao
    // confundir com "linhasCredito" (tabela de codigos BNDES) exposta em outro campo.
    linhas: checklist.linhas || {},
  };
}

const FALLBACK = {
  linhasCredito: LINHAS_CREDITO_FALLBACK,
  municipiosFno: MUNICIPIOS_FALLBACK,
  checklist: processarChecklist({
    proponente: CHECKLIST_PROPONENTE_FALLBACK,
    documentos: CHECKLIST_DOCUMENTOS_FALLBACK,
    garantias: CHECKLIST_GARANTIAS_FALLBACK,
    area_beneficiada: CHECKLIST_AREA_BENEFICIADA_FALLBACK,
    linhas: LINHAS_CHECKLIST_FALLBACK,
  }),
  linksUteis: LINKS_UTEIS_FALLBACK,
  fnoRegras: FNO_REGRAS_FALLBACK,
};

// Carrega os dados de referencia do backend Flask; se o backend nao estiver disponivel,
// usa a copia estatica embutida no frontend (mesmo papel de camadasExternasFallback.js no
// webgis-project) para que a ferramenta continue funcionando offline.
export function useReferencia() {
  const [dados, setDados] = useState(FALLBACK);
  const [origem, setOrigem] = useState("local");

  const carregar = useCallback(async () => {
    try {
      const [linhas, municipios, checklist, links, fnoRegras] = await Promise.all([
        axios.get(`${config.REFERENCIA_URL}/linhas-credito`),
        axios.get(`${config.REFERENCIA_URL}/municipios-fno`),
        axios.get(`${config.REFERENCIA_URL}/checklist`),
        axios.get(`${config.REFERENCIA_URL}/links-uteis`),
        axios.get(`${config.REFERENCIA_URL}/fno-regras`),
      ]);

      setDados({
        linhasCredito: linhas.data,
        municipiosFno: municipios.data,
        checklist: processarChecklist(checklist.data),
        linksUteis: links.data,
        fnoRegras: fnoRegras.data,
      });
      setOrigem("backend");
    } catch (erro) {
      console.warn("Backend de referencia indisponivel, usando dados locais.", erro);
      setOrigem("local");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { ...dados, origem, recarregar: carregar };
}
