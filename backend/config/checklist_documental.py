"""
Checklist documental por programa de credito, extraido das abas "PROPONENTE" e
"OUTROS DOCS." do PARECER 2.1 (BNDES E FUNDOS).xlsb.

Cada item tem: nome do documento, texto de ajuda (quando existir na planilha original) e
"status" (o analista marca OK / N.A. / Pendente na interface, nao ha valor aqui).

CHECKLIST_PROPONENTE cobre as verificacoes de compliance do proponente que valem para
qualquer programa (vieram da aba PROPONENTE). CHECKLIST_DOCUMENTAL cobre a documentacao
especifica de cada programa/linha — e um espelho fiel da aba "OUTROS DOCS." (BNDES, FCO
Rural, FNO, FCO Empresarial), sem misturar conteudo de outras abas (ex: "CHECKLIST BNDES"):
isso ja foi tentado numa versao anterior e ficou confuso, com itens de origem diferente
dentro do mesmo painel "Demais documentos".

Para atualizar: reexportar a aba OUTROS DOCS. do Excel e ajustar as listas abaixo. Lembrar
que isso aqui e so a "semente" inicial — depois do primeiro boot, quem manda e o conteudo
gravado em backend/data/checklist.json (editavel pelo painel de administracao).
"""

CHECKLIST_PROPONENTE = [
    {
        "grupo": "Compliance geral",
        "itens": [
            {"nome": "Trabalho escravo", "ajuda": "Verificar na \"Lista Suja\" do Ministerio do Trabalho e Emprego."},
            {"nome": "QRSA", "ajuda": "Conferir na plataforma RSAC. Nivel ALTO exige submissao ao Nivel 4."},
            {"nome": "CNDU", "ajuda": "Verificar a autenticidade da certidao."},
            {"nome": "CND embargo", "ajuda": "Se houver medidas efetivas informadas pelo cooperado, solicitar PRAD, TC, TAC e/ou documento que comprove a regularizacao (CCI 015-24)."},
            {"nome": "CND IBAMA", "ajuda": ""},
            {"nome": "CND trabalhista", "ajuda": ""},
            {"nome": "Autorizacao SICOR", "ajuda": ""},
            {"nome": "Autorizacao consulta emitentes - CPRF", "ajuda": ""},
            {"nome": "CND regularidade FGTS", "ajuda": "Exigido para PJ."},
        ],
    },
    {
        "grupo": "CAPES",
        "itens": [
            {"nome": "DAP/CAF", "ajuda": "Verificar se DAP/CAF esta lancada no CAPES do Proponente (Parceiro de Negocio > Certidoes) e se a renda cadastrada e oriunda da CAF/DAP."},
            {"nome": "PRONAF - saldo devedor em aberto", "ajuda": "MCR 10-1-34: somar o saldo devedor de todas as operacoes PRONAF vigentes do proponente; se saldo devedor + valor da operacao analisada ultrapassar R$ 450 mil, nao seguir com a operacao."},
            {"nome": "Anotacoes no CAPES", "ajuda": "Registrar cada anotacao encontrada com numero, descricao e explicacao."},
            {"nome": "Desclassificacao", "ajuda": "Se houver anotacao de desclassificacao, registrar: \"Proponente consta historico de irregularidades com desclassificacao/reclassificacao em operacoes de Credito Rural\"."},
            {"nome": "Codigo 115", "ajuda": "Condenacao em sentenca judicial transitada em julgado (crime ambiental, trabalho escravo, exploracao sexual, improbidade administrativa, corrupcao, lavagem de dinheiro, descumprimento de TAC)."},
            {"nome": "Ambiental", "ajuda": "Analisar caso a caso (acao, embargo, auto de infracao etc.) e apontar no parecer."},
            {"nome": "Crime", "ajuda": "Apresentar certidao de objeto e pe. Quando nao houver, solicitar parecer juridico do resumo do processo e anexar CNJ, antecedentes criminais e certidao TRF (civel e criminal)."},
            {"nome": "Risco superior a R12", "ajuda": "Submeter ao Nivel 4 (Resolucao Nº28/2025)."},
            {"nome": "Operacoes enquadradas em estagio 3", "ajuda": ""},
            {"nome": "Perda esperada > 6,5%", "ajuda": "Submeter ao Nivel 3 (Resolucao Nº28/2025). Informar o motivo em anotacoes mesmo quando todas sao submetidas ao Nivel 3."},
            {"nome": "Partes relacionadas", "ajuda": "Submeter ao Nivel 4. Planilha disponivel na pasta 24/25."},
            {"nome": "Renda atualizada", "ajuda": "A renda e considerada atualizada por ate 2 anos a partir da data de lancamento, conforme manual de cadastro."},
            {"nome": "Renda zerada", "ajuda": "E necessario comprovante de renda/faturamento mesmo que zerado, conforme Escopo 111 da CNAC."},
            {"nome": "BACEN", "ajuda": "A data em \"consulta realizada em\" deve ser no dia ou posterior a liberacao pela equipe de credito."},
            {"nome": "SERASA", "ajuda": "Validade de 30 dias."},
            {"nome": "CNAE", "ajuda": "Conferir se o CNAE no CAPES esta de acordo com a Inscricao Estadual do proponente e, em caso de BNDES, com a concessao."},
            {"nome": "Campo produtor", "ajuda": "Precisa estar informado o porte e somente a producao agricola cadastrada."},
        ],
    },
]

