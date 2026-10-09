"""
Checklist da area beneficiada (imovel(is) rural(is) onde o credito sera aplicado), extraido
da aba "AREA BEN." do PARECER 2.1 (BNDES E FUNDOS).xlsb.

A aba original tem espaco pra ate 10 imoveis, cada um com ate 5 proprietarios — mas a
estrutura de documentos exigidos e identica em todos os blocos, entao aqui ela vira duas
listas de grupos so: uma pro checklist do imovel (BEM) e outra pro checklist de cada
proprietario, do mesmo jeito que ja existe em checklist_garantias.py (bem + garantidor), so
que sem a dimensao "tipo" — area beneficiada nao varia por tipo de garantia, mas cada item
pode ser marcado como especifico de uma ou mais fontes/linhas (mesmo mecanismo de
"fontes"/"linhas" do Proponente e Demais Documentos, ver storage/checklist_store.py).

Usado apenas para semear backend/data/checklist.json na primeira execucao — depois disso o
conteudo vivo fica no arquivo, editavel pelo painel de administracao.
"""

CHECKLIST_AREA_BENEFICIADA_BEM = [
    {
        "grupo": "Documentos do imóvel",
        "itens": [
            {
                "nome": "DAP/CAF ativa",
                "ajuda": "> Não aceita para FUNDOS CONSTITUCIONAIS (https://smap14.mda.gov.br/extratodap/)\n"
                "- Verificar se DAP/CAF está lançada no CAPES do Proponente: Parceiro de Negócios > Certidões.\n"
                "- Verificar se a renda cadastrada é oriunda da CAF/DAP.",
            },
            {
                "nome": "Matrícula",
                "ajuda": "CONFERIR:\n> Validade: 12 meses\n> Consta usufruto, espólio, processos judiciais, desmembramento, etc",
            },
            {
                "nome": "Contrato de arrendamento / anuência",
                "ajuda": "> Deve constar clausula que permita dar em penhor a produção\n"
                "> Verificar quantidade permitida para exploração no arrendamento - anuência",
            },
            {
                "nome": "Contrato social",
                "ajuda": "Se o imóvel for arrendado e a proprietária seja uma PJ atentar-se a:\n"
                "1.Pesquisar na junta comercial a última atualização;\n"
                "2.Verificar se no capes está atualizado de acordo com a ultima atualização.\n"
                "3.Verificar se é passível em estar operando com bndes e fundos (principalmente nas atas).\n"
                "4.Verificar se é possível arrendar as áreas pertencentes aquela PJ.",
            },
            {
                "nome": "Croqui - roteiro de acesso",
                "ajuda": "> Que contenha a descrição correta da localização de como chegar ao imóvel",
            },
            {"nome": "Recibo do CAR", "ajuda": ""},
            {"nome": "Demonstrativo do CAR", "ajuda": ""},
            {"nome": "NIRF", "ajuda": "> Dispensado para PRONAF OU ITR"},
            {"nome": "Dispensa ou outorga d'água", "ajuda": ""},
            {
                "nome": "Declaração de adequação ao zoneamento ecológico-econômico (ZEE)",
                "ajuda": "> Se for assinatura digita: validar",
            },
            {
                "nome": "Dispensa ou licença ambiental",
                "ajuda": "> RO - inexigibilidade;\n> MT - APF\n"
                "> Verificar ao tipo de atividade, deve estar de acordo com a finalidade do crédito\n\n"
                "PARA OPERAÇÕES FINAME - MÁQUINAS E EQUIPAMENTOS ISOLADOS OU MI, NÃO É NECESSÁRIO SOLICITAR LICENÇA AMBIENTAL\n\n"
                "PARA PCA (automático)\n"
                ">Solicitar LP (licença prévia) ou LI (licença de instação) para novos\n"
                ">LO (licença de operação) para ampliação",
            },
            {
                "nome": "Agrotools",
                "ajuda": "> Realizar a verificação da área enviada pelo projetista\n\n"
                ">Se possuir sobreposição com prodes/mapbiomas:\n"
                "a) 1º de abril de 2026, quando se tratar de imóveis com área superior a quatro módulos fiscais; e\n"
                "b) 4 de janeiro de 2027, quando se tratar de imóveis com área de até quatro módulos fiscais\n"
                "Foi constatado supressão da vegetação após 31/07/2019, conforme MCR 2-9-17. O cooperado só poderá "
                "acessar o crédito rural ao apresentar as documentações previstas no MCR 2-9-18.\n\n"
                "> Se possuir sobreposição com FPB:\n"
                "Apresentar imóvel matrícula no registro de imóveis;\n"
                "Imóveis com até quinze módulos fiscais, desde que seja mantida a vegetação nativa na área de "
                "Floresta Pública Tipo B e a área ocupada pelo empreendimento a ser financiado não esteja inserida, "
                "total ou parcialmente, na respectiva Floresta Pública.\n\n"
                "> Se possuir sobreposição com embargo:\n"
                "MCR 2-9-10 até 2-9-13\n\n"
                ">Se possuir sobreposição com UC (unidade de conservação):\n"
                "Na ausência de PLANO DE MANEJO para RESEX (reserva extrativista), Floresta Nacional e Reserva de "
                "Desenvolvimento Sustentável, será admitida para a concessão de crédito:\n"
                "1.Anuência publicada no Sítio Eletrônico do órgão oficial, desde que:\n"
                "1.1 A operação seja de PRONAF\n"
                "1.2 As atividades produtivas sejam destinadas a implementação de práticas sustentáveis sejam "
                "compatíveis com os objetos de criação da Unidade.",
            },
            {"nome": "Inscrição estadual", "ajuda": ""},
            {
                "nome": "Contrato de condomínio",
                "ajuda": "> Pode ser utilizado também o contrato de parceria exploração rural, desde que conste "
                "o percentual de cada envolvido",
            },
            {"nome": "Ficha do contribuinte", "ajuda": ""},
            {
                "nome": "Imóvel avançado no CAPES",
                "ajuda": "> Deve estar completo, informando a matrícula, endereço do imóvel;",
            },
            {
                "nome": "Ficha de bovinos do imóvel beneficiado",
                "ajuda": "> Validade: 60 dias - Mesmo que zerada, deve ser apresentadas para operações de CNAE PECUÁRIO",
            },
            {
                "nome": "Anotações que vai precisar serem descritas para o CCS?",
                "ajuda": "PEM, PEP, CRIME AMBIENTAL, EMBARGO E QUALQUER OUTRA ANOTAÇÃO QUE VÁ GERAR DEVOLUTIVA DO CCS",
            },
        ],
    },
]

CHECKLIST_AREA_BENEFICIADA_PROPRIETARIO = [
    {
        "grupo": "Documentos do proprietário",
        "itens": [
            {
                "nome": "CND embargo",
                "ajuda": "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php",
            },
            {"nome": "CND IBAMA", "ajuda": "https://servicos.ibama.gov.br/sicafiext/"},
            {
                "nome": "Proprietário do imóvel",
                "ajuda": "Possui um cadastro simples com:\n"
                "> ESTADO E CIDADE DE NASCIMENTO\n"
                "> ESTADO CIVIL\n"
                "> CPF DO CONJUGUE E REGIME DE CASAMENTO",
            },
            {
                "nome": "Cadastro compartilhado",
                "ajuda": "> 1º CAPES -> PARCEIRO DE NEGÓCIO -> INSTITUIÇÕES DE RELACIONAMENTO "
                "(TEM QUE POSSUIR A INSTITUIÇÃO 1).",
            },
        ],
    },
]
