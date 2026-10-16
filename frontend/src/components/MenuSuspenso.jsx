import { useEffect, useRef, useState } from "react";

// Botao que abre um painel flutuante. Fecha com Esc, clique fora ou chamando `fechar()`
// (os filhos podem ser uma funcao que recebe `fechar`, pra itens que devem fechar o menu).
export default function MenuSuspenso({ rotulo, alinhamento = "esquerda", classe = "", children }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoClicarFora = (evento) => {
      if (raizRef.current && !raizRef.current.contains(evento.target)) setAberto(false);
    };
    const aoTeclar = (evento) => {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div className="menu-suspenso" ref={raizRef}>
      <button
        type="button"
        ref={botaoRef}
        className={`btn ${classe}`.trim()}
        aria-expanded={aberto}
        aria-haspopup="true"
        onClick={() => setAberto((valor) => !valor)}
      >
        {rotulo}
        <span aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div className="menu-suspenso-painel" data-alinhamento={alinhamento}>
          {typeof children === "function" ? children(fechar) : children}
        </div>
      )}
    </div>
  );
}
