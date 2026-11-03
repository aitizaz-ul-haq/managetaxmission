"""Tiny SVG toolkit for hand-drawn sticky-note style notice-board pages."""
import html, math

W, H = 1123, 794  # A4 landscape @96dpi

# --- palette: app colours + sticky-note colours -------------------------
NAVY = '#4B4E6D'
DNAVY = '#171e3a'
BGNAVY = '#090e25'
INK = '#23264a'
CORAL = '#FF6372'
LAV = '#B4BAFF'
LAV2 = '#B3B6CB'
YELLOW = '#FFF27A'
PINK = '#FF9DB1'
MINT = '#9BF0C8'
SKY = '#8FD3FF'
ORANGE = '#FFC078'
PURPLE = '#CDBEFF'
LIME = '#DDF77C'
WHITE = '#FFFFFF'
PAPER = '#FFFCF3'
MUTED = '#6a6d8c'
GREEN = '#16803c'
AMBER = '#b7791f'

BODY = "'Patrick Hand', 'Kalam', cursive"
BOLD = "'Kalam', 'Patrick Hand', cursive"
MARKER = "'Permanent Marker', 'Kalam', cursive"
SCRIPT = "'Caveat', 'Kalam', cursive"

ARROW_COLORS = {'navy': NAVY, 'coral': CORAL, 'ink': INK, 'green': '#1f9d63', 'purple': '#7a5af8', 'blue': '#2b7de9', 'amber': '#e08a00'}


def esc(s):
    return html.escape(str(s), quote=False)


