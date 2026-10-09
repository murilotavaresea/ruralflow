import "./TextoGeradoPainel.css";

// Painel generico de "texto gerado, editavel, copiavel e exportavel" — usado tanto pelo
// Parecer quanto pela Devolutiva (mesma interacao, conteudo diferente).
export default function TextoGeradoPainel({
  titulo,
  descricao,
  texto,
  onMudarTexto,
  onRegerar,
  onCopiar,
  onExportarPdf,
  copiado,
}) {
  return (
    <div className="cartao">
      <h2>{titulo}</h2>
      <p className="cartao-descricao">{descricao}</p>

      <textarea
        className="texto-gerado-area"
        value={texto}
        onChange={(e) => onMudarTexto(e.target.value)}
        rows={14}
      />

      <div className="texto-gerado-acoes">
        <button type="button" onClick={onRegerar} className="texto-gerado-botao-secundario">
          Gerar novamente
        </button>
        <button type="button" onClick={onCopiar} className="texto-gerado-botao-secundario">
          {copiado ? "Copiado!" : "Copiar texto"}
        </button>
        <button type="button" onClick={onExportarPdf} className="texto-gerado-botao-primario">
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
