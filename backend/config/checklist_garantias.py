"""
Checklist e modelos de texto juridico dos modulos de garantia, extraidos das abas HIPOTECA -
ALIENACAO IMOVEL, AVALISTA, PENHOR PEC., PENHOR AGR. e ALIENACAO do
PARECER 2.1 (BNDES E FUNDOS).xlsb.

Cada tipo de garantia tem duas listas de grupos: uma para o checklist do BEM dado em garantia
(documentos do imovel/bem + o modelo de descricao juridica, que e so mais um item do tipo
"texto") e outra para o checklist de cada GARANTIDOR (dono do bem ou avalista).

Usado apenas para semear backend/data/checklist.json na primeira execucao — depois disso o
conteudo vivo fica no arquivo, editavel pelo painel de administracao.
"""

TIPOS_GARANTIA = (
    "hipoteca",
    "alienacao_imovel",
    "alienacao_movel",
    "penhor_pecuario",
    "penhor_agricola",
    "aval",
)

_CHECKLIST_GARANTIDOR_PADRAO = [
    {
        "grupo": "Documentação do garantidor",
        "itens": [
            {"nome": "Negativa de união estável", "ajuda": "Se estado civil diferente de casado, modelo no Sharepoint."},
            {"nome": "Contrato social ou estatuto (quando PJ)", "ajuda": "Que comprove a permissão em ofertar bens em garantia."},
            {"nome": "Renda atualizada", "ajuda": "Quando renda zerada, é necessário comprovante de renda/faturamento mesmo que zerado, conforme Escopo 111 da CNAC."},
            {"nome": "Cadastro compartilhado", "ajuda": "1º CAPES > Parceiro de Negócio > Instituições de Relacionamento (precisa ter a Instituição 1). 2º CAPES > Produtos Bancoob > Endereço de Correspondência. 3º CAPES > Produtos Bancoob > Dados do Cliente."},
            {"nome": "CND regularidade FGTS", "ajuda": "Se PJ."},
        ],
    },
]

