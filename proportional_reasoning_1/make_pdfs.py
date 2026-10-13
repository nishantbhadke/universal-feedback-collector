"""Generate homework (questions + answers) PDFs for
CBSE Class 8 Maths - Ganita Prakash Part 1, Chapter 7: Proportional Reasoning-1."""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, Rectangle

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.fonts import addMapping
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
os.makedirs(FIG, exist_ok=True)

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
for _b, _i, _f in ((0, 0, "DV"), (1, 0, "DVB"), (0, 1, "DV"), (1, 1, "DVB")):
    addMapping("DV", _b, _i, _f)

BLUE, ORANGE, GREEN = "#cfe2ff", "#ffe0c2", "#d4f0d0"
TXT = "#1a4fa0"

# ---------------------------------------------------------------- figure helpers

def new_ax(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def save(fig, name):
    path = os.path.join(FIG, name + ".png")
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    return path


def photo(ax, x, y, w, h, label=None, wtext=None, htext=None, fc=BLUE):
    """A 'picture' rectangle with a little mountain-and-sun sketch inside."""
    ax.add_patch(Rectangle((x, y), w, h, fc=fc, ec="black", lw=1.4))
    ax.add_patch(Polygon([(x + 0.1 * w, y), (x + 0.4 * w, y + 0.55 * h), (x + 0.7 * w, y)],
                         closed=True, fc="#9bbf8a", ec="none"))
    ax.add_patch(Polygon([(x + 0.45 * w, y), (x + 0.7 * w, y + 0.4 * h), (x + 0.95 * w, y)],
                         closed=True, fc="#7aa56a", ec="none"))
    ax.add_patch(Circle((x + 0.78 * w, y + 0.75 * h), 0.09 * min(w, h), fc="#f5c542", ec="none"))
    if wtext:
        ax.text(x + w / 2, y - 0.55, wtext, ha="center", va="center", fontsize=9, color=TXT)
    if htext:
        ax.text(x - 0.35, y + h / 2, htext, ha="right", va="center", fontsize=9, color=TXT)
    if label:
        ax.text(x + w / 2, y + h + 0.5, label, ha="center", va="center", fontsize=10,
                fontweight="bold")


def bar(ax, x, y, parts, colours, unit=1.0, h=0.8, labels=None):
    """Bar model: parts = list of counts of equal boxes per person."""
    cx = x
    for i, (n, c) in enumerate(zip(parts, colours)):
        for _ in range(n):
            ax.add_patch(Rectangle((cx, y), unit, h, fc=c, ec="black", lw=1.1))
            cx += unit
        if labels:
            ax.text(cx - n * unit / 2, y + h + 0.35, labels[i], ha="center", fontsize=9,
                    fontweight="bold")
    return cx


def finish(ax, pad=0.4):
    ax.autoscale_view()
    x0, x1 = ax.get_xlim()
    y0, y1 = ax.get_ylim()
    ax.set_xlim(x0 - pad, x1 + pad)
    ax.set_ylim(y0 - pad, y1 + pad)


# ---------------------------------------------------------------- figures

def fig_q1():
    fig, ax = new_ax(4.6, 1.4)
    for i in range(6):
        ax.add_patch(Circle((i * 1.0 + 0.4, 0.4), 0.35, fc="#e66b6b", ec="black", lw=1))
    for i in range(4):
        x = 6.6 + i * 1.0
        ax.add_patch(Polygon([(x, 0.05), (x + 0.7, 0.05), (x + 0.35, 0.75)], closed=True,
                             fc="#6b9be6", ec="black", lw=1))
    finish(ax, 0.2)
    return save(fig, "q1")


def fig_q7():
    fig, ax = new_ax(4.2, 0.9)
    bar(ax, 0, 0, [2, 3], ["#8fb8f0", "white"], unit=1.2)
    finish(ax, 0.15)
    return save(fig, "q7")


def fig_q11():
    fig, ax = new_ax(5.4, 2.3)
    photo(ax, 0, 0, 3, 2, "A", "6 cm", "4 cm")
    photo(ax, 5.4, 0, 4.5, 3, "B", "9 cm", "6 cm", fc=ORANGE)
    photo(ax, 12.0, 0, 4, 2.5, "C", "8 cm", "5 cm", fc=GREEN)
    finish(ax, 0.3)
    return save(fig, "q11")


def fig_q12():
    fig, ax = new_ax(4.6, 2.2)
    photo(ax, 0, 0, 3, 2, "Original", "12 cm", "8 cm")
    photo(ax, 5.0, 0, 4.5, 3, "Enlarged", "18 cm", "? cm", fc=ORANGE)
    finish(ax, 0.3)
    return save(fig, "q12")


def fig_q14():
    fig, ax = new_ax(4.6, 2.4)
    photo(ax, 0, 0, 3, 2, "Original", "6 cm", "4 cm")
    photo(ax, 5.4, 0, 4.5, 4, "Rani's picture", "9 cm", "8 cm", fc=ORANGE)
    finish(ax, 0.3)
    return save(fig, "q14")


def fig_q20():
    fig, ax = new_ax(4.4, 2.4)
    ax.add_patch(Rectangle((0, 0), 9, 4.6, fc="#f7f3e3", ec="black", lw=1.2))
    # winding road (decorative) and the two towns
    ax.plot([1.3, 2.5, 4.5, 6.0, 7.6], [3.4, 2.6, 3.0, 2.1, 1.6], color="#bbbbbb", lw=3, zorder=1)
    for (x, y), name in (((1.3, 3.4), "Rampur"), ((7.6, 1.6), "Sitapur")):
        ax.add_patch(Circle((x, y), 0.18, fc="#d64545", ec="black", zorder=3))
        ax.text(x, y + 0.45, name, ha="center", fontsize=9, fontweight="bold")
    ax.plot([1.3, 7.6], [3.4, 1.6], color=TXT, lw=1.2, ls="--", zorder=2)
    ax.text(4.9, 2.95, "7 cm on the map", ha="center", fontsize=8.5, color=TXT, rotation=-16)
    # scale bar
    ax.plot([0.5, 1.5], [0.6, 0.6], color="black", lw=2.5)
    ax.plot([0.5, 0.5], [0.5, 0.7], color="black", lw=1.2)
    ax.plot([1.5, 1.5], [0.5, 0.7], color="black", lw=1.2)
    ax.text(1.7, 0.6, "Scale: 1 cm = 5 km", va="center", fontsize=8.5)
    finish(ax, 0.1)
    return save(fig, "q20")


def fig_q21():
    fig, ax = new_ax(4.8, 2.4)
    ax.plot([-0.5, 13], [0, 0], color="#6b4f2a", lw=2)
    # pole: 2 m tall, 3 m shadow (scale 0.5 unit per m)
    ax.plot([0.5, 0.5], [0, 1.0], color="black", lw=3)
    ax.plot([0.5, 2.0], [0, 0], color="#555555", lw=5, alpha=0.6)
    ax.plot([0.5, 2.0], [1.0, 0], color="#e0a020", lw=1, ls=":")
    ax.text(0.15, 0.5, "2 m", ha="right", va="center", fontsize=8.5, color=TXT)
    ax.text(1.25, -0.6, "3 m", ha="center", fontsize=8.5, color=TXT)
    ax.text(0.9, 1.35, "Pole", ha="center", fontsize=9, fontweight="bold")
    # tree: 8 m tall, 12 m shadow
    tx = 5.5
    ax.plot([tx, tx], [0, 2.8], color="#7a4b25", lw=5)
    ax.add_patch(Circle((tx, 3.3), 0.9, fc="#5fa04e", ec="black", lw=1))
    ax.plot([tx, tx + 6], [0, 0], color="#555555", lw=5, alpha=0.6)
    ax.plot([tx, tx + 6], [4.2, 0], color="#e0a020", lw=1, ls=":")
    ax.annotate("", xy=(tx - 1.3, 0), xytext=(tx - 1.3, 4.2),
                arrowprops=dict(arrowstyle="<->", color=TXT, lw=1))
    ax.text(tx - 1.5, 2.1, "? m", ha="right", va="center", fontsize=8.5, color=TXT)
    ax.text(tx + 3, -0.6, "12 m", ha="center", fontsize=8.5, color=TXT)
    ax.text(tx, 4.55, "Tree", ha="center", fontsize=9, fontweight="bold")
    ax.text(12.6, 3.6, "☀", fontsize=20, color="#f5b400", ha="center", va="center")
    finish(ax, 0.3)
    return save(fig, "q21")


def fig_q23():
    fig, ax = new_ax(4.4, 1.3)
    end = bar(ax, 0, 0, [2, 3], [BLUE, ORANGE], unit=1.2, labels=["Asha", "Ravi"])
    ax.annotate("", xy=(0, -0.35), xytext=(end, -0.35),
                arrowprops=dict(arrowstyle="<->", color=TXT, lw=1))
    ax.text(end / 2, -0.75, "Total = ₹500", ha="center", fontsize=9, color=TXT)
    finish(ax, 0.15)
    return save(fig, "q23")


def fig_q26():
    fig, ax = new_ax(4.6, 1.3)
    end = bar(ax, 0, 0, [1, 2, 3], [BLUE, ORANGE, GREEN], unit=1.1,
              labels=["Meena", "Kabir", "Joseph"])
    ax.annotate("", xy=(0, -0.35), xytext=(end, -0.35),
                arrowprops=dict(arrowstyle="<->", color=TXT, lw=1))
    ax.text(end / 2, -0.75, "Total = ₹600", ha="center", fontsize=9, color=TXT)
    finish(ax, 0.15)
    return save(fig, "q26")


FIGS = {1: fig_q1, 7: fig_q7, 11: fig_q11, 12: fig_q12, 14: fig_q14, 20: fig_q20,
        21: fig_q21, 23: fig_q23, 26: fig_q26}
FIG_WIDTH = {1: 9, 7: 7, 11: 13, 12: 10, 14: 10, 20: 8.5, 21: 10, 23: 8, 26: 8.5}

# ---------------------------------------------------------------- content

SECTIONS = [
    ("Section A – Ratios", [
        (1, "Look at the shapes below.<br/>"
            "(a) Write the ratio of the number of circles to the number of triangles in its "
            "simplest form.<br/>"
            "(b) Write the ratio of the number of triangles to the total number of shapes in its "
            "simplest form."),
        (2, "Write each ratio in its simplest form:<br/>"
            "(a) 12 : 18&nbsp;&nbsp;&nbsp; (b) 25 : 100&nbsp;&nbsp;&nbsp; (c) 14 : 21"
            "&nbsp;&nbsp;&nbsp; (d) 45 : 30"),
        (3, "A class has 18 girls and 12 boys. Find the ratio of:<br/>"
            "(a) girls to boys&nbsp;&nbsp;&nbsp; (b) boys to the total number of students"),
        (4, "Find the ratio of 50 paise to ₹2. (Hint: first write both amounts in the same unit.)"),
        (5, "Find the ratio of 400 g to 2 kg in its simplest form."),
        (6, "Fill in the blanks so that all the ratios are equal:<br/>"
            "2 : 5 = 6 : ____ = ____ : 20 = 10 : ____"),
        (7, "The strip below is divided into equal parts. Write the ratio of:<br/>"
            "(a) shaded parts to unshaded parts&nbsp;&nbsp;&nbsp; "
            "(b) shaded parts to all the parts"),
    ]),
    ("Section B – Proportion and Resizing Pictures", [
        (8, "Are the following ratios in proportion? Write Yes or No.<br/>"
            "(a) 3 : 4 and 9 : 12&nbsp;&nbsp;&nbsp; (b) 2 : 5 and 4 : 9"
            "&nbsp;&nbsp;&nbsp; (c) 6 : 8 and 15 : 20"),
        (9, "Find the missing number:<br/>"
            "(a) 3 : 5 = x : 20&nbsp;&nbsp;&nbsp; (b) 4 : x = 12 : 27"),
        (10, "Check whether the numbers 25, 40, 30, 48 are in proportion "
             "(that is, whether 25 : 40 = 30 : 48)."),
        (11, "Three pictures A, B and C are shown below with their widths and heights. "
             "Which two pictures have their width and height in the same ratio?"),
        (12, "A photo is 12 cm wide and 8 cm high. It is enlarged to a width of 18 cm without "
             "changing the ratio of width to height. What is the height of the enlarged photo?"),
        (13, "A poster is 20 cm wide and 15 cm high. It is made smaller so that its width becomes "
             "8 cm, keeping the same ratio of width to height. What will its new height be?"),
        (14, "Rani resized a picture that was 6 cm wide and 4 cm high into a picture 9 cm wide and "
             "8 cm high.<br/>"
             "(a) Is the ratio of width to height the same in both pictures?<br/>"
             "(b) Will Rani's picture look stretched?<br/>"
             "(c) What height should she have used with the 9 cm width?"),
    ]),
    ("Section C – Rule of Three", [
        (15, "4 pens cost ₹60. What is the cost of 7 such pens?"),
        (16, "5 kg of rice costs ₹300. How much will 8 kg of the same rice cost?"),
        (17, "A car travels 120 km in 3 hours. At the same speed, how far will it travel in "
             "5 hours?"),
        (18, "12 notebooks cost ₹480. How many such notebooks can be bought for ₹200?"),
        (19, "A recipe uses 2 cups of rice to serve 6 people. How many cups of rice are needed "
             "to serve 15 people?"),
        (20, "On the map below, 1 cm stands for 5 km. The two towns are 7 cm apart on the map. "
             "What is the actual distance between Rampur and Sitapur?"),
        (21, "A pole 2 m tall casts a shadow 3 m long. At the same time, a tree casts a shadow "
             "12 m long. How tall is the tree?"),
        (22, "A machine fills 150 bottles in 5 minutes. How many bottles will it fill in "
             "12 minutes, working at the same rate?"),
    ]),
    ("Section D – Sharing, but Not Equally", [
        (23, "Asha and Ravi share ₹500 in the ratio 2 : 3, as shown in the bar model. "
             "How much money does each get?"),
        (24, "35 sweets are divided between Tina and Sonu in the ratio 3 : 4. "
             "How many sweets does each get?"),
        (25, "In a school club, the ratio of boys to girls is 4 : 5. If there are 20 boys, "
             "how many girls are there? How many members are there in all?"),
        (26, "Meena, Kabir and Joseph share ₹600 in the ratio 1 : 2 : 3. "
             "How much does each person get?"),
        (27, "To make green paint, blue and yellow paint are mixed in the ratio 2 : 3. "
             "How many litres of blue paint and of yellow paint are needed to make 20 litres "
             "of green paint?"),
    ]),
    ("Section E – Unit Conversion", [
        (28, "1 foot = 12 inches. Find:<br/>"
             "(a) 4 feet = ____ inches&nbsp;&nbsp;&nbsp; (b) 60 inches = ____ feet"),
        (29, "Suppose 1 US dollar = ₹84. How many rupees is 5 US dollars?"),
        (30, "Take 1 inch = 2.5 cm. A TV screen measures 40 inches. What is this length in "
             "centimetres?"),
    ]),
]

ANSWERS = {
    1: "There are 6 circles and 4 triangles (10 shapes). (a) 6 : 4 = <b>3 : 2</b> "
       "(b) 4 : 10 = <b>2 : 5</b>",
    2: "(a) 2 : 3 &nbsp; (b) 1 : 4 &nbsp; (c) 2 : 3 &nbsp; (d) 3 : 2",
    3: "(a) 18 : 12 = <b>3 : 2</b> &nbsp; (b) Total = 30, so 12 : 30 = <b>2 : 5</b>",
    4: "₹2 = 200 paise. 50 : 200 = <b>1 : 4</b>",
    5: "2 kg = 2000 g. 400 : 2000 = <b>1 : 5</b>",
    6: "2 : 5 = 6 : <b>15</b> = <b>8</b> : 20 = 10 : <b>25</b>",
    7: "2 shaded and 3 unshaded parts (5 in all). (a) <b>2 : 3</b> &nbsp; (b) <b>2 : 5</b>",
    8: "(a) Yes (9 : 12 = 3 : 4) &nbsp; (b) No (4 : 9 cannot be simplified to 2 : 5) "
       "&nbsp; (c) Yes (both are 3 : 4)",
    9: "(a) 20 = 5 × 4, so x = 3 × 4 = <b>12</b>. "
       "(b) 12 = 4 × 3, so x = 27 ÷ 3 = <b>9</b>.",
    10: "25 : 40 = 5 : 8 and 30 : 48 = 5 : 8. The ratios are equal, so <b>yes</b>, they are in "
        "proportion.",
    11: "A: 6 : 4 = 3 : 2, B: 9 : 6 = 3 : 2, C: 8 : 5. So <b>A and B</b> have the same ratio.",
    12: "Width 12 → 18 is multiplied by 1.5 (or: height is 2/3 of width). "
        "Height = 8 × 1.5 = <b>12 cm</b>.",
    13: "Width : height = 20 : 15 = 4 : 3. New width 8 = 4 × 2, so height = 3 × 2 = <b>6 cm</b>.",
    14: "(a) No. 6 : 4 = 3 : 2, but 9 : 8 is not 3 : 2. (b) Yes, it will look stretched "
        "(too tall). (c) 9 : h = 3 : 2, so h = <b>6 cm</b>.",
    15: "1 pen costs 60 ÷ 4 = ₹15. 7 pens cost 7 × 15 = <b>₹105</b>.",
    16: "1 kg costs 300 ÷ 5 = ₹60. 8 kg cost 8 × 60 = <b>₹480</b>.",
    17: "In 1 hour: 120 ÷ 3 = 40 km. In 5 hours: 5 × 40 = <b>200 km</b>.",
    18: "1 notebook costs 480 ÷ 12 = ₹40. Number for ₹200 = 200 ÷ 40 = <b>5 notebooks</b>.",
    19: "6 people → 2 cups, so 3 people → 1 cup. 15 people → 15 ÷ 3 = <b>5 cups</b>.",
    20: "7 × 5 = <b>35 km</b>.",
    21: "Height : shadow = 2 : 3 for both. 12 = 3 × 4, so height = 2 × 4 = <b>8 m</b>.",
    22: "In 1 minute: 150 ÷ 5 = 30 bottles. In 12 minutes: 12 × 30 = <b>360 bottles</b>.",
    23: "Total parts = 2 + 3 = 5. 1 part = 500 ÷ 5 = ₹100. "
        "Asha = 2 × 100 = <b>₹200</b>, Ravi = 3 × 100 = <b>₹300</b>.",
    24: "Total parts = 7. 1 part = 35 ÷ 7 = 5. Tina = 3 × 5 = <b>15</b>, "
        "Sonu = 4 × 5 = <b>20</b>.",
    25: "4 parts = 20 boys, so 1 part = 5. Girls = 5 × 5 = <b>25</b>. "
        "Total members = 20 + 25 = <b>45</b>.",
    26: "Total parts = 1 + 2 + 3 = 6. 1 part = 600 ÷ 6 = ₹100. "
        "Meena = <b>₹100</b>, Kabir = <b>₹200</b>, Joseph = <b>₹300</b>.",
    27: "Total parts = 5. 1 part = 20 ÷ 5 = 4 L. Blue = 2 × 4 = <b>8 L</b>, "
        "Yellow = 3 × 4 = <b>12 L</b>.",
    28: "(a) 4 × 12 = <b>48 inches</b> &nbsp; (b) 60 ÷ 12 = <b>5 feet</b>",
    29: "5 × 84 = <b>₹420</b>.",
    30: "40 × 2.5 = <b>100 cm</b>.",
}

# ---------------------------------------------------------------- PDF building

TITLE = ParagraphStyle("t", fontName="DVB", fontSize=16, alignment=TA_CENTER, leading=20)
SUB = ParagraphStyle("s", fontName="DV", fontSize=10.5, alignment=TA_CENTER, leading=14,
                     textColor=colors.HexColor("#444444"))
SEC = ParagraphStyle("sec", fontName="DVB", fontSize=12, leading=16, spaceBefore=8,
                     spaceAfter=4, textColor=colors.HexColor(TXT))
Q = ParagraphStyle("q", fontName="DV", fontSize=10.5, leading=15)
NUM = ParagraphStyle("n", fontName="DVB", fontSize=10.5, leading=15)


def header(story, kind):
    story.append(Paragraph("Proportional Reasoning-1 – Homework " + kind, TITLE))
    story.append(Spacer(1, 4))
    story.append(Paragraph("CBSE Class 8 Mathematics · Ganita Prakash (Part 1) · "
                           "Chapter 7", SUB))
    story.append(Spacer(1, 8))
    if kind == "Questions":
        t = Table([["Name: ______________________", "Class/Section: ________",
                    "Date: ____________"]], colWidths=[7.5 * cm, 5 * cm, 4.5 * cm])
        t.setStyle(TableStyle([("FONTNAME", (0, 0), (-1, -1), "DV"),
                               ("FONTSIZE", (0, 0), (-1, -1), 10)]))
        story.append(t)
        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Instructions:</b> Answer all 30 questions. Show your working. "
                               "Write every ratio in its simplest form unless asked otherwise.",
                               Q))
    story.append(Spacer(1, 4))


