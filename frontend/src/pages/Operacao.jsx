import { useEffect, useMemo, useRef, useState } from "react";
import ProponenteForm from "../components/ProponenteForm";
import PropostaForm from "../components/PropostaForm";
import ChecklistDocumental from "../components/ChecklistDocumental";
import GarantiasPainel from "../components/GarantiasPainel";
import AreaBeneficiadaPainel from "../components/AreaBeneficiadaPainel";
import TextoGeradoPainel from "../components/TextoGeradoPainel";
import ProgressoGeral from "../components/ProgressoGeral";
import { useReferencia } from "../utils/referencia";
import {
  criarOperacaoVazia,
  normalizarOperacao,
  progressoGeral,
} from "../utils/operacaoModel";
import { novaGarantia, novoGarantidor } from "../utils/garantiaModel";
import { novoImovel, novoProprietario } from "../utils/areaBeneficiadaModel";
import { filtrarGruposPorFonteELinha } from "../utils/linhaModel";
import {
  salvarOperacao,
  carregarOperacao,
  exportarOperacao,
  importarOperacao,
} from "../utils/operacaoStorage";
import { calcularCapacidade, valorParcela } from "../utils/capacidadePagamento";
import gerarParecerTexto from "../utils/gerarParecerTexto";
import gerarDevolutivaTexto from "../utils/gerarDevolutivaTexto";
import { gerarPdfOperacao, gerarPdfDevolutiva } from "../utils/gerarPdf";
import "./Operacao.css";

// "Capacidade de pagamento" fica de fora do menu por enquanto: e uma situacao especifica das
// linhas de BNDES, nao faz sentido como aba sempre visivel pra qualquer programa. O calculo
// (capacidadeBeneficiario, mais abaixo) continua de pe porque o Parecer ja usa esse resultado —
// a ideia e futuramente reaproveitar como item de checklist dentro das linhas de BNDES.
const ABAS = [
  { chave: "proponente", rotulo: "Proponente" },
  { chave: "proposta", rotulo: "Proposta" },
  { chave: "area_beneficiada", rotulo: "Área beneficiada" },
  { chave: "garantias", rotulo: "Garantias" },
  { chave: "checklist", rotulo: "Demais documentos" },
  { chave: "parecer", rotulo: "Parecer" },
  { chave: "devolutiva", rotulo: "Devolutiva" },
];