CHECKLIST_GARANTIAS_BEM = {
    "hipoteca": [
        {
            "grupo": "Documentação do imóvel",
            "itens": [
                {"nome": "Inteiro teor", "ajuda": "Validade = 30 dias."},
                {"nome": "Certidão de inexistência de ônus dos bens incorporados ao imóvel", "ajuda": ""},
                {"nome": "NIRF", "ajuda": ""},
                {"nome": "CCIR", "ajuda": ""},
                {"nome": "Laudo", "ajuda": "Hipoteca e alienação: 1 ano. Guarda-chuva: 5 anos."},
                {"nome": "Imóvel no CAPES em avançado", "ajuda": "Para BNDES e Fundos é obrigatório o preenchimento."},
                {"nome": "Avaliação do imóvel no CAPES", "ajuda": "A aba de avaliação do imóvel deve estar preenchida de acordo com o laudo."},
                {"nome": "Recibo do CAR", "ajuda": ""},
                {"nome": "Consulta Agrotools", "ajuda": "Realizar a verificação de área e anexar documento no dossiê com print da situação ambiental. Se houver impedimentos ambientais, apontar ao comitê para deliberação."},
                {"nome": "Soma das garantias reais > 30%", "ajuda": "Se não, referendar no CONSAD."},
            ],
        },
        {
            "grupo": "Descrição legal",
            "itens": [
                {
                    "nome": "Modelo de descrição da hipoteca",
                    "tipo": "texto",
                    "template": "HIPOTECA CEDULAR DE {grau}º GRAU SOBRE O SEGUINTE BEM: DESCRIÇÃO IGUAL AO INÍCIO DA MATRÍCULA - NÃO INCLUINDO OS LIMITES E CONFRONTAÇÕES - MELHOR CARACTERIZADO E DESCRITO NA MATRÍCULA {matricula}, DATA {data}, LIVRO {livro}, CARTÓRIO {cartorio}, COMARCA DE {comarca}. A GARANTIA ABRANGE O IMÓVEL E TODAS AS ACESSÕES, BENFEITORIAS, MELHORAMENTOS, CONSTRUÇÕES E INSTALAÇÕES.",
                    "ajuda": "Modelo extraído da aba HIPOTECA - ALIENAÇÃO IMÓVEL do Excel original.",
                },
            ],
        },
    ],
    "alienacao_imovel": [
        {
            "grupo": "Documentação do imóvel",
            "itens": [
                {"nome": "Orçamento atualizado", "ajuda": "Verificar se possui assinatura do proponente e vendedor. Se não houver data de validade, o prazo é de 30 dias."},
                {"nome": "Soma das garantias reais > 30%", "ajuda": "Se não, referendar no CONSAD."},
            ],
        },
        {
            "grupo": "Descrição legal",
            "itens": [
                {
                    "nome": "Modelo de descrição da alienação de imóvel",
                    "tipo": "texto",
                    "template": "O(S) EMITENTE(S) ENTREGA(M), NESTE ATO, EM ALIENAÇÃO FIDUCIÁRIA, O(S) BEM(NS) LIVRE(S) E DESEMBARAÇADO(S) DE QUAISQUER ÔNUS, INCLUSIVE DÉBITOS FISCAIS, A SEGUIR DESCRITO(S): IMÓVEL RURAL/URBANO DENOMINADO \"{nome_imovel}\", MEDINDO {area} HA, SITUADO NO MUNICÍPIO DE {municipio}-{uf}, COMARCA DE {comarca}, COM SEUS LIMITES E CONFRONTAÇÕES MELHOR CARACTERIZADOS E DESCRITOS NA MATRÍCULA {matricula}, LIVRO {livro}, {cartorio}.",
                    "ajuda": "Modelo extraído da aba ALIENAÇÃO do Excel original.",
                },
            ],
        },
    ],
    "alienacao_movel": [
        {
            "grupo": "Documentação do bem",
            "itens": [
                {"nome": "Consulta ao Sistema Nacional de Gravames", "ajuda": "Necessária quando for alienação de veículos usados."},
                {"nome": "Tabela FIPE", "ajuda": "Em caso de veículos usados, consultar a tabela FIPE."},
                {"nome": "Código FINAME", "ajuda": "Não se aplica para veículos utilitários."},
            ],
        },
        {
            "grupo": "Descrição legal",
            "itens": [
                {
                    "nome": "Modelo de descrição da alienação de bem móvel",
                    "tipo": "texto",
                    "template": "O(S) EMITENTE(S) ENTREGA(M), NESTE ATO, EM ALIENAÇÃO FIDUCIÁRIA, O(S) BEM(NS) LIVRE(S) E DESEMBARAÇADO(S) DE QUAISQUER ÔNUS, INCLUSIVE DÉBITOS FISCAIS, A SEGUIR DESCRITO(S): {descricao_bem}, MARCA {marca}, SITUADO NA PROPRIEDADE {propriedade}, MUNICÍPIO DE {municipio}-{uf}. SE O BEM ALIENADO FIDUCIARIAMENTE FOR VEÍCULO AUTOMOTOR, A MENÇÃO À GARANTIA DEVE CONSTAR DO CERTIFICADO DE REGISTRO.",
                    "ajuda": "Modelo extraído da aba ALIENAÇÃO do Excel original.",
                },
            ],
        },
    ],
    "penhor_pecuario": [
        {
            "grupo": "Documentação do rebanho",
            "itens": [
                {"nome": "Sem warrant", "ajuda": ""},
                {"nome": "Estimativa de penhor", "ajuda": "Laudo do bem inserido em garantia - exceto para máquinas ou equipamentos."},
                {"nome": "CND de ônus penhor", "ajuda": ""},
                {"nome": "Orçamento", "ajuda": "Apresentar quando penhor de máquinas ou equipamentos - válido 30 dias."},
                {"nome": "Consulta CFI", "ajuda": ""},
                {"nome": "Soma das garantias reais > 30%", "ajuda": "Se não, referendar no CONSAD."},
            ],
        },
        {
            "grupo": "Descrição legal",
            "itens": [
                {
                    "nome": "Modelo de descrição do penhor pecuário",
                    "tipo": "texto",
                    "template": "PENHOR CEDULAR DE {grau}º GRAU O SEGUINTE BEM: {quantidade} BOVINOS {sexo}, COM IDADE ACIMA DE {idade_meses} MESES, IDENTIFICADAS COM A MARCA {marca}, NA ANCA DO LADO {lado}, QUE ESTÃO OU SERÃO APASCENTADAS NA FAZENDA {fazenda}, MATRÍCULA {matricula}, LOCALIZADO NO MUNICÍPIO DE {municipio}-{uf}, PROPRIEDADE DE {proprietario}. VALOR UNITÁRIO DE R$ {valor_unitario}, TOTALIZANDO O VALOR DE R$ {valor_total}.",
                    "ajuda": "Modelo extraído da aba PENHOR PEC. do Excel original (variante bovinos; adaptar para maquinários se necessário).",
                },
            ],
        },
    ],
    "penhor_agricola": [
        {
            "grupo": "Documentação da lavoura",
            "itens": [
                {"nome": "Estimativa de penhor", "ajuda": "Laudo do bem inserido em garantia - exceto para máquinas e equipamentos."},
                {"nome": "CND de ônus penhor", "ajuda": ""},
                {"nome": "Orçamento", "ajuda": "Apresentar quando penhor de máquinas ou equipamentos - válido 30 dias."},
                {"nome": "Consulta CFI", "ajuda": ""},
                {"nome": "Soma das garantias reais > 30%", "ajuda": "Se não, referendar no CONSAD."},
            ],
        },
        {
            "grupo": "Descrição legal",
            "itens": [
                {
                    "nome": "Modelo de descrição do penhor agrícola",
                    "tipo": "texto",
                    "template": "PENHOR CEDULAR DE {grau}º GRAU O SEGUINTE BEM: {quantidade} SACAS DE {cultura} DE 60 KG CADA, TIPO EXPORTAÇÃO, QUE SERÃO PRODUZIDAS DURANTE A SAFRA {safra}, NA FAZENDA {fazenda}, MATRÍCULA {matricula}, LOCALIZADO NO MUNICÍPIO DE {municipio}-{uf}, PROPRIEDADE DE {proprietario}. VALOR UNITÁRIO DE R$ {valor_unitario} A SACA, TOTALIZANDO O VALOR DE R$ {valor_total}.",
                    "ajuda": "Modelo extraído da aba PENHOR AGR. do Excel original.",
                },
            ],
        },
    ],
    "aval": [],
}

