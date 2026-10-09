import { useEffect, useRef, useState } from "react";
import AreaBeneficiadaCard from "./AreaBeneficiadaCard";
import "./AreaBeneficiadaPainel.css";

export default function AreaBeneficiadaPainel({ imoveis, checklistAreaBeneficiadaDef, acoes }) {
  // So um imovel fica visivel por vez (abas em vez de empilhar todos pra baixo, que poluia
  // muito a tela com varios imoveis cadastrados). O estado da selecao mora aqui, nao em
  // Operacao.jsx, porque e so uma preferencia de visualizacao — nao faz parte dos dados da
  // operacao.
  const [imovelAtivoId, setImovelAtivoId] = useState(imoveis[0]?.id ?? null);
  const quantidadeAnterior = useRef(imoveis.length);

  useEffect(() => {
    const cresceu = imoveis.length > quantidadeAnterior.current;
    quantidadeAnterior.current = imoveis.length;

    if (cresceu) {
      // Imovel novo: pula automaticamente pra ele, ja que e o unico jeito de "ver" o que
      // acabou de ser criado agora que so um fica visivel por vez.
      setImovelAtivoId(imoveis[imoveis.length - 1].id);
      return;
    }

    if (imoveis.length === 0) {
      setImovelAtivoId(null);
    } else if (!imoveis.some((imovel) => imovel.id === imovelAtivoId)) {
      // Rede de seguranca pra qualquer outro jeito do id ativo sumir da lista (ex: importar
      // uma operacao com outros imoveis) — volta pro primeiro.
      setImovelAtivoId(imoveis[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imoveis]);

  const removerImovel = (imovelId) => {
    if (imovelId === imovelAtivoId) {
      const indiceRemovido = imoveis.findIndex((imovel) => imovel.id === imovelId);
      const restantes = imoveis.filter((imovel) => imovel.id !== imovelId);
      const proximo = restantes[Math.min(indiceRemovido, restantes.length - 1)];
      setImovelAtivoId(proximo ? proximo.id : null);
    }
    acoes.remover(imovelId);
  };

  const imovelAtivo = imoveis.find((imovel) => imovel.id === imovelAtivoId) || null;

  return (
    <div className="area-beneficiada-painel">
      <div className="cartao">
        <h2>Área beneficiada</h2>
        <p className="cartao-descricao">
          Cadastre um ou mais imóveis beneficiados pela operação. Cada imóvel tem seu próprio
          checklist de documentos e um checklist por proprietário.
        </p>

        <button type="button" className="area-beneficiada-adicionar" onClick={acoes.adicionar}>
          + Adicionar imóvel
        </button>
      </div>

      {imoveis.length === 0 && <p className="cartao-descricao">Nenhum imóvel cadastrado ainda.</p>}

      {imoveis.length > 0 && (
        <nav className="area-beneficiada-abas">
          {imoveis.map((imovel, indice) => (
            <button
              key={imovel.id}
              type="button"
              className={imovel.id === imovelAtivoId ? "ativa" : ""}
              onClick={() => setImovelAtivoId(imovel.id)}
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
