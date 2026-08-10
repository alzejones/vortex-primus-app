#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Adaptado de gerar_plano.py (projeto Vortex-Nutrição) para rodar como
# Vercel Python Serverless Function. Layout, cores e estilos idênticos
# ao script original — só a entrada/saída mudou (dict -> bytes em vez
# de arquivo -> arquivo).
#
from http.server import BaseHTTPRequestHandler
import json
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, PageBreak, HRFlowable, KeepTogether, Image)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from PIL import Image as PILImage

FD = os.environ.get("FONTS_DIR", os.path.join(os.path.dirname(__file__), "..", "fonts"))
pdfmetrics.registerFont(TTFont("NotoSans", f"{FD}/NotoSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Bold", f"{FD}/NotoSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-ExtraBold", f"{FD}/NotoSans-ExtraBold.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Italic", f"{FD}/NotoSans-Italic.ttf"))

# Assets de fotos dos produtos Herbalife (mesmo padrão de FONTS_DIR)
PD = os.environ.get("PRODUCTS_DIR", os.path.join(os.path.dirname(__file__), "..", "assets", "produtos"))

C_CYAN=colors.HexColor("#00D1DF");C_PINK=colors.HexColor("#FF4D8C")
C_YELLOW=colors.HexColor("#FFB800");C_DARK=colors.HexColor("#333333")
C_MUTED=colors.HexColor("#6C757D");C_BG_METRICS=colors.HexColor("#E8EBEF")
C_BORDER=colors.HexColor("#DDE2E6");C_WHITE=colors.white
C_DAY_HEADER=colors.HexColor("#006B73")
ML=1.5*cm;MR=1.5*cm;CW=A4[0]-ML-MR

def S(n,**k):return ParagraphStyle(n,**k)
ST_BODY=S("b",fontName="NotoSans",fontSize=9.5,leading=13.5,textColor=colors.HexColor("#333333"),alignment=TA_LEFT)
ST_MEAL=S("m",fontName="NotoSans-Bold",fontSize=9.5,leading=13.5,textColor=colors.HexColor("#00D2DF"),alignment=TA_LEFT)
ST_DAY=S("d",fontName="NotoSans-ExtraBold",fontSize=10,leading=12,textColor=colors.white,alignment=TA_LEFT)
ST_HDR=S("h",fontName="NotoSans-Bold",fontSize=8,leading=10,textColor=colors.white,alignment=TA_LEFT)
ST_NOME=S("n",fontName="NotoSans-Bold",fontSize=13,leading=16,textColor=colors.HexColor("#333333"),alignment=TA_LEFT)
ST_OBJ=S("o",fontName="NotoSans",fontSize=9,leading=12,textColor=colors.HexColor("#666666"),alignment=TA_LEFT)
ST_ML=S("ml",fontName="NotoSans-Bold",fontSize=7,leading=9,textColor=colors.HexColor("#6C757D"),alignment=TA_CENTER)
ST_MV=S("mv",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.HexColor("#333333"),alignment=TA_CENTER)
ST_MP=S("mp",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.HexColor("#FF4D8C"),alignment=TA_CENTER)
ST_MY=S("my",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.HexColor("#FFB800"),alignment=TA_CENTER)
ST_MC=S("mc",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.HexColor("#00D1DF"),alignment=TA_CENTER)
ST_CT=S("ct",fontName="NotoSans-ExtraBold",fontSize=11,leading=14,textColor=colors.HexColor("#00D1DF"),alignment=TA_LEFT)
ST_ES=S("es",fontName="NotoSans-Italic",fontSize=8.5,leading=13,textColor=colors.HexColor("#555555"),alignment=TA_LEFT)
ST_NT=S("nt",fontName="NotoSans-Bold",fontSize=11,leading=14,textColor=colors.HexColor("#BF3DFB"),alignment=TA_LEFT)
ST_NB=S("nb",fontName="NotoSans",fontSize=9.5,leading=14,textColor=colors.HexColor("#2C3E50"),alignment=TA_JUSTIFY)
ST_CAT=S("cat",fontName="NotoSans-Bold",fontSize=8,leading=9.5,textColor=colors.white,alignment=TA_LEFT)
ST_IT=S("it",fontName="NotoSans",fontSize=7.8,leading=10.5,textColor=colors.HexColor("#333333"),alignment=TA_LEFT)
ST_QT=S("qt",fontName="NotoSans-Bold",fontSize=7.8,leading=10.5,textColor=colors.HexColor("#6C757D"),alignment=TA_RIGHT)

COLOR_MAP={"gordura":ST_MP,"gord_visceral":ST_MP,"cal_alvo":ST_MP,"gorduras":ST_MP,
           "idade_metab":ST_MY,"carbo":ST_MY,"proteina":ST_MC,
           "peso":ST_MV,"massa_musc":ST_MV,"bmr_tdee":ST_MV}

# ------------------------------------------------------------
# Suplementação Herbalife — cores, catálogo fixo e layout
# ------------------------------------------------------------
C_ALERT_BG=colors.HexColor("#FDEDED");C_ALERT_BORDER=colors.HexColor("#E74C3C")
C_ATENCAO_BG=colors.HexColor("#FFF6E5");C_ATENCAO_BORDER=colors.HexColor("#FFB800")
C_OK_BG=colors.HexColor("#EAF7EE");C_OK_BORDER=colors.HexColor("#27AE60")

