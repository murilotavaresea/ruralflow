import { useUi } from "./UiFeedback";
import { contarTrechosAPreencher } from "../utils/revisao";
import "./TextoGeradoPainel.css";

// Painel generico de "texto gerado, editavel, copiavel e exportavel" — usado tanto pelo
// Parecer quanto pela Devolutiva (mesma interacao, conteudo diferente).
//
// O texto acompanha os dados da operacao enquanto ninguem mexe nele; a primeira edicao manual
// "trava" o texto (`editadoManualmente`). O painel deixa isso explicito e pede confirmacao
// antes de "Gerar novamente" jogar fora as edicoes.
export default function TextoGeradoPainel({
  titulo,
  descricao,
  texto,
  editadoManualmente,
  onMudarTexto,
  onRegerar,
  onCopiar,
  onExportarPdf,
  rotuloPdf = "Exportar PDF",
  copiado,
}) {
  const { confirmar } = useUi();
  const trechos = contarTrechosAPreencher(texto);

  const regerar = async () => {
    if (editadoManualmente) {
      const resposta = await confirmar({
        titulo: "Descartar suas edições?",
        mensagem: `O ${titulo.toLowerCase()} foi editado manualmente. Gerar novamente substitui o texto atual pelo texto automático e as suas alterações serão perdidas.`,
        confirmarRotulo: "Descartar e gerar novamente",
        perigo: true,
      });
      if (resposta !== "confirmar") return;
    }
    onRegerar();
  };

  const exportar = async () => {
    if (trechos > 0) {
      const resposta = await confirmar({
        titulo: "Ainda há trechos para preencher",
        mensagem: `O texto tem ${trechos} trecho${trechos > 1 ? "s" : ""} entre [colchetes] que ainda não ${trechos > 1 ? "foram preenchidos" : "foi preenchido"}. Deseja exportar mesmo assim?`,
        confirmarRotulo: "Exportar mesmo assim",
        cancelarRotulo: "Voltar e revisar",
      });
      if (resposta !== "confirmar") return;
    }
    onExportarPdf();
  };

  return (
    <div className="cartao">
      <h2>{titulo}</h2>
      <p className="cartao-descricao">{descricao}</p>

      <div className="texto-gerado-estado">
        {editadoManualmente ? (
          <span className="texto-gerado-selo editado">
            Editado manualmente — não acompanha mais os dados da operação
          </span>
        ) : (
          <span className="texto-gerado-selo automatico">Atualiza sozinho conforme você preenche a operação</span>
        )}
        {trechos > 0 && (
          <span className="texto-gerado-selo aviso">
            {trechos} trecho{trechos > 1 ? "s" : ""} entre [colchetes] para preencher
          </span>
        )}
      </div>

      <textarea
        className="texto-gerado-area"
        value={texto}
        onChange={(e) => onMudarTexto(e.target.value)}
        rows={16}
        aria-label={titulo}
      />

      <div className="texto-gerado-acoes">
        <button type="button" onClick={regerar} className="btn">
          {editadoManualmente ? "Descartar edições e gerar novamente" : "Gerar novamente"}
        </button>
        <button type="button" onClick={onCopiar} className="btn" aria-live="polite">
          {copiado ? "✓ Copiado!" : "Copiar texto"}
        </button>
        <button type="button" onClick={exportar} className="btn btn-primario">
          {rotuloPdf}
        </button>
      </div>
    </div>
  );
}
