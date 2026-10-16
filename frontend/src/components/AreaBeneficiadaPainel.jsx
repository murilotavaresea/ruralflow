import AreaBeneficiadaCard from "./AreaBeneficiadaCard";
import EstadoVazio from "./EstadoVazio";
import useAbaAtiva from "../utils/useAbaAtiva";
import "./GarantiasPainel.css";
import "./AreaBeneficiadaPainel.css";

export default function AreaBeneficiadaPainel({ imoveis, checklistAreaBeneficiadaDef, acoes }) {
  const { ativoId, setAtivoId, selecionarVizinho } = useAbaAtiva(imoveis);

  const removerImovel = (imovelId) => {
    selecionarVizinho(imovelId);
    acoes.remover(imovelId);
  };

  const imovelAtivo = imoveis.find((imovel) => imovel.id === ativoId) || null;

  return (
    <div className="area-beneficiada-painel">
      <div className="cartao">
        <h2>Área beneficiada</h2>
        <p className="cartao-descricao">
          Cadastre um ou mais imóveis beneficiados pela operação. Cada imóvel tem seu próprio checklist de
          documentos e um checklist por proprietário.
        </p>

        <button type="button" className="btn btn-primario" onClick={acoes.adicionar}>
          + Adicionar imóvel
        </button>
      </div>

      {imoveis.length === 0 && (
        <EstadoVazio
          icone="⌂"
          titulo="Nenhum imóvel cadastrado"
          descricao="Adicione o imóvel beneficiado para preencher matrícula, áreas e o checklist de documentos de cada proprietário."
        >
          <button type="button" className="btn" onClick={acoes.adicionar}>
            + Adicionar o primeiro imóvel
          </button>
        </EstadoVazio>
      )}

      {imoveis.length > 0 && (
        <nav className="area-beneficiada-abas" aria-label="Imóveis da operação">
          {imoveis.map((imovel, indice) => (
            <button
              key={imovel.id}
              type="button"
              className={imovel.id === ativoId ? "ativa" : ""}
              aria-current={imovel.id === ativoId ? "true" : undefined}
              onClick={() => setAtivoId(imovel.id)}
            >
              {imovel.nomeImovel || `Imóvel ${indice + 1}`}
            </button>
          ))}
        </nav>
      )}

      {imovelAtivo && (
        <AreaBeneficiadaCard
          imovel={imovelAtivo}
          checklistDef={checklistAreaBeneficiadaDef}
          onMudarCampo={(campo, valor) => acoes.mudarCampo(imovelAtivo.id, campo, valor)}
          onMudarChecklistImovel={(chave, estado) => acoes.mudarChecklistImovel(imovelAtivo.id, chave, estado)}
          onAdicionarProprietario={() => acoes.adicionarProprietario(imovelAtivo.id)}
          onRemoverProprietario={(proprietarioId) => acoes.removerProprietario(imovelAtivo.id, proprietarioId)}
          onMudarCampoProprietario={(proprietarioId, campo, valor) =>
            acoes.mudarCampoProprietario(imovelAtivo.id, proprietarioId, campo, valor)
          }
          onMudarChecklistProprietario={(proprietarioId, chave, estado) =>
            acoes.mudarChecklistProprietario(imovelAtivo.id, proprietarioId, chave, estado)
          }
          onRemover={() => removerImovel(imovelAtivo.id)}
        />
      )}
    </div>
  );
}