ST_PROD_TIT=S("pt",fontName="NotoSans-ExtraBold",fontSize=13,leading=16,textColor=colors.HexColor("#333333"),alignment=TA_LEFT)
ST_PROD_SUB=S("ps",fontName="NotoSans",fontSize=9,leading=12,textColor=colors.HexColor("#666666"),alignment=TA_LEFT)
ST_PROD_SABOR=S("psab",fontName="NotoSans-Italic",fontSize=8.5,leading=12,textColor=colors.HexColor("#555555"),alignment=TA_LEFT)
ST_SPEC_L=S("spl",fontName="NotoSans-Bold",fontSize=7,leading=9,textColor=colors.HexColor("#6C757D"),alignment=TA_CENTER)
ST_SPEC_V=S("spv",fontName="NotoSans-ExtraBold",fontSize=10,leading=13,textColor=colors.HexColor("#333333"),alignment=TA_CENTER)
ST_BEN_T=S("bent",fontName="NotoSans-Bold",fontSize=8.5,leading=11,textColor=colors.HexColor("#333333"),alignment=TA_LEFT)
ST_BEN_D=S("bend",fontName="NotoSans",fontSize=8.5,leading=12,textColor=colors.HexColor("#444444"),alignment=TA_LEFT)
ST_MOTIVO_TIT=S("mot",fontName="NotoSans-Bold",fontSize=9.5,leading=12,textColor=colors.HexColor("#006B73"),alignment=TA_LEFT)
ST_MOTIVO_TX=S("motx",fontName="NotoSans",fontSize=9,leading=13,textColor=colors.HexColor("#2C3E50"),alignment=TA_JUSTIFY)
ST_ALERT_TX=S("altx",fontName="NotoSans-Bold",fontSize=9,leading=13,textColor=colors.HexColor("#8B2E2E"),alignment=TA_LEFT)
ST_CATALOGO_TIT=S("catt",fontName="NotoSans-ExtraBold",fontSize=14,leading=17,textColor=colors.white,alignment=TA_LEFT)
ST_PROGRAMA_LETRA=S("progl",fontName="NotoSans-ExtraBold",fontSize=13,leading=16,textColor=colors.white,alignment=TA_CENTER)
ST_PROGRAMA_NOME=S("progn",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.white,alignment=TA_LEFT)
ST_PROGRAMA_DESC=S("progd",fontName="NotoSans",fontSize=8.5,leading=11,textColor=colors.HexColor("#F0F0F0"),alignment=TA_LEFT)
ST_PRECO_DE=S("prde",fontName="NotoSans",fontSize=8,leading=10,textColor=colors.HexColor("#F0F0F0"),alignment=TA_RIGHT)
ST_PRECO_POR=S("prpo",fontName="NotoSans-ExtraBold",fontSize=15,leading=18,textColor=colors.white,alignment=TA_RIGHT)
ST_GRID_NOME=S("grn",fontName="NotoSans-Bold",fontSize=8.5,leading=11,textColor=colors.HexColor("#333333"),alignment=TA_CENTER)
ST_GRID_DE=S("grde",fontName="NotoSans",fontSize=7.5,leading=9,textColor=colors.HexColor("#999999"),alignment=TA_CENTER)
ST_GRID_POR=S("grpo",fontName="NotoSans-ExtraBold",fontSize=10.5,leading=13,textColor=colors.HexColor("#00D1DF"),alignment=TA_CENTER)
ST_UPSELL_TX=S("uptx",fontName="NotoSans",fontSize=8.8,leading=12.5,textColor=colors.HexColor("#444444"),alignment=TA_LEFT)

DESCONTO_MYBOX=0.15  # fallback padrão (15%) se dados.desconto_percent não vier no payload

def pct_str(fracao):
    v = fracao * 100
    s = f"{v:.2f}".rstrip("0").rstrip(".") if v != int(v) else f"{int(v)}"
    return s.replace(".", ",")

