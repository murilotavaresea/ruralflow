import { useMemo, useState } from "react";
import { PROGRAMAS, PERIODICIDADES } from "../utils/operacaoModel";
import EnquadramentoFno from "./EnquadramentoFno";
import "./PropostaForm.css";

export default function PropostaForm({
  proposta,
  rendaAnualProponente,
  linhasCredito,
  linhasChecklist,
  municipiosFno,
  fnoRegras,
  onMudarCampo,
}) {
  const [buscaLinhaAberta, setBuscaLinhaAberta] = useState(false);
  const linhasDoPrograma = linhasChecklist[proposta.programa] || [];

  const sugestoesLinha = useMemo(() => {
    if (!buscaLinhaAberta || !proposta.linhaCreditoDescricao) return [];
    const alvo = proposta.linhaCreditoDescricao.toLowerCase();
    return linhasCredito
      .filter((l) => l.descricao.toLowerCase().includes(alvo) || String(l.codigo).includes(alvo))
      .slice(0, 15);
  }, [buscaLinhaAberta, proposta.linhaCreditoDescricao, linhasCredito]);

  return (
    <div className="cartao">
      <h2>Proposta e enquadramento</h2>
      <p className="cartao-descricao">Condicoes da operacao e programa de credito escolhido.</p>

      <div className="grade-campos">
        <label className="campo">
          <span>Programa</span>
          <select
            value={proposta.programa}
            onChange={(e) => {
              onMudarCampo("programa", e.target.value);
              onMudarCampo("linhaChecklist", "");
            }}
          >
            {PROGRAMAS.map((p) => (
              <option key={p.chave} value={p.chave}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Linha do checklist</span>
          <select
            value={proposta.linhaChecklist}
            onChange={(e) => onMudarCampo("linhaChecklist", e.target.value)}
            disabled={linhasDoPrograma.length === 0}
          >
            <option value="">
              {linhasDoPrograma.length === 0 ? "Nenhuma linha cadastrada" : "Comum a todas as linhas"}
            </option>
            {linhasDoPrograma.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>

        {proposta.programa === "bndes" ? (
          <label className="campo proposta-form-busca">
            <span>Linha de credito</span>
            <input
              type="text"
              value={proposta.linhaCreditoDescricao}
              onChange={(e) => {
                onMudarCampo("linhaCreditoDescricao", e.target.value);
                onMudarCampo("linhaCreditoCodigo", "");
                setBuscaLinhaAberta(true);
              }}
              onFocus={() => setBuscaLinhaAberta(true)}
              onBlur={() => setTimeout(() => setBuscaLinhaAberta(false), 150)}
              placeholder="Digite o nome ou codigo da linha"
              autoComplete="off"
            />
            {sugestoesLinha.length > 0 && (
              <ul className="proposta-form-sugestoes">
                {sugestoesLinha.map((l) => (
                  <li
                    key={l.codigo}
                    onMouseDown={() => {
                      onMudarCampo("linhaCreditoDescricao", l.descricao);
                      onMudarCampo("linhaCreditoCodigo", l.codigo);
                      setBuscaLinhaAberta(false);
                    }}
                  >
                    <strong>{l.codigo}</strong> - {l.descricao}
                  </li>
                ))}
              </ul>
            )}
          </label>
        ) : (
          <label className="campo">
            <span>Linha de credito</span>
            <input
              type="text"
              value={proposta.linhaCreditoDescricao}
              onChange={(e) => onMudarCampo("linhaCreditoDescricao", e.target.value)}
              placeholder="Codigo/descricao da linha (Tabela 4/5)"
            />
          </label>
        )}

        <label className="campo">
          <span>Finalidade</span>
          <input
            type="text"
            value={proposta.finalidade}
            onChange={(e) => onMudarCampo("finalidade", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Tipo de cedula</span>
          <input
            type="text"
            value={proposta.tipoCedula}
            onChange={(e) => onMudarCampo("tipoCedula", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Valor da operacao (R$)</span>
          <input
            type="number"
            value={proposta.valorOperacao}
            onChange={(e) => onMudarCampo("valorOperacao", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Prazo (meses)</span>
          <input
            type="number"
            value={proposta.prazoMeses}
            onChange={(e) => onMudarCampo("prazoMeses", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Carencia (meses)</span>
          <input
            type="number"
            value={proposta.carenciaMeses}
            onChange={(e) => onMudarCampo("carenciaMeses", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Taxa de juros (% a.a.)</span>
          <input
            type="number"
            step="0.01"
            value={proposta.taxaAnual}
            onChange={(e) => onMudarCampo("taxaAnual", e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Periodicidade de pagamento</span>
          <select
            value={proposta.periodicidadePagamento}
            onChange={(e) => onMudarCampo("periodicidadePagamento", e.target.value)}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Seguro prestamista</span>
          <select
            value={proposta.seguroPrestamista}
            onChange={(e) => onMudarCampo("seguroPrestamista", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Nao</option>
          </select>
        </label>
      </div>

      {proposta.programa === "fno" && (
        <EnquadramentoFno
          proposta={proposta}
          rendaAnualProponente={rendaAnualProponente}
          municipiosFno={municipiosFno}
          fnoRegras={fnoRegras}
          onMudarCampo={onMudarCampo}
        />
      )}
    </div>
  );
}
