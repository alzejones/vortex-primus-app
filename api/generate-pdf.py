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
    TableStyle, PageBreak, HRFlowable, KeepTogether)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT

FD = os.environ.get("FONTS_DIR", os.path.join(os.path.dirname(__file__), "..", "fonts"))
pdfmetrics.registerFont(TTFont("NotoSans", f"{FD}/NotoSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Bold", f"{FD}/NotoSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-ExtraBold", f"{FD}/NotoSans-ExtraBold.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Italic", f"{FD}/NotoSans-Italic.ttf"))

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

def make_on_page(coach=None):
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
        canvas.setFont("NotoSans-Bold",10);canvas.setFillColor(colors.white)
        canvas.drawRightString(W-1.5*cm-8,ht-hh+0.52*cm,"MYBOX IRAJÁ")
        canvas.setFont("NotoSans-Bold",8);canvas.setFillColor(colors.HexColor("#333333"))
        canvas.drawRightString(W-1.5*cm-8,ht-hh-0.22*cm,"EVOLUÇÃO CONSTANTE DE PERFORMANCE")
        if coach:
            canvas.setFont("NotoSans",7.5);canvas.setFillColor(colors.HexColor("#00D1DF"))
            canvas.drawRightString(W-1.5*cm-8,ht-hh-0.5*cm,f"Coach {coach}")
        canvas.setFont("NotoSans",8);canvas.setFillColor(colors.HexColor("#ADB5BD"))
        fd=f"Coach {coach}" if coach else "Jardim Irajá, Ribeirão Preto, SP"
        canvas.drawString(1.5*cm+8,1.5*cm+0.25*cm,f"VORTEX PRIMUS © 2026  |  MyBox Irajá  |  {fd}")
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
    col_w=(CW-4*mm)/2
    def make_block(cat,itens):
        rows=[[Paragraph(cat,ST_CAT),Paragraph("",ST_CAT)]]
        for item,qtd in itens:
            rows.append([Paragraph(f"◻  {item}",ST_IT),Paragraph(qtd,ST_QT)])
        t=Table(rows,colWidths=[col_w*0.60,col_w*0.40])
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
    esq,dir_=[],[]
    for idx,cat in enumerate(lista):
        blk=make_block(cat["categoria"],[(i["item"],i["qtd"]) for i in cat["itens"]])
        if idx<3:esq.append(blk);esq.append(Spacer(1,3*mm))
        else:dir_.append(blk);dir_.append(Spacer(1,3*mm))
    def col_t(items,cw):
        t=Table([[i] for i in items],colWidths=[cw])
        t.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
        return t
    layout=Table([[col_t(esq,col_w),Spacer(4*mm,1),col_t(dir_,col_w)]],colWidths=[col_w,4*mm,col_w])
    layout.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    story=[
        Paragraph("🛒  LISTA DE COMPRAS — SEMANA",ST_CT),
        Spacer(1,1*mm),
        HRFlowable(width=CW,thickness=1.5,color=colors.HexColor("#00D1DF")),
        Spacer(1,2*mm),
        Paragraph("Itens necessários para o plano semanal. Quantidades estimadas para 1 pessoa / 7 dias.",ST_ES),
        Spacer(1,5*mm),layout,Spacer(1,4*mm),
        HRFlowable(width=CW,thickness=0.5,color=colors.HexColor("#DDE2E6")),
        Spacer(1,2*mm),
        Paragraph("<i>* Priorize alimentos frescos e in natura. Verifique o estoque antes de comprar.</i>",
            ParagraphStyle("rod",fontName="NotoSans-Italic",fontSize=7.5,leading=11,
                textColor=colors.HexColor("#6C757D"),alignment=TA_LEFT))]
    return story

def gerar_bytes(dados: dict) -> bytes:
    aluno=dados["aluno"];cardapio=dados["cardapio"];nota=dados["nota"]
    lista=dados.get("lista_compras",[]);coach=dados.get("coach")
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
    doc.build(story,onFirstPage=make_on_page(coach),onLaterPages=make_on_page(coach))
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
