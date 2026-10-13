"""Generate homework (questions + answers) PDFs for
CBSE Class 7 Maths - Ganita Prakash Part 2, Chapter: Geometric Twins."""
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Polygon

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
from reportlab.platypus import (Image, KeepTogether, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)
from reportlab.lib import colors

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
os.makedirs(FIG, exist_ok=True)

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
for _b, _i, _f in ((0, 0, "DV"), (1, 0, "DVB"), (0, 1, "DV"), (1, 1, "DVB")):
    addMapping("DV", _b, _i, _f)

# ---------------------------------------------------------------- geometry helpers

def pt_from(P, length, deg):
    return (P[0] + length * math.cos(math.radians(deg)),
            P[1] + length * math.sin(math.radians(deg)))


def third_vertex(B, C, b_side, c_side):
    """Point A above BC with AB = c_side and AC = b_side (BC horizontal)."""
    d = C[0] - B[0]
    x = (c_side ** 2 - b_side ** 2 + d ** 2) / (2 * d)
    y = math.sqrt(c_side ** 2 - x ** 2)
    return (B[0] + x, B[1] + y)


def from_angles(B, C, angB, angC):
    """Apex A above BC given base angles at B and C."""
    d = C[0] - B[0]
    tb, tc = math.tan(math.radians(angB)), math.tan(math.radians(angC))
    x = d * tc / (tb + tc)
    return (B[0] + x, B[1] + x * tb)


def new_ax(w=3.2, h=2.4):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def save(fig, name):
    path = os.path.join(FIG, name + ".png")
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    return path


def poly(ax, pts, labels=None, fc="none"):
    ax.add_patch(Polygon(pts, closed=True, fill=fc != "none", fc=fc, ec="black", lw=1.4))
    if labels:
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        for p, lab in zip(pts, labels):
            dx, dy = p[0] - cx, p[1] - cy
            r = math.hypot(dx, dy) or 1
            ax.text(p[0] + 0.38 * dx / r, p[1] + 0.38 * dy / r, lab,
                    ha="center", va="center", fontsize=11, fontweight="bold")


