import "./NavegacaoAbas.css";

// "Anterior / Proximo" no fim de cada aba: quem preenche a operacao de cima pra baixo nao
// precisa voltar a lateral a cada etapa.
export default function NavegacaoAbas({ abas, abaAtiva, onIr }) {
  const indice = abas.findIndex((aba) => aba.chave === abaAtiva);
  const anterior = indice > 0 ? abas[indice - 1] : null;
  const proxima = indice >= 0 && indice < abas.length - 1 ? abas[indice + 1] : null;

  return (
    <nav className="navegacao-abas" aria-label="Navegar entre as etapas">
      {anterior ? (
        <button type="button" className="btn" onClick={() => onIr(anterior.chave)}>
          ← {anterior.rotulo}
        </button>
      ) : (
        <span />
      )}
      {proxima && (
        <button type="button" className="btn btn-primario" onClick={() => onIr(proxima.chave)}>
          {proxima.rotulo} →
        </button>
      )}
    </nav>
  );
}