# Catálogo fixo de produtos. Specs e benefícios replicam o conteúdo real já
# usado nos protocolos de suplementação Vortex Primus (confirmado nos PDFs
# de referência de Miguel Abdala Jabur Junior e Iuri Furlan Vieira), exceto
# Herbal Concentrate — nenhum PDF de referência com esse produto existia
# até o momento, então specs numéricas foram omitidas (marcadas N/D) para
# não inventar dado que não foi confirmado; apenas o texto do rótulo do
# produto (chá verde, chá preto e ervas aromáticas) foi usado.
PRODUCT_CATALOG = {
    "shake_nutrev": {
        "titulo": "SHAKE FÓRMULA 1 + NUTREV",
        "subtitulo": "Mix Para Controle de Peso · Nova Fórmula | Proteína Vegetal com Vitaminas e Minerais",
        "sabor_emb": "Sabores: Morango · Baunilha · Chocolate · Maracujá · Pote 780 g (~21 doses) NutreV: Baunilha · 30 sachês",
        "imagem": "shake_nutrev.jpg",
        "cor_barra": C_CYAN,
        "preco_base": 322.00,
        "specs": [("CALORIAS/DOSE","~230 kcal"),("PROTEÍNA","~20g"),("VITAMINAS","21 nutrientes"),
                  ("USO NO PLANO","Café da Manhã"),("FREQUÊNCIA","7x / semana")],
        "beneficios": [
            ("Proteína de Soja Isolada","Fonte completa de aminoácidos essenciais. Ativa a síntese proteica logo pela manhã e protege a massa muscular durante o protocolo calórico."),
            ("Fibras Prebióticas","Regulam a microbiota intestinal e prolongam a saciedade — base do controle inflamatório."),
            ("21 Vitaminas e Minerais","Cobertura completa para o metabolismo energético ao longo do dia."),
            ("Zinco (NutreV)","Fundamental para a manutenção hormonal e imunidade."),
            ("Vitaminas C + E (NutreV)","Antioxidantes que neutralizam radicais livres e reduzem a inflamação sistêmica."),
        ],
    },
    "whey_3w": {
        "titulo": "WHEY PROTEIN 3W",
        "subtitulo": "Blend Triplo: Whey Isolado + Concentrado + Hidrolisado · Herbalife 24 Hours",
        "sabor_emb": "Sabor Chocolate · Embalagem 510 g (~15 doses) · Não contém glúten",
        "imagem": "whey_3w.jpg",
        "cor_barra": colors.HexColor("#1E88E5"),
        "preco_base": 256.00,
        "specs": [("PROTEÍNA/DOSE","25g"),("CARBOIDRATOS","3,3g"),("CALORIAS","128 kcal"),
                  ("USO NO PLANO","Pós-Treino"),("JANELA","Até 40 min")],
        "beneficios": [
            ("Whey Isolado","Absorção ultra-rápida. Inicia a síntese proteica imediatamente após o treino."),
            ("Whey Concentrado","Absorção intermediária, sustenta o fluxo de aminoácidos por 2–3 horas."),
            ("Whey Hidrolisado","Peptídeos pré-digeridos de absorção imediata — acelera a entrega de aminoácidos ao músculo."),
            ("BCAAs (Leucina, Isoleucina, Valina)","Ativam diretamente a via mTOR de síntese proteica muscular."),
            ("Glutamina","Recuperação muscular, saúde intestinal e imunidade."),
        ],
    },
    "creatina_premium": {
        "titulo": "CREATINA PREMIUM HERBALIFE 24",
        "subtitulo": "Creatina Monohidratada 100% Pura · Vegana · 0 kcal · Sem Glúten · Herbalife 24 Hours",
        "sabor_emb": "Sabor Neutro · Pote 150 g (~50 doses de 3g) · Livre de substâncias proibidas",
        "imagem": "creatina_premium.jpg",
        "cor_barra": colors.HexColor("#2E7D32"),
        "preco_base": 181.00,
        "specs": [("CREATINA/DOSE","3.000 mg"),("CALORIAS","0 kcal"),("RENDIMENTO","~50 doses"),
                  ("USO NO PLANO","Pós-Treino"),("PAUSA","Sem necessidade")],
        "beneficios": [
            ("Creatina Monohidratada 100%","A forma mais estudada e eficaz da ciência esportiva — pureza total."),
            ("Ressíntese de ATP","Repõe o fosfato de creatina muscular, acelerando a energia celular em esforços intensos."),
            ("Aumento de Força Muscular","Permite maior carga e volume de treino — estímulo direto para hipertrofia."),
            ("Sinergia com Whey 3W","Juntos, potencializam a via mTOR de síntese proteica."),
            ("0 kcal","Não interfere no déficit ou superávit calórico do protocolo."),
        ],
    },
    "cr7_drive": {
        "titulo": "CR7 DRIVE",
        "subtitulo": "Suplemento Hidroeletrolítico para Atletas · Herbalife 24 Hours",
        "sabor_emb": "Sabor Berry Mix · Pote 810 g (~40 doses)",
        "imagem": "cr7_drive.jpg",
        "cor_barra": colors.HexColor("#F57C00"),
        "preco_base": 243.00,
        "specs": [("RENDIMENTO","~40 doses"),("USO NO PLANO","Pré-Treino"),("ANTECEDÊNCIA","20 min antes"),
                  ("ELETRÓLITOS","Na · K · Mg · Ca"),("FREQUÊNCIA","Dias de treino")],
        "beneficios": [
            ("Eletrólitos (Na, K, Mg, Ca)","Repõem os sais minerais perdidos no suor — previnem câimbras e queda de performance."),
            ("Carboidratos de Liberação Rápida","Energia imediata para os músculos, sem catabolismo em déficit calórico."),
            ("Vitaminas do Complexo B","Convertem glicose em energia muscular eficiente."),
            ("Coenzima Q10","Otimiza a produção de energia nas mitocôndrias."),
            ("Hidratação Avançada","Mantém a hidratação celular durante o esforço, retardando a fadiga."),
        ],
    },
    "fiber_concentrate": {
        "titulo": "FIBER CONCENTRATE",
        "subtitulo": "Concentrado de Fibras Solúveis · Herbalife Nutrition",
        "sabor_emb": "Sabores: Limão · Uva · Manga · Frasco 237 ml (~30 doses)",
        "imagem": "fiber_concentrate.jpg",
        "cor_barra": colors.HexColor("#43A047"),
        "preco_base": 206.00,
        "specs": [("FIBRAS/DOSE","3g"),("CALORIAS","~12 kcal"),("TIPO","Solúvel"),
                  ("USO NO PLANO","Café da Tarde"),("FREQUÊNCIA","7x / semana")],
        "beneficios": [
            ("Fibras Solúveis (Pectina + Guar)","Retardam a absorção de glicose no intestino, reduzindo o pico de insulina pós-refeição."),
            ("Efeito Prebiótico","Alimentam a microbiota benéfica — base da imunidade e regulação do peso corporal."),
            ("Controle Glicêmico","Reduzem a resposta glicêmica na refeição seguinte."),
            ("Trânsito Intestinal","Regulam o intestino de forma natural e não laxativa."),
            ("A combinação perfeita","Fibras + hidratação + sabor — forma prática de adicionar fibras funcionais ao dia."),
        ],
    },
    "herbal_concentrate": {
        "titulo": "HERBAL CONCENTRATE",
        "subtitulo": "Néctar Para o Preparo de Composto Líquido com Chá Verde, Chá Preto e Ervas Aromáticas",
        "sabor_emb": "Original",
        "imagem": "herbal_concentrate.png",
        "cor_barra": colors.HexColor("#8BC34A"),
        "preco_base": 222.00,
        "specs": [("CALORIAS/DOSE","N/D"),("USO NO PLANO","Café da Manhã (antes do Shake)"),
                  ("MODO DE PREPARO","1 dose em 240ml de água"),("FREQUÊNCIA","Diária")],
        "beneficios": [
            ("Chá Verde e Chá Preto","Blend tradicional usado para dar suporte à hidratação e ao bem-estar ao longo do dia."),
            ("Ervas Aromáticas","Compõem o composto natural, servido quente ou gelado."),
            ("Termogênico Matinal","Posicionado antes do Shake, no início do protocolo do dia."),
        ],
    },
}

