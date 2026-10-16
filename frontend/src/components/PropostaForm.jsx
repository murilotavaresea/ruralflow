import { useMemo } from "react";
import { PROGRAMAS, PERIODICIDADES } from "../utils/operacaoModel";
import Autocomplete from "./Autocomplete";
import CampoNumerico from "./CampoNumerico";
import EnquadramentoFno from "./EnquadramentoFno";
import SimulacaoParcela from "./SimulacaoParcela";
import "./PropostaForm.css";

function semAcento(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function PropostaForm({
  proposta,
  rendaAnualProponente,
  linhasCredito,
  linhasChecklist,
  municipiosFno,
  fnoRegras,
  onMudarCampo,
}) {
  const modalidades = linhasChecklist[proposta.programa] || [];

  const sugestoesLinha = useMemo(() => {
    const alvo = semAcento(proposta.linhaCreditoDescricao).trim();
    if (!alvo || proposta.programa !== "bndes") return [];
    return linhasCredito
      .filter((l) => semAcento(l.descricao).includes(alvo) || String(l.codigo).includes(alvo))
      .slice(0, 15)
      .map((l) => ({ id: String(l.codigo), rotulo: l.descricao, detalhe: `Código ${l.codigo}`, linha: l }));
  }, [proposta.linhaCreditoDescricao, proposta.programa, linhasCredito]);

  const prazo = Number(proposta.prazoMeses) || 0;
  const carencia = Number(proposta.carenciaMeses) || 0;
  const carenciaInvalida = prazo > 0 && carencia >= prazo;

  return (
    <div className="cartao">
      <h2>Proposta e enquadramento</h2>
      <p className="cartao-descricao">
        Condições da operação. A fonte de recurso e a modalidade definem quais itens aparecem nos
        checklists. Campos com * são obrigatórios para fechar o parecer.
      </p>

      <fieldset className="form-secao">
        <legend>Enquadramento</legend>
        <div className="grade-campos colunas-3">
          <label className="campo">
            <span>Fonte de recurso</span>
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

          <label className="campo" title="Ex.: Custeio ou Investimento. As modalidades são cadastradas em Administração.">
            <span>Modalidade do checklist</span>
            <select
              value={proposta.linhaChecklist}
              onChange={(e) => onMudarCampo("linhaChecklist", e.target.value)}
              disabled={modalidades.length === 0}
            >
              <option value="">
                {modalidades.length === 0 ? "Nenhuma modalidade cadastrada" : "Comum a todas as modalidades"}
              </option>
              {modalidades.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Tipo de cédula</span>
            <input
              type="text"
              value={proposta.tipoCedula}
              onChange={(e) => onMudarCampo("tipoCedula", e.target.value)}
            />
          </label>

          {proposta.programa === "bndes" ? (
            <Autocomplete
              classe="proposta-form-busca"
              rotulo="Linha de crédito"
              valor={proposta.linhaCreditoDescricao}
              onChangeTexto={(texto) => {
                onMudarCampo("linhaCreditoDescricao", texto);
                onMudarCampo("linhaCreditoCodigo", "");
              }}
              sugestoes={sugestoesLinha}
              onSelecionar={(sugestao) => {
                onMudarCampo("linhaCreditoDescricao", sugestao.linha.descricao);
                onMudarCampo("linhaCreditoCodigo", sugestao.linha.codigo);
              }}
              placeholder="Digite o nome ou o código da linha"
              dica={proposta.linhaCreditoCodigo ? `Código ${proposta.linhaCreditoCodigo}` : undefined}
            />
          ) : (
            <label className="campo proposta-form-busca">
              <span>Linha de crédito</span>
              <input
                type="text"
                value={proposta.linhaCreditoDescricao}
                onChange={(e) => onMudarCampo("linhaCreditoDescricao", e.target.value)}
                placeholder="Código/descrição da linha (Tabela 4/5)"
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
        </div>
      </fieldset>

      <fieldset className="form-secao">
        <legend>Condições financeiras</legend>
        <div className="grade-campos colunas-3">
          <label className="campo obrigatorio">
            <span>Valor da operação</span>
            <CampoNumerico
              prefixo="R$"
              valor={proposta.valorOperacao}
              onChange={(valor) => onMudarCampo("valorOperacao", valor)}
              placeholder="0,00"
            />
          </label>

          <label className="campo obrigatorio">
            <span>Prazo</span>
            <CampoNumerico
              decimais={0}
              sufixo="meses"
              valor={proposta.prazoMeses}
              onChange={(valor) => onMudarCampo("prazoMeses", valor)}
            />
          </label>

          <label className="campo">
            <span>Carência</span>
            <CampoNumerico
              decimais={0}
              sufixo="meses"
              valor={proposta.carenciaMeses}
              onChange={(valor) => onMudarCampo("carenciaMeses", valor)}
              aria-invalid={carenciaInvalida}
            />
            {carenciaInvalida && (
              <small className="campo-dica aviso">A carência deve ser menor que o prazo.</small>
            )}
          </label>

          <label className="campo obrigatorio">
            <span>Taxa de juros</span>
            <CampoNumerico
              sufixo="% a.a."
              maximo={1000}
              valor={proposta.taxaAnual}
              onChange={(valor) => onMudarCampo("taxaAnual", valor)}
              placeholder="0,00"
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
              <option value="NAO">Não</option>
            </select>
          </label>
        </div>

        <SimulacaoParcela proposta={proposta} />
      </fieldset>

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
