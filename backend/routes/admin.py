from flask import Blueprint, jsonify, request

from storage.checklist_store import get_store, NaoEncontradoError, SecaoInvalidaError

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/admin")


def _corpo():
    return request.get_json(silent=True) or {}


def _tratado(funcao, *args, **kwargs):
    try:
        return jsonify(funcao(*args, **kwargs))
    except NaoEncontradoError as erro:
        return jsonify({"erro": str(erro)}), 404
    except SecaoInvalidaError as erro:
        return jsonify({"erro": str(erro)}), 400


# --- grupos ---------------------------------------------------------------------------

def _criar_grupo(painel, programa):
    nome = _corpo().get("nome", "").strip()
    if not nome:
        return jsonify({"erro": "Nome do grupo e obrigatorio"}), 400
    return _tratado(get_store().criar_grupo, painel, programa, nome)


def _atualizar_grupo(painel, programa, grupo_id):
    nome = _corpo().get("nome", "").strip()
    if not nome:
        return jsonify({"erro": "Nome do grupo e obrigatorio"}), 400
    return _tratado(get_store().atualizar_grupo, painel, programa, grupo_id, nome)


def _excluir_grupo(painel, programa, grupo_id):
    try:
        get_store().excluir_grupo(painel, programa, grupo_id)
        return jsonify({"ok": True})
    except NaoEncontradoError as erro:
        return jsonify({"erro": str(erro)}), 404


def _reordenar_grupos(painel, programa):
    ordem = _corpo().get("ordem", [])
    return _tratado(get_store().reordenar_grupos, painel, programa, ordem)


# --- itens ------------------------------------------------------------------------

def _criar_item(painel, programa, grupo_id):
    corpo = _corpo()
    if not corpo.get("nome", "").strip():
        return jsonify({"erro": "Nome do item e obrigatorio"}), 400
    return _tratado(get_store().criar_item, painel, programa, grupo_id, corpo)


def _atualizar_item(painel, programa, item_id):
    corpo = _corpo()
    if "nome" in corpo and not corpo["nome"].strip():
        return jsonify({"erro": "Nome do item e obrigatorio"}), 400
    return _tratado(get_store().atualizar_item, painel, programa, item_id, corpo)


def _excluir_item(painel, programa, item_id):
    try:
        get_store().excluir_item(painel, programa, item_id)
        return jsonify({"ok": True})
    except NaoEncontradoError as erro:
        return jsonify({"erro": str(erro)}), 404


def _reordenar_itens(painel, programa, grupo_id):
    ordem = _corpo().get("ordem", [])
    return _tratado(get_store().reordenar_itens, painel, programa, grupo_id, ordem)


# --- rotas: painel Proponente -----------------------------------------------------

@admin_bp.route("/checklist/proponente/grupos", methods=["POST"])
def criar_grupo_proponente():
    return _criar_grupo("proponente", None)


@admin_bp.route("/checklist/proponente/grupos/reordenar", methods=["PUT"])
def reordenar_grupos_proponente():
    return _reordenar_grupos("proponente", None)


@admin_bp.route("/checklist/proponente/grupos/<grupo_id>", methods=["PUT"])
def atualizar_grupo_proponente(grupo_id):
    return _atualizar_grupo("proponente", None, grupo_id)


@admin_bp.route("/checklist/proponente/grupos/<grupo_id>", methods=["DELETE"])
def excluir_grupo_proponente(grupo_id):
    return _excluir_grupo("proponente", None, grupo_id)


@admin_bp.route("/checklist/proponente/grupos/<grupo_id>/itens", methods=["POST"])
def criar_item_proponente(grupo_id):
    return _criar_item("proponente", None, grupo_id)


@admin_bp.route("/checklist/proponente/grupos/<grupo_id>/itens/reordenar", methods=["PUT"])
def reordenar_itens_proponente(grupo_id):
    return _reordenar_itens("proponente", None, grupo_id)


@admin_bp.route("/checklist/proponente/itens/<item_id>", methods=["PUT"])
def atualizar_item_proponente(item_id):
    return _atualizar_item("proponente", None, item_id)


@admin_bp.route("/checklist/proponente/itens/<item_id>", methods=["DELETE"])
def excluir_item_proponente(item_id):
    return _excluir_item("proponente", None, item_id)


# --- rotas: painel Demais Documentos (catalogo unico, igual Proponente) -----------

@admin_bp.route("/checklist/documentos/grupos", methods=["POST"])
def criar_grupo_documentos():
    return _criar_grupo("documentos", None)


@admin_bp.route("/checklist/documentos/grupos/reordenar", methods=["PUT"])
def reordenar_grupos_documentos():
    return _reordenar_grupos("documentos", None)


@admin_bp.route("/checklist/documentos/grupos/<grupo_id>", methods=["PUT"])
def atualizar_grupo_documentos(grupo_id):
    return _atualizar_grupo("documentos", None, grupo_id)


@admin_bp.route("/checklist/documentos/grupos/<grupo_id>", methods=["DELETE"])
def excluir_grupo_documentos(grupo_id):
    return _excluir_grupo("documentos", None, grupo_id)


@admin_bp.route("/checklist/documentos/grupos/<grupo_id>/itens", methods=["POST"])
def criar_item_documentos(grupo_id):
    return _criar_item("documentos", None, grupo_id)


