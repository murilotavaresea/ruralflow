import "./BarraProgresso.css";

// Barra de progresso segmentada. Cada segmento tem uma textura propria (liso, claro, listrado)
// alem da cor, pra distinguir OK / N.A. / Pendente tambem sem depender de cor.
// `segmentos`: [{ chave: "ok"|"na"|"pendente", quantidade, rotulo }]; `total`: soma de tudo,
// inclusive o que ainda nao foi avaliado (que aparece como a parte vazia da trilha).
export default function BarraProgresso({ segmentos, total, rotulo, mostrarRotulo = true, altura = "normal" }) {
  const avaliados = segmentos.reduce((soma, segmento) => soma + segmento.quantidade, 0);
  const percentual = total > 0 ? Math.round((avaliados / total) * 100) : 0;
  const textoValor = `${percentual}% avaliado. ${segmentos
    .map((segmento) => `${segmento.quantidade} ${segmento.rotulo}`)
    .join(", ")}.`;

  return (
    <div className="barra-progresso">
      {mostrarRotulo && (
        <div className="barra-progresso-rotulo">
          <span>{rotulo}</span>
          <span>{percentual}%</span>
        </div>
      )}
      <div
        className={`barra-progresso-trilha ${altura === "fina" ? "fina" : ""}`}
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        aria-valuetext={textoValor}
      >
        {segmentos.map((segmento) =>
          segmento.quantidade > 0 && total > 0 ? (
            <div
              key={segmento.chave}
              className={`barra-progresso-segmento ${segmento.chave}`}
              style={{ width: `${(segmento.quantidade / total) * 100}%` }}
              title={`${segmento.quantidade} ${segmento.rotulo}`}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
