from flask import Blueprint, jsonify

from config.linhas_credito import LINHAS_CREDITO_BNDES
from config.municipios_fno import MUNICIPIOS_FNO
from config.links_uteis import LINKS_UTEIS
from config.fno_regras import FAIXAS_PORTE_FNO, PRAZO_POR_EMPREENDIMENTO_FNO
from storage.checklist_store import get_store

referencia_bp = Blueprint("referencia_bp", __name__, url_prefix="/referencia")


@referencia_bp.route("/linhas-credito", methods=["GET"])
def listar_linhas_credito():
    return jsonify(LINHAS_CREDITO_BNDES)


@referencia_bp.route("/municipios-fno", methods=["GET"])
def listar_municipios_fno():
    return jsonify(MUNICIPIOS_FNO)


@referencia_bp.route("/checklist", methods=["GET"])
def obter_checklist():
    return jsonify(get_store().obter_tudo())


@referencia_bp.route("/links-uteis", methods=["GET"])
def listar_links_uteis():
    return jsonify(LINKS_UTEIS)


@referencia_bp.route("/fno-regras", methods=["GET"])
def obter_fno_regras():
    return jsonify({
        "faixasPorte": FAIXAS_PORTE_FNO,
        "prazoPorEmpreendimento": PRAZO_POR_EMPREENDIMENTO_FNO,
    })
