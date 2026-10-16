import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import "./UiFeedback.css";

// Avisos (toasts) com acao opcional — usados principalmente pra "Desfazer" — e dialogo de
// confirmacao, no lugar de alert()/confirm() nativos. Qualquer componente abaixo do
// <UiProvider> usa useUi() pra chamar toast({...}) ou await confirmar({...}).

const UiContexto = createContext(null);

export function useUi() {
  const contexto = useContext(UiContexto);
  if (!contexto) throw new Error("useUi precisa estar dentro de <UiProvider>.");
  return contexto;
}

const FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Janela modal: prende o foco dentro dela, fecha com Esc ou clicando no fundo e devolve o
// foco pra quem a abriu.
export function Modal({ titulo, onFechar, children, rodape, largura = "media" }) {
  const idTitulo = useId();
  const painelRef = useRef(null);

  useEffect(() => {
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const painel = painelRef.current;
    const alvo = painel?.querySelector("[data-foco-inicial]") || painel?.querySelector(FOCAVEIS) || painel;
    alvo?.focus();

    return () => {
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior && typeof focoAnterior.focus === "function") focoAnterior.focus();
    };
  }, []);

  const aoTeclar = (evento) => {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      onFechar();
      return;
    }
    if (evento.key !== "Tab") return;
    const focaveis = Array.from(painelRef.current.querySelectorAll(FOCAVEIS));
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  return (
    <div
      className="modal-fundo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div
        className={`modal modal-${largura}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        ref={painelRef}
        onKeyDown={aoTeclar}
      >
        <header className="modal-cabecalho">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="btn btn-fantasma btn-pequeno" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="modal-corpo">{children}</div>
        {rodape && <footer className="modal-rodape">{rodape}</footer>}
      </div>
    </div>
  );
}

function DialogoConfirmacao({ dialogo, onResponder }) {
  const {
    titulo,
    mensagem,
    confirmarRotulo = "Confirmar",
    cancelarRotulo = "Cancelar",
    secundariaRotulo,
    perigo = false,
  } = dialogo;

  return (
    <Modal
      titulo={titulo}
      largura="pequena"
      onFechar={() => onResponder("cancelar")}
      rodape={
        <>
          <button type="button" className="btn" data-foco-inicial onClick={() => onResponder("cancelar")}>
            {cancelarRotulo}
          </button>
          {secundariaRotulo && (
            <button type="button" className="btn" onClick={() => onResponder("secundaria")}>
              {secundariaRotulo}
            </button>
          )}
          <button
            type="button"
            className={`btn ${perigo ? "btn-perigo-solido" : "btn-primario"}`}
            onClick={() => onResponder("confirmar")}
          >
            {confirmarRotulo}
          </button>
        </>
      }
    >
      <p className="modal-mensagem">{mensagem}</p>
    </Modal>
  );
}

export function UiProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [dialogo, setDialogo] = useState(null);
  const proximoId = useRef(1);
  const temporizadores = useRef(new Map());

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => mapa.forEach((temporizador) => clearTimeout(temporizador));
  }, []);

  const descartar = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
    setAvisos((lista) => lista.filter((aviso) => aviso.id !== id));
  }, []);

  // tipo: "info" | "sucesso" | "erro". Com `acao` ({ rotulo, onClick }) o aviso dura mais, pra
  // dar tempo de clicar em "Desfazer".
  const toast = useCallback(
    ({ mensagem, tipo = "info", acao, duracao }) => {
      const id = proximoId.current;
      proximoId.current += 1;
      const milissegundos = duracao ?? (acao ? 9000 : tipo === "erro" ? 8000 : 4000);
      setAvisos((lista) => [...lista.slice(-3), { id, mensagem, tipo, acao }]);
      temporizadores.current.set(
        id,
        setTimeout(() => descartar(id), milissegundos)
      );
      return id;
    },
    [descartar]
  );

  // Resolve com "confirmar", "secundaria" (botao extra opcional) ou "cancelar".
  const confirmar = useCallback(
    (opcoes) => new Promise((resolver) => setDialogo({ ...opcoes, resolver })),
    []
  );

  const responder = (resposta) => {
    dialogo.resolver(resposta);
    setDialogo(null);
  };

  const valor = useMemo(() => ({ toast, descartarAviso: descartar, confirmar }), [toast, descartar, confirmar]);

  return (
    <UiContexto.Provider value={valor}>
      {children}

      <div className="toasts nao-imprimir" aria-live="polite" aria-relevant="additions">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`toast toast-${aviso.tipo}`}
            role={aviso.tipo === "erro" ? "alert" : "status"}
          >
            <span className="toast-mensagem">{aviso.mensagem}</span>
            {aviso.acao && (
              <button
                type="button"
                className="toast-acao"
                onClick={() => {
                  aviso.acao.onClick();
                  descartar(aviso.id);
                }}
              >
                {aviso.acao.rotulo}
              </button>
            )}
            <button type="button" className="toast-fechar" onClick={() => descartar(aviso.id)} aria-label="Fechar aviso">
              ✕
            </button>
          </div>
        ))}
      </div>

      {dialogo && <DialogoConfirmacao dialogo={dialogo} onResponder={responder} />}
    </UiContexto.Provider>
  );
}