PRODUCT_ORDER = ["shake_nutrev","herbal_concentrate","cr7_drive","whey_3w","creatina_premium","fiber_concentrate"]


def formatar_celular(digits):
    d = "".join(ch for ch in (digits or "") if ch.isdigit())
    if len(d) == 11:
        return f"({d[0:2]}) {d[2:7]}-{d[7:11]}"
    if len(d) == 10:
        return f"({d[0:2]}) {d[2:6]}-{d[6:10]}"
    return digits or ""

def make_on_page(coach=None, espaco_nome=None, espaco_endereco=None, celular=None):
    def on_page(canvas,doc):
        W,H=A4;canvas.saveState()
        canvas.setFillColor(colors.white);canvas.setStrokeColor(colors.HexColor("#DDE2E6"));canvas.setLineWidth(0.5)
        canvas.roundRect(1.5*cm,1.5*cm,W-3*cm,H-3*cm,4,fill=1,stroke=1)
        ht=H-1.5*cm-0.3*cm;hh=1.35*cm
        canvas.setFillColor(colors.HexColor("#00D1DF"));canvas.roundRect(1.5*cm,ht-hh,W-3*cm,hh,4,fill=1,stroke=0)
        canvas.setFont("NotoSans-ExtraBold",18);canvas.setFillColor(colors.white)
        canvas.drawString(1.5*cm+8,ht-hh+0.42*cm,"VORTEX PRIMUS")
        canvas.setFont("NotoSans-Bold",7.5);canvas.setFillColor(colors.HexColor("#DDFBFC"))
        canvas.drawString(1.5*cm+8,ht-hh+0.18*cm,"PLANO ALIMENTAR INTEGRADO")
        if espaco_nome:
            canvas.setFont("NotoSans-Bold",10);canvas.setFillColor(colors.white)
            canvas.drawRightString(W-1.5*cm-8,ht-hh+0.52*cm,espaco_nome.upper())
        canvas.setFont("NotoSans-Bold",8);canvas.setFillColor(colors.HexColor("#333333"))
        canvas.drawRightString(W-1.5*cm-8,ht-hh-0.22*cm,"EVOLUÇÃO CONSTANTE DE PERFORMANCE")
        if coach:
            canvas.setFont("NotoSans",7.5);canvas.setFillColor(colors.HexColor("#00D1DF"))
            canvas.drawRightString(W-1.5*cm-8,ht-hh-0.5*cm,f"Coach {coach}")
        canvas.setFont("NotoSans",8);canvas.setFillColor(colors.HexColor("#ADB5BD"))
        partes = [p for p in [espaco_nome, espaco_endereco, formatar_celular(celular) if celular else None] if p]
        sufixo = " - ".join(partes) if partes else (f"Coach {coach}" if coach else "")
        rodape = f"VORTEX PRIMUS © 2026  |  {sufixo}" if sufixo else "VORTEX PRIMUS © 2026"
        canvas.drawString(1.5*cm+8,1.5*cm+0.25*cm,rodape)
        canvas.restoreState()
    return on_page

def cell_m(lbl,val,vstyle,cw):
    return Table([[Paragraph(lbl,ST_ML)],[Paragraph(val,vstyle)]],colWidths=[cw-2],
        style=TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("TOPPADDING",(0,0),(-1,-1),4),
            ("BOTTOMPADDING",(0,0),(-1,-1),4),("LEFTPADDING",(0,0),(-1,-1),2),("RIGHTPADDING",(0,0),(-1,-1),2)]))