def shade(hex_, f=0.88):
    hex_ = hex_.lstrip('#')
    r, g, b = [int(hex_[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % (int(r * f), int(g * f), int(b * f))


def est(text, size, bold=False):
    return len(text) * size * (0.50 if bold else 0.43)


def wrap(text, maxw, size, bold=False):
    out = []
    for para in str(text).split('\n'):
        words, cur = para.split(' '), ''
        for w in words:
            t = (cur + ' ' + w).strip()
            if est(t, size, bold) <= maxw or not cur:
                cur = t
            else:
                out.append(cur)
                cur = w
        out.append(cur)
    return out


class Page:
    def __init__(self, section, title, num, total, accent=CORAL, subtitle=''):
        self.section, self.title, self.num, self.total = section, title, num, total
        self.accent, self.subtitle = accent, subtitle
        self.p = []
        self.warn = []

    # ---- low level ------------------------------------------------------
    def add(self, s):
        self.p.append(s)

    def text(self, x, y, s, size=15, fill=INK, font=BODY, anchor='start', rot=0, weight='normal', opacity=1):
        tr = f' transform="rotate({rot} {x} {y})"' if rot else ''
        self.add(f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" opacity="{opacity}"{tr}>{esc(s)}</text>')

    def para(self, x, y, s, maxw, size=14, fill=INK, font=BODY, lh=None, anchor='start', bold=False):
        lh = lh or size * 1.22
        lines = wrap(s, maxw, size, bold)
        for i, l in enumerate(lines):
            self.text(x, y + i * lh, l, size, fill, BOLD if bold else font, anchor)
        return y + len(lines) * lh

    def line(self, x1, y1, x2, y2, color=NAVY, w=2, dash=None, cap='round'):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}" stroke-linecap="{cap}"{d}/>')

    def rect(self, x, y, w, h, fill='none', stroke=INK, sw=2, rx=8, dash=None, opacity=1, rot=0):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        tr = f' transform="rotate({rot} {x + w / 2} {y + h / 2})"' if rot else ''
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"{d}{tr}/>')

    def circle(self, cx, cy, r, fill='none', stroke=INK, sw=2):
        self.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def path(self, d, fill='none', stroke=INK, sw=2, dash=None, marker=None, opacity=1):
        m = f' marker-end="url(#ah-{marker})"' if marker else ''
        dd = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"{dd}{m}/>')

    # ---- sticky note ----------------------------------------------------
    def note(self, x, y, w, h, color=YELLOW, title='', lines=(), rot=0, size=14.5, tsize=18, tape=True,
             tcolor=INK, align='left', lh=None, pad=12, bullet=True, tapecolor=None, check=True):
        cx, cy = x + w / 2, y + h / 2
        g = [f'<g transform="rotate({rot} {cx} {cy})">']
        g.append(f'<path d="M{x+4},{y+6} H{x+w+4} V{y+h-8} L{x+w-10},{y+h+6} H{x+4} Z" fill="#000" opacity="0.13"/>')
        g.append(f'<path d="M{x},{y} H{x+w} V{y+h-16} L{x+w-16},{y+h} H{x} Z" fill="{color}" stroke="{shade(color, .8)}" stroke-width="1"/>')
        g.append(f'<path d="M{x+w},{y+h-16} L{x+w-16},{y+h} L{x+w-16},{y+h-16} Z" fill="{shade(color, .82)}"/>')
        self.add(''.join(g))
        ty = y + pad + tsize * 0.85
        lh = lh or size * 1.2
        maxw = w - pad * 2
        ax = x + pad if align == 'left' else x + w / 2
        anc = 'start' if align == 'left' else 'middle'
        if title:
            for l in wrap(title, maxw, tsize, True):
                self.text(ax, ty, l, tsize, tcolor, BOLD, anc, weight='bold')
                ty += tsize * 1.18
            ty += 3
        for ln in lines:
            style = None
            if ln.startswith('!'):
                style, ln = 'b', ln[1:]
            elif ln.startswith('~'):
                style, ln = 'c', ln[1:]
            pre = ''
            if bullet and align == 'left' and not style and not ln.startswith(' '):
                pre = '• '
            wl = wrap(pre + ln, maxw, size, style == 'b')
            for i, l in enumerate(wl):
                txt = l if i == 0 else ('  ' + l if pre else l)
                self.text(ax, ty + size * 0.8, txt, size, CORAL if style == 'c' else tcolor, BOLD if style == 'b' else BODY, anc, weight='bold' if style == 'b' else 'normal')
                ty += lh
        if check and ty > y + h - 6:
            self.warn.append(f'note "{title}" overflows by {ty - (y + h):.0f}px')
        if tape:
            tc = tapecolor or ('rgba(255,99,114,0.55)' if color != PINK else 'rgba(180,186,255,0.7)')
            self.add(f'<rect x="{cx-26}" y="{y-9}" width="52" height="18" fill="{tc}" transform="rotate({-3 if rot >= 0 else 3} {cx} {y})"/>')
        self.add('</g>')

    def pin(self, x, y, color=CORAL):
        self.add(f'<circle cx="{x}" cy="{y}" r="7" fill="{shade(color, .8)}"/><circle cx="{x-1}" cy="{y-1.5}" r="5.5" fill="{color}"/><circle cx="{x-2.5}" cy="{y-3}" r="1.8" fill="#fff" opacity=".8"/>')

    # ---- boxes / cards ---------------------------------------------------
    def card(self, x, y, w, h, fill=WHITE, stroke=INK, title='', lines=(), size=14, tsize=17, tcolor=INK, rx=12,
             align='left', sw=2.4, headfill=None, shadow=True, lh=None, bullet=False):
        if shadow:
            self.rect(x + 3, y + 4, w, h, fill=stroke, stroke='none', rx=rx, opacity=0.18)
        self.rect(x, y, w, h, fill=fill, stroke=stroke, sw=sw, rx=rx)
        ty = y + 8 + tsize * 0.85
        anc, ax = ('start', x + 10) if align == 'left' else ('middle', x + w / 2)
        maxw = w - 20
        if title:
            if headfill:
                self.add(f'<path d="M{x+1},{y+1+rx} Q{x+1},{y+1} {x+1+rx},{y+1} H{x+w-1-rx} Q{x+w-1},{y+1} {x+w-1},{y+1+rx} V{y+tsize*1.9} H{x+1} Z" fill="{headfill}"/>')
            for l in wrap(title, maxw, tsize, True):
                self.text(ax, ty, l, tsize, tcolor, BOLD, anc, weight='bold')
                ty += tsize * 1.15
            ty += 4
        lh = lh or size * 1.2
        for ln in lines:
            pre = '• ' if bullet else ''
            for i, l in enumerate(wrap(pre + ln, maxw, size)):
                self.text(ax, ty + size * 0.8, ('  ' + l) if (i and pre) else l, size, INK, BODY, anc)
                ty += lh
        if ty > y + h + 2:
            self.warn.append(f'card "{title}" overflows by {ty - (y + h):.0f}px')

    def pill(self, x, y, s, fill=CORAL, color=WHITE, size=13, padx=10, h=None, stroke=None, anchor='start'):
        w = est(s, size, True) + padx * 2
        h = h or size * 1.7
        x0 = x if anchor == 'start' else x - w / 2
        self.rect(x0, y, w, h, fill=fill, stroke=stroke or 'none', sw=1.5, rx=h / 2)
        self.text(x0 + w / 2, y + h * 0.72, s, size, color, BOLD, 'middle', weight='bold')
        return w

    def diamond(self, cx, cy, w, h, fill=YELLOW, text='', size=13, stroke=INK):
        self.add(f'<path d="M{cx},{cy-h/2} L{cx+w/2},{cy} L{cx},{cy+h/2} L{cx-w/2},{cy} Z" fill="{fill}" stroke="{stroke}" stroke-width="2.2" stroke-linejoin="round"/>')
        ls = wrap(text, w * 0.62, size)
        y0 = cy - (len(ls) - 1) * size * 0.55 + size * 0.3
        for i, l in enumerate(ls):
            self.text(cx, y0 + i * size * 1.1, l, size, INK, BOLD, 'middle')

    def cylinder(self, x, y, w, h, fill=MINT, title='', size=15):
        ry = 12
        self.add(f'<path d="M{x},{y+ry} V{y+h-ry} A{w/2},{ry} 0 0 0 {x+w},{y+h-ry} V{y+ry}" fill="{fill}" stroke="{INK}" stroke-width="2.4"/>')
        self.add(f'<ellipse cx="{x+w/2}" cy="{y+ry}" rx="{w/2}" ry="{ry}" fill="{shade(fill, 1.05) if False else fill}" stroke="{INK}" stroke-width="2.4"/>')
        self.add(f'<path d="M{x},{y+ry+16} A{w/2},{ry} 0 0 0 {x+w},{y+ry+16}" fill="none" stroke="{INK}" stroke-width="1.6" opacity=".5"/>')
        if title:
            ty = y + h / 2 + 4
            for l in wrap(title, w - 14, size, True):
                self.text(x + w / 2, ty, l, size, INK, BOLD, 'middle', weight='bold')
                ty += size * 1.15

    def person(self, cx, y, label, color=SKY, sub=''):
        self.add(f'<circle cx="{cx}" cy="{y+14}" r="13" fill="{color}" stroke="{INK}" stroke-width="2.2"/>')
        self.add(f'<path d="M{cx-20},{y+52} Q{cx-20},{y+30} {cx},{y+30} Q{cx+20},{y+30} {cx+20},{y+52} Z" fill="{color}" stroke="{INK}" stroke-width="2.2"/>')
        self.text(cx, y + 70, label, 15, INK, BOLD, 'middle', weight='bold')
        if sub:
            self.text(cx, y + 85, sub, 12.5, MUTED, BODY, 'middle')

    def window(self, x, y, w, h, title='', fill=DNAVY, bar=NAVY, stroke=INK):
        self.rect(x + 3, y + 4, w, h, fill=INK, stroke='none', rx=10, opacity=.2)
        self.rect(x, y, w, h, fill=fill, stroke=stroke, sw=2.4, rx=10)
        self.add(f'<path d="M{x+1},{y+30} V{y+11} Q{x+1},{y+1} {x+11},{y+1} H{x+w-11} Q{x+w-1},{y+1} {x+w-1},{y+11} V{y+30} Z" fill="{bar}"/>')
        for i, c in enumerate([CORAL, YELLOW, MINT]):
            self.circle(x + 16 + i * 16, y + 15, 4.5, c, 'none', 0)
        if title:
            self.text(x + 70, y + 20, title, 13, WHITE, BODY)

    # ---- connectors -------------------------------------------------------
    def arrow(self, pts, color='navy', dash=None, sw=2.6, label='', lpos=0.5, lsize=15, ldx=0, ldy=-6, lcolor=None, curve=None):
        c = ARROW_COLORS.get(color, color)
        if curve is not None and len(pts) == 2:
            (x1, y1), (x2, y2) = pts
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            dx, dy = x2 - x1, y2 - y1
            n = math.hypot(dx, dy) or 1
            cxp, cyp = mx - dy / n * curve, my + dx / n * curve
            d = f'M{x1},{y1} Q{cxp},{cyp} {x2},{y2}'
            lx = 0.25 * x1 + 0.5 * cxp + 0.25 * x2
            ly = 0.25 * y1 + 0.5 * cyp + 0.25 * y2
        else:
            d = f'M{pts[0][0]},{pts[0][1]}'
            for (x, y) in pts[1:]:
                d += f' L{x},{y}'
            # label position along polyline
            segs = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
            total = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in segs) or 1
            target, acc, lx, ly = total * lpos, 0, pts[0][0], pts[0][1]
            for a, b in segs:
                L = math.hypot(b[0] - a[0], b[1] - a[1])
                if acc + L >= target:
                    t = (target - acc) / (L or 1)
                    lx, ly = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
                    break
                acc += L
        key = color if color in ARROW_COLORS else 'navy'
        self.path(d, stroke=c, sw=sw, dash=dash, marker=key)
        if label:
            self.text(lx + ldx, ly + ldy, label, lsize, lcolor or c, SCRIPT, 'middle', weight='bold')

    def squiggle(self, x, y, w, color=CORAL, sw=3):
        d, n = f'M{x},{y}', int(w / 14)
        for i in range(n):
            d += f' q7,-6 14,0'
        self.path(d, stroke=color, sw=sw)

    def star(self, cx, cy, r=10, color=YELLOW):
        pts = []
        for i in range(10):
            rr = r if i % 2 == 0 else r * 0.45
            a = -math.pi / 2 + i * math.pi / 5
            pts.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
        self.add(f'<polygon points="{" ".join(pts)}" fill="{color}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>')

    def callout(self, x, y, s, color=CORAL, size=19, rot=-3, anchor='start'):
        self.text(x, y, s, size, color, SCRIPT, anchor, rot=rot, weight='bold')

    # ---- DB schema card ----------------------------------------------------
    def schema(self, x, y, w, title, color, rows, size=13, rowh=19.5, sub='', cols=(0.40, 0.60)):
        """rows: (name, type, note, flag) ; flag in PK FK UQ IDX ENUM '' ; returns dict with y centres per row"""
        head = 36 if not sub else 46
        h = head + rowh * len(rows) + 10
        self.rect(x + 4, y + 5, w, h, fill=INK, stroke='none', rx=10, opacity=.2)
        self.rect(x, y, w, h, fill=WHITE, stroke=INK, sw=2.4, rx=10)
        self.add(f'<path d="M{x+1.2},{y+head} V{y+11} Q{x+1.2},{y+1.2} {x+11},{y+1.2} H{x+w-11} Q{x+w-1.2},{y+1.2} {x+w-1.2},{y+11} V{y+head} Z" fill="{color}"/>')
        self.line(x, y + head, x + w, y + head, INK, 2)
        self.text(x + 12, y + 24, title, 19, INK, BOLD, weight='bold')
        if sub:
            self.text(x + 12, y + 40, sub, 12.5, shade(color, .45), BODY)
        centres = {}
        c1 = x + 12 + 26
        c2 = x + w * cols[0] + 6
        for i, r in enumerate(rows):
            name, typ, note, flag = (list(r) + ['', '', ''])[:4]
            ry = y + head + 6 + i * rowh
            if i % 2 == 1:
                self.rect(x + 3, ry, w - 6, rowh, fill=shade(PAPER, .97), stroke='none', rx=0)
            base = ry + rowh * 0.72
            if flag:
                fc = {'PK': CORAL, 'FK': '#7a5af8', 'UQ': '#1f9d63', 'IDX': '#2b7de9', 'ENUM': AMBER, 'EMB': '#d6336c'}.get(flag, NAVY)
                self.rect(x + 8, ry + 3, 24, rowh - 6, fill=fc, stroke='none', rx=5)
                self.text(x + 20, base - 1, flag, 9.5, WHITE, BOLD, 'middle', weight='bold')
            self.text(c1 + 2, base, name, size, INK, BOLD, weight='bold')
            self.text(c2, base, typ, size - 0.5, '#c2185b' if typ.startswith('ObjectId') else '#1b5fa8', BODY)
            if note:
                self.text(x + w - 10, base, note, size - 1.5, MUTED, BODY, 'end')
            centres[i] = ry + rowh / 2
        return {'x': x, 'y': y, 'w': w, 'h': h, 'rows': centres}

    # ---- render --------------------------------------------------------------
    def render(self):
        a = self.accent
        defs = ''.join(
            f'<marker id="ah-{k}" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11 L4,6 Z" fill="{v}"/></marker>'
            for k, v in ARROW_COLORS.items())
        defs += f'<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="{LAV2}" opacity=".55"/></pattern>'
        head = []
        head.append(f'<rect width="{W}" height="{H}" fill="{PAPER}"/><rect width="{W}" height="{H}" fill="url(#dots)"/>')
        # header banner
        head.append(f'<path d="M0,0 H{W} V62 Q{W/2},74 0,62 Z" fill="{DNAVY}"/>')
        head.append(f'<path d="M0,62 Q{W/2},74 {W},62 V68 Q{W/2},80 0,68 Z" fill="{a}"/>')
        head.append(f'<text x="28" y="43" font-family="{MARKER}" font-size="31" fill="#fff">{esc(self.title)}</text>')
        if self.subtitle:
            head.append(f'<text x="{28 + len(self.title) * 19.5 + 22}" y="43" font-family="{SCRIPT}" font-size="22" font-weight="bold" fill="{LAV}">{esc(self.subtitle)}</text>')
        # section tag
        tw = est(self.section, 15, True) + 28
        head.append(f'<g transform="rotate(3 {W-tw/2-24} 34)"><rect x="{W-tw-24}" y="14" width="{tw}" height="30" rx="6" fill="{a}" stroke="#fff" stroke-width="2"/><text x="{W-tw/2-24}" y="35" text-anchor="middle" font-family="{BOLD}" font-weight="bold" font-size="15" fill="#fff">{esc(self.section)}</text></g>')
        foot = []
        foot.append(f'<text x="28" y="{H-14}" font-family="{SCRIPT}" font-size="21" font-weight="bold" fill="{NAVY}">Manage<tspan fill="{CORAL}">Tax</tspan>Mission</text>')
        foot.append(f'<text x="{W/2}" y="{H-14}" text-anchor="middle" font-family="{BODY}" font-size="14" fill="{MUTED}">Next.js 14 · React 18 · MongoDB · FBR Bridge · Sales Tax / FED invoicing</text>')
        foot.append(f'<g transform="rotate(-2 {W-70} {H-20})"><rect x="{W-120}" y="{H-36}" width="96" height="26" rx="13" fill="{YELLOW}" stroke="{INK}" stroke-width="1.8"/><text x="{W-72}" y="{H-18}" text-anchor="middle" font-family="{BOLD}" font-weight="bold" font-size="15" fill="{INK}">page {self.num} / {self.total}</text></g>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="100%" height="100%"><defs>{defs}</defs>'
                + ''.join(head) + ''.join(self.p) + ''.join(foot) + '</svg>')


def build_html(pages, fonts_css, doc_title):
    body = ''.join(f'<section class="pg">{p.render()}</section>' for p in pages)
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>{esc(doc_title)}</title>
<style>{fonts_css}
@page {{ size: 297mm 210mm; margin: 0 }}
html,body {{ margin:0; padding:0; background:#fff; }}
.pg {{ width:297mm; height:210mm; overflow:hidden; page-break-after:always; break-after:page; }}
.pg:last-child {{ page-break-after:auto; break-after:auto; }}
svg {{ display:block; }}
</style></head><body>{body}</body></html>'''
