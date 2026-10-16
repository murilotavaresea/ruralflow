import { useState } from "react";
import { extrairCampos } from "../utils/gerarTextoTemplate";
import "./Campos.css";

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
// `linhasPorFonte`: dicionario { fonteChave: [{id, nome}] } com as modalidades de cada fonte.
// `onSalvar` pode devolver uma Promise; o botao fica desabilitado enquanto ela nao termina.
export default function AdminItemForm({
  valorInicial,
  fontesDisponiveis = [],
  linhasPorFonte = {},
  onSalvar,
  onCancelar,
  textoBotao = "Salvar",
}) {
  const [item, setItem] = useState(valorInicial || ITEM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const campos = item.tipo === "texto" ? extrairCampos(item.template) : [];
  const comumATodasFontes = item.fontes === "todas" || item.fontes === undefined;
  const comumATodasLinhas = item.linhas === "todas" || item.linhas === undefined;
  const fontesMarcadas = Array.isArray(item.fontes) ? item.fontes : [];
  const linhasMarcadas = Array.isArray(item.linhas) ? item.linhas : [];

  const mudar = (campo, valor) => setItem((atual) => ({ ...atual, [campo]: valor }));

  const alternarTodasFontes = (marcado) => mudar("fontes", marcado ? "todas" : []);

  const alternarFonte = (fonteChave) => {
    mudar(
      "fontes",
      fontesMarcadas.includes(fonteChave)
        ? fontesMarcadas.filter((f) => f !== fonteChave)
        : [...fontesMarcadas, fonteChave]
    );
  };

  const alternarTodasLinhas = (marcado) => mudar("linhas", marcado ? "todas" : []);

  const alternarLinha = (linhaId) => {
    mudar(
      "linhas",
      linhasMarcadas.includes(linhaId) ? linhasMarcadas.filter((id) => id !== linhaId) : [...linhasMarcadas, linhaId]
    );
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!item.nome.trim() || salvando) return;
    setSalvando(true);
    try {
      await onSalvar(item);
    } finally {
      setSalvando(false);
    }
  };

  // As modalidades disponiveis pra marcar dependem das fontes marcadas: se o item e comum a
  // todas as fontes, mostra as de todas; senao, so as das fontes marcadas.
  const fontesParaLinhas = comumATodasFontes ? fontesDisponiveis.map((f) => f.chave) : fontesMarcadas;
  const gruposDeLinha = fontesDisponiveis
    .filter((f) => fontesParaLinhas.includes(f.chave))
    .map((f) => ({ fonte: f, linhas: linhasPorFonte[f.chave] || [] }))
    .filter((g) => g.linhas.length > 0);

  return (
    <form className="admin-item-form" onSubmit={salvar}>
      <div className="grade-campos">
        <label className="campo obrigatorio">
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
          <span>Modelo de texto — use {"{campo}"} para marcar um espaço preenchível</span>
          <textarea
            rows={3}
            value={item.template}
            onChange={(e) => mudar("template", e.target.value)}
            placeholder="Ex.: Hipoteca de {grau} grau sobre o imóvel matrícula {matricula}, no município de {municipio}."
          />
          <span className="campo-dica">
            {campos.length > 0 ? `Campos detectados: ${campos.join(", ")}` : "Nenhum campo {assim} detectado ainda."}
          </span>
        </label>
      )}

      {fontesDisponiveis.length > 0 && (
        <fieldset className="admin-escopo">
          <legend>Quais fontes de recurso usam este item?</legend>
          <div className="admin-escopo-chips">
            <label className={`chip${comumATodasFontes ? " selecionado" : ""}`}>
              <input
                type="checkbox"
                checked={comumATodasFontes}
                onChange={(e) => alternarTodasFontes(e.target.checked)}
              />
              Todas as fontes
            </label>
            {fontesDisponiveis.map((fonte) => {
              const marcada = fontesMarcadas.includes(fonte.chave);
              return (
                <label key={fonte.chave} className={`chip${marcada ? " selecionado" : ""}`}>
                  <input type="checkbox" checked={marcada} onChange={() => alternarFonte(fonte.chave)} />
                  {fonte.rotulo}
                </label>
              );
            })}
          </div>
          <p className="campo-dica">“Todas as fontes” inclui também as que forem criadas depois.</p>
          {!comumATodasFontes && fontesMarcadas.length === 0 && (
            <p className="campo-dica aviso">Nenhuma fonte marcada: o item não aparecerá em nenhuma operação.</p>
          )}

          {gruposDeLinha.length > 0 && (
            <>
              <p className="admin-escopo-subtitulo">Quais modalidades usam este item?</p>
              <div className="admin-escopo-chips">
                <label className={`chip${comumATodasLinhas ? " selecionado" : ""}`}>
                  <input
                    type="checkbox"
                    checked={comumATodasLinhas}
                    onChange={(e) => alternarTodasLinhas(e.target.checked)}
                  />
                  Todas as modalidades
                </label>
              </div>
              {!comumATodasLinhas &&
                gruposDeLinha.map(({ fonte, linhas }) => (
                  <div className="admin-escopo-fonte" key={fonte.chave}>
                    <span className="admin-escopo-fonte-titulo">{fonte.rotulo}</span>
                    <div className="admin-escopo-chips">
                      {linhas.map((linha) => {
                        const marcada = linhasMarcadas.includes(linha.id);
                        return (
                          <label key={linha.id} className={`chip${marcada ? " selecionado" : ""}`}>
                            <input type="checkbox" checked={marcada} onChange={() => alternarLinha(linha.id)} />
                            {linha.nome}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              {!comumATodasLinhas && linhasMarcadas.length === 0 && (
                <p className="campo-dica aviso">
                  Nenhuma modalidade marcada: o item não aparecerá em nenhuma operação.
                </p>
              )}
            </>
          )}
        </fieldset>
      )}

      <label className="campo">
        <span>Texto padrão de devolutiva (preenche quando o item ficar “Pendente”)</span>
        <textarea
          rows={2}
          value={item.textoDevolutivaPadrao}
          onChange={(e) => mudar("textoDevolutivaPadrao", e.target.value)}
        />
      </label>

      <div className="admin-item-form-acoes">
        <button type="button" onClick={onCancelar} className="btn">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={salvando || !item.nome.trim()}>
          {salvando ? "Salvando…" : textoBotao}
        </button>
      </div>
    </form>
  );
}
