import "./LinksUteis.css";

// Atalhos institucionais usados durante a analise (certidoes, consultas, simuladores). Os que
// ainda nao tem endereco cadastrado ficam recolhidos para nao poluir a lista.
export default function LinksUteis({ links }) {
  const comLink = links.filter((link) => link.url);
  const semLink = links.filter((link) => !link.url);

  return (
    <div className="links-uteis">
      {comLink.length > 0 ? (
        <ul className="links-uteis-lista">
          {comLink.map((link) => (
            <li key={link.nome}>
              <a href={link.url} target="_blank" rel="noreferrer" className="menu-item">
                <span>{link.nome}</span>
                <span aria-hidden="true">↗</span>
                <span className="sr-only">(abre em uma nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="links-uteis-vazio">Nenhum link com endereço cadastrado ainda.</p>
      )}

      {semLink.length > 0 && (
        <details className="links-uteis-sem-endereco">
          <summary>Sem endereço cadastrado ({semLink.length})</summary>
          <ul>
            {semLink.map((link) => (
              <li key={link.nome}>{link.nome}</li>
            ))}
          </ul>
          <p>Peça a quem administra o sistema para cadastrar os endereços destes atalhos.</p>
        </details>
      )}
    </div>
  );
}
