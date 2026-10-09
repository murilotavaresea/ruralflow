"""
Regras de enquadramento FNO extraidas da aba "BASE DE DADOS - FNO" e da formula de porte da
aba "PROPONENTE" (celula G49) do PARECER 2.1 (BNDES E FUNDOS).xlsb.

O bloco de "LIMITE FINANCIAVEL" da planilha original (BASE DE DADOS - FNO!A7:D11) esta
preenchido com valores placeholder (100, 90...) que nao representam limites reais em R$ —
por isso o limite financiavel e um campo preenchido manualmente na interface, com a mesma
nota de ajuda que a planilha usa ("Programacao FNO, pag. 23"), em vez de um automatismo
quebrado.
"""

# Faixas de RAB (Receita Operacional Bruta) para classificacao de porte do produtor,
# formula original: IF(renda<=360000,"Mini/Micro", IF(renda<=4800000,"Pequeno",
# IF(4800000<=renda<16000000,"Pequeno-Medio", IF(renda>=16000000,"PORTE NAO ATENDIDO PELO SICOOB"))))
FAIXAS_PORTE_FNO = [
    {"limite_maximo": 360000, "porte": "Mini/Micro"},
    {"limite_maximo": 4800000, "porte": "Pequeno"},
    {"limite_maximo": 16000000, "porte": "Pequeno-Medio"},
    {"limite_maximo": None, "porte": "PORTE NAO ATENDIDO PELO SICOOB"},
]

# Prazo por tipo de empreendimento FNO (BASE DE DADOS - FNO!B19:D21). Agricola Semifixo e
# Pecuario Semifixo nao tinham prazo preenchido na planilha original.
PRAZO_POR_EMPREENDIMENTO_FNO = [
    {"tipo": "Caminhonete", "prazo": "60 meses, sendo 12 de carencia"},
    {"tipo": "Agricola Fixo", "prazo": "144 meses, sendo 72 de carencia"},
    {"tipo": "Pecuario Fixo", "prazo": "120 meses, sendo 72 de carencia"},
    {"tipo": "Agricola Semifixo", "prazo": None},
    {"tipo": "Pecuario Semifixo", "prazo": None},
]
