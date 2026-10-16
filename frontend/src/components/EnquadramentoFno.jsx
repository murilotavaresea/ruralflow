import { useMemo } from "react";
import { buscarMunicipios, classificarPorte, buscarPrazoPorEmpreendimento } from "../utils/enquadramentoFno";
import Autocomplete from "./Autocomplete";
import CampoNumerico from "./CampoNumerico";
import "./EnquadramentoFno.css";

// O valor (chave) tem que bater com o `tipo` de /referencia/fno-regras; so o rotulo muda.
const TIPOS_EMPREENDIMENTO = [
  { valor: "Caminhonete", rotulo: "Caminhonete" },
  { valor: "Agricola Fixo", rotulo: "Agrícola fixo" },
  { valor: "Pecuario Fixo", rotulo: "Pecuário fixo" },
  { valor: "Agricola Semifixo", rotulo: "Agrícola semifixo" },
  { valor: "Pecuario Semifixo", rotulo: "Pecuário semifixo" },
];

export default function EnquadramentoFno({
  proposta,
  rendaAnualProponente,
  municipiosFno,
  fnoRegras,
  onMudarCampo,
}) {
  const sugestoes = useMemo(
    () =>
      buscarMunicipios(municipiosFno, proposta.municipio).map((m) => ({
        id: String(m.codigo_ibge),
        rotulo: m.municipio,
        detalhe: m.uf,
      })),
    [proposta.municipio, municipiosFno]
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
        <Autocomplete
          rotulo="Município do empreendimento"
          valor={proposta.municipio}
          onChangeTexto={(texto) => onMudarCampo("municipio", texto)}
          sugestoes={sugestoes}
          onSelecionar={(sugestao) => onMudarCampo("municipio", sugestao.rotulo)}
          placeholder="Digite o nome do município"
        />

        <label className="campo">
          <span>Tipo de empreendimento</span>
          <select
            value={proposta.tipoEmpreendimento}
            onChange={(e) => onMudarCampo("tipoEmpreendimento", e.target.value)}
          >
            <option value="">Selecione</option>
            {TIPOS_EMPREENDIMENTO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Limite financiável</span>
          <CampoNumerico
            prefixo="R$"
            valor={proposta.limiteFinanciavelManual}
            onChange={(valor) => onMudarCampo("limiteFinanciavelManual", valor)}
            placeholder="Consultar Programação FNO, pág. 23"
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
            <dt>Microrregião</dt>
            <dd>{municipioSelecionado.microrregiao}</dd>
          </div>
          <div>
            <dt>Tipologia</dt>
            <dd>{municipioSelecionado.tipologia_4_classificacoes}</dd>
          </div>
          <div>
            <dt>Faixa de fronteira</dt>
            <dd>{municipioSelecionado.faixa_fronteira ? "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Área de atuação Sicoob</dt>
            <dd>{municipioSelecionado.area_atuacao_sicoob ? "Sim" : "Não"}</dd>
          </div>
        </dl>
      ) : (
        proposta.municipio && (
          <p className="enquadramento-fno-aviso" role="status">
            Município não encontrado na base do FNO.
          </p>
        )
      )}

      {porteSugerido && (
        <p className="enquadramento-fno-porte">
          Porte sugerido pela renda anual do proponente: <strong>{porteSugerido}</strong>
        </p>
      )}

      {proposta.tipoEmpreendimento && (
        <p className="enquadramento-fno-porte">
          Prazo de referência:{" "}
          <strong>{prazoEmpreendimento?.prazo || "não definido na programação para este tipo"}</strong>
        </p>
      )}
    </div>
  );
}