def bloco_metricas(a):
    items=[("PESO",a["peso"],"peso"),("GORDURA",a["gordura"],"gordura"),
           ("MASSA MUSC.",a["massa_musc"],"massa_musc"),("IDADE METAB.",a["idade_metab"],"idade_metab"),
           ("BMR / TDEE",a["bmr_tdee"],"bmr_tdee"),("GORD. VISCERAL",a["gord_visceral"],"gord_visceral")]
    cw=CW/6
    t=Table([[cell_m(l,v,COLOR_MAP[k],cw) for l,v,k in items]],colWidths=[cw]*6,rowHeights=[1.3*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#E8EBEF")),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#DDE2E6")),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    return t

def bloco_macros(a):
    items=[("CALORIAS ALVO",a["cal_alvo"],"cal_alvo"),("PROTEÍNAS",a["proteina"],"proteina"),
           ("CARBOIDRATOS",a["carbo"],"carbo"),("GORDURAS",a["gorduras"],"gorduras")]
    cw=CW/4
    t=Table([[cell_m(l,v,COLOR_MAP[k],cw) for l,v,k in items]],colWidths=[cw]*4,rowHeights=[1.3*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#E8EBEF")),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#DDE2E6")),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    return t

def bloco_dia(dd):
    rows=[[Paragraph(dd["dia"],ST_DAY),Paragraph("DESCRIÇÃO DO PROTOCOLO",ST_HDR)]]
    for ref,desc in dd["refeicoes"]:
        rows.append([Paragraph(ref,ST_MEAL),Paragraph(desc,ST_BODY)])
    t=Table(rows,colWidths=[3.7*cm,CW-3.7*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),C_DAY_HEADER),
        ("TOPPADDING",(0,0),(-1,0),6),("BOTTOMPADDING",(0,0),(-1,0),6),
        ("LEFTPADDING",(0,0),(-1,0),7),("RIGHTPADDING",(0,0),(-1,0),7),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#F0F2F4")]),
        ("TOPPADDING",(0,1),(-1,-1),5),("BOTTOMPADDING",(0,1),(-1,-1),5),
        ("LEFTPADDING",(0,1),(-1,-1),7),("RIGHTPADDING",(0,1),(-1,-1),7),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#DDE2E6")),
        ("LINEBELOW",(0,0),(-1,0),0.5,colors.HexColor("#DDE2E6"))]))
    return KeepTogether([t,Spacer(1,3.5*mm)])

def bloco_nota(texto,primeiro_nome):
    sep=HRFlowable(width=CW,thickness=0.75,color=colors.HexColor("#DDE2E6"),dash=(4,4))
    tit=Paragraph(f"🧬 DIRECIONAMENTO ESTRATÉGICO E NOTA CIENTÍFICA — EXCLUSIVO PARA {primeiro_nome.upper()}",ST_NT)
    ps=texto.strip().split("\n\n")
    rows=[[Paragraph(p.strip(),ST_NB)] for p in ps]+[[Spacer(1,2.5*mm)]]
    inner=Table(rows,colWidths=[CW-1.2*cm],style=TableStyle([
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    box=Table([[inner]],colWidths=[CW])
    box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F9F9F9")),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),
        ("BOX",(0,0),(-1,-1),0.75,colors.HexColor("#DDE2E6"))]))
    return [Spacer(1,3*mm),KeepTogether([sep,Spacer(1,3*mm),tit,Spacer(1,3*mm),box])]

def bloco_lista(lista):
    def make_block(cat,itens):
        rows=[[Paragraph(cat,ST_CAT),Paragraph("",ST_CAT)]]
        for item,qtd in itens:
            rows.append([Paragraph(f"◻  {item}",ST_IT),Paragraph(qtd,ST_QT)])
        t=Table(rows,colWidths=[CW*0.60,CW*0.40])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0),C_DAY_HEADER),("SPAN",(0,0),(-1,0)),
            ("TOPPADDING",(0,0),(-1,0),5),("BOTTOMPADDING",(0,0),(-1,0),5),
            ("LEFTPADDING",(0,0),(-1,0),8),("RIGHTPADDING",(0,0),(-1,0),6),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#F0F2F4")]),
            ("TOPPADDING",(0,1),(-1,-1),3),("BOTTOMPADDING",(0,1),(-1,-1),3),
            ("LEFTPADDING",(0,1),(-1,-1),8),("RIGHTPADDING",(0,1),(-1,-1),6),
            ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
            ("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#DDE2E6"))]))
        return t
    # Coluna única, categorias em sequência — cada bloco é sua própria Table
    # (paginável linha a linha pelo ReportLab). A estrutura anterior (2
    # colunas dentro de 1 única linha de tabela externa) não conseguia
    # quebrar de página quando a lista era mais longa que uma página —
    # corrigido em 2026-08 após erro real em produção (KeepTogether/Table
    # de 1 linha não é divisível).
    blocos=[]
    for cat in lista:
        blk=make_block(cat["categoria"],[(i["item"],i["qtd"]) for i in cat["itens"]])
        blocos.append(blk)
        blocos.append(Spacer(1,4*mm))
    story=[
        Paragraph("🛒  LISTA DE COMPRAS — SEMANA",ST_CT),
        Spacer(1,1*mm),
        HRFlowable(width=CW,thickness=1.5,color=colors.HexColor("#00D1DF")),
        Spacer(1,2*mm),
        Paragraph("Itens necessários para o plano semanal. Quantidades estimadas para 1 pessoa / 7 dias.",ST_ES),
        Spacer(1,5*mm),
        *blocos,
        Spacer(1,2*mm),
        HRFlowable(width=CW,thickness=0.5,color=colors.HexColor("#DDE2E6")),
        Spacer(1,2*mm),
        Paragraph("<i>* Priorize alimentos frescos e in natura. Verifique o estoque antes de comprar.</i>",
            ParagraphStyle("rod",fontName="NotoSans-Italic",fontSize=7.5,leading=11,
                textColor=colors.HexColor("#6C757D"),alignment=TA_LEFT))]
    return story


def foto_produto(nome_arquivo, max_w, max_h):
    caminho = os.path.join(PD, nome_arquivo)
    with PILImage.open(caminho) as im:
        w, h = im.size
    escala = min(max_w / w, max_h / h)
    return Image(caminho, width=w * escala, height=h * escala)

def preco_str(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def bloco_banner_visceral(aluno, n_produtos):
    gv = aluno.get("gord_visceral", "")
    if "ALERTA" in gv:
        bg, border, tag = C_ALERT_BG, C_ALERT_BORDER, "ALERTA"
    elif "Atenção" in gv:
        bg, border, tag = C_ATENCAO_BG, C_ATENCAO_BORDER, "ATENÇÃO"
    else:
        bg, border, tag = C_OK_BG, C_OK_BORDER, "CONTROLADA"
    texto = (f"GORDURA VISCERAL {gv} — {tag}: o protocolo de {n_produtos} produto"
             f"{'s' if n_produtos != 1 else ''} indicado{'s' if n_produtos != 1 else ''} foi "
             f"estruturado com base no objetivo e na avaliação de composição corporal.")
    box = Table([[Paragraph(texto, ST_ALERT_TX)]], colWidths=[CW])
    box.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),bg),("BOX",(0,0),(-1,-1),1,border),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10)]))
    return box