def qrow(n, text):
    return Table([[Paragraph(f"Q{n}.", NUM), Paragraph(text, Q)]],
                 colWidths=[1.3 * cm, 15.7 * cm],
                 style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("DV", 8.5)
    canvas.setFillColor(colors.gray)
    canvas.drawCentredString(A4[0] / 2, 1.1 * cm, f"Page {doc.page}")
    canvas.restoreState()


def make_doc(path, title):
    return SimpleDocTemplate(path, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                             topMargin=1.6 * cm, bottomMargin=1.8 * cm, title=title)


def build_questions(path, figs):
    doc = make_doc(path, "Proportional Reasoning-1 – Homework Questions")
    story = []
    header(story, "Questions")
    for sec, qs in SECTIONS:
        for i, (n, text) in enumerate(qs):
            block = [Paragraph(sec, SEC)] if i == 0 else []
            block.append(qrow(n, text))
            if n in figs:
                img = Image(figs[n])
                w = FIG_WIDTH[n] * cm
                img.drawHeight = img.drawHeight * w / img.drawWidth
                img.drawWidth = w
                block += [Spacer(1, 3), img]
            block.append(Spacer(1, 9))
            story.append(KeepTogether(block))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def build_answers(path):
    doc = make_doc(path, "Proportional Reasoning-1 – Answer Key")
    story = []
    header(story, "Answer Key")
    for sec, qs in SECTIONS:
        for i, (n, _) in enumerate(qs):
            head = [Paragraph(sec, SEC)] if i == 0 else []
            story.append(KeepTogether(head + [qrow(n, ANSWERS[n]), Spacer(1, 6)]))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    figs = {n: f() for n, f in FIGS.items()}
    assert sum(len(q) for _, q in SECTIONS) == 30 and len(ANSWERS) == 30
    build_questions(os.path.join(HERE, "Proportional_Reasoning_1_Questions.pdf"), figs)
    build_answers(os.path.join(HERE, "Proportional_Reasoning_1_Answers.pdf"))
    print("done")
