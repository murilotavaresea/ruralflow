import "./LinksUteis.css";

export default function LinksUteis({ links }) {
  return (
    <div className="cartao links-uteis">
      <h2>Links uteis</h2>
      <p className="cartao-descricao">Atalhos institucionais usados durante a analise.</p>
      <div className="links-uteis-grade">
        {links.map((link) =>
          link.url ? (
            <a
              key={link.nome}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="links-uteis-item"
            >
              {link.nome}
            </a>
          ) : (
            <span key={link.nome} className="links-uteis-item links-uteis-item-sem-link">
              {link.nome}
            </span>
          )
        )}
      </div>
    </div>
  );
}