def side_text(ax, P, Q, text, inside_pt, off=0.6, fs=9):
    mx, my = (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2
    nx, ny = -(Q[1] - P[1]), Q[0] - P[0]
    n = math.hypot(nx, ny)
    nx, ny = nx / n, ny / n
    if (inside_pt[0] - mx) * nx + (inside_pt[1] - my) * ny > 0:
        nx, ny = -nx, -ny
    ax.text(mx + off * nx, my + off * ny, text, ha="center", va="center", fontsize=fs,
            color="#1a4fa0")


def ticks(ax, P, Q, n=1, size=0.18, gap=0.1):
    mx, my = (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2
    dx, dy = Q[0] - P[0], Q[1] - P[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    for i in range(n):
        s = (i - (n - 1) / 2) * gap
        cx, cy = mx + s * ux, my + s * uy
        ax.plot([cx - size * nx, cx + size * nx], [cy - size * ny, cy + size * ny],
                color="black", lw=1.2)


def angle_mark(ax, V, P, Q, text=None, r=0.55, arcs=1, fs=9, toff=0.45):
    a1 = math.degrees(math.atan2(P[1] - V[1], P[0] - V[0]))
    a2 = math.degrees(math.atan2(Q[1] - V[1], Q[0] - V[0]))
    if (a2 - a1) % 360 > 180:
        a1, a2 = a2, a1
    for k in range(arcs):
        rr = r + k * 0.12
        ax.add_patch(Arc(V, 2 * rr, 2 * rr, theta1=a1, theta2=a2, color="black", lw=1.1))
    if text:
        mid = math.radians(a1 + ((a2 - a1) % 360) / 2)
        ax.text(V[0] + (r + toff) * math.cos(mid), V[1] + (r + toff) * math.sin(mid), text,
                ha="center", va="center", fontsize=fs, color="#b03030")


def right_mark(ax, V, P, Q, s=0.35):
    def unit(A):
        dx, dy = A[0] - V[0], A[1] - V[1]
        L = math.hypot(dx, dy)
        return dx / L, dy / L
    u, w = unit(P), unit(Q)
    p1 = (V[0] + s * u[0], V[1] + s * u[1])
    p3 = (V[0] + s * w[0], V[1] + s * w[1])
    p2 = (p1[0] + s * w[0], p1[1] + s * w[1])
    ax.plot([p1[0], p2[0], p3[0]], [p1[1], p2[1], p3[1]], color="black", lw=1.1)


def centroid(*pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def finish(ax, pad=0.8):
    ax.autoscale_view()
    x0, x1 = ax.get_xlim()
    y0, y1 = ax.get_ylim()
    ax.set_xlim(x0 - pad, x1 + pad)
    ax.set_ylim(y0 - pad, y1 + pad)


# ---------------------------------------------------------------- figures

def fig_q3():
    fig, axs = plt.subplots(1, 4, figsize=(8, 2.6))
    shapes = {
        "(a)": ([(0, 0), (3, 0), (3, 2), (0, 2)], [(5, 0), (7, 0), (7, 3), (5, 3)]),
        "(b)": ([(0, 0), (2, 0), (2, 2), (0, 2)], [(4, 0), (7, 0), (7, 3), (4, 3)]),
        "(c)": ([(0, 0), (3, 0), (0, 2)], [(5, 0), (8, 0), (8, 2)]),
        "(d)": ([(0, 0), (4, 0), (4, 1), (0, 1)], [(5, 0), (7, 0), (7, 2), (5, 2)]),
    }
    for ax, (lab, (s1, s2)) in zip(axs, shapes.items()):
        ax.set_aspect("equal")
        for x in range(0, 9):
            ax.plot([x, x], [0, 3], color="#cccccc", lw=0.6)
        for y in range(0, 4):
            ax.plot([0, 8], [y, y], color="#cccccc", lw=0.6)
        ax.add_patch(Polygon(s1, closed=True, fc="#cfe2ff", ec="black", lw=1.3))
        ax.add_patch(Polygon(s2, closed=True, fc="#ffe0c2", ec="black", lw=1.3))
        ax.set_xlim(-0.3, 8.3)
        ax.set_ylim(-1.6, 3.3)
        ax.text(4, -1.1, lab, ha="center", fontsize=11, fontweight="bold")
        ax.axis("off")
    return save(fig, "q3")


def fig_q7():
    fig, ax = new_ax(5.2, 2.2)
    A, B, C = (0.8, 2.6), (0, 0), (3.2, 0)
    poly(ax, [A, B, C], ["A", "B", "C"])
    # same triangle rotated 180 degrees and shifted
    sh = 8.0
    P, Q, R = (sh - 0.8, 0), (sh, 2.6), (sh - 3.2, 2.6)
    poly(ax, [P, Q, R], ["P", "Q", "R"])
    finish(ax)
    return save(fig, "q7")


def fig_q10():
    fig, ax = new_ax(5.6, 2.4)
    B, C = (0, 0), (5, 0)
    A = third_vertex(B, C, 6, 4)
    g = centroid(A, B, C)
    poly(ax, [A, B, C], ["A", "B", "C"])
    side_text(ax, A, B, "4 cm", g)
    side_text(ax, B, C, "5 cm", g)
    side_text(ax, C, A, "6 cm", g)
    # triangle LMN: MN = 4, NL = 5, LM = 6 (mirror image, shifted)
    sh = 7.5
    L, N = (sh, 0), (sh + 5, 0)
    Mx = third_vertex(L, N, 4, 6)  # LM = 6, NM = 4
    M = Mx
    g2 = centroid(L, M, N)
    poly(ax, [L, M, N], ["L", "M", "N"])
    side_text(ax, M, N, "4 cm", g2)
    side_text(ax, N, L, "5 cm", g2)
    side_text(ax, L, M, "6 cm", g2)
    finish(ax)
    return save(fig, "q10")


def two_triangles(name, build):
    fig, ax = new_ax(5.6, 2.4)
    build(ax, 0, "ABC")
    build(ax, 8.0, "DEF")
    finish(ax)
    return save(fig, name)


def fig_q13():
    def build(ax, sh, n):
        B, C = (sh, 0), (sh + 6, 0)
        A = third_vertex(B, C, 4.5, 5)
        g = centroid(A, B, C)
        poly(ax, [A, B, C], [n[0], n[1], n[2]])
        side_text(ax, A, B, "5 cm", g)
        side_text(ax, B, C, "6 cm", g)
        side_text(ax, A, C, "4.5 cm", g)
    return two_triangles("q13", build)


def fig_q14():
    fig, ax = new_ax(5.6, 2.4)
    for sh, n in ((0, "PQR"), (7.5, "XYZ")):
        Q, R = (sh, 0), (sh + 5, 0)
        P = pt_from(Q, 4, 60)
        g = centroid(P, Q, R)
        poly(ax, [P, Q, R], [n[0], n[1], n[2]])
        side_text(ax, P, Q, "4 cm", g)
        side_text(ax, Q, R, "5 cm", g)
        angle_mark(ax, Q, R, P, "60°", toff=0.6)
    finish(ax)
    return save(fig, "q14")


def fig_q15():
    def build(ax, sh, n):
        B, C = (sh, 0), (sh + 6, 0)
        A = from_angles(B, C, 50, 70)
        poly(ax, [A, B, C], [n[0], n[1], n[2]])
        side_text(ax, B, C, "6 cm", A)
        angle_mark(ax, B, C, A, "50°", toff=0.6)
        angle_mark(ax, C, A, B, "70°", arcs=2, toff=0.7)
    return two_triangles("q15", build)


def fig_q16():
    fig, ax = new_ax(5.6, 2.6)
    # ABC: right angle at B
    A, B, C = (0, 4.5), (0, 0), (6, 0)
    g = centroid(A, B, C)
    poly(ax, [A, B, C], ["A", "B", "C"])
    right_mark(ax, B, A, C)
    side_text(ax, A, B, "6 cm", g)
    side_text(ax, A, C, "10 cm", g)
    # PQR: right angle at Q, mirrored
    sh = 13.5
    P, Q, R = (sh, 4.5), (sh, 0), (sh - 6, 0)
    g2 = centroid(P, Q, R)
    poly(ax, [P, Q, R], ["P", "Q", "R"])
    right_mark(ax, Q, P, R)
    side_text(ax, P, Q, "6 cm", g2)
    side_text(ax, P, R, "10 cm", g2)
    finish(ax)
    return save(fig, "q16")


def fig_q19():
    fig, ax = new_ax(5.2, 2.6)
    for sh, base, n in ((0, 3.5, "ABC"), (5.0, 6.0, "PQR")):
        B, C = (sh, 0), (sh + base, 0)
        A = from_angles(B, C, 60, 80)
        poly(ax, [A, B, C], [n[0], n[1], n[2]])
        angle_mark(ax, B, C, A, "60°", r=0.5, toff=0.5, fs=8)
        angle_mark(ax, C, A, B, "80°", r=0.5, toff=0.5, fs=8)
        angle_mark(ax, A, B, C, "40°", r=0.5, toff=0.9, fs=8)
    finish(ax, 0.5)
    return save(fig, "q19")


def fig_q20():
    fig, ax = new_ax(3.6, 2.6)
    A, C = (0, 0), (6, 0)
    B = (2, 2 * math.tan(math.radians(35)))
    D = (2, -B[1])
    poly(ax, [A, B, C, D], ["A", "B", "C", "D"])
    ax.plot([A[0], C[0]], [A[1], C[1]], color="black", lw=1.4)
    ticks(ax, A, B, 1)
    ticks(ax, A, D, 1)
    ticks(ax, C, B, 2)
    ticks(ax, C, D, 2)
    angle_mark(ax, A, C, B, "35°", r=1.0, toff=0.45)
    finish(ax, 0.5)
    return save(fig, "q20")


def fig_q21():
    fig, ax = new_ax(3.4, 2.6)
    O = (0, 0)
    A, B = (-3, 1.5), (3, -1.5)
    C, D = (-2, -2), (2, 2)
    ax.plot([A[0], B[0]], [A[1], B[1]], color="black", lw=1.4)
    ax.plot([C[0], D[0]], [C[1], D[1]], color="black", lw=1.4)
    ax.plot([A[0], C[0]], [A[1], C[1]], color="black", lw=1.4)
    ax.plot([B[0], D[0]], [B[1], D[1]], color="black", lw=1.4)
    for p, lab, off in ((A, "A", (-0.35, 0.15)), (B, "B", (0.35, -0.15)),
                        (C, "C", (-0.3, -0.25)), (D, "D", (0.3, 0.25)), (O, "O", (0, 0.42))):
        ax.text(p[0] + off[0], p[1] + off[1], lab, ha="center", va="center",
                fontsize=11, fontweight="bold")
    ticks(ax, A, O, 1)
    ticks(ax, O, B, 1)
    ticks(ax, C, O, 2)
    ticks(ax, O, D, 2)
    finish(ax, 0.6)
    return save(fig, "q21")


def fig_q22():
    fig, ax = new_ax(2.4, 2.4)
    A, B, C, D = (0, 4), (0, 0), (4, 0), (4, 4)
    poly(ax, [A, B, C, D], ["A", "B", "C", "D"])
    ax.plot([A[0], C[0]], [A[1], C[1]], color="black", lw=1.4)
    finish(ax, 0.5)
    return save(fig, "q22")


def fig_q23():
    fig, ax = new_ax(2.6, 2.8)
    B, C = (0, 0), (4, 0)
    A = from_angles(B, C, 65, 65)
    poly(ax, [A, B, C], ["A", "B", "C"])
    ticks(ax, A, B, 1)
    ticks(ax, A, C, 1)
    angle_mark(ax, B, C, A, "65°", r=0.6)
    finish(ax, 0.5)
    return save(fig, "q23")


def fig_q25():
    fig, ax = new_ax(2.6, 2.8)
    Q, R = (0, 0), (4, 0)
    P = from_angles(Q, R, 70, 70)
    poly(ax, [P, Q, R], ["P", "Q", "R"])
    angle_mark(ax, Q, R, P, "70°", r=0.6)
    angle_mark(ax, R, P, Q, "70°", r=0.6)
    finish(ax, 0.5)
    return save(fig, "q25")


def fig_q29():
    fig, ax = new_ax(3.6, 2.6)
    Q, P, A, B = (0, 0), (0, 4), (-3, 0), (3, 0)
    ax.plot([-4.2, 4.2], [0, 0], color="#6b4f2a", lw=2)
    for x in [i * 0.5 - 4 for i in range(17)]:
        ax.plot([x, x - 0.3], [0, -0.3], color="#6b4f2a", lw=0.8)
    ax.plot([Q[0], P[0]], [Q[1], P[1]], color="black", lw=2.5)
    ax.plot([P[0], A[0]], [P[1], A[1]], color="#1a4fa0", lw=1.4, ls="--")
    ax.plot([P[0], B[0]], [P[1], B[1]], color="#1a4fa0", lw=1.4, ls="--")
    ax.add_patch(Polygon([(0, 4), (1.2, 3.6), (0, 3.2)], closed=True, fc="#f28c28", ec="black"))
    right_mark(ax, Q, P, A)
    right_mark(ax, Q, P, B)
    for p, lab, off in ((P, "P", (-0.35, 0.2)), (Q, "Q", (0.0, -0.55)),
                        (A, "A", (0, -0.55)), (B, "B", (0, -0.55))):
        ax.text(p[0] + off[0], p[1] + off[1], lab, ha="center", va="center",
                fontsize=11, fontweight="bold")
    ax.text(-1.5, -1.35, "3 m", ha="center", fontsize=9, color="#1a4fa0")
    ax.annotate("", xy=(-3, -0.75), xytext=(0, -0.75),
                arrowprops=dict(arrowstyle="<->", color="#1a4fa0", lw=0.9))
    finish(ax, 0.4)
    return save(fig, "q29")


# ---------------------------------------------------------------- content

FIGS = {
    3: fig_q3, 7: fig_q7, 10: fig_q10, 13: fig_q13, 14: fig_q14, 15: fig_q15,
    16: fig_q16, 19: fig_q19, 20: fig_q20, 21: fig_q21, 22: fig_q22, 23: fig_q23,
    25: fig_q25, 29: fig_q29,
}

FIG_WIDTH = {3: 16, 7: 10, 10: 12, 13: 12, 14: 12, 15: 12, 16: 12, 19: 9,
             20: 6.5, 21: 6, 22: 4.2, 23: 4.6, 25: 4.6, 29: 6.5}

SECTIONS = [
    ("Section A – Congruent Figures", [
        (1, "Fill in the blanks: Two figures are called <b>congruent</b> if they have the same "
            "__________ and the same __________."),
        (2, "Write <b>True</b> or <b>False</b>:<br/>"
            "(a) Two circles, each of radius 4 cm, are congruent.<br/>"
            "(b) Any two squares are always congruent.<br/>"
            "(c) Two line segments, each of length 5 cm, are congruent.<br/>"
            "(d) A photograph and its enlarged copy are congruent."),
        (3, "Look at the pairs of shapes drawn on the square grid below. Which pairs are "
            "congruent? (Hint: imagine cutting out one shape and placing it on the other. "
            "You may turn or flip it.)"),
        (4, "Which measurement(s) do you need to know to draw an exact copy of:<br/>"
            "(a) a circle?&nbsp;&nbsp;&nbsp; (b) a square?&nbsp;&nbsp;&nbsp; (c) a rectangle?"),
        (5, "Answer in Yes or No:<br/>"
            "(a) ∠A = 50° and ∠B = 50°. Are ∠A and ∠B congruent?<br/>"
            "(b) PQ = 3 cm and XY = 3.5 cm. Are line segments PQ and XY congruent?"),
        (6, "Write any <b>two</b> examples of congruent objects that you see in your daily life."),
    ]),
    ("Section B – Corresponding Parts", [
        (7, "In the figure, ΔABC ≅ ΔPQR. Complete the following:<br/>"
            "(a) AB ↔ ______&nbsp;&nbsp;&nbsp; (b) BC ↔ ______&nbsp;&nbsp;&nbsp; "
            "(c) ∠B ↔ ______&nbsp;&nbsp;&nbsp; (d) ∠C ↔ ______"),
        (8, "ΔDEF ≅ ΔLMN. If DE = 6 cm, EF = 7 cm and DF = 5 cm, find the lengths of "
            "LM, MN and LN."),
        (9, "ΔXYZ ≅ ΔKLM. If ∠X = 60° and ∠Y = 70°, find ∠K, ∠L and ∠M."),
        (10, "Look at the two triangles below. They are congruent by matching equal sides. "
             "Complete the congruence statement in the correct order: ΔABC ≅ Δ______"),
        (11, "If ΔABC ≅ ΔPQR, which one of the following is <b>true</b>?<br/>"
             "(a) AB = QR&nbsp;&nbsp;&nbsp; (b) ∠A = ∠P&nbsp;&nbsp;&nbsp; "
             "(c) BC = PR&nbsp;&nbsp;&nbsp; (d) ∠B = ∠R"),
    ]),
    ("Section C – Conditions for Congruence of Triangles", [
        (12, "Write the full form of each congruence condition:<br/>"
             "(a) SSS&nbsp;&nbsp;&nbsp; (b) SAS&nbsp;&nbsp;&nbsp; (c) ASA&nbsp;&nbsp;&nbsp; (d) RHS"),
        (13, "Are the two triangles below congruent? If yes, write the condition used and the "
             "congruence statement."),
        (14, "Are the two triangles below congruent? If yes, write the condition used and the "
             "congruence statement."),
        (15, "In the figure, ∠B = ∠E = 50°, BC = EF = 6 cm and ∠C = ∠F = 70°. Are the "
             "triangles congruent? Write the condition used and the congruence statement."),
        (16, "In the figure, ∠B = ∠Q = 90°, AC = PR = 10 cm and AB = PQ = 6 cm. Are the "
             "triangles congruent? Write the condition used and the congruence statement."),
        (17, "Fill in the blank: In the SAS condition, the angle must be the angle "
             "__________ the two given sides."),
        (18, "For ΔABC and ΔPQR, name the condition (SSS, SAS, ASA or RHS) that shows they are "
             "congruent:<br/>"
             "(a) AB = PQ, BC = QR, CA = RP<br/>"
             "(b) AB = PQ, ∠A = ∠P, AC = PR<br/>"
             "(c) ∠A = ∠P, AB = PQ, ∠B = ∠Q<br/>"
             "(d) ∠B = ∠Q = 90°, AC = PR, BC = QR"),
        (19, "In the figure, both triangles have angles 40°, 60° and 80°. Are the two triangles "
             "congruent? Give a reason."),
        (20, "In the figure, AB = AD and CB = CD.<br/>"
             "(a) Which condition shows that ΔABC ≅ ΔADC?<br/>"
             "(b) If ∠BAC = 35°, find ∠DAC."),
        (21, "In the figure, line segments AB and CD cross each other at O, with OA = OB and "
             "OC = OD.<br/>"
             "(a) Why is ∠AOC = ∠BOD?<br/>"
             "(b) Which condition shows that ΔAOC ≅ ΔBOD?<br/>"
             "(c) If AC = 5 cm, find BD."),
        (22, "ABCD is a square and AC is joined. Is ΔABC ≅ ΔCDA? Which condition did you use?"),
    ]),
    ("Section D – Isosceles and Equilateral Triangles", [
        (23, "In ΔABC, AB = AC and ∠B = 65°. Find ∠C and ∠A."),
        (24, "What is the measure of each angle of an equilateral triangle?"),
        (25, "In ΔPQR, ∠Q = ∠R = 70°.<br/>"
             "(a) Which two sides of the triangle are equal?&nbsp;&nbsp;&nbsp; (b) Find ∠P."),
        (26, "The angle between the two equal sides of an isosceles triangle is 80°. "
             "Find each of the other two angles."),
        (27, "Each of the two equal angles of an isosceles triangle is 45°. Find the third angle. "
             "What special name can you give to this triangle?"),
        (28, "Can an isosceles triangle have two equal angles of 95° each? Give a reason."),
    ]),
    ("Section E – Congruence Around Us", [
        (29, "A flag pole PQ stands straight on the ground (∠PQA = ∠PQB = 90°). Two ropes PA and "
             "PB of <b>equal length</b> are tied from the top P to the points A and B on the "
             "ground.<br/>"
             "(a) Which condition shows that ΔPQA ≅ ΔPQB?<br/>"
             "(b) If QA = 3 m, what is QB?"),
        (30, "Ravi draws a triangle with sides 3 cm, 4 cm and 5 cm. His friend Asha draws a "
             "triangle with sides 5 cm, 3 cm and 4 cm. Are the two triangles congruent? "
             "Give a reason."),
    ]),
]

ANSWERS = {
    1: "shape; size.",
    2: "(a) True &nbsp; (b) False – squares of different side lengths are not congruent. "
       "&nbsp; (c) True &nbsp; (d) False – the size changes.",
    3: "Pairs <b>(a)</b> and <b>(c)</b> are congruent. (a) Both rectangles are 3 × 2 (one is "
       "turned). (c) Both right triangles have sides 3 and 2 units along the grid (one is flipped). "
       "(b) Squares of side 2 and 3 – different sizes. (d) 4 × 1 rectangle and 2 × 2 square – "
       "different shapes.",
    4: "(a) The radius (or diameter). (b) The length of one side. (c) The length and the breadth.",
    5: "(a) Yes – angles with equal measures are congruent. (b) No – their lengths are different.",
    6: "Answers may vary. For example: two ₹10 coins of the same design, two sheets of A4 paper, "
       "two floor tiles of the same design, two pages of the same notebook.",
    7: "(a) PQ &nbsp; (b) QR &nbsp; (c) ∠Q &nbsp; (d) ∠R",
    8: "LM = DE = 6 cm, MN = EF = 7 cm, LN = DF = 5 cm.",
    9: "∠K = ∠X = 60°, ∠L = ∠Y = 70°, ∠M = ∠Z = 180° − (60° + 70°) = 50°.",
    10: "ΔABC ≅ ΔMNL. (AB = MN = 4 cm, BC = NL = 5 cm, CA = LM = 6 cm, so A ↔ M, B ↔ N, C ↔ L.)",
    11: "(b) ∠A = ∠P.",
    12: "(a) Side–Side–Side (b) Side–Angle–Side (c) Angle–Side–Angle "
        "(d) Right angle–Hypotenuse–Side",
    13: "Yes. AB = DE = 5 cm, BC = EF = 6 cm, AC = DF = 4.5 cm. Condition: <b>SSS</b>. "
        "ΔABC ≅ ΔDEF.",
    14: "Yes. PQ = XY = 4 cm, ∠Q = ∠Y = 60°, QR = YZ = 5 cm. The 60° angle is between the two "
        "sides. Condition: <b>SAS</b>. ΔPQR ≅ ΔXYZ.",
    15: "Yes. Condition: <b>ASA</b> (the 6 cm side lies between the 50° and 70° angles). "
        "ΔABC ≅ ΔDEF.",
    16: "Yes. Both have a right angle, equal hypotenuses (AC = PR = 10 cm) and one more equal side "
        "(AB = PQ = 6 cm). Condition: <b>RHS</b>. ΔABC ≅ ΔPQR.",
    17: "included between (the angle formed by the two sides).",
    18: "(a) SSS &nbsp; (b) SAS &nbsp; (c) ASA &nbsp; (d) RHS",
    19: "No. They have the same shape but not the same size (ΔPQR is bigger). Equal angles "
        "alone (AAA) do not make triangles congruent.",
    20: "(a) <b>SSS</b> – AB = AD, CB = CD and AC is common to both triangles. "
        "(b) ∠DAC = ∠BAC = 35° (corresponding parts of congruent triangles).",
    21: "(a) They are vertically opposite angles. (b) <b>SAS</b> – OA = OB, ∠AOC = ∠BOD, "
        "OC = OD. (c) BD = AC = 5 cm.",
    22: "Yes. AB = CD and BC = DA (sides of a square), and AC is common. Condition: <b>SSS</b>. "
        "(SAS can also be used: AB = CD, ∠B = ∠D = 90°, BC = DA.)",
    23: "∠C = ∠B = 65° (angles opposite equal sides are equal). "
        "∠A = 180° − (65° + 65°) = 50°.",
    24: "60° (180° ÷ 3).",
    25: "(a) PQ = PR (sides opposite the equal angles). (b) ∠P = 180° − (70° + 70°) = 40°.",
    26: "The other two angles are equal: (180° − 80°) ÷ 2 = 50° each.",
    27: "Third angle = 180° − (45° + 45°) = 90°. It is a <b>right-angled isosceles triangle</b>.",
    28: "No. 95° + 95° = 190°, which is more than 180°. The sum of the angles of a triangle is "
        "always 180°.",
    29: "(a) <b>RHS</b> – ∠PQA = ∠PQB = 90°, hypotenuse PA = PB, and PQ is common. "
        "(b) QB = QA = 3 m.",
    30: "Yes. All three sides of one triangle are equal to the three sides of the other "
        "(3 cm, 4 cm, 5 cm), so they are congruent by <b>SSS</b>. The order in which the sides are "
        "listed does not matter.",
}

# ---------------------------------------------------------------- PDF building

TITLE = ParagraphStyle("t", fontName="DVB", fontSize=16, alignment=TA_CENTER, leading=20)
SUB = ParagraphStyle("s", fontName="DV", fontSize=10.5, alignment=TA_CENTER, leading=14,
                     textColor=colors.HexColor("#444444"))
SEC = ParagraphStyle("sec", fontName="DVB", fontSize=12, leading=16, spaceBefore=8,
                     spaceAfter=4, textColor=colors.HexColor("#1a4fa0"))
Q = ParagraphStyle("q", fontName="DV", fontSize=10.5, leading=15)
NUM = ParagraphStyle("n", fontName="DVB", fontSize=10.5, leading=15)


def header(story, kind):
    story.append(Paragraph("Geometric Twins – Homework " + kind, TITLE))
    story.append(Spacer(1, 4))
    story.append(Paragraph("CBSE Class 7 Mathematics · Ganita Prakash (Part 2) · "
                           "Chapter: Geometric Twins", SUB))
    story.append(Spacer(1, 8))
    if kind == "Questions":
        t = Table([["Name: ______________________", "Class/Section: ________",
                    "Date: ____________"]], colWidths=[7.5 * cm, 5 * cm, 4.5 * cm])
        t.setStyle(TableStyle([("FONTNAME", (0, 0), (-1, -1), "DV"),
                               ("FONTSIZE", (0, 0), (-1, -1), 10)]))
        story.append(t)
        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Instructions:</b> Answer all 30 questions. Show your "
                               "reasoning where needed. Figures are for reference. "
                               "Equal tick marks on sides mean those sides are equal; "
                               "equal arcs mean those angles are equal.", Q))
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


def build_questions(path, figs):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=1.6 * cm, bottomMargin=1.8 * cm,
                            title="Geometric Twins – Homework Questions")
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
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=1.6 * cm, bottomMargin=1.8 * cm,
                            title="Geometric Twins – Answer Key")
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
    build_questions(os.path.join(HERE, "Geometric_Twins_Questions.pdf"), figs)
    build_answers(os.path.join(HERE, "Geometric_Twins_Answers.pdf"))
    print("done")