def bloco_produto(produto_key, motivo_curto, idx, total):
    p = PRODUCT_CATALOG[produto_key]
    header = Table([[Paragraph(f"PRODUTO {idx} — {p['titulo']} · HERBALIFE", ST_HDR)]], colWidths=[CW])
    header.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),p["cor_barra"]),
        ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
        ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8)]))

    foto = foto_produto(p["imagem"], 4.2*cm, 4.6*cm)
    info = Table([[Paragraph(p["titulo"], ST_PROD_TIT)],
                  [Paragraph(p["subtitulo"], ST_PROD_SUB)],
                  [Spacer(1,1.5*mm)],
                  [Paragraph(p["sabor_emb"], ST_PROD_SABOR)]], colWidths=[CW-4.6*cm-4*mm])
    info.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),("VALIGN",(0,0),(-1,-1),"TOP")]))

    topo = Table([[foto, info]], colWidths=[4.6*cm, CW-4.6*cm])
    topo.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0)]))

    spec_cw = CW/len(p["specs"])
    spec_row = Table([[cell_m(l,v,ST_SPEC_V,spec_cw) for l,v in p["specs"]]],
        colWidths=[spec_cw]*len(p["specs"]), rowHeights=[1.15*cm])
    spec_row.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_BG_METRICS),
        ("GRID",(0,0),(-1,-1),0.5,C_BORDER),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))

    ben_table_inner = [[Paragraph(t, ST_BEN_T), Paragraph(d, ST_BEN_D)] for t,d in p["beneficios"]]
    beneficios = Table(ben_table_inner, colWidths=[4*cm, CW-4*cm])
    beneficios.setStyle(TableStyle([
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.white,colors.HexColor("#F7F9FA")]),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("VALIGN",(0,0),(-1,-1),"TOP"),("GRID",(0,0),(-1,-1),0.4,C_BORDER)]))
    ben_header = Table([[Paragraph("COMPOSIÇÃO TÉCNICA E BENEFÍCIOS", ST_CAT)]], colWidths=[CW])
    ben_header.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_DAY_HEADER),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),8)]))

    motivo_box = None
    if motivo_curto:
        motivo_titulo = Paragraph("POR QUE ESTE PRODUTO FOI INDICADO", ST_MOTIVO_TIT)
        motivo_txt = Paragraph(motivo_curto, ST_MOTIVO_TX)
        inner = Table([[motivo_titulo],[Spacer(1,1.5*mm)],[motivo_txt]], colWidths=[CW-1*cm])
        inner.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
        motivo_box = Table([[inner]], colWidths=[CW])
        motivo_box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F0F9FA")),
            ("BOX",(0,0),(-1,-1),0.75,C_DAY_HEADER),
            ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10)]))

    story = [header, Spacer(1,3*mm), topo, Spacer(1,3*mm), spec_row, Spacer(1,4*mm),
             ben_header, beneficios]
    if motivo_box:
        story += [Spacer(1,4*mm), motivo_box]
    return story

def linha_programa(letra, cor, nome, descricao, preco_base, produto_keys, desconto, espaco_nome):
    preco_final = preco_base * (1 - desconto)
    letra_style = S(f"progl_{letra}", fontName="NotoSans-ExtraBold", fontSize=13, leading=16,
        textColor=cor, alignment=TA_CENTER)
    letra_cel = Table([[Paragraph(letra, letra_style)]], colWidths=[1.1*cm], rowHeights=[1.1*cm])
    letra_cel.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.white),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("BOX",(0,0),(-1,-1),1.5,colors.white)]))
    nome_cel = Table([[Paragraph(nome, ST_PROGRAMA_NOME)],[Paragraph(descricao, ST_PROGRAMA_DESC)]],
        colWidths=[CW-1.1*cm-4.3*cm-4.2*cm])
    nome_cel.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1),
        ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),4),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))

    fotos = [foto_produto(PRODUCT_CATALOG[k]["imagem"], 1.3*cm, 1.3*cm) for k in produto_keys]
    fotos_inner = Table([fotos], colWidths=[1.4*cm]*len(fotos)) if fotos else Table([[""]], colWidths=[4.3*cm])
    fotos_inner.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),1),("RIGHTPADDING",(0,0),(-1,-1),1)]))
    fotos_cel = Table([[fotos_inner]], colWidths=[4.3*cm])
    fotos_cel.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))

    preco_cel = Table([
        [Paragraph(f"<strike>{preco_str(preco_base)}</strike>", ST_PRECO_DE)],
        [Paragraph(f"{(espaco_nome or 'DESCONTO').upper()} {pct_str(desconto)}%", ST_PRECO_DE)],
        [Paragraph(preco_str(preco_final), ST_PRECO_POR)]], colWidths=[4.2*cm])
    preco_cel.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("RIGHTPADDING",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    row = Table([[letra_cel, nome_cel, fotos_cel, preco_cel]],
        colWidths=[1.1*cm, CW-1.1*cm-4.3*cm-4.2*cm, 4.3*cm, 4.2*cm])
    row.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),cor),
        ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    return KeepTogether([row, Spacer(1,1.5*mm)])