CHECKLIST_GARANTIAS_PROPRIETARIO = {
    "hipoteca": _CHECKLIST_GARANTIDOR_PADRAO,
    "alienacao_imovel": _CHECKLIST_GARANTIDOR_PADRAO,
    "alienacao_movel": _CHECKLIST_GARANTIDOR_PADRAO,
    "penhor_pecuario": _CHECKLIST_GARANTIDOR_PADRAO,
    "penhor_agricola": _CHECKLIST_GARANTIDOR_PADRAO,
    "aval": [
        {
            "grupo": "Documentação do avalista",
            "itens": [
                {"nome": "Negativa de união estável", "ajuda": "Se estado civil diferente de casado, modelo no Sharepoint."},
                {"nome": "QRSA", "ajuda": "Conferir na plataforma RSAC. Se nível alto, submeter ao Nível 4."},
                {"nome": "CND regularidade FGTS", "ajuda": "Se PJ."},
                {"nome": "Renda atualizada", "ajuda": ""},
                {"nome": "Renda zerada", "ajuda": "É necessário comprovante de renda/faturamento mesmo que zerado, conforme Escopo 111 da CNAC."},
                {"nome": "Renda atualizada do cônjuge", "ajuda": ""},
                {"nome": "Se proponente PJ, vincular um sócio como avalista", "ajuda": "Se PJ, verificar se o contrato social e alterações estão no CAPES."},
                {"nome": "Anotações de crime", "ajuda": "Apresentar certidão de objeto e pé. Quando não houver, solicitar parecer jurídico do resumo do processo e anexar CNJ, antecedentes criminais e certidão TRF (cível e criminal)."},
                {"nome": "SERASA", "ajuda": "Validade de 30 dias."},
                {"nome": "BACEN", "ajuda": ""},
                {"nome": "Cadastro compartilhado (avalista e cônjuge)", "ajuda": "1º CAPES > Parceiro de Negócio > Instituições de Relacionamento (precisa ter a Instituição 1). 2º CAPES > Produtos Bancoob > Endereço de Correspondência. 3º CAPES > Produtos Bancoob > Dados do Cliente."},
            ],
        },
    ],
}
