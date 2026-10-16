import "./Campos.css";

// Tela/lista sem conteudo ainda: explica o que vai aparecer ali e oferece a acao que resolve.
export default function EstadoVazio({ icone = "+", titulo, descricao, children }) {
  return (
    <div className="estado-vazio">
      <div className="estado-vazio-icone" aria-hidden="true">
        {icone}
      </div>
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {children && <div className="estado-vazio-acoes">{children}</div>}
    </div>
  );
}
