"""
Camada de armazenamento dos itens de checklist (paineis Proponente, Demais Documentos,
Garantias e Area Beneficiada). Isolada das rotas de proposito: hoje grava num arquivo JSON
local (backend/data/checklist.json), mas se um dia for necessario trocar por um banco de
dados, basta escrever uma nova classe com os mesmos metodos (ex: SqlChecklistStore) e trocar
o que `get_store()` retorna — nada em routes/referencia.py ou routes/admin.py muda.

Proponente e Demais Documentos sao ambos catalogos unicos (lista flat de grupos) — cada item
se marca com "fontes" (quais fontes de recurso o usam) e "linhas" (quais linhas de credito
dentro dessas fontes), os dois "todas" por padrao. Garantias e Area Beneficiada seguem o
padrao bem + proprietario/garantidor (Garantias ainda com a dimensao extra de tipo).
"""

import json
import os
import uuid
from pathlib import Path
from threading import Lock

from config.checklist_documental import CHECKLIST_PROPONENTE, CHECKLIST_DOCUMENTAL
from config.checklist_garantias import (
    TIPOS_GARANTIA,
    CHECKLIST_GARANTIAS_BEM,
    CHECKLIST_GARANTIAS_PROPRIETARIO,
)
from config.checklist_area_beneficiada import (
    CHECKLIST_AREA_BENEFICIADA_BEM,
    CHECKLIST_AREA_BENEFICIADA_PROPRIETARIO,
)

PROGRAMAS_DOCUMENTAL = ("bndes", "fno", "fco", "controlado", "livre")
_PROGRAMAS_ANTIGOS_FCO = ("fco_rural", "fco_empresarial")
# "bem"/"proprietario" — usado tanto por Garantias (composto com o tipo, ex: "bem_hipoteca")
# quanto por Area Beneficiada (usado sozinho, sem dimensao de tipo).
ESCOPOS_BEM_PROPRIETARIO = ("bem", "proprietario")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_FILE = DATA_DIR / "checklist.json"


def _novo_id(prefixo):
    return f"{prefixo}_{uuid.uuid4().hex[:10]}"


def _item_vazio(nome, ajuda="", tipo="checklist", template="", texto_devolutiva_padrao="", linhas="todas", fontes="todas"):
    return {
        "id": _novo_id("itm"),
        "nome": nome,
        "tipo": tipo,
        "ajuda": ajuda,
        "template": template,
        "textoDevolutivaPadrao": texto_devolutiva_padrao,
        "linhas": linhas,
        "fontes": fontes,
    }


def _grupo_vazio(nome, itens=None):
    return {
        "id": _novo_id("grp"),
        "nome": nome,
        "itens": itens or [],
    }


def _linha_vazia(nome):
    return {"id": _novo_id("lin"), "nome": nome}


def _item_da_semente(item):
    return _item_vazio(
        item["nome"],
        ajuda=item.get("ajuda", ""),
        tipo=item.get("tipo", "checklist"),
        template=item.get("template", ""),
        texto_devolutiva_padrao=item.get("textoDevolutivaPadrao", ""),
        linhas=item.get("linhas", "todas"),
        fontes=item.get("fontes", "todas"),
    )


def _grupos_da_semente(grupos_config, linhas_do_programa=None, fontes=None):
    """`linhas_do_programa`: lista de linhas ja criadas pro programa (com id/nome). Se um
    grupo da semente tiver a chave opcional "linha" (nome), todo item desse grupo nasce
    marcado como especifico dessa linha em vez de 'todas' — usado pra ja deixar os itens de
    FCO Rural/Empresarial na linha certa mesmo numa instalacao nova do zero.

    `fontes`: se informado (ex: ["bndes"]), todo item destes grupos nasce marcado como
    especifico dessa(s) fonte(s) em vez de 'todas' — usado pra semear o catalogo unico de
    Demais Documentos ja preservando de qual fonte cada bloco original veio (mesma logica
    aplicada na migracao de quem ja tinha dados gravados, ver _migrar_documental_para_documentos)."""
    linhas_por_nome = {l["nome"]: l["id"] for l in (linhas_do_programa or [])}
    grupos = []
    for grupo in grupos_config:
        linha_id = linhas_por_nome.get(grupo.get("linha"))
        itens = []
        for item in grupo["itens"]:
            item_pronto = _item_da_semente(item)
            if linha_id and item_pronto["linhas"] == "todas":
                item_pronto["linhas"] = [linha_id]
            if fontes is not None and item_pronto["fontes"] == "todas":
                item_pronto["fontes"] = fontes
            itens.append(item_pronto)
        grupos.append(_grupo_vazio(grupo["grupo"], itens))
    return grupos


