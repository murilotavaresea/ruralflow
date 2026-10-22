"""
Regras do parecer: ponto de partida (semente). Cada regra liga UMA condicao sobre um dado da
operacao a um efeito:

    QUANDO <campo> <operador> <valor>   [vale para: todas as fontes | fontes marcadas]
    ENTAO  texto no Parecer  e/ou  texto na Devolutiva  e/ou  "impede a contratacao"

Estas duas regras so existem na primeira vez que o arquivo de dados e criado (ou quando um
arquivo antigo ainda nao tem a secao "regras"); depois disso tudo e editavel na Administracao
(aba "Regras do parecer") — criar, editar, desativar, reordenar e excluir.

`campo` e a chave do campo no catalogo do frontend (frontend/src/utils/regrasModel.js).
Nos textos, {nome} e substituido pelo valor do dado — ex.: {risco} vira "R7".
"""

REGRAS_PADRAO = [
    {
        "nome": "Risco R7 ou acima",
        "ativa": True,
        "campo": "proponente_risco",
        "operador": "maior_igual",
        "valor": "7",
        "fontes": "todas",
        "impedeContratacao": False,
        "textoParecer": "Cooperado com risco {risco}: a operação deve ser deliberada pelas alçadas competentes.",
        "textoDevolutiva": "",
    },
    {
        "nome": "QRSA Alto",
        "ativa": True,
        "campo": "proponente_qrsa",
        "operador": "igual",
        "valor": "Alto",
        "fontes": "todas",
        "impedeContratacao": False,
        "textoParecer": "QRSA Alto: submeter ao Nível 4.",
        "textoDevolutiva": "",
    },
]
