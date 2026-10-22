import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ProponenteForm from "../components/ProponenteForm";
import PropostaForm from "../components/PropostaForm";
import ChecklistDocumental from "../components/ChecklistDocumental";
import GarantiasPainel from "../components/GarantiasPainel";
import AreaBeneficiadaPainel from "../components/AreaBeneficiadaPainel";
import TextoGeradoPainel from "../components/TextoGeradoPainel";
import RevisaoPainel from "../components/RevisaoPainel";
import ContextoOperacao from "../components/ContextoOperacao";
import OperacoesRecentes from "../components/OperacoesRecentes";
import NavegacaoAbas from "../components/NavegacaoAbas";
import LinksUteis from "../components/LinksUteis";
import MenuSuspenso from "../components/MenuSuspenso";
import { useUi } from "../components/UiFeedback";
import { useReferencia } from "../utils/referencia";
import {
  criarOperacaoVazia,
  normalizarOperacao,
  novoIdOperacao,
  operacaoEstaVazia,
  progressoGeral,
} from "../utils/operacaoModel";
import { novaGarantia, novoGarantidor, novoGrau, rotuloTipoGarantia } from "../utils/garantiaModel";
import { novoImovel, novoProprietario } from "../utils/areaBeneficiadaModel";
import { filtrarGruposPorFonteELinha } from "../utils/linhaModel";
import {
  abrirOperacao,
  carregarOperacaoAtiva,
  excluirOperacao,
  exportarOperacao,
  importarOperacao,
  lerOperacaoSalva,
  listarOperacoes,
  salvarOperacao,
} from "../utils/operacaoStorage";
import { calcularCapacidade, valorParcela } from "../utils/capacidadePagamento";
import { coletarRevisao } from "../utils/revisao";
import { avaliarRegras, textosUnicos } from "../utils/regrasModel";
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
  { chave: "revisao", rotulo: "Revisão" },
  { chave: "parecer", rotulo: "Parecer" },
  { chave: "devolutiva", rotulo: "Devolutiva" },
];

const ROTULOS_ABAS = Object.fromEntries(ABAS.map((aba) => [aba.chave, aba.rotulo]));

const inserirEm = (lista, item, indice) => {
  const copia = [...lista];
  copia.splice(Math.min(indice, copia.length), 0, item);
  return copia;
};

// Indicadores mostrados ao lado do nome de cada aba da lateral.
function IndicadorAba({ info }) {
  if (!info) return null;
  return (
    <span className="aba-indicadores">
      {info.total > 0 && (
        <span className={`aba-selo${info.completo ? " completo" : ""}`}>
          {info.completo && <span aria-hidden="true">✓ </span>}
          {info.feitos}/{info.total}
          <span className="sr-only"> itens avaliados</span>
        </span>
      )}
      {info.pendente > 0 && (
        <span className="aba-selo pendente">
          {info.pendente}
          <span className="sr-only"> pendentes</span>
          <span aria-hidden="true">!</span>
        </span>
      )}
      {info.atencao > 0 && (
        <span className="aba-selo atencao">
          {info.atencao}
          <span className="sr-only"> pontos de atenção</span>
        </span>
      )}
    </span>
  );
}