def bloco_catalogo_final(uso_shake, desconto, espaco_nome, pix_key):
    story = [Paragraph("PROGRAMAS NUTRICIONAIS — ESCOLHA O SEU", ST_CATALOGO_TIT)]
    header_box = Table([story], colWidths=[CW])
    header_box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_CYAN),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),10)]))
    nome_promo = (espaco_nome or "coach").upper()
    promo_txt = f"PROMOÇÃO EXCLUSIVA ALUNOS {nome_promo} — {pct_str(desconto)}% DE DESCONTO EM TODOS OS PROGRAMAS"
    promo = Table([[Paragraph(promo_txt,
        S("promo",fontName="NotoSans-Bold",fontSize=8.5,textColor=colors.white,alignment=TA_CENTER))]], colWidths=[CW])
    promo.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#E74C3C")),
        ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))

    out = [header_box, Spacer(1,2*mm), promo, Spacer(1,4*mm)]

    if uso_shake != "nenhum":
        shake = PRODUCT_CATALOG["shake_nutrev"]["preco_base"]
        fiber = PRODUCT_CATALOG["fiber_concentrate"]["preco_base"]
        whey  = PRODUCT_CATALOG["whey_3w"]["preco_base"]
        out.append(linha_programa("A", C_DAY_HEADER, "BÁSICO", "Shake + NutreV", shake,
            ["shake_nutrev"], desconto, espaco_nome))
        out.append(linha_programa("B", colors.HexColor("#2E7D32"), "REDUÇÃO GORDURA VISCERAL",
            "Shake + NutreV • Fiber Concentrate", shake+fiber, ["shake_nutrev","fiber_concentrate"], desconto, espaco_nome))
        out.append(linha_programa("C", colors.HexColor("#1E88E5"), "+ MÚSCULO",
            "Shake + NutreV • Whey 3W", shake+whey, ["shake_nutrev","whey_3w"], desconto, espaco_nome))
        out.append(linha_programa("D", colors.HexColor("#6A1B9A"), "REDUÇÃO GORDURA VISCERAL + MÚSCULO",
            "Shake + NutreV • Fiber Concentrate • Whey 3W", shake+fiber+whey,
            ["shake_nutrev","fiber_concentrate","whey_3w"], desconto, espaco_nome))
    else:
        cr7 = PRODUCT_CATALOG["cr7_drive"]["preco_base"]
        whey = PRODUCT_CATALOG["whey_3w"]["preco_base"]
        creat = PRODUCT_CATALOG["creatina_premium"]["preco_base"]
        out.append(linha_programa("A", colors.HexColor("#F57C00"), "PERFORMANCE PRÉ-TREINO",
            "CR7 Drive — pré-treino • energia • eletrólitos", cr7, ["cr7_drive"], desconto, espaco_nome))
        out.append(linha_programa("B", colors.HexColor("#1E88E5"), "PERFORMANCE + RECUPERAÇÃO",
            "CR7 Drive • Whey 3W", cr7+whey, ["cr7_drive","whey_3w"], desconto, espaco_nome))
        out.append(linha_programa("C", colors.HexColor("#2E7D32"), "RECOMPOSIÇÃO CORPORAL COMPLETO",
            "CR7 Drive • Whey 3W • Creatina Premium", cr7+whey+creat,
            ["cr7_drive","whey_3w","creatina_premium"], desconto, espaco_nome))

        shake_final = PRODUCT_CATALOG["shake_nutrev"]["preco_base"] * (1-desconto)
        upsell_txt = (f'<b>• Performance + Alta Nutrição:</b> Eleve ainda mais sua performance melhorando mais '
                      f'a qualidade de sua alimentação. Adicione o Shake e o NutreV ao seu programa Performance '
                      f'escolhido e aumente ainda mais seus resultados com a Nutrição Celular Herbalife '
                      f'(+ {preco_str(shake_final)} com desconto {(espaco_nome or "do Coach")}).')
        upsell = Table([[Paragraph(upsell_txt, ST_UPSELL_TX)]], colWidths=[CW])
        upsell.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F9F0FE")),
            ("BOX",(0,0),(-1,-1),0.75,colors.HexColor("#BF3DFB")),
            ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10)]))
        out += [Spacer(1,1*mm), upsell]

    out.append(Spacer(1,2.5*mm))
    out.append(HRFlowable(width=CW,thickness=0.5,color=C_BORDER))
    out.append(Spacer(1,1.5*mm))
    out.append(Paragraph("PRODUTOS INDIVIDUAIS — MONTE SEU PRÓPRIO PROGRAMA", ST_CT))
    out.append(Spacer(1,1.5*mm))

    cel_w = CW/3
    grid_rows = []
    linha_atual = []
    for i, key in enumerate(PRODUCT_ORDER):
        p = PRODUCT_CATALOG[key]
        foto = foto_produto(p["imagem"], 2.1*cm, 2.1*cm)
        preco_final = p["preco_base"] * (1-desconto)
        cel = Table([[foto],
                     [Paragraph(p["titulo"], ST_GRID_NOME)],
                     [Paragraph(f"<strike>{preco_str(p['preco_base'])}</strike>", ST_GRID_DE)],
                     [Paragraph(preco_str(preco_final), ST_GRID_POR)]], colWidths=[cel_w-6])
        cel.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),
            ("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1),
            ("LEFTPADDING",(0,0),(-1,-1),3),("RIGHTPADDING",(0,0),(-1,-1),3)]))
        linha_atual.append(cel)
        if len(linha_atual) == 3:
            grid_rows.append(linha_atual); linha_atual = []
    if linha_atual:
        while len(linha_atual) < 3:
            linha_atual.append(Spacer(cel_w,1))
        grid_rows.append(linha_atual)

    grid = Table(grid_rows, colWidths=[cel_w]*3)
    grid.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.4,C_BORDER),
        ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    out.append(grid)
    out.append(Spacer(1,2*mm))
    out.append(HRFlowable(width=CW,thickness=0.5,color=C_BORDER))
    out.append(Spacer(1,2*mm))

    pix_valor = pix_key.strip() if pix_key and pix_key.strip() else "Solicite a chave PIX ao seu Coach"
    cc_texto = 'em até 3x sem juros<br/><font size="7">Solicite o link para pagamento ao seu Coach</font>'

    titulo_pagto = Paragraph("CONDIÇÕES DE PAGAMENTO", ST_CT)
    cond = Table([[Paragraph("PAGAMENTO VIA PIX", S("pixt",fontName="NotoSans-Bold",fontSize=8,textColor=colors.white,alignment=TA_CENTER)),
                   Paragraph("CARTÃO DE CRÉDITO", S("cct",fontName="NotoSans-Bold",fontSize=8,textColor=C_DARK,alignment=TA_CENTER))],
                  [Paragraph(pix_valor, S("pixv",fontName="NotoSans-Bold",fontSize=10,textColor=colors.white,alignment=TA_CENTER,leading=13)),
                   Paragraph(cc_texto, S("ccv",fontName="NotoSans-Bold",fontSize=10,textColor=C_DARK,alignment=TA_CENTER,leading=13))]],
                 colWidths=[CW/2,CW/2])
    cond.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),C_DAY_HEADER),
        ("BACKGROUND",(1,0),(1,-1),colors.HexColor("#E8EBEF")),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("GRID",(0,0),(-1,-1),0.4,C_BORDER)]))

    # Título e tabela de pagamento agrupados: sem isso, o ReportLab pode
    # deixar o título sozinho no fim de uma página e jogar só a tabela
    # pra próxima (bug real visto em produção em 2026-08).
    out.append(KeepTogether([titulo_pagto, Spacer(1,2*mm), cond]))
    return out