CHECKLIST_DOCUMENTAL = {
    "bndes": [
        {
            "grupo": "Documentacao BNDES",
            "itens": [
                {"nome": "Declaracao TFBD", "ajuda": "Quando a operacao estiver na taxa TFBD (dolar)."},
                {"nome": "Consulta CFI - FCC (financiavel caso a caso)", "ajuda": "Seguir orientacoes do print ao lado: https://web.bndes.gov.br/planilha-cfi/#/produto/dadosGerais"},
                {"nome": "Importados sem similar nacional", "ajuda": "Verificar cartilha orientativa na pasta de CCI e normativos. Se maquina, anexar Ex-tarifario e manter a consulta vigente no Siscomex (https://portalunico.siscomex.gov.br/portal/). Se importado, anexar Resolucao Camex vigente que ampara a condicao de importado novo sem similar nacional, e o extrato de Declaracao de Importacao de Consumo (DI). Financiamento de sistemas geradores fotovoltaicos precisa que o sistema seja composto pelas 4 partes - ler cartilha."},
                {"nome": "Consulta CFI (FINAME)", "ajuda": "https://ws.bndes.gov.br/cfi_catalogo/"},
                {"nome": "Viabilidade", "ajuda": "Para BNDES Rural, usar a \"Viabilidade do Rural\"."},
                {"nome": "Projeto / Plano Simplificado / Orcamento (FINAME)", "ajuda": "Quando Pronaf, pode utilizar o plano simplificado disponivel na DAF. Em caso de projeto externo, deve conter as informacoes do plano referente a identificacao do proponente (preenchimento da concessao)."},
                {"nome": "Projeto (quando correcao ou reforma)", "ajuda": "Verificar analise de solo (1 ano de validade), recomendacao tecnica e cronograma de execucao. A quantidade de hectares para execucao deve sempre ser redonda (ex.: 120 ha)."},
                {"nome": "Ficha de bovinos de outros imoveis", "ajuda": "Validade de 60 dias. Deve comprovar os animais informados na viabilidade (rural)."},
                {"nome": "CPRF BNDES", "ajuda": ""},
                {"nome": "Boletador", "ajuda": "IC 30293."},
                {"nome": "Print CPRF do SISBR 2.0 e cotacao", "ajuda": ""},
                {"nome": "Recibo do CAR", "ajuda": "Circular SUP/ADIG Nº 42/2024-BNDES."},
                {"nome": "Taxa", "ajuda": "Somente TFB (CCI 958/2024)."},
                {"nome": "Consulta Agrotools", "ajuda": "Referente ao recibo do CAR."},
                {"nome": "Lista de todos os fornecedores presentes no cadastro de fornecedores direto", "ajuda": "Quando o ramo de atuacao for abate e/ou fabricacao de produtos de carne bovina."},
                {"nome": "Materiais industrializados", "ajuda": ""},
                {"nome": "Data emissao NF", "ajuda": "Verificar a data de emissao da NF: deve ser de ate 12 meses antes da data da proposta na concessao de credito BNDES."},
                {"nome": "Inscricao estadual", "ajuda": "Verificar se o numero da I.E. na NF condiz com a I.E. da area beneficiada."},
                {"nome": "Chave de acesso", "ajuda": "Verificar se a chave de acesso esta correta na planilha de materiais industrializados - a chave nao pode ter espacos, para que o BNDES consiga fazer a leitura."},
                {"nome": "Valor total da NF e valor dos produtos", "ajuda": "Verificar se ha divergencia entre o valor total dos produtos e o valor total da NF - sera necessario fazer um calculo proporcional para cada produto."},
                {"nome": "NCM, CST", "ajuda": "Fazer a validacao no site: https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/finame-materiais-industrializados"},
                {"nome": "Itens da NF", "ajuda": "Conferir o NCM e o CST de todos os itens da nota, caso tenha mais de um."},
            ],
        },
    ],
    "fno": [
        {
            "grupo": "Documentacao FNO",
            "itens": [
                {"nome": "Projeto (quando correcao ou reforma)", "ajuda": "Verificar analise de solo (1 ano de validade), recomendacao tecnica e cronograma de execucao. A quantidade de hectares para execucao deve sempre ser redonda (ex.: 120 ha)."},
                {"nome": "Projeto / Roteiro de Informacoes / Orcamento", "ajuda": "Orcamento quando maquina ou veiculos."},
                {"nome": "Consulta CFI (FINAME)", "ajuda": "Ou comprovacao de que nao tem similar nacional."},
                {"nome": "CNJ", "ajuda": ""},
                {"nome": "Proposta e lista de verificacao", "ajuda": "Necessario estar assinada. Caso necessario, consultar a \"Lista de Verificacao FNO\"."},
                {"nome": "Viabilidade", "ajuda": "Validar as informacoes em relacao aos bovinos, safra, Bacen, taxa, prazo etc."},
                {"nome": "Importados sem similar nacional", "ajuda": "Verificar cartilha orientativa na pasta de CCI e normativos. Se maquina, anexar Ex-tarifario e manter a consulta vigente no Siscomex (https://portalunico.siscomex.gov.br/portal/). Se importado, anexar Resolucao Camex vigente que ampara a condicao de importado novo sem similar nacional. Financiamento de sistemas geradores fotovoltaicos precisa que o sistema seja composto pelas 4 partes - ler cartilha. Extrato de Declaracao de Importacao de Consumo (DI)."},
            ],
        },
    ],
    # "fco" reune o que antes eram os programas separados "fco_rural" e "fco_empresarial"
    # (v1.3) — agora sao linhas dentro de um unico programa FCO. A chave "linha" em cada
    # grupo abaixo e so um hint pro seed inicial (backend/storage/checklist_store.py) marcar
    # os itens como especificos daquela linha; nao afeta o funcionamento normal do app.
    "fco": [
        {
            "grupo": "Documentacao FCO Rural",
            "linha": "Rural",
            "itens": [
                {"nome": "Carta consulta (Parte I, II e III)", "ajuda": "Se a operacao for acima de R$ 1 milhao ou for a terceira operacao em 12 meses."},
                {"nome": "CNJ", "ajuda": ""},
                {"nome": "Modelo 30027", "ajuda": "Conferir se esta na versao atualizada."},
                {"nome": "Demais documentos solicitados no Modelo 30027", "ajuda": ""},
                {"nome": "Projeto / Roteiro de Informacoes / Orcamento", "ajuda": "Orcamento quando maquina; demais explicacoes no Modelo 30027. Se for veiculo, precisa de projeto que comprove a atividade agropecuaria."},
                {"nome": "Consulta CFI (FINAME)", "ajuda": "Ou comprovacao de que nao tem similar nacional (nao necessario para energia convencional)."},
                {"nome": "Certificado / Laudo de avaliacao de usado (revenda autorizada)", "ajuda": "Para maquinas usadas."},
                {"nome": "Viabilidade", "ajuda": "Validar as informacoes em relacao aos bovinos, safra, Bacen, taxa, prazo etc."},
            ],
        },
        {
            "grupo": "Documentacao FCO Empresarial",
            "linha": "Empresarial",
            "itens": [
                {"nome": "Carta consulta", "ajuda": "Se a operacao for acima de R$ 1 milhao ou for a terceira operacao no prazo de 12 meses (consultar extrato Sicor)."},
                {"nome": "CNJ", "ajuda": ""},
                {"nome": "Modelo 30028", "ajuda": "Conferir se esta na versao atualizada."},
                {"nome": "Demais documentos solicitados no Modelo 30028", "ajuda": ""},
                {"nome": "Projeto / Roteiro de Informacoes / Orcamento", "ajuda": "Orcamento quando maquina; demais explicacoes no Modelo 30038. Se for veiculo, precisa de projeto que comprove a atividade agropecuaria."},
                {"nome": "Imovel cadastrado no CAPES", "ajuda": "Verificar se o imovel esta com o cadastro completo, incluindo o simples e o avancado; mesmo que seja como participacoes, e necessario informar um imovel para o cadastro."},
                {"nome": "Dardo", "ajuda": "Esta informando no parecer a finalidade? Investimento e capital de giro associado, dissociado ou caminhoes."},
            ],
        },
    ],
}
