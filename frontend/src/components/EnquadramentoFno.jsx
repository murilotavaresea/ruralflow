import { useMemo, useState } from "react";
import { buscarMunicipios, classificarPorte, buscarPrazoPorEmpreendimento } from "../utils/enquadramentoFno";
import "./EnquadramentoFno.css";

const TIPOS_EMPREENDIMENTO = ["Caminhonete", "Agricola Fixo", "Pecuario Fixo", "Agricola Semifixo", "Pecuario Semifixo"];

export default function EnquadramentoFno({
  proposta,
  rendaAnualProponente,
  municipiosFno,
  fnoRegras,
  onMudarCampo,
}) {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const sugestoes = useMemo(
    () => (buscaAberta ? buscarMunicipios(municipiosFno, proposta.municipio) : []),
    [buscaAberta, proposta.municipio, municipiosFno]
  );

  const municipioSelecionado = useMemo(
    () => municipiosFno.find((m) => m.municipio === proposta.municipio) || null,
    [municipiosFno, proposta.municipio]
  );

  const porteSugerido = classificarPorte(rendaAnualProponente, fnoRegras.faixasPorte);
  const prazoEmpreendimento = buscarPrazoPorEmpreendimento(
    proposta.tipoEmpreendimento,
    fnoRegras.prazoPorEmpreendimento
  );

  return (
    <div className="enquadramento-fno">
      <h3>Enquadramento FNO</h3>

      <div className="grade-campos">
        <label className="campo enquadramento-fno-busca">
          <span>Municipio do empreendimento</span>
          <input
            type="text"
            value={proposta.municipio}
            onChange={(e) => {
              onMudarCampo("municipio", e.target.value);
              setBuscaAberta(true);
            }}
            onFocus={() => setBuscaAberta(true)}
            onBlur={() => setTimeout(() => setBuscaAberta(false), 150)}
            placeholder="Digite o nome do municipio"
            autoComplete="off"
          />
          {sugestoes.length > 0 && (
            <ul className="enquadramento-fno-sugestoes">
              {sugestoes.map((m) => (
                <li
                  key={m.codigo_ibge}
                  onMouseDown={() => {
                    onMudarCampo("municipio", m.municipio);
                    setBuscaAberta(false);
                  }}
                >
                  {m.municipio} - {m.uf}
                </li>
              ))}
            </ul>
          )}
        </label>

        <label className="campo">
          <span>Tipo de empreendimento</span>
          <select
            value={proposta.tipoEmpreendimento}
            onChange={(e) => onMudarCampo("tipoEmpreendimento", e.target.value)}
          >
            <option value="">Selecione</option>
            {TIPOS_EMPREENDIMENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Limite financiavel (R$)</span>
          <input
            type="number"
            value={proposta.limiteFinanciavelManual}
            onChange={(e) => onMudarCampo("limiteFinanciavelManual", e.target.value)}
            placeholder="Consultar Programacao FNO, pag. 23"
          />
        </label>
      </div>

      {municipioSelecionado ? (
        <dl className="enquadramento-fno-resultado">
          <div>
            <dt>UF</dt>
            <dd>{municipioSelecionado.uf}</dd>
          </div>
          <div>
            <dt>Microrregiao</dt>
            <dd>{municipioSelecionado.microrregiao}</dd>
          </div>
          <div>
            <dt>Tipologia</dt>
            <dd>{municipioSelecionado.tipologia_4_classificacoes}</dd>
          </div>
          <div>
            <dt>Faixa de fronteira</dt>
            <dd>{municipioSelecionado.faixa_fronteira ? "Sim" : "Nao"}</dd>
          </div>
          <div>
            <dt>Area de atuacao Sicoob</dt>
            <dd>{municipioSelecionado.area_atuacao_sicoob ? "Sim" : "Nao"}</dd>
          </div>
        </dl>
      ) : (
        proposta.municipio && (
          <p className="enquadramento-fno-aviso">Municipio nao encontrado na base do FNO.</p>
        )
      )}

      {porteSugerido && (
        <p className="enquadramento-fno-porte">
          Porte sugerido pela renda anual do proponente: <strong>{porteSugerido}</strong>
        </p>
      )}

      {proposta.tipoEmpreendimento && (
        <p className="enquadramento-fno-porte">
          Prazo de referencia:{" "}
          <strong>{prazoEmpreendimento?.prazo || "nao definido na programacao para este tipo"}</strong>
        </p>
      )}
    </div>
  );
}