def gerar_bytes(dados: dict) -> bytes:
    aluno=dados["aluno"];cardapio=dados["cardapio"];nota=dados["nota"]
    lista=dados.get("lista_compras",[]);coach=dados.get("coach")
    espaco_nome=dados.get("espaco_nome") or None
    pix_key=dados.get("pix_key") or None
    espaco_endereco=dados.get("espaco_endereco") or None
    coach_celular=dados.get("coach_celular") or None
    desconto_percent_raw=dados.get("desconto_percent")
    try:
        desconto=float(desconto_percent_raw)/100 if desconto_percent_raw is not None else DESCONTO_MYBOX
    except (TypeError, ValueError):
        desconto=DESCONTO_MYBOX
    primeiro_nome=aluno["nome"].split()[0]
    buf=BytesIO()
    doc=SimpleDocTemplate(buf,pagesize=A4,
        leftMargin=1.8*cm,rightMargin=1.8*cm,topMargin=3.2*cm,bottomMargin=1.8*cm,
        title=f'Plano Alimentar — {aluno["nome"]}',author="Vortex Primus / MyBox Irajá")
    story=[]
    story.append(Paragraph(aluno["nome"],ST_NOME));story.append(Spacer(1,2*mm))
    story.append(Paragraph(f'Objetivo Principal: <font name="NotoSans-Bold">{aluno["objetivo"]}</font>',ST_OBJ))
    story.append(Spacer(1,4*mm));story.append(bloco_metricas(aluno));story.append(Spacer(1,3*mm))
    story.append(Paragraph("METAS DE MACRONUTRIENTES DIÁRIAS (AJUSTE DE PRECISÃO)",ST_CT))
    story.append(Spacer(1,1.5*mm));story.append(bloco_macros(aluno));story.append(Spacer(1,5*mm))
    story.append(Paragraph("PLANEJAMENTO NUTRICIONAL DE 7 DIAS",ST_CT));story.append(Spacer(1,2*mm))
    story.append(Paragraph("*Estratégia Funcional: Cardápio estruturado com alimentos in natura e sólidos. O fracionamento proteico protege a musculatura e ativa o gasto digestivo. O protocolo Herbalife potencializa a termogênese, a hidratação e o controle glicêmico ao longo do dia.",ST_ES))
    story.append(Spacer(1,4*mm))
    story.append(bloco_dia(cardapio[0]));story.append(PageBreak())
    story.append(bloco_dia(cardapio[1]));story.append(bloco_dia(cardapio[2]));story.append(PageBreak())
    story.append(bloco_dia(cardapio[3]));story.append(bloco_dia(cardapio[4]));story.append(PageBreak())
    story.append(bloco_dia(cardapio[5]));story.append(bloco_dia(cardapio[6]))
    story+=bloco_nota(nota,primeiro_nome)
    if lista:story.append(PageBreak());story+=bloco_lista(lista)

    herbalife=dados.get("herbalife")
    produtos_inclusos=herbalife.get("produtos_inclusos",[]) if herbalife else []
    if produtos_inclusos:
        story.append(PageBreak())
        story.append(Paragraph("INDICAÇÃO DE SUPLEMENTAÇÃO HERBALIFE",ST_CT))
        story.append(Spacer(1,2*mm))
        story.append(bloco_banner_visceral(aluno,len(produtos_inclusos)))
        story.append(Spacer(1,4*mm))
        for idx,item in enumerate(produtos_inclusos,start=1):
            story.append(PageBreak())
            story+=bloco_produto(item["produto"],item.get("motivo_curto",""),idx,len(produtos_inclusos))
        story.append(PageBreak())
        story+=bloco_catalogo_final(herbalife.get("uso_shake","nenhum"), desconto, espaco_nome, pix_key)

    doc.build(story,
        onFirstPage=make_on_page(coach, espaco_nome, espaco_endereco, coach_celular),
        onLaterPages=make_on_page(coach, espaco_nome, espaco_endereco, coach_celular))
    return buf.getvalue()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            dados = json.loads(body)
            pdf_bytes = gerar_bytes(dados)
            nome_arq = dados.get("aluno", {}).get("nome", "aluno").split()[0].lower()
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="plano-alimentar-{nome_arq}.pdf"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(pdf_bytes)
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