# Semente inicial das linhas por programa — so um ponto de partida com os nomes que ja foram
# mencionados; o objetivo do painel de administracao e justamente deixar isso ajustavel sem
# mexer em codigo.
_LINHAS_SEMENTE = {
    "bndes": ["Investimento BNDES"],
    "fno": ["Investimento FNO"],
    "fco": ["Rural", "Empresarial"],
    "controlado": ["Custeio - Repasse", "Custeio - Singular", "Investimento - Repasse", "Investimento - Singular"],
    "livre": ["Repasse", "Singular"],
}


def _semente():
    """Gera a estrutura inicial a partir das constantes Python legadas (mesmo conteudo da
    v1/v1.1/v1.2), atribuindo um id estavel a cada grupo e item.

    "documentos" (Demais Documentos) e "proponente" tem exatamente a mesma forma — uma lista
    unica de grupos — desde a v1.5; a diferenca entre os dois e so o painel a que pertencem,
    nao mais a estrutura de armazenamento. Documentos nasce com cada item ja marcado com a
    fonte de origem (nao "todas"), preservando a mesma visibilidade que o modelo antigo
    ("documental" dividido por programa) tinha."""
    proponente = _grupos_da_semente(CHECKLIST_PROPONENTE)
    linhas = {
        programa: [_linha_vazia(nome) for nome in _LINHAS_SEMENTE.get(programa, [])]
        for programa in PROGRAMAS_DOCUMENTAL
    }
    documentos = []
    for programa in PROGRAMAS_DOCUMENTAL:
        documentos += _grupos_da_semente(
            CHECKLIST_DOCUMENTAL.get(programa, []), linhas[programa], fontes=[programa]
        )
    garantias = {}
    for tipo in TIPOS_GARANTIA:
        garantias[f"bem_{tipo}"] = _grupos_da_semente(CHECKLIST_GARANTIAS_BEM.get(tipo, []))
        garantias[f"proprietario_{tipo}"] = _grupos_da_semente(CHECKLIST_GARANTIAS_PROPRIETARIO.get(tipo, []))
    area_beneficiada = {
        "bem": _grupos_da_semente(CHECKLIST_AREA_BENEFICIADA_BEM),
        "proprietario": _grupos_da_semente(CHECKLIST_AREA_BENEFICIADA_PROPRIETARIO),
    }
    return {
        "proponente": proponente,
        "documentos": documentos,
        "garantias": garantias,
        "area_beneficiada": area_beneficiada,
        "linhas": linhas,
    }


class SecaoInvalidaError(ValueError):
    pass


class NaoEncontradoError(LookupError):
    pass


