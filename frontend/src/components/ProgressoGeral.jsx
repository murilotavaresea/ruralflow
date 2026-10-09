import BarraProgresso from "./BarraProgresso";
import "./ProgressoGeral.css";

export default function ProgressoGeral({ progresso }) {
  return (
    <div className="progresso-geral">
      <BarraProgresso percentual={progresso.percentual} rotulo="Progresso geral da operacao" />
      <div className="progresso-geral-detalhes">
        <span>
          Compliance do proponente: {progresso.proponente.preenchidos}/{progresso.proponente.totalItens}
        </span>
        <span>
          Demais documentos: {progresso.documentos.preenchidos}/{progresso.documentos.totalItens}
        </span>
        <span>
          Área beneficiada: {progresso.areaBeneficiada.preenchidos}/{progresso.areaBeneficiada.totalItens}
        </span>
        <span>
          Garantias: {progresso.garantias.preenchidos}/{progresso.garantias.totalItens}
        </span>
      </div>
    </div>
  );
}