@admin_bp.route("/checklist/documentos/grupos/<grupo_id>/itens/reordenar", methods=["PUT"])
def reordenar_itens_documentos(grupo_id):
    return _reordenar_itens("documentos", None, grupo_id)


@admin_bp.route("/checklist/documentos/itens/<item_id>", methods=["PUT"])
def atualizar_item_documentos(item_id):
    return _atualizar_item("documentos", None, item_id)


@admin_bp.route("/checklist/documentos/itens/<item_id>", methods=["DELETE"])
def excluir_item_documentos(item_id):
    return _excluir_item("documentos", None, item_id)


# --- rotas: painel Garantias (por escopo "bem"/"proprietario" e tipo) --------------

@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos", methods=["POST"])
def criar_grupo_garantia(escopo, tipo):
    return _criar_grupo("garantias", f"{escopo}_{tipo}")


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos/reordenar", methods=["PUT"])
def reordenar_grupos_garantia(escopo, tipo):
    return _reordenar_grupos("garantias", f"{escopo}_{tipo}")


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos/<grupo_id>", methods=["PUT"])
def atualizar_grupo_garantia(escopo, tipo, grupo_id):
    return _atualizar_grupo("garantias", f"{escopo}_{tipo}", grupo_id)


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos/<grupo_id>", methods=["DELETE"])
def excluir_grupo_garantia(escopo, tipo, grupo_id):
    return _excluir_grupo("garantias", f"{escopo}_{tipo}", grupo_id)


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos/<grupo_id>/itens", methods=["POST"])
def criar_item_garantia(escopo, tipo, grupo_id):
    return _criar_item("garantias", f"{escopo}_{tipo}", grupo_id)


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/grupos/<grupo_id>/itens/reordenar", methods=["PUT"])
def reordenar_itens_garantia(escopo, tipo, grupo_id):
    return _reordenar_itens("garantias", f"{escopo}_{tipo}", grupo_id)


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/itens/<item_id>", methods=["PUT"])
def atualizar_item_garantia(escopo, tipo, item_id):
    return _atualizar_item("garantias", f"{escopo}_{tipo}", item_id)


@admin_bp.route("/checklist/garantias/<escopo>/<tipo>/itens/<item_id>", methods=["DELETE"])
def excluir_item_garantia(escopo, tipo, item_id):
    return _excluir_item("garantias", f"{escopo}_{tipo}", item_id)


# --- rotas: painel Area Beneficiada (por escopo "bem"/"proprietario") -------------

@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos", methods=["POST"])
def criar_grupo_area_beneficiada(escopo):
    return _criar_grupo("area_beneficiada", escopo)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos/reordenar", methods=["PUT"])
def reordenar_grupos_area_beneficiada(escopo):
    return _reordenar_grupos("area_beneficiada", escopo)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos/<grupo_id>", methods=["PUT"])
def atualizar_grupo_area_beneficiada(escopo, grupo_id):
    return _atualizar_grupo("area_beneficiada", escopo, grupo_id)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos/<grupo_id>", methods=["DELETE"])
def excluir_grupo_area_beneficiada(escopo, grupo_id):
    return _excluir_grupo("area_beneficiada", escopo, grupo_id)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos/<grupo_id>/itens", methods=["POST"])
def criar_item_area_beneficiada(escopo, grupo_id):
    return _criar_item("area_beneficiada", escopo, grupo_id)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/grupos/<grupo_id>/itens/reordenar", methods=["PUT"])
def reordenar_itens_area_beneficiada(escopo, grupo_id):
    return _reordenar_itens("area_beneficiada", escopo, grupo_id)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/itens/<item_id>", methods=["PUT"])
def atualizar_item_area_beneficiada(escopo, item_id):
    return _atualizar_item("area_beneficiada", escopo, item_id)


@admin_bp.route("/checklist/area_beneficiada/<escopo>/itens/<item_id>", methods=["DELETE"])
def excluir_item_area_beneficiada(escopo, item_id):
    return _excluir_item("area_beneficiada", escopo, item_id)


# --- rotas: linhas do checklist Documental (por programa) --------------------------

@admin_bp.route("/linhas/<programa>", methods=["POST"])
def criar_linha(programa):
    nome = _corpo().get("nome", "").strip()
    if not nome:
        return jsonify({"erro": "Nome da linha e obrigatorio"}), 400
    return _tratado(get_store().criar_linha, programa, nome)


@admin_bp.route("/linhas/<programa>/reordenar", methods=["PUT"])
def reordenar_linhas(programa):
    ordem = _corpo().get("ordem", [])
    return _tratado(get_store().reordenar_linhas, programa, ordem)


@admin_bp.route("/linhas/<programa>/<linha_id>", methods=["PUT"])
def atualizar_linha(programa, linha_id):
    nome = _corpo().get("nome", "").strip()
    if not nome:
        return jsonify({"erro": "Nome da linha e obrigatorio"}), 400
    return _tratado(get_store().atualizar_linha, programa, linha_id, nome)


@admin_bp.route("/linhas/<programa>/<linha_id>", methods=["DELETE"])
def excluir_linha(programa, linha_id):
    try:
        get_store().excluir_linha(programa, linha_id)
        return jsonify({"ok": True})
    except NaoEncontradoError as erro:
        return jsonify({"erro": str(erro)}), 404