class JsonChecklistStore:
    def __init__(self, caminho=DATA_FILE):
        self._caminho = Path(caminho)
        self._lock = Lock()

    # --- leitura/escrita do arquivo -------------------------------------------------

    def _carregar(self):
        if not self._caminho.exists():
            dados = _semente()
            self._gravar(dados)
            return dados
        with open(self._caminho, "r", encoding="utf-8") as f:
            dados = json.load(f)
        if self._completar_secoes_ausentes(dados):
            self._gravar(dados)
        return dados

    def _completar_secoes_ausentes(self, dados):
        """Auto-cura arquivos gravados por uma versao anterior do app que ainda nao tinha
        alguma secao nova (garantias na v1.2, linhas na v1.3, area beneficiada na v1.5) ou
        que estava num formato antigo (fontes separadas na v1.4, documental por fonte na
        v1.5) — evita ter que apagar customizacoes ja feitas no admin so porque uma secao
        nova ou uma mudanca estrutural foi introduzida."""
        alterado = False
        if "garantias" not in dados:
            dados["garantias"] = _semente()["garantias"]
            alterado = True
        if "linhas" not in dados:
            dados["linhas"] = _semente()["linhas"]
            alterado = True
        if self._completar_campo_linhas_dos_itens(dados):
            alterado = True
        if self._migrar_programas_fco(dados):
            alterado = True
        if self._completar_programas_novos(dados):
            alterado = True
        if self._migrar_documental_para_documentos(dados):
            alterado = True
        if "area_beneficiada" not in dados:
            dados["area_beneficiada"] = _semente()["area_beneficiada"]
            alterado = True
        if self._completar_campo_fontes_dos_itens(dados):
            alterado = True
        return alterado

    def _completar_programas_novos(self, dados):
        """v1.4: 'controlado' e 'livre' sao programas novos. Garante que todo programa valido
        tenha pelo menos uma entrada (vazia ou semeada) em 'documental' e 'linhas', mesmo em
        arquivos gravados antes desses programas existirem. Roda antes da migracao pro
        catalogo unico 'documentos' (abaixo), pra que esses programas novos tambem entrem
        nela — se o arquivo ja tiver sido migrado (tem 'documentos' e nao 'documental'), nao
        ha nada a completar aqui."""
        if "documental" not in dados:
            return False
        alterado = False
        for programa in PROGRAMAS_DOCUMENTAL:
            if programa not in dados["linhas"]:
                dados["linhas"][programa] = [_linha_vazia(nome) for nome in _LINHAS_SEMENTE.get(programa, [])]
                alterado = True
            if programa not in dados["documental"]:
                dados["documental"][programa] = _grupos_da_semente(
                    CHECKLIST_DOCUMENTAL.get(programa, []), dados["linhas"][programa]
                )
                alterado = True
        return alterado

    def _migrar_documental_para_documentos(self, dados):
        """v1.5: o checklist Documental deixou de ser 5 copias paralelas por fonte de recurso
        (dados['documental'][programa]) e virou um catalogo unico 'documentos', com a mesma
        forma que 'proponente' ja tinha — cada item se marca com 'fontes' (uma ou mais
        fontes, ou 'todas') em vez de morar dentro de uma fonte especifica. Isso e o que
        permite marcar um item como comum a duas fontes sem duplicar o cadastro.

        A migracao SO preserva a visibilidade que cada item ja tinha (fontes vira
        [programa de origem]) — nao amplia o escopo de ninguem sozinha. Hoje existem itens
        repetidos entre fontes (ex: "CNJ" em FCO, Controlado, Livre); unificar essas copias
        num item so comum as fontes necessarias e uma decisao manual, feita depois pelo
        admin — a migracao nao tenta adivinhar quais itens sao "a mesma regra"."""
        if "documentos" in dados:
            return False
        documental = dados.pop("documental", {})
        documentos = []
        for programa in PROGRAMAS_DOCUMENTAL:
            for grupo in documental.get(programa, []):
                for item in grupo.get("itens", []):
                    item["fontes"] = [programa]
                documentos.append(grupo)
        dados["documentos"] = documentos
        return True

    def _completar_campo_fontes_dos_itens(self, dados):
        """Itens gravados antes da v1.5 nao tem o campo 'fontes' — sem isso, o filtro por
        fonte esconderia itens que deveriam continuar aparecendo. Todo item sem o campo vira
        'todas' (comportamento de antes: sempre visivel). Em Documentos isso normalmente ja e
        resolvido pela migracao acima, mas cobre tambem o caso de Proponente (que nunca teve
        marcacao de fonte) e qualquer item criado fora do fluxo normal."""
        alterado = False
        for grupo in dados.get("proponente", []):
            for item in grupo.get("itens", []):
                if "fontes" not in item:
                    item["fontes"] = "todas"
                    alterado = True
        for grupo in dados.get("documentos", []):
            for item in grupo.get("itens", []):
                if "fontes" not in item:
                    item["fontes"] = "todas"
                    alterado = True
        return alterado

    def _migrar_programas_fco(self, dados):
        """v1.4: 'FCO Rural' e 'FCO Empresarial' deixaram de ser programas separados e viraram
        linhas dentro de um unico programa 'fco'. Quem gravou dados nesse formato antigo
        (v1.3) tem os itens preservados, so remarcados como especificos da linha
        correspondente, em vez de perdidos."""
        documental = dados.get("documental", {})
        if not any(chave in documental for chave in _PROGRAMAS_ANTIGOS_FCO):
            return False

        linhas_fco = dados["linhas"].setdefault("fco", [])
        mapa_linha_por_programa_antigo = {}
        nomes_linha = {"fco_rural": "Rural", "fco_empresarial": "Empresarial"}

        for programa_antigo, nome_linha in nomes_linha.items():
            linha_existente = next((l for l in linhas_fco if l["nome"] == nome_linha), None)
            if linha_existente is None:
                linha_existente = _linha_vazia(nome_linha)
                linhas_fco.append(linha_existente)
            mapa_linha_por_programa_antigo[programa_antigo] = linha_existente["id"]

        grupos_fco = documental.setdefault("fco", [])
        for programa_antigo in _PROGRAMAS_ANTIGOS_FCO:
            grupos_antigos = documental.pop(programa_antigo, [])
            linha_id = mapa_linha_por_programa_antigo[programa_antigo]
            for grupo in grupos_antigos:
                for item in grupo.get("itens", []):
                    item["linhas"] = [linha_id]
                grupos_fco.append(grupo)
            dados["linhas"].pop(programa_antigo, None)

        return True

    def _completar_campo_linhas_dos_itens(self, dados):
        """Itens do checklist Documental gravados antes da v1.3 nao tem o campo 'linhas' —
        sem isso, o filtro por linha esconderia itens que sempre deveriam aparecer. Todo item
        sem o campo vira 'todas' (comum a qualquer linha), preservando o comportamento de
        antes da funcionalidade existir."""
        alterado = False
        for grupos in dados.get("documental", {}).values():
            for grupo in grupos:
                for item in grupo.get("itens", []):
                    if "linhas" not in item:
                        item["linhas"] = "todas"
                        alterado = True
        return alterado

    def _gravar(self, dados):
        self._caminho.parent.mkdir(parents=True, exist_ok=True)
        arquivo_temporario = self._caminho.with_suffix(".tmp")
        with open(arquivo_temporario, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        os.replace(arquivo_temporario, self._caminho)

    def _grupos(self, dados, painel, programa=None):
        if painel == "proponente":
            return dados["proponente"]
        if painel == "documentos":
            return dados["documentos"]
        if painel == "garantias":
            escopo, _, tipo = (programa or "").partition("_")
            if escopo not in ESCOPOS_BEM_PROPRIETARIO or tipo not in TIPOS_GARANTIA:
                raise SecaoInvalidaError(f"Escopo/tipo de garantia invalido: {programa}")
            return dados["garantias"].setdefault(programa, [])
        if painel == "area_beneficiada":
            if programa not in ESCOPOS_BEM_PROPRIETARIO:
                raise SecaoInvalidaError(f"Escopo de area beneficiada invalido: {programa}")
            return dados["area_beneficiada"].setdefault(programa, [])
        raise SecaoInvalidaError(f"Painel invalido: {painel}")

    # --- leitura publica --------------------------------------------------------------

    def obter_tudo(self):
        with self._lock:
            dados = self._carregar()
            garantias_por_tipo = {
                tipo: {
                    "bem": dados["garantias"].get(f"bem_{tipo}", []),
                    "proprietario": dados["garantias"].get(f"proprietario_{tipo}", []),
                }
                for tipo in TIPOS_GARANTIA
            }
            return {
                "proponente": dados["proponente"],
                "documentos": dados["documentos"],
                "garantias": garantias_por_tipo,
                "area_beneficiada": dados["area_beneficiada"],
                "linhas": dados["linhas"],
            }

    # --- grupos -------------------------------------------------------------------

    def criar_grupo(self, painel, programa, nome):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            grupo = _grupo_vazio(nome)
            grupos.append(grupo)
            self._gravar(dados)
            return grupo

    def atualizar_grupo(self, painel, programa, grupo_id, nome):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            for grupo in grupos:
                if grupo["id"] == grupo_id:
                    grupo["nome"] = nome
                    self._gravar(dados)
                    return grupo
            raise NaoEncontradoError(f"Grupo nao encontrado: {grupo_id}")

    def excluir_grupo(self, painel, programa, grupo_id):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            restantes = [g for g in grupos if g["id"] != grupo_id]
            if len(restantes) == len(grupos):
                raise NaoEncontradoError(f"Grupo nao encontrado: {grupo_id}")
            grupos[:] = restantes
            self._gravar(dados)

    def reordenar_grupos(self, painel, programa, ordem):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            indice = {g["id"]: g for g in grupos}
            grupos_reordenados = [indice[gid] for gid in ordem if gid in indice]
            faltantes = [g for g in grupos if g["id"] not in ordem]
            grupos[:] = grupos_reordenados + faltantes
            self._gravar(dados)
            return grupos

    # --- itens --------------------------------------------------------------------

    def criar_item(self, painel, programa, grupo_id, item_dados):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            for grupo in grupos:
                if grupo["id"] == grupo_id:
                    item = _item_vazio(item_dados.get("nome", ""))
                    item.update(_campos_validos(item_dados))
                    grupo["itens"].append(item)
                    self._gravar(dados)
                    return item
            raise NaoEncontradoError(f"Grupo nao encontrado: {grupo_id}")

    def atualizar_item(self, painel, programa, item_id, item_dados):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            for grupo in grupos:
                for item in grupo["itens"]:
                    if item["id"] == item_id:
                        item.update(_campos_validos(item_dados))
                        self._gravar(dados)
                        return item
            raise NaoEncontradoError(f"Item nao encontrado: {item_id}")

    def excluir_item(self, painel, programa, item_id):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            for grupo in grupos:
                antes = len(grupo["itens"])
                grupo["itens"] = [i for i in grupo["itens"] if i["id"] != item_id]
                if len(grupo["itens"]) != antes:
                    self._gravar(dados)
                    return
            raise NaoEncontradoError(f"Item nao encontrado: {item_id}")

    def reordenar_itens(self, painel, programa, grupo_id, ordem):
        with self._lock:
            dados = self._carregar()
            grupos = self._grupos(dados, painel, programa)
            for grupo in grupos:
                if grupo["id"] == grupo_id:
                    indice = {i["id"]: i for i in grupo["itens"]}
                    itens_reordenados = [indice[iid] for iid in ordem if iid in indice]
                    faltantes = [i for i in grupo["itens"] if i["id"] not in ordem]
                    grupo["itens"] = itens_reordenados + faltantes
                    self._gravar(dados)
                    return grupo["itens"]
            raise NaoEncontradoError(f"Grupo nao encontrado: {grupo_id}")

    # --- linhas (checklist Documental) ---------------------------------------------

    def _linhas_do_programa(self, dados, programa):
        if programa not in PROGRAMAS_DOCUMENTAL:
            raise SecaoInvalidaError(f"Programa invalido: {programa}")
        return dados["linhas"].setdefault(programa, [])

    def listar_linhas(self, programa):
        with self._lock:
            dados = self._carregar()
            return self._linhas_do_programa(dados, programa)

    def criar_linha(self, programa, nome):
        with self._lock:
            dados = self._carregar()
            linhas = self._linhas_do_programa(dados, programa)
            linha = _linha_vazia(nome)
            linhas.append(linha)
            self._gravar(dados)
            return linha

    def atualizar_linha(self, programa, linha_id, nome):
        with self._lock:
            dados = self._carregar()
            linhas = self._linhas_do_programa(dados, programa)
            for linha in linhas:
                if linha["id"] == linha_id:
                    linha["nome"] = nome
                    self._gravar(dados)
                    return linha
            raise NaoEncontradoError(f"Linha nao encontrada: {linha_id}")

    def excluir_linha(self, programa, linha_id):
        with self._lock:
            dados = self._carregar()
            linhas = self._linhas_do_programa(dados, programa)
            restantes = [l for l in linhas if l["id"] != linha_id]
            if len(restantes) == len(linhas):
                raise NaoEncontradoError(f"Linha nao encontrada: {linha_id}")
            linhas[:] = restantes
            self._gravar(dados)

    def reordenar_linhas(self, programa, ordem):
        with self._lock:
            dados = self._carregar()
            linhas = self._linhas_do_programa(dados, programa)
            indice = {l["id"]: l for l in linhas}
            linhas_reordenadas = [indice[lid] for lid in ordem if lid in indice]
            faltantes = [l for l in linhas if l["id"] not in ordem]
            linhas[:] = linhas_reordenadas + faltantes
            self._gravar(dados)
            return linhas


def _campos_validos(item_dados):
    permitidos = ("nome", "tipo", "ajuda", "template", "textoDevolutivaPadrao", "linhas", "fontes")
    return {chave: item_dados[chave] for chave in permitidos if chave in item_dados}


_instancia = None


def get_store():
    global _instancia
    if _instancia is None:
        _instancia = JsonChecklistStore()
    return _instancia
