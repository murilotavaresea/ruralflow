"""
Testes das regras do parecer (armazenamento, validacao, rotas) e da pasta de dados persistente.

Rodar na pasta backend:   python -m unittest discover -s tests -v
Usa so a biblioteca padrao + o que o backend ja exige (Flask); grava apenas em pastas temporarias.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from storage import checklist_store as cs  # noqa: E402


class BaseComPastaTemporaria(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.arquivo = Path(self.pasta) / "checklist.json"
        self.loja = cs.JsonChecklistStore(self.arquivo)

    def tearDown(self):
        shutil.rmtree(self.pasta, ignore_errors=True)


class SementeETest(BaseComPastaTemporaria):
    def test_arquivo_novo_nasce_com_as_duas_regras_iniciais(self):
        regras = self.loja.obter_tudo()["regras"]
        self.assertEqual([r["nome"] for r in regras], ["Risco R7 ou acima", "QRSA Alto"])
        self.assertTrue(all(r["id"].startswith("reg_") for r in regras))
        risco, qrsa = regras
        self.assertEqual((risco["campo"], risco["operador"], risco["valor"]), ("proponente_risco", "maior_igual", "7"))
        self.assertIn("alçadas competentes", risco["textoParecer"])
        self.assertEqual((qrsa["campo"], qrsa["operador"], qrsa["valor"]), ("proponente_qrsa", "igual", "Alto"))
        self.assertEqual(qrsa["textoParecer"], "QRSA Alto: submeter ao Nível 4.")

    def test_arquivo_antigo_sem_a_secao_regras_e_completado_sem_perder_o_resto(self):
        self.loja.obter_tudo()  # cria o arquivo
        dados = json.loads(self.arquivo.read_text(encoding="utf-8"))
        dados.pop("regras")
        dados["proponente"][0]["nome"] = "Nome customizado pelo admin"
        self.arquivo.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")

        recarregado = cs.JsonChecklistStore(self.arquivo).obter_tudo()
        self.assertEqual(len(recarregado["regras"]), 2)
        self.assertEqual(recarregado["proponente"][0]["nome"], "Nome customizado pelo admin")
        self.assertIn("regras", json.loads(self.arquivo.read_text(encoding="utf-8")))


class CrudDeRegrasTest(BaseComPastaTemporaria):
    def nova(self, **extras):
        return {"nome": "Perda esperada acima de 9,05%", "campo": "proponente_perda_esperada", "operador": "maior", "valor": "9.05", **extras}

    def test_criar_aplica_padroes_e_persiste(self):
        regra = self.loja.criar_regra(self.nova(impedeContratacao=True))
        self.assertTrue(regra["id"].startswith("reg_"))
        self.assertTrue(regra["ativa"])
        self.assertEqual(regra["fontes"], "todas")
        self.assertEqual(regra["textoParecer"], "")
        self.assertTrue(regra["impedeContratacao"])
        persistida = [r for r in cs.JsonChecklistStore(self.arquivo).obter_tudo()["regras"] if r["id"] == regra["id"]]
        self.assertEqual(len(persistida), 1)

    def test_novas_regras_entram_no_fim(self):
        regra = self.loja.criar_regra(self.nova())
        self.assertEqual(self.loja.obter_tudo()["regras"][-1]["id"], regra["id"])

    def test_valor_numerico_vira_texto(self):
        self.assertEqual(self.loja.criar_regra(self.nova(valor=7))["valor"], "7")

    def test_espacos_das_pontas_sao_removidos(self):
        regra = self.loja.criar_regra(self.nova(nome="  Regra  ", textoParecer="  texto  "))
        self.assertEqual((regra["nome"], regra["textoParecer"]), ("Regra", "texto"))

    def test_recusa_dados_invalidos(self):
        invalidos = {
            "corpo que nao e objeto": [1, 2],
            "sem nome": self.nova(nome="   "),
            "nome que nao e texto": self.nova(nome=["x"]),
            "sem campo": self.nova(campo=""),
            "campo com caracteres estranhos": self.nova(campo="proponente risco; drop"),
            "operador desconhecido": self.nova(operador="parecido_com"),
            "fontes que nao sao lista": self.nova(fontes=42),
            "fonte com caractere invalido": self.nova(fontes=["BNDES!"]),
            "booleano que nao e booleano": self.nova(impedeContratacao="sim"),
            "ativa que nao e booleano": self.nova(ativa=1),
            "texto gigante": self.nova(textoParecer="x" * 2001),
            "valor que e lista": self.nova(valor=["7"]),
        }
        for descricao, corpo in invalidos.items():
            with self.subTest(descricao):
                with self.assertRaises(cs.ValorInvalidoError):
                    self.loja.criar_regra(corpo)

    def test_atualizar_so_o_que_veio(self):
        regra = self.loja.criar_regra(self.nova(textoParecer="original"))
        atualizada = self.loja.atualizar_regra(regra["id"], {"ativa": False})
        self.assertFalse(atualizada["ativa"])
        self.assertEqual(atualizada["textoParecer"], "original")
        self.assertEqual(atualizada["campo"], "proponente_perda_esperada")

    def test_atualizar_valida_e_nao_grava_lixo(self):
        regra = self.loja.criar_regra(self.nova())
        with self.assertRaises(cs.ValorInvalidoError):
            self.loja.atualizar_regra(regra["id"], {"operador": "inexistente"})
        atual = [r for r in self.loja.obter_tudo()["regras"] if r["id"] == regra["id"]][0]
        self.assertEqual(atual["operador"], "maior")

    def test_atualizar_regra_inexistente(self):
        with self.assertRaises(cs.NaoEncontradoError):
            self.loja.atualizar_regra("reg_nao_existe", {"ativa": False})

    def test_excluir(self):
        regra = self.loja.criar_regra(self.nova())
        self.loja.excluir_regra(regra["id"])
        self.assertNotIn(regra["id"], [r["id"] for r in self.loja.obter_tudo()["regras"]])
        with self.assertRaises(cs.NaoEncontradoError):
            self.loja.excluir_regra(regra["id"])

    def test_reordenar_ignora_ids_desconhecidos_e_mantem_os_que_faltaram_no_fim(self):
        a, b = self.loja.obter_tudo()["regras"]
        c = self.loja.criar_regra(self.nova())
        ordem = self.loja.reordenar_regras([c["id"], "reg_fantasma", b["id"]])
        self.assertEqual([r["id"] for r in ordem], [c["id"], b["id"], a["id"]])

    def test_reordenar_exige_lista_de_ids(self):
        for ordem in (None, "abc", [1, 2], {"a": 1}):
            with self.subTest(ordem=ordem):
                with self.assertRaises(cs.ValorInvalidoError):
                    self.loja.reordenar_regras(ordem)


class RotasTest(BaseComPastaTemporaria):
    def setUp(self):
        super().setUp()
        patch = mock.patch.object(cs, "_instancia", self.loja)
        patch.start()
        self.addCleanup(patch.stop)
        from app import app  # importado so aqui: depende do Flask

        self.cliente = app.test_client()

    def test_referencia_inclui_as_regras(self):
        resposta = self.cliente.get("/referencia/checklist")
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(len(resposta.get_json()["regras"]), 2)

    def test_criar_editar_reordenar_excluir_pela_api(self):
        criada = self.cliente.post(
            "/admin/regras",
            json={"nome": "Estágio 3", "campo": "proponente_estagio3", "operador": "igual", "valor": "Sim", "textoParecer": "Operação em estágio 3."},
        )
        self.assertEqual(criada.status_code, 200)
        regra_id = criada.get_json()["id"]

        editada = self.cliente.put(f"/admin/regras/{regra_id}", json={"ativa": False})
        self.assertEqual(editada.status_code, 200)
        self.assertFalse(editada.get_json()["ativa"])

        ids = [r["id"] for r in self.cliente.get("/referencia/checklist").get_json()["regras"]]
        reordenada = self.cliente.put("/admin/regras/reordenar", json={"ordem": list(reversed(ids))})
        self.assertEqual(reordenada.status_code, 200)
        self.assertEqual([r["id"] for r in reordenada.get_json()], list(reversed(ids)))

        self.assertEqual(self.cliente.delete(f"/admin/regras/{regra_id}").status_code, 200)
        self.assertEqual(self.cliente.delete(f"/admin/regras/{regra_id}").status_code, 404)

    def test_dados_invalidos_voltam_400_com_mensagem(self):
        for corpo in ({}, {"nome": "x"}, {"nome": "x", "campo": "a", "operador": "xyz"}, [1, 2], None):
            with self.subTest(corpo=corpo):
                resposta = self.cliente.post("/admin/regras", json=corpo)
                self.assertEqual(resposta.status_code, 400)
                self.assertIn("erro", resposta.get_json())

    def test_reordenar_com_corpo_que_nao_e_objeto_nao_derruba_o_servidor(self):
        self.assertEqual(self.cliente.put("/admin/regras/reordenar", json=[1, 2]).status_code, 400)
        self.assertEqual(self.cliente.put("/admin/regras/reordenar", json={"ordem": "x"}).status_code, 400)

    def test_editar_regra_inexistente_da_404(self):
        self.assertEqual(self.cliente.put("/admin/regras/reg_x", json={"ativa": False}).status_code, 404)


class PastaDeDadosPersistenteTest(unittest.TestCase):
    def setUp(self):
        self.base = Path(tempfile.mkdtemp())
        self.semente = self.base / "repositorio" / "checklist.json"
        self.semente.parent.mkdir()
        self.semente.write_text('{"marcador": "semente"}', encoding="utf-8")
        self.volume = self.base / "volume"
        self.addCleanup(shutil.rmtree, self.base, True)

    def resolver(self, **ambiente):
        with mock.patch.object(cs, "_ARQUIVO_SEMENTE", self.semente), mock.patch.dict(os.environ, ambiente, clear=False):
            os.environ.pop("RURALFLOW_DATA_DIR", None) if "RURALFLOW_DATA_DIR" not in ambiente else None
            return cs._resolver_arquivo_de_dados()

    def test_sem_a_variavel_continua_usando_o_arquivo_do_repositorio(self):
        self.assertEqual(self.resolver(), self.semente)
        self.assertFalse(self.volume.exists())

    def test_com_a_variavel_a_pasta_recebe_uma_copia_na_primeira_vez(self):
        destino = self.resolver(RURALFLOW_DATA_DIR=str(self.volume))
        self.assertEqual(destino, self.volume / "checklist.json")
        self.assertEqual(json.loads(destino.read_text(encoding="utf-8")), {"marcador": "semente"})

    def test_nunca_sobrescreve_o_que_ja_existe_no_volume(self):
        self.volume.mkdir()
        (self.volume / "checklist.json").write_text('{"marcador": "editado em producao"}', encoding="utf-8")
        destino = self.resolver(RURALFLOW_DATA_DIR=str(self.volume))
        self.assertEqual(json.loads(destino.read_text(encoding="utf-8")), {"marcador": "editado em producao"})

    def test_variavel_em_branco_conta_como_nao_definida(self):
        self.assertEqual(self.resolver(RURALFLOW_DATA_DIR="   "), self.semente)


if __name__ == "__main__":
    unittest.main()
