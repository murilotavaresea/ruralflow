import { useState } from "react";
import { extrairCampos } from "../utils/gerarTextoTemplate";

const ITEM_VAZIO = {
  nome: "",
  tipo: "checklist",
  ajuda: "",
  template: "",
  textoDevolutivaPadrao: "",
  linhas: "todas",
  fontes: "todas",
};

// `fontesDisponiveis`: lista de fontes de recurso ({chave, rotulo}) — so informado pra
// Proponente, Documentos e Area Beneficiada (Garantias nao varia por fonte/linha, so por tipo).
// `linhasPorFonte`: dicionario { fonteChave: [{id, nome}] } com as linhas de cada fonte.
export default function AdminItemForm({
  valorInicial,
  fontesDisponiveis = [],
  linhasPorFonte = {},
  onSalvar,
  onCancelar,
  textoBotao = "Salvar",
}) {
  const [item, setItem] = useState(valorInicial || ITEM_VAZIO);
  const campos = item.tipo === "texto" ? extrairCampos(item.template) : [];
  const comumATodasFontes = item.fontes === "todas" || item.fontes === undefined;
  const comumATodasLinhas = item.linhas === "todas" || item.linhas === undefined;

  const mudar = (campo, valor) => setItem((atual) => ({ ...atual, [campo]: valor }));

  const alternarComumATodasFontes = (marcado) => {
    mudar("fontes", marcado ? "todas" : []);
  };

  const alternarFonte = (fonteChave) => {
    const atuais = Array.isArray(item.fontes) ? item.fontes : [];
    const novas = atuais.includes(fonteChave) ? atuais.filter((f) => f !== fonteChave) : [...atuais, fonteChave];
    mudar("fontes", novas);
  };

  const alternarComumATodasLinhas = (marcado) => {
    mudar("linhas", marcado ? "todas" : []);
  };

  const alternarLinha = (linhaId) => {
    const atuais = Array.isArray(item.linhas) ? item.linhas : [];
    const novas = atuais.includes(linhaId) ? atuais.filter((id) => id !== linhaId) : [...atuais, linhaId];
    mudar("linhas", novas);
  };

  const salvar = (e) => {
    e.preventDefault();
    if (!item.nome.trim()) return;
    onSalvar(item);
  };

  // As linhas disponiveis pra marcar dependem das fontes marcadas: se o item e comum a
  // todas as fontes, mostra as linhas de todas; senao, so as linhas das fontes marcadas.
  const fontesParaLinhas = comumATodasFontes
    ? fontesDisponiveis.map((f) => f.chave)
    : Array.isArray(item.fontes)
      ? item.fontes
      : [];
  const gruposDeLinha = fontesDisponiveis
    .filter((f) => fontesParaLinhas.includes(f.chave))
    .map((f) => ({ fonte: f, linhas: linhasPorFonte[f.chave] || [] }))
    .filter((g) => g.linhas.length > 0);

  return (
    <form className="admin-item-form" onSubmit={salvar}>
      <div className="grade-campos">
        <label className="campo">
          <span>Nome do item</span>
          <input type="text" value={item.nome} onChange={(e) => mudar("nome", e.target.value)} autoFocus />
        </label>
        <label className="campo">
          <span>Tipo</span>
          <select value={item.tipo} onChange={(e) => mudar("tipo", e.target.value)}>
            <option value="checklist">Checklist (OK / N.A. / Pendente)</option>
            <option value="texto">Gera texto (modelo com campos)</option>
          </select>
        </label>
      </div>

      <label className="campo">
        <span>Texto de ajuda (opcional)</span>
        <textarea rows={2} value={item.ajuda} onChange={(e) => mudar("ajuda", e.target.value)} />
      </label>

      {item.tipo === "texto" && (
        <label className="campo">
          <span>Modelo de texto — use {"{campo}"} para marcar um espaco preenchivel</span>
          <textarea
            rows={3}
            value={item.template}
            onChange={(e) => mudar("template", e.target.value)}
            placeholder="Ex: Hipoteca de {grau} grau sobre o imovel matricula {matricula}, no municipio de {municipio}."
          />
          <span className="admin-item-form-campos-detectados">
            {campos.length > 0 ? `Campos detectados: ${campos.join(", ")}` : "Nenhum campo {assim} detectado ainda."}
          </span>
        </label>
      )}

      {fontesDisponiveis.length > 0 && (
        <div className="admin-item-form-linhas">
          <span className="admin-item-form-linhas-titulo">Quais fontes de recurso usam este item?</span>

          <label className={`admin-item-form-linha-opcao admin-item-form-linha-especial${comumATodasFontes ? " marcada" : ""}`}>
            <input type="checkbox" checked={comumATodasFontes} onChange={(e) => alternarComumATodasFontes(e.target.checked)} />
            <span>
              Comum a todas as fontes
              <small>inclusive fontes criadas depois — não precisa marcar de novo</small>
            </span>
          </label>

          {!comumATodasFontes && (
            <ul className="admin-item-form-linha-lista">
              {fontesDisponiveis.map((fonte) => {
                const marcada = Array.isArray(item.fontes) && item.fontes.includes(fonte.chave);
                return (
                  <li key={fonte.chave}>
                    <label className={`admin-item-form-linha-opcao${marcada ? " marcada" : ""}`}>
                      <input type="checkbox" checked={marcada} onChange={() => alternarFonte(fonte.chave)} />
                      <span>{fonte.rotulo}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {gruposDeLinha.length > 0 && (
            <>
              <span className="admin-item-form-linhas-titulo">
                Quais linhas destas fontes usam este item?
              </span>

              <label className={`admin-item-form-linha-opcao admin-item-form-linha-especial${comumATodasLinhas ? " marcada" : ""}`}>
                <input type="checkbox" checked={comumATodasLinhas} onChange={(e) => alternarComumATodasLinhas(e.target.checked)} />
                <span>
                  Comum a todas as linhas
                  <small>inclusive linhas criadas depois — não precisa marcar de novo</small>
                </span>
              </label>

              {!comumATodasLinhas && (
                <ul className="admin-item-form-linha-lista">
                  {gruposDeLinha.map(({ fonte, linhas }) => (
                    <li key={fonte.chave} className="admin-item-form-linha-grupo">
                      <span className="admin-item-form-linha-grupo-titulo">{fonte.rotulo}</span>
                      <ul className="admin-item-form-linha-lista">
                        {linhas.map((linha) => {
                          const marcada = Array.isArray(item.linhas) && item.linhas.includes(linha.id);
                          return (
                            <li key={linha.id}>
                              <label className={`admin-item-form-linha-opcao${marcada ? " marcada" : ""}`}>
                                <input type="checkbox" checked={marcada} onChange={() => alternarLinha(linha.id)} />
                                <span>{linha.nome}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <label className="campo">
        <span>Texto padrao de devolutiva (preenche quando o item ficar "Pendente")</span>
        <textarea
          rows={2}
          value={item.textoDevolutivaPadrao}
          onChange={(e) => mudar("textoDevolutivaPadrao", e.target.value)}
        />
      </label>

      <div className="admin-item-form-acoes">
        <button type="button" onClick={onCancelar} className="admin-botao-secundario">
          Cancelar
        </button>
        <button type="submit" className="admin-botao-primario">
          {textoBotao}
        </button>
      </div>
    </form>
  );
}
