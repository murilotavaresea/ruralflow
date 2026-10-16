import { useState } from "react";
import { aplicarTema, lerTema, proximoTema, salvarTema } from "../utils/tema";

const ROTULOS = {
  auto: { icone: "◐", texto: "Auto", descricao: "automático (segue o sistema)" },
  claro: { icone: "☀", texto: "Claro", descricao: "claro" },
  escuro: { icone: "☾", texto: "Escuro", descricao: "escuro" },
};

export default function TemaToggle() {
  const [tema, setTema] = useState(lerTema);
  const atual = ROTULOS[tema];

  const alternar = () => {
    const proximo = proximoTema(tema);
    aplicarTema(proximo);
    salvarTema(proximo);
    setTema(proximo);
  };

  return (
    <button
      type="button"
      className="btn btn-fantasma btn-pequeno tema-toggle"
      onClick={alternar}
      title={`Tema ${atual.descricao}. Clique para alternar.`}
      aria-label={`Tema ${atual.descricao}. Clique para alternar.`}
    >
      <span aria-hidden="true">{atual.icone}</span>
      <span className="tema-toggle-texto" aria-hidden="true">
        {atual.texto}
      </span>
    </button>
  );
}