export default function Operacao({ onIrParaAdministracao }) {
  const referencia = useReferencia();
  const { toast, confirmar } = useUi();
  const [operacao, setOperacao] = useState(() => normalizarOperacao(carregarOperacaoAtiva()));
  const [operacoesSalvas, setOperacoesSalvas] = useState(() => listarOperacoes());
  const [salvamento, setSalvamento] = useState({ estado: "inicial", em: null });
  const [abaAtiva, setAbaAtiva] = useState("proponente");
  const [copiado, setCopiado] = useState(false);
  const [copiadoDevolutiva, setCopiadoDevolutiva] = useState(false);
  const importarInputRef = useRef(null);
  const raizRef = useRef(null);
  const contextoRef = useRef(null);
  const conteudoRef = useRef(null);
  const primeiraAba = useRef(true);
  const operacaoAtualRef = useRef(operacao);
  operacaoAtualRef.current = operacao;

  // --- salvamento automatico ---------------------------------------------------------

  useEffect(() => {
    setSalvamento((atual) => (atual.estado === "salvando" ? atual : { ...atual, estado: "salvando" }));
    const temporizador = setTimeout(() => {
      const jaSalva = listarOperacoes().some((entrada) => entrada.id === operacao.id);
      const ok = salvarOperacao(operacao);
      const nadaASalvar = !jaSalva && operacaoEstaVazia(operacao);
      setSalvamento(nadaASalvar ? { estado: "inicial", em: null } : { estado: ok ? "salvo" : "erro", em: new Date() });
      setOperacoesSalvas(listarOperacoes());
    }, 400);
    return () => clearTimeout(temporizador);
  }, [operacao]);

  // Fechar/recarregar a aba (ou ir pra Administracao, que desmonta esta tela) dentro da janela de
  // 400 ms nao pode perder o ultimo trecho digitado.
  useEffect(() => {
    const salvarAoSair = () => salvarOperacao(operacaoAtualRef.current);
    window.addEventListener("pagehide", salvarAoSair);
    return () => {
      window.removeEventListener("pagehide", salvarAoSair);
      salvarAoSair();
    };
  }, []);

  useEffect(() => {
    document.title = operacao.proponente.nome ? `${operacao.proponente.nome} · RuralFlow` : "RuralFlow Checklist";
    return () => {
      document.title = "RuralFlow Checklist";
    };
  }, [operacao.proponente.nome]);

  // --- layout: a faixa de contexto e fixa, entao a lateral e o scroll precisam saber a altura ---

  useLayoutEffect(() => {
    const faixa = contextoRef.current;
    const raiz = raizRef.current;
    if (!faixa || !raiz || typeof ResizeObserver === "undefined") return undefined;
    const atualizar = () => raiz.style.setProperty("--contexto-altura", `${faixa.offsetHeight}px`);
    atualizar();
    const observador = new ResizeObserver(atualizar);
    observador.observe(faixa);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (primeiraAba.current) {
      primeiraAba.current = false;
      return;
    }
    const conteudo = conteudoRef.current;
    if (!conteudo) return;
    const alturaFaixa = contextoRef.current?.offsetHeight || 0;
    if (conteudo.getBoundingClientRect().top < alturaFaixa) conteudo.scrollIntoView({ block: "start" });
    conteudo.focus({ preventScroll: true });
  }, [abaAtiva]);

  // --- alteracoes simples --------------------------------------------------------------

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

  const mudarChecklistDocumental = (chave, novoEstado) => {
    setOperacao((op) => ({
      ...op,
      checklistDocumental: { ...op.checklistDocumental, [chave]: novoEstado },
    }));
  };

  // --- garantias (remocoes oferecem "Desfazer") ------------------------------------------

  const adicionarGarantia = (tipo) => {
    setOperacao((op) => ({ ...op, garantias: [...op.garantias, novaGarantia(tipo)] }));
  };

  const removerGarantia = (garantiaId) => {
    const indice = operacao.garantias.findIndex((g) => g.id === garantiaId);
    if (indice < 0) return;
    const removida = operacao.garantias[indice];
    setOperacao((op) => ({ ...op, garantias: op.garantias.filter((g) => g.id !== garantiaId) }));
    toast({
      mensagem: `Garantia "${rotuloTipoGarantia(removida.tipo)}" removida.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () =>
          setOperacao((op) =>
            op.garantias.some((g) => g.id === removida.id)
              ? op
              : { ...op, garantias: inserirEm(op.garantias, removida, indice) }
          ),
      },
    });
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
    const garantia = operacao.garantias.find((g) => g.id === garantiaId);
    const indice = garantia ? garantia.garantidores.findIndex((gd) => gd.id === garantidorId) : -1;
    if (indice < 0) return;
    const removido = garantia.garantidores[indice];
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        garantidores: g.garantidores.filter((gd) => gd.id !== garantidorId),
      }))
    );
    toast({
      mensagem: `Garantidor ${removido.nome ? `"${removido.nome}" ` : ""}removido.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () =>
          setOperacao((op) =>
            atualizarGarantia(op, garantiaId, (g) =>
              g.garantidores.some((gd) => gd.id === removido.id)
                ? g
                : { ...g, garantidores: inserirEm(g.garantidores, removido, indice) }
            )
          ),
      },
    });
  };

  // graus ja registrados na matricula (analise de matricula da garantia)
  const adicionarGrau = (garantiaId) => {
    setOperacao((op) => atualizarGarantia(op, garantiaId, (g) => ({ ...g, graus: [...(g.graus || []), novoGrau()] })));
  };

  const removerGrau = (garantiaId, grauId) => {
    const garantia = operacao.garantias.find((g) => g.id === garantiaId);
    const indice = garantia ? (garantia.graus || []).findIndex((gr) => gr.id === grauId) : -1;
    if (indice < 0) return;
    const removido = garantia.graus[indice];
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({ ...g, graus: g.graus.filter((gr) => gr.id !== grauId) }))
    );
    toast({
      mensagem: `Grau ${removido.grau || indice + 1} removido da análise da matrícula.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () =>
          setOperacao((op) =>
            atualizarGarantia(op, garantiaId, (g) =>
              (g.graus || []).some((gr) => gr.id === removido.id)
                ? g
                : { ...g, graus: inserirEm(g.graus || [], removido, indice) }
            )
          ),
      },
    });
  };

  const mudarCampoGrau = (garantiaId, grauId, campo, valor) => {
    setOperacao((op) =>
      atualizarGarantia(op, garantiaId, (g) => ({
        ...g,
        graus: (g.graus || []).map((gr) => (gr.id === grauId ? { ...gr, [campo]: valor } : gr)),
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

  // --- area beneficiada (idem) ---------------------------------------------------------

  const adicionarImovel = () => {
    setOperacao((op) => ({ ...op, areaBeneficiada: [...op.areaBeneficiada, novoImovel()] }));
  };

  const removerImovel = (imovelId) => {
    const indice = operacao.areaBeneficiada.findIndex((i) => i.id === imovelId);
    if (indice < 0) return;
    const removido = operacao.areaBeneficiada[indice];
    setOperacao((op) => ({ ...op, areaBeneficiada: op.areaBeneficiada.filter((i) => i.id !== imovelId) }));
    toast({
      mensagem: `Imóvel ${removido.nomeImovel ? `"${removido.nomeImovel}" ` : ""}removido.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () =>
          setOperacao((op) =>
            op.areaBeneficiada.some((i) => i.id === removido.id)
              ? op
              : { ...op, areaBeneficiada: inserirEm(op.areaBeneficiada, removido, indice) }
          ),
      },
    });
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
    const imovel = operacao.areaBeneficiada.find((i) => i.id === imovelId);
    const indice = imovel ? imovel.proprietarios.findIndex((p) => p.id === proprietarioId) : -1;
    if (indice < 0) return;
    const removido = imovel.proprietarios[indice];
    setOperacao((op) =>
      atualizarImovel(op, imovelId, (i) => ({
        ...i,
        proprietarios: i.proprietarios.filter((p) => p.id !== proprietarioId),
      }))
    );
    toast({
      mensagem: `Proprietário ${removido.nome ? `"${removido.nome}" ` : ""}removido.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () =>
          setOperacao((op) =>
            atualizarImovel(op, imovelId, (i) =>
              i.proprietarios.some((p) => p.id === removido.id)
                ? i
                : { ...i, proprietarios: inserirEm(i.proprietarios, removido, indice) }
            )
          ),
      },
    });
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

  // --- calculos derivados --------------------------------------------------------------

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

  const progresso = useMemo(
    () =>
      progressoGeral(
        operacao,
        referencia.checklist.proponente,
        referencia.checklist.documentos,
        referencia.checklist.garantias,
        referencia.checklist.areaBeneficiada
      ),
    [operacao, referencia.checklist]
  );

  // Regras do parecer (Administracao): cada uma avalia um dado da operacao e pode levar uma mensagem
  // ao Parecer, outra a Devolutiva e/ou marcar que a contratacao esta impedida.
  const resultadosRegras = useMemo(
    () => avaliarRegras(operacao, referencia.checklist.regras, { progresso }),
    [operacao, referencia.checklist.regras, progresso]
  );
  const textosRegrasParecer = useMemo(
    () => textosUnicos(resultadosRegras.filter((r) => r.estado === "acionada").map((r) => r.textoParecer)),
    [resultadosRegras]
  );
  const textosRegrasDevolutiva = useMemo(
    () => textosUnicos(resultadosRegras.filter((r) => r.estado === "acionada").map((r) => r.textoDevolutiva)),
    [resultadosRegras]
  );
  const chaveRegrasParecer = textosRegrasParecer.join("\u0001");
  const chaveRegrasDevolutiva = textosRegrasDevolutiva.join("\u0001");

  const revisao = useMemo(
    () => coletarRevisao(operacao, referencia.checklist, resultadosRegras),
    [operacao, referencia.checklist, resultadosRegras]
  );

  // Parecer editado a mao nao acompanha mais os dados; avisa e deixa inserir o que ficou de fora.
  const regrasFaltandoNoParecer = operacao.parecerEditadoManualmente
    ? textosRegrasParecer.filter((texto) => !String(operacao.parecerTexto || "").includes(texto))
    : [];

  const inserirRegrasNoParecer = () => {
    setOperacao((op) => {
      const faltando = textosRegrasParecer.filter((texto) => !String(op.parecerTexto || "").includes(texto));
      if (faltando.length === 0) return op;
      const jaTemTitulo = String(op.parecerTexto || "").includes("Alçadas e condicionantes:");
      const bloco = [...(jaTemTitulo ? [] : ["", "Alçadas e condicionantes:"]), ...faltando.map((texto) => `  - ${texto}`)];
      return { ...op, parecerTexto: `${String(op.parecerTexto || "").replace(/\s+$/, "")}\n${bloco.join("\n")}\n` };
    });
  };

  const indicadoresAbas = useMemo(() => {
    const doChecklist = (contagem, aba) => ({
      total: contagem.totalItens,
      feitos: contagem.preenchidos,
      completo: contagem.totalItens > 0 && contagem.naoAvaliados === 0,
      pendente: contagem.pendente,
      atencao: revisao.camposFaltando.filter((campo) => campo.aba === aba).length,
    });
    return {
      proponente: doChecklist(progresso.proponente, "proponente"),
      proposta: { total: 0, pendente: 0, atencao: revisao.camposFaltando.filter((c) => c.aba === "proposta").length },
      area_beneficiada: doChecklist(progresso.areaBeneficiada, "area_beneficiada"),
      garantias: doChecklist(progresso.garantias, "garantias"),
      checklist: doChecklist(progresso.documentos, "checklist"),
      revisao: { total: 0, pendente: 0, atencao: revisao.resumo.camposFaltando + revisao.resumo.avisos },
      devolutiva: { total: 0, pendente: progresso.pendente, atencao: 0 },
    };
  }, [progresso, revisao]);

  // --- parecer e devolutiva ------------------------------------------------------------

  const regerarParecer = () => {
    const texto = gerarParecerTexto(operacao, { beneficiario: capacidadeBeneficiario }, textosRegrasParecer);
    setOperacao((op) => ({ ...op, parecerTexto: texto, parecerEditadoManualmente: false }));
  };

  useEffect(() => {
    if (!operacao.parecerEditadoManualmente) {
      const texto = gerarParecerTexto(operacao, { beneficiario: capacidadeBeneficiario }, textosRegrasParecer);
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
    chaveRegrasParecer,
  ]);

  const copiarTexto = async (texto, definirCopiado, descricao) => {
    try {
      await navigator.clipboard.writeText(texto);
      definirCopiado(true);
      setTimeout(() => definirCopiado(false), 1800);
    } catch (erro) {
      console.error(`Nao foi possivel copiar ${descricao}.`, erro);
      toast({
        tipo: "erro",
        mensagem: `Não foi possível copiar automaticamente. Selecione o texto do ${descricao} e use Ctrl+C.`,
      });
    }
  };

  const exportarPdf = () => {
    gerarPdfOperacao(operacao, referencia.checklist, resultadosRegras);
  };

  const regerarDevolutiva = () => {
    const texto = gerarDevolutivaTexto(operacao, referencia.checklist, textosRegrasDevolutiva);
    setOperacao((op) => ({ ...op, devolutivaTextoFinal: texto, devolutivaEditadaManualmente: false }));
  };

  useEffect(() => {
    if (!operacao.devolutivaEditadaManualmente) {
      const texto = gerarDevolutivaTexto(operacao, referencia.checklist, textosRegrasDevolutiva);
      setOperacao((op) => (op.devolutivaTextoFinal === texto ? op : { ...op, devolutivaTextoFinal: texto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    operacao.proponente.checklist,
    operacao.checklistDocumental,
    operacao.garantias,
    operacao.areaBeneficiada,
    operacao.proposta.programa,
    operacao.proposta.linhaChecklist,
    referencia.checklist,
    chaveRegrasDevolutiva,
  ]);

  const exportarPdfDevolutiva = () => {
    gerarPdfDevolutiva(operacao, operacao.devolutivaTextoFinal);
  };

  // --- varias operacoes salvas ---------------------------------------------------------

  const guardarAtual = () => salvarOperacao(operacaoAtualRef.current);

  const trocarPara = (novaOperacao) => {
    setOperacao(novaOperacao);
    setAbaAtiva("proponente");
    setSalvamento({ estado: "inicial", em: null });
  };

  const abrirOutraOperacao = (id) => {
    guardarAtual();
    const dados = abrirOperacao(id);
    if (!dados) {
      toast({ tipo: "erro", mensagem: "Não foi possível abrir essa operação. Ela pode ter sido removida." });
      setOperacoesSalvas(listarOperacoes());
      return;
    }
    trocarPara(normalizarOperacao(dados));
  };

  const novaOperacao = () => {
    const anterior = operacaoAtualRef.current;
    const anteriorTinhaDados = !operacaoEstaVazia(anterior);
    guardarAtual();
    trocarPara(criarOperacaoVazia());
    setOperacoesSalvas(listarOperacoes());
    if (anteriorTinhaDados) {
      toast({
        mensagem: "Nova operação criada. A anterior continua salva em Operações.",
        acao: { rotulo: "Voltar para a anterior", onClick: () => abrirOutraOperacao(anterior.id) },
      });
    }
  };

  const excluirOperacaoSalva = async (entrada) => {
    const nome = entrada.nome || "Operação sem proponente";
    const resposta = await confirmar({
      titulo: "Excluir esta operação?",
      mensagem: `"${nome}" será removida deste navegador. Se precisar dela depois, exporte uma cópia (.json) antes.`,
      confirmarRotulo: "Excluir",
      secundariaRotulo: "Exportar e excluir",
      perigo: true,
    });
    if (resposta === "cancelar") return;

    const dados = entrada.id === operacao.id ? operacao : lerOperacaoSalva(entrada.id);
    if (resposta === "secundaria" && dados) exportarOperacao(dados);

    excluirOperacao(entrada.id);
    const restantes = listarOperacoes();
    setOperacoesSalvas(restantes);

    if (entrada.id === operacao.id) {
      const proxima = restantes[0] ? lerOperacaoSalva(restantes[0].id) : null;
      trocarPara(proxima ? normalizarOperacao(proxima) : criarOperacaoVazia());
      if (proxima) abrirOperacao(restantes[0].id);
    }

    toast({
      mensagem: `Operação "${nome}" excluída.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () => {
          if (!dados) return;
          salvarOperacao(dados);
          setOperacoesSalvas(listarOperacoes());
          abrirOutraOperacao(dados.id);
        },
      },
    });
  };

  const handleImportar = async (evento) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      const dados = await importarOperacao(arquivo);
      guardarAtual();
      // A importacao nunca sobrescreve: vira uma operacao nova (id novo), mesmo que o arquivo
      // tenha sido exportado desta mesma operacao.
      trocarPara(normalizarOperacao({ ...dados, id: novoIdOperacao() }));
      toast({
        tipo: "sucesso",
        mensagem: "Operação importada como uma nova operação. A anterior continua salva em Operações.",
      });
    } catch (erro) {
      toast({ tipo: "erro", mensagem: erro.message });
    } finally {
      evento.target.value = "";
    }
  };

  // --- listas filtradas pela fonte e modalidade escolhidas ---------------------------------

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
    <div className="operacao" ref={raizRef}>
      <header className="operacao-cabecalho nao-imprimir">
        <h1>Análise de operação</h1>
        <div className="operacao-cabecalho-acoes">
          <MenuSuspenso rotulo="Operações">
            {(fechar) => (
              <OperacoesRecentes
                operacoes={operacoesSalvas}
                atualId={operacao.id}
                onAbrir={abrirOutraOperacao}
                onExcluir={excluirOperacaoSalva}
                onNova={novaOperacao}
                fechar={fechar}
              />
            )}
          </MenuSuspenso>
          <MenuSuspenso rotulo="Arquivo">
            {(fechar) => (
              <>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    fechar();
                    exportarOperacao(operacao);
                  }}
                >
                  Exportar operação (.json)
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    fechar();
                    importarInputRef.current?.click();
                  }}
                >
                  Importar operação (.json)
                </button>
              </>
            )}
          </MenuSuspenso>
          <MenuSuspenso rotulo="Links úteis" alinhamento="direita">
            <LinksUteis links={referencia.linksUteis} />
          </MenuSuspenso>
          <button type="button" className="btn btn-primario" onClick={novaOperacao}>
            + Nova operação
          </button>
          <input
            ref={importarInputRef}
            type="file"
            accept="application/json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Importar operação (.json)"
            onChange={handleImportar}
          />
        </div>
      </header>

      <ContextoOperacao
        ref={contextoRef}
        operacao={operacao}
        progresso={progresso}
        salvamento={salvamento}
        dadosLocais={referencia.origem === "local"}
        impedimentos={revisao.regras.impedimentos.length}
        onIrParaAba={setAbaAtiva}
      />

      <div className="operacao-corpo">
        <nav className="operacao-sidebar nao-imprimir" aria-label="Etapas da análise">
          {ABAS.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              className={abaAtiva === aba.chave ? "ativa" : ""}
              aria-current={abaAtiva === aba.chave ? "page" : undefined}
              onClick={() => setAbaAtiva(aba.chave)}
            >
              <span className="aba-nome">{aba.rotulo}</span>
              <IndicadorAba info={indicadoresAbas[aba.chave]} />
            </button>
          ))}
        </nav>

        <main className="operacao-conteudo" id="conteudo-principal" ref={conteudoRef} tabIndex={-1}>
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
                adicionarGrau,
                removerGrau,
                mudarCampoGrau,
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
              onIrParaAdministracao={onIrParaAdministracao}
            />
          )}

          {abaAtiva === "revisao" && (
            <RevisaoPainel revisao={revisao} rotulosAbas={ROTULOS_ABAS} onIrParaAba={setAbaAtiva} />
          )}

          {abaAtiva === "parecer" && (
            <TextoGeradoPainel
              titulo="Parecer"
              descricao="Texto gerado a partir dos dados preenchidos. Pode ser editado livremente antes de encaminhar. O PDF exportado traz o relatório completo da operação: resumo, checklists e este parecer."
              texto={operacao.parecerTexto}
              editadoManualmente={operacao.parecerEditadoManualmente}
              onMudarTexto={(texto) =>
                setOperacao((op) => ({ ...op, parecerTexto: texto, parecerEditadoManualmente: true }))
              }
              onRegerar={regerarParecer}
              onCopiar={() => copiarTexto(operacao.parecerTexto, setCopiado, "parecer")}
              onExportarPdf={exportarPdf}
              rotuloPdf="Exportar relatório (PDF)"
              copiado={copiado}
              regrasFaltando={regrasFaltandoNoParecer.length}
              onInserirRegras={inserirRegrasNoParecer}
            />
          )}

          {abaAtiva === "devolutiva" && (
            <TextoGeradoPainel
              titulo="Devolutiva"
              descricao="Consolida o texto de devolutiva de todos os itens marcados como Pendente (e com texto de devolutiva preenchido) nos checklists."
              texto={operacao.devolutivaTextoFinal}
              editadoManualmente={operacao.devolutivaEditadaManualmente}
              onMudarTexto={(texto) =>
                setOperacao((op) => ({ ...op, devolutivaTextoFinal: texto, devolutivaEditadaManualmente: true }))
              }
              onRegerar={regerarDevolutiva}
              onCopiar={() => copiarTexto(operacao.devolutivaTextoFinal, setCopiadoDevolutiva, "devolutiva")}
              onExportarPdf={exportarPdfDevolutiva}
              rotuloPdf="Exportar devolutiva (PDF)"
              copiado={copiadoDevolutiva}
            />
          )}

          <NavegacaoAbas abas={ABAS} abaAtiva={abaAtiva} onIr={setAbaAtiva} />
        </main>
      </div>
    </div>
  );
}
