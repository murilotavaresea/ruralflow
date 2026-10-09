import "./BarraProgresso.css";

export default function BarraProgresso({ percentual, rotulo }) {
  return (
    <div className="barra-progresso">
      {rotulo && (
        <div className="barra-progresso-rotulo">
          <span>{rotulo}</span>
          <span>{percentual}%</span>
        </div>
      )}
      <div className="barra-progresso-trilha">
        <div className="barra-progresso-preenchimento" style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}
