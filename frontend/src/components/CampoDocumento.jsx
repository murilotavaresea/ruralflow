import { useId } from "react";
import { formatarDocumento, validarDocumento } from "../utils/cpfCnpj";
import "./Campos.css";

// CPF/CNPJ com mascara e conferencia dos digitos verificadores. A validacao e so informativa:
// nao impede digitar nem salvar (o analista pode estar colando um documento de teste ou
// corrigindo depois), mas deixa o erro visivel na hora em vez de so aparecer no parecer. O
// status fica na linha do rotulo, a direita, pra nao aumentar a altura do campo.
export default function CampoDocumento({
  valor,
  onChange,
  rotulo = "CPF / CNPJ",
  obrigatorio = false,
  placeholder = "000.000.000-00",
}) {
  const id = useId();
  const idStatus = `${id}-status`;
  const { tipo, valido, digitos } = validarDocumento(valor);

  let curto = "";
  let leitor = "";
  let classe = "";
  if (valido === true) {
    curto = `✓ ${tipo}`;
    leitor = `${tipo} válido`;
    classe = "ok";
  } else if (valido === false) {
    curto = "✗ inválido";
    leitor = `${tipo} inválido — confira os dígitos`;
    classe = "erro";
  } else if (digitos > 11) {
    curto = "incompleto";
    leitor = "Documento incompleto: um CPF tem 11 dígitos e um CNPJ tem 14";
  }

  return (
    <div className="campo">
      <div className="campo-rotulo-linha">
        <label htmlFor={id} className={`campo-rotulo${obrigatorio ? " obrigatorio" : ""}`}>
          {rotulo}
        </label>
        <span id={idStatus} className={`campo-status ${classe}`} aria-live="polite" title={leitor || undefined}>
          <span aria-hidden="true">{curto}</span>
          <span className="sr-only">{leitor}</span>
        </span>
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={valor}
        onChange={(evento) => onChange(formatarDocumento(evento.target.value))}
        placeholder={placeholder}
        aria-invalid={valido === false}
        aria-describedby={leitor ? idStatus : undefined}
      />
    </div>
  );
}