export default function Operacao() {
  const referencia = useReferencia();
  const [operacao, setOperacao] = useState(() => normalizarOperacao(carregarOperacao()));
  const [abaAtiva, setAbaAtiva] = useState("proponente");
  const [copiado, setCopiado] = useState(false);
  const [copiadoDevolutiva, setCopiadoDevolutiva] = useState(false);
  const importarInputRef = useRef(null);

  useEffect(() => {
    const atalho = setTimeout(() => {
      salvarOperacao({ ...operacao, atualizadoEm: new Date().toISOString() });
    }, 400);
    return () => clearTimeout(atalho);
  }, [operacao]);

  const mudarProponente = (campo, valor) => {
    setOperacao((op) => ({ ...op, proponente: { ...op.proponente, [campo]: valor } }));
  };

  const mudarChecklistProponente = (chave, novoEstado) => {
    setOperacao((op) => ({
      ...op,
      proponente: {
        ...op.proponente,
        checklist: { ...op.proponente.checklist, [chave]: novoEstado },
      },
    }));
  };

  const mudarProposta = (campo, valor) => {
    setOperacao((op) => ({ ...op, proposta: { ...op.proposta, [campo]: valor } }));
  };

  const mudarBeneficiario = (novoValor) => {
    setOperacao((op) => ({
      ...op,
      capacidadePagamento: { ...op.capacidadePagamento, beneficiario: novoValor },
    }));
  };

  const mudarAvalistas = (novosAvalistas) => {
    setOperacao((op) => ({
      ...op,
      capacidadePagamento: { ...op.capacidadePagamento, avalistas: novosAvalistas },
    }));
  };

  const mudarChecklistDocumental = (chave, novoEstado) => {
    setOperacao((op) => ({
      ...op,
      checklistDocumental: { ...op.checklistDocumental, [chave]: novoEstado },
    }));
  };

  const adicionarGarantia = (tipo) => {
    setOperacao((op) => ({ ...op, garantias: [...op.garantias, novaGarantia(tipo)] }));
  };

  const removerGarantia = (garantiaId) => {
    setOperacao((op) => ({ ...op, garantias: op.garantias.filter((g) => g.id !== garantiaId) }));
  };

  const atualizarGarantia = (op, garantiaId, transformar) => ({
    ...op,
    garantias: op.garantias.map((g) => (g.id === garantiaId ? transformar(g) : g)),
  });

  const mudarCampoGarantia = (garantiaId, campo, valor) => {
    setOperacao((op) => atualizarGarantia(op, garantiaId, (g) => ({ ...g, [campo]: valor })));
  };

  const mudarChecklistBemGarantia = (garantiaId, chave, novoEstado) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        checklist: { ...g.checklist, [chave]: novoEstado },
      }))
    );
  };

  const adicionarGarantidor = (garantiaId) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        garantidores: [...g.garantidores, novoGarantidor()],
      }))
    );
  };

  const removerGarantidor = (garantiaId, garantidorId) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        garantidores: g.garantidores.filter((gd) => gd.id !== garantidorId),
      }))
    );
  };

  const mudarCampoGarantidor = (garantiaId, garantidorId, campo, valor) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        garantidores: g.garantidores.map((gd) => (gd.id === garantidorId ? { ...gd, [campo]: valor } : gd)),
      }))
    );
  };

  const mudarChecklistGarantidor = (garantiaId, garantidorId, chave, novoEstado) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        garantidores: g.garantidores.map((gd) =>
          gd.id === garantidorId ? { ...gd, checklist: { ...gd.checklist, [chave]: novoEstado } } : gd
        ),
      }))
    );
  };

  const adicionarImovel = () => {
    setOperacao((op) => ({ ...op, areaBeneficiada: [...op.areaBeneficiada, novoImovel()] }));
  };

  const removerImovel = (imovelId) => {
    setOperacao((op) => ({ ...op, areaBeneficiada: op.areaBeneficiada.filter((i) => i.id !== imovelId) }));
  };

  const atualizarImovel = (op, imovelId, transformar) => ({
    ...op,
    areaBeneficiada: op.areaBeneficiada.map((i) => (i.id === imovelId ? transformar(i) : i)),
  });

  const mudarCampoImovel = (imovelId, campo, valor) => {
    setOperacao((op) => atualizarImovel(op, imovelId, (i) => ({ ...i, [campo]: valor })));
  };

  const mudarChecklistImovel = (imovelId, chave, novoEstado) => {
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        checklist: { ...i.checklist, [chave]: novoEstado },
      }))
    );
  };

  const adicionarProprietario = (imovelId) => {
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        proprietarios: [...i.proprietarios, novoProprietario()],
      }))
    );
  };

  const removerProprietario = (imovelId, proprietarioId) => {
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        proprietarios: i.proprietarios.filter((p) => p.id !== proprietarioId),
      }))
    );
  };

  const mudarCampoProprietario = (imovelId, proprietarioId, campo, valor) => {
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        proprietarios: i.proprietarios.map((p) => (p.id === proprietarioId ? { ...p, [campo]: valor } : p)),
      }))
    );
  };

  const mudarChecklistProprietario = (imovelId, proprietarioId, chave, novoEstado) => {
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        proprietarios: i.proprietarios.map((p) =>
          p.id === proprietarioId ? { ...p, checklist: { ...p.checklist, [chave]: novoEstado } } : p
        ),
      }))
    );
  };

  const parcela = valorParcela({
    valorOperacao: operacao.proposta.valorOperacao,
    taxaAnualPercentual: operacao.proposta.taxaAnual,
    prazoMeses: operacao.proposta.prazoMeses,
    carenciaMeses: operacao.proposta.carenciaMeses,
    periodicidade: operacao.proposta.periodicidadePagamento,
  });

  const capacidadeBeneficiario = useMemo(
    () =>
      calcularCapacidade({
        rendaBruta: operacao.capacidadePagamento.beneficiario.rendaBruta,
        despesasPercentual:
          operacao.capacidadePagamento.beneficiario.despesasPercentual || 50,
        parcela,
        periodicidade: operacao.proposta.periodicidadePagamento,
      }),
    [operacao.capacidadePagamento.beneficiario, parcela, operacao.proposta.periodicidadePagamento]
  );

  const progresso = progressoGeral(
    operacao,
    referencia.checklist.proponente,
    referencia.checklist.documentos,
    referencia.checklist.garantias,
    referencia.checklist.areaBeneficiada
  );

  const regerarParecer = () => {
    const texto = gerarParecerTexto(operacao, { beneficiario: capacidadeBeneficiario });
    setOperacao((op) => ({ ...op, parecerTexto: texto, parecerEditadoManualmente: false }));
  };

  useEffect(() => {
    if (!operacao.parecerEditadoManualmente) {
      const texto = gerarParecerTexto(operacao, { beneficiario: capacidadeBeneficiario });
      setOperacao((op) => (op.parecerTexto === texto ? op : { ...op, parecerTexto: texto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    operacao.proponente,
    operacao.proposta,
    operacao.garantias,
    operacao.areaBeneficiada,
    capacidadeBeneficiario.rendaLiquida,
    capacidadeBeneficiario.indice,
  ]);

  const copiarParecer = async () => {
    try {
      await navigator.clipboard.writeText(operacao.parecerTexto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch (erro) {
      console.error("Nao foi possivel copiar o parecer.", erro);
    }
  };

  const exportarPdf = () => {
    gerarPdfOperacao(
      operacao,
      referencia.checklist.proponente,
      referencia.checklist.documentos,
      referencia.checklist.garantias,
      referencia.checklist.areaBeneficiada
    );
  };

  const regerarDevolutiva = () => {
    const texto = gerarDevolutivaTexto(operacao, referencia.checklist);
    setOperacao((op) => ({ ...op, devolutivaTextoFinal: texto, devolutivaEditadaManualmente: false }));
  };

  useEffect(() => {
    if (!operacao.devolutivaEditadaManualmente) {
      const texto = gerarDevolutivaTexto(operacao, referencia.checklist);
      setOperacao((op) => (op.devolutivaTextoFinal === texto ? op : { ...op, devolutivaTextoFinal: texto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    operacao.proponente.checklist,
    operacao.checklistDocumental,
    operacao.garantias,
    operacao.areaBeneficiada,
    operacao.proposta.programa,
  ]);

  const copiarDevolutiva = async () => {
    try {
      await navigator.clipboard.writeText(operacao.devolutivaTextoFinal);
      setCopiadoDevolutiva(true);
      setTimeout(() => setCopiadoDevolutiva(false), 1800);
    } catch (erro) {
      console.error("Nao foi possivel copiar a devolutiva.", erro);
    }
  };

  const exportarPdfDevolutiva = () => {
    gerarPdfDevolutiva(operacao, operacao.devolutivaTextoFinal);
  };

  const handleImportar = async (evento) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      const dados = await importarOperacao(arquivo);
      setOperacao(normalizarOperacao(dados));
    } catch (erro) {
      alert(erro.message);
    } finally {
      evento.target.value = "";
    }
  };

  const novaOperacao = () => {
    if (window.confirm("Isso vai limpar todos os dados da operacao atual. Deseja continuar?")) {
      setOperacao(criarOperacaoVazia());
    }
  };

  const grupoProponenteAtual = filtrarGruposPorFonteELinha(
    referencia.checklist.proponente,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  const grupoDocumentalAtual = filtrarGruposPorFonteELinha(
    referencia.checklist.documentos,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist
  );
  const grupoAreaBeneficiadaAtual = {
    bem: filtrarGruposPorFonteELinha(
      referencia.checklist.areaBeneficiada.bem,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    ),
    proprietario: filtrarGruposPorFonteELinha(
      referencia.checklist.areaBeneficiada.proprietario,
      operacao.proposta.programa,
      operacao.proposta.linhaChecklist
    ),
  };

  return (
    <div className="operacao">
      <header className="operacao-header">
        <div>
          <h1>RuralFlow Checklist</h1>
          <p>Analise de operacoes de credito rural — BNDES, FNO e FCO</p>
        </div>
        <div className="operacao-header-acoes">
          <button type="button" onClick={() => exportarOperacao(operacao)}>
            Exportar operacao (.json)
          </button>
          <button type="button" onClick={() => importarInputRef.current?.click()}>
            Importar operacao (.json)
          </button>
          <input
            ref={importarInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImportar}
          />
          <button type="button" className="operacao-header-acao-perigo" onClick={novaOperacao}>
            Nova operacao
          </button>
        </div>
      </header>

      <ProgressoGeral progresso={progresso} />

      <div className="operacao-corpo">
        <nav className="operacao-sidebar">
          {ABAS.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              className={abaAtiva === aba.chave ? "ativa" : ""}
              onClick={() => setAbaAtiva(aba.chave)}
            >
              {aba.rotulo}
            </button>
          ))}
        </nav>

        <main className="operacao-conteudo">
        {abaAtiva === "proponente" && (
          <ProponenteForm
            proponente={operacao.proponente}
            checklistDef={grupoProponenteAtual}
            onMudarCampo={mudarProponente}
            onMudarChecklist={mudarChecklistProponente}
          />
        )}

        {abaAtiva === "proposta" && (
          <PropostaForm
            proposta={operacao.proposta}
            rendaAnualProponente={operacao.proponente.rendaAnual}
            linhasCredito={referencia.linhasCredito}
            linhasChecklist={referencia.checklist.linhas}
            municipiosFno={referencia.municipiosFno}
            fnoRegras={referencia.fnoRegras}
            onMudarCampo={mudarProposta}
          />
        )}

        {abaAtiva === "area_beneficiada" && (
          <AreaBeneficiadaPainel
            imoveis={operacao.areaBeneficiada}
            checklistAreaBeneficiadaDef={grupoAreaBeneficiadaAtual}
            acoes={{
              adicionar: adicionarImovel,
              remover: removerImovel,
              mudarCampo: mudarCampoImovel,
              mudarChecklistImovel,
              adicionarProprietario,
              removerProprietario,
              mudarCampoProprietario,
              mudarChecklistProprietario,
            }}
          />
        )}

        {abaAtiva === "garantias" && (
          <GarantiasPainel
            garantias={operacao.garantias}
            checklistGarantiasDef={referencia.checklist.garantias}
            valorOperacao={operacao.proposta.valorOperacao}
            acoes={{
              adicionar: adicionarGarantia,
              remover: removerGarantia,
              mudarCampo: mudarCampoGarantia,
              mudarChecklistBem: mudarChecklistBemGarantia,
              adicionarGarantidor,
              removerGarantidor,
              mudarCampoGarantidor,
              mudarChecklistGarantidor,
            }}
          />
        )}

        {abaAtiva === "checklist" && (
          <ChecklistDocumental
            programa={operacao.proposta.programa}
            grupos={grupoDocumentalAtual}
            estado={operacao.checklistDocumental}
            onMudarItem={mudarChecklistDocumental}
          />
        )}

        {abaAtiva === "parecer" && (
          <TextoGeradoPainel
            titulo="Parecer"
            descricao="Texto gerado a partir dos dados preenchidos. Pode ser editado livremente antes de encaminhar."
            texto={operacao.parecerTexto}
            onMudarTexto={(texto) =>
              setOperacao((op) => ({ ...op, parecerTexto: texto, parecerEditadoManualmente: true }))
            }
            onRegerar={regerarParecer}
            onCopiar={copiarParecer}
            onExportarPdf={exportarPdf}
            copiado={copiado}
          />
        )}

        {abaAtiva === "devolutiva" && (
          <TextoGeradoPainel
            titulo="Devolutiva"
            descricao="Consolida o texto de devolutiva de todos os itens marcados como Pendente no checklist do Proponente e no Checklist Documental."
            texto={operacao.devolutivaTextoFinal}
            onMudarTexto={(texto) =>
              setOperacao((op) => ({ ...op, devolutivaTextoFinal: texto, devolutivaEditadaManualmente: true }))
            }
            onRegerar={regerarDevolutiva}
            onCopiar={copiarDevolutiva}
            onExportarPdf={exportarPdfDevolutiva}
            copiado={copiadoDevolutiva}
          />
        )}
        </main>
      </div>
    </div>
  );
}
