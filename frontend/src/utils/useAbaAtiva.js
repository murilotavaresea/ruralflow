import { useEffect, useRef, useState } from "react";

// Painéis de Garantias e Área beneficiada mostram um cartão por vez (abas). Este hook guarda
// qual está aberto e cuida dos casos chatos:
// - item novo (inclusive um "Desfazer" que traz um item removido de volta) abre na hora, pois
//   é o único jeito de ver o que acabou de aparecer;
// - se o aberto some da lista, cai no primeiro;
// - ao remover o aberto, `selecionarVizinho` escolhe o item que ocupava o lugar dele.
// A seleção é só preferência de visualização — não faz parte dos dados da operação.
export default function useAbaAtiva(itens) {
  const [ativoId, setAtivoId] = useState(itens[0]?.id ?? null);
  const idsAnteriores = useRef(new Set(itens.map((item) => item.id)));

  useEffect(() => {
    const atuais = new Set(itens.map((item) => item.id));
    const novo = itens.find((item) => !idsAnteriores.current.has(item.id));
    idsAnteriores.current = atuais;

    if (novo) {
      setAtivoId(novo.id);
    } else if (itens.length === 0) {
      setAtivoId(null);
    } else {
      setAtivoId((atual) => (atuais.has(atual) ? atual : itens[0].id));
    }
  }, [itens]);

  const selecionarVizinho = (removidoId) => {
    if (removidoId !== ativoId) return;
    const indice = itens.findIndex((item) => item.id === removidoId);
    const restantes = itens.filter((item) => item.id !== removidoId);
    const proximo = restantes[Math.min(indice, restantes.length - 1)];
    setAtivoId(proximo ? proximo.id : null);
  };

  return { ativoId, setAtivoId, selecionarVizinho };
}
