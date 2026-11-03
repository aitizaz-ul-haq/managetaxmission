from lib import *
import math

TOTAL = 20

# dark UI colours used in the wireframes (real app portal palette)
D_BG = '#090e25'
D_SURF = '#171e3a'
D_LINE = '#3a4577'
D_ALT = '#202b49'
D_TXT = '#f3f4ff'
D_MUT = '#aab5d9'
D_PINK = '#ff637f'
D_MINT = '#32e6b4'
D_AMB = '#ffc258'
D_BLUE = '#4b8bff'
D_PURP = '#8f7bff'


# ---------------------------------------------------------------- wireframe helpers
def dcard(p, x, y, w, h, fill=D_SURF, stroke=D_LINE, rx=6):
    p.rect(x, y, w, h, fill=fill, stroke=stroke, sw=1.2, rx=rx)


def dtext(p, x, y, s, size=9, fill=D_TXT, bold=False, anchor='start'):
    p.text(x, y, s, size, fill, BOLD if bold else BODY, anchor, weight='bold' if bold else 'normal')


def spark(p, x, y, w, h, color, pts=None):
    pts = pts or [0.8, 0.55, 0.65, 0.3, 0.45, 0.15, 0.3]
    d = ''
    for i, v in enumerate(pts):
        xx = x + w * i / (len(pts) - 1)
        d += ('M' if i == 0 else ' L') + f'{xx:.1f},{y + h * v:.1f}'
    p.path(d, stroke=color, sw=1.6)


def stat(p, x, y, w, h, label, val, col, pct='↑ 0%'):
    dcard(p, x, y, w, h)
    p.rect(x + 5, y + 6, 16, 16, fill=col, stroke='none', rx=4, opacity=.9)
    dtext(p, x + 26, y + 13, label, 8.5, D_MUT)
    dtext(p, x + 26, y + 28, val, 13, D_TXT, True)
    if h > 34:
        dtext(p, x + 6, y + h - 5, pct, 8.5, D_MINT if '↑' in pct else D_PINK, True)
    if w >= 90:
        spark(p, x + w - 34, y + h - 12, 28, 7, col)


def donut(p, cx, cy, r, parts, sw=11):
    circ = 2 * math.pi * r
    off = 0
    for frac, col in parts:
        if frac <= 0:
            continue
        p.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-dasharray="{circ*frac:.1f} {circ:.1f}" stroke-dashoffset="{-off:.1f}" transform="rotate(-90 {cx} {cy})"/>')
        off += circ * frac


def table_rows(p, x, y, w, heads, rows, rh=11, size=8):
    dtext(p, x, y, '', size)
    cw = w / len(heads)
    for i, h in enumerate(heads):
        dtext(p, x + i * cw, y, h, size, D_MUT, True)
    for r, row in enumerate(rows):
        yy = y + 11 + r * rh
        p.line(x - 2, yy - 8, x + w, yy - 8, D_LINE, 0.6)
        for i, c in enumerate(row):
            if c in ('Submitted', 'Failed', 'Draft', 'Validated'):
                col = {'Submitted': D_MINT, 'Failed': D_PINK, 'Draft': D_AMB, 'Validated': D_MINT}[c]
                p.rect(x + i * cw, yy - 8, 36, 10, fill='none', stroke=col, sw=1, rx=5)
                dtext(p, x + i * cw + 18, yy - 1, c, 7.5, col, True, 'middle')
            else:
                dtext(p, x + i * cw, yy, c, size, D_TXT)


def sidebar(p, x, y, w, h, items, active=0, portal=''):
    p.rect(x, y, w, h, fill='#12182f', stroke=D_LINE, sw=1, rx=0)
    dtext(p, x + w / 2, y + 16, 'Manage', 11, WHITE, True, 'middle')
    p.text(x + w / 2, y + 28, 'Taxmission', 11, D_PINK, BOLD, 'middle', weight='bold')
    dtext(p, x + w / 2, y + 38, portal, 7, D_MUT, False, 'middle')
    for i, it in enumerate(items):
        yy = y + 52 + i * 21
        if i == active:
            p.rect(x + 5, yy - 3, w - 10, 18, fill='rgba(255,99,127,0.28)', stroke=D_PINK, sw=1, rx=5)
        p.rect(x + 10, yy + 1, 8, 8, fill=D_MUT, stroke='none', rx=2, opacity=.7)
        dtext(p, x + 23, yy + 9, it, 8.5, D_TXT)
    p.rect(x + 5, y + h - 26, w - 10, 18, fill='none', stroke=D_PINK, sw=1, rx=5)
    dtext(p, x + w / 2, y + h - 14, 'Logout', 8.5, D_PINK, True, 'middle')


def topbar(p, x, y, w, title, search=True):
    p.line(x, y + 24, x + w, y + 24, D_LINE, 1)
    dtext(p, x + 8, y + 16, title, 9.5, D_TXT, True)
    if search:
        p.rect(x + w - 190, y + 5, 120, 15, fill=D_SURF, stroke=D_LINE, sw=1, rx=6)
        dtext(p, x + w - 182, y + 15.5, 'Search…        Ctrl+K', 7.5, D_MUT)
    p.circle(x + w - 56, y + 13, 5, fill='none', stroke=D_MUT, sw=1)
    p.circle(x + w - 30, y + 13, 7, fill=D_PURP, stroke='none')
    dtext(p, x + w - 20, y + 16, '▾', 8, D_MUT)


def hero(p, x, y, w, h, kicker, a, b, sub):
    p.rect(x, y, w, h, fill='#1d2550', stroke=D_LINE, sw=1, rx=6)
    dtext(p, x + 8, y + 12, kicker, 6.5, D_MUT)
    p.text(x + 8, y + 29, a, 15, D_PINK, BOLD, weight='bold')
    p.text(x + 8 + est(a, 15, True) * 0.9 + 6, y + 29, b, 15, WHITE, BOLD, weight='bold')
    dtext(p, x + 8, y + 41, sub, 7.5, D_MUT)
    for i, hh in enumerate([8, 12, 16, 22, 28, 20, 32]):
        p.rect(x + w - 120 + i * 11, y + h - 6 - hh, 7, hh, fill='rgba(255,99,127,0.5)', stroke='none', rx=1)


def status_bars(p, x, y, w, rows, rh=15):
    for i, (lbl, frac, col, n) in enumerate(rows):
        yy = y + i * rh
        dtext(p, x, yy + 8, lbl, 8.5, D_TXT)
        p.rect(x + 56, yy + 1, w - 90, 7, fill=D_ALT, stroke='none', rx=3)
        p.rect(x + 56, yy + 1, max((w - 90) * frac, 2), 7, fill=col, stroke='none', rx=3)
        dtext(p, x + w - 6, yy + 8, str(n), 8.5, D_TXT, True, 'end')


def bar_chart(p, x, y, w, h, vals, col=D_PURP):
    for i, v in enumerate(vals):
        bw = w / len(vals) * 0.5
        bx = x + i * w / len(vals) + w / len(vals) * 0.25
        p.rect(bx, y + h - v * h, bw, v * h, fill=col, stroke='none', rx=2)
    p.line(x, y + h, x + w, y + h, D_LINE, 1)


def finance(p, x, y, w, h, label, val, col):
    dcard(p, x, y, w, h)
    p.rect(x + 5, y + 6, 16, 16, fill=col, stroke='none', rx=4)
    dtext(p, x + 26, y + 13, label, 8, D_MUT)
    dtext(p, x + 26, y + 28, val, 12, D_TXT, True)
    spark(p, x + w - 44, y + 12, 38, 16, col)


# =============================================================================
def f1():
    p = Page('FEATURES 1/10', 'Who Does What', 11, TOTAL, CORAL, 'journeys for each role')
    lanes = [
        ('Super Admin', PINK, '/admin', [
            ('Register company', ['FBR registration data', 'branches', 'sandbox + production tokens']),
            ('Create users', ['accountants & supervisors', 'set passwords', 'activate / deactivate']),
            ('Manage ref. data', ['provinces · HS codes', 'tax rates · UOM', 'SRO schedules']),
            ('Monitor submissions', ['all companies', 'status filters', 'record details']),
            ('Dashboard + search', ['10 live metrics', 'Ctrl/Cmd+K search', 'activity feed'])]),
        ('Accountant', MINT, '/company', [
            ('Sign in', ['lands on dashboard', 'company-scoped data']),
            ('Save invoice items', ['reusable item templates', 'per seller registration']),
            ('Create submission', ['seller · buyer · scenario', 'item grid + live totals']),
            ('Validate', ['client + server rules', 'fix listed errors']),
            ('Submit to FBR', ['sandbox / production', 'receipt + print A4'])]),
        ('Supervisor', SKY, '/supervisor', [
            ('Sign in', ['password set by admin', 'read-only role']),
            ('Review dashboard', ['progress · ready · failed', 'financial totals']),
            ('Search & filter', ['status · environment', 'paged lists']),
            ('Open a record', ['read-only modal', 'print-ready A4']),
            ('Export CSV', ['all matching records', 'formula-safe cells'])]),
    ]
    tints = ['rgba(255,157,177,.20)', 'rgba(155,240,200,.25)', 'rgba(143,211,255,.22)']
    cyc = [YELLOW, ORANGE, LIME, PURPLE, YELLOW]
    for li, (name, col, path, steps) in enumerate(lanes):
        y = 96 + li * 227
        p.rect(24, y, 1075, 214, fill=tints[li], stroke=NAVY, sw=2, rx=16, dash='9 6')
        p.person(80, y + 52, name, col, path + '/*')
        for i, (t, ls) in enumerate(steps):
            x = 168 + i * 186
            p.note(x, y + 30, 160, 156, cyc[(i + li) % 5], f'{i+1}. {t}', ls, rot=[-1.5, 1, -0.8, 1.4, -1][i], size=14.5, tsize=17.5, pad=11)
            if i < 4:
                p.arrow([(x + 164, y + 108), (x + 182, y + 108)], 'coral', sw=3)
    return p


def f2():
    p = Page('FEATURES 2/10', 'Creating & Sending an Invoice', 12, TOTAL, '#7a5af8', 'accountant flowchart')

    def box(x, y, w, h, c, t, sub=''):
        p.rect(x + 3, y + 4, w, h, fill=INK, stroke='none', rx=12, opacity=.18)
        p.rect(x, y, w, h, fill=c, stroke=INK, sw=2.4, rx=12)
        ls = wrap(t, w - 16, 15.5, True)
        yy = y + (h - len(ls) * 17 - (14 if sub else 0)) / 2 + 14
        for l in ls:
            p.text(x + w / 2, yy, l, 15.5, INK, BOLD, 'middle', weight='bold')
            yy += 17
        if sub:
            p.text(x + w / 2, yy, sub, 12.5, MUTED, BODY, 'middle')
    p.pill(30, 108, 'START', '#1f9d63', WHITE, 14)
    box(110, 100, 160, 62, SKY, 'Open New Submission')
    box(300, 100, 190, 62, MINT, 'Pick seller registration', 'auto-fill saved items')
    box(520, 100, 210, 62, YELLOW, 'Choose scenario + environment', 'SN018 / SN019 · sandbox / prod')
    box(760, 100, 190, 62, PINK, 'Add item rows', 'qty × price × rate')
    for a, b in ((84, 108), (270, 300), (490, 520), (730, 760)):
        pass
    p.arrow([(80, 131), (108, 131)], 'coral')
    p.arrow([(272, 131), (298, 131)], 'coral')
    p.arrow([(492, 131), (518, 131)], 'coral')
    p.arrow([(732, 131), (758, 131)], 'coral')
    p.arrow([(855, 164), (855, 214)], 'coral', label='totals recalc live', ldx=62, ldy=0)
    # row 2 (right to left)
    box(760, 216, 190, 62, ORANGE, 'Buyer + invoice details', 'NTN/CNIC · province · type')
    box(520, 216, 210, 62, LIME, 'Save Draft', 'POST / PUT /api/company/submissions')
    box(280, 216, 210, 62, PURPLE, 'Validate', 'client rules → POST …/validate')
    p.arrow([(758, 247), (732, 247)], 'coral')
    p.arrow([(518, 247), (492, 247)], 'coral')
    p.diamond(150, 247, 150, 94, YELLOW, 'All rules pass?', 14)
    p.arrow([(278, 247), (227, 247)], 'coral')
    # errors branch
    p.arrow([(150, 200), (150, 190)], 'coral')
    p.text(150, 182, 'No → errors listed, stays draft', 14, CORAL, SCRIPT, 'middle', weight='bold')
    # yes branch down
    p.arrow([(150, 294), (150, 330)], 'green', label='Yes', ldx=20, ldy=0)
    box(70, 332, 160, 58, MINT, 'status = validated')
    p.text(150, 408, 'then, when ready…', 16, CORAL, SCRIPT, 'middle', weight='bold')
    # submit row
    box(30, 430, 200, 66, ORANGE, 'Click "Submit to FBR"', 'local validate first')
    box(270, 430, 200, 66, SKY, 'Save latest form', 'POST / PUT submission')
    box(510, 430, 210, 66, YELLOW, 'POST /api/fbr/submit', 'mapper + token + bridge')
    p.arrow([(232, 463), (268, 463)], 'coral')
    p.arrow([(472, 463), (508, 463)], 'coral')
    p.diamond(830, 463, 150, 96, PINK, 'FBR success?', 14)
    p.arrow([(722, 463), (755, 463)], 'coral')
    p.arrow([(905, 463), (940, 463)], 'green', label='Yes', ldy=-8)
    box(940, 436, 160, 56, MINT, 'status submitted')
    p.arrow([(830, 512), (830, 556)], 'coral', label='No', ldx=-18, ldy=0)
    box(730, 558, 200, 56, PINK, 'status failed', 'error message shown')
    p.arrow([(1020, 494), (1020, 556)], 'green')
    box(940, 558, 160, 56, SKY, 'FbrSuccessModal', 'receipt + print')
    p.note(30, 540, 330, 104, LIME, 'Form state', ['useReducer: SET_FIELD · ADD_ITEM · UPDATE_ITEM · REMOVE_ITEM', 'row totals recomputed on every edit'], rot=-1, size=14, tsize=17, pad=10)
    p.note(380, 540, 330, 104, PURPLE, 'Fill sample data helper', ['uses the selected scenario defaults', 'for demo / testing only'], rot=1, size=14, tsize=17, pad=10)
    p.note(30, 660, 1070, 86, YELLOW, 'Every step is company-scoped & audited', ['A FbrReceipt row is written for success AND failure · password confirmation protects deletes · production submits go to production token only'], rot=-0.4, size=15, tsize=18, bullet=False, pad=12)
    return p


def f3():
    p = Page('FEATURES 3/10', 'Validation Rulebook', 13, TOTAL, '#1f9d63', 'lib/validators/submissionValidator.js')

    def chk(x, y, ok=True):
        c = '#1f9d63' if ok else CORAL
        p.circle(x, y, 9, fill=c, stroke='none')
        p.text(x, y + 5.5, '✔' if ok else '✘', 14, WHITE, BOLD, 'middle', weight='bold')
    # header rules
    p.note(24, 98, 360, 372, YELLOW, '', [], rot=-0.6, check=False)
    p.add('<g transform="rotate(-0.6 204 284)">')
    p.text(40, 128, 'Header rules', 21, INK, BOLD, weight='bold')
    hdr = ['Scenario ID required', 'Submission type matches scenario', 'Invoice type = Sale Invoice', 'Invoice date valid, not in future', 'Tax period ≤ current month, ≤ 6 months old',
           'Seller / buyer province in FBR list', 'Seller / buyer NTN or CNIC valid', 'Internal document number present', 'Buyer type from allowed list', 'Names + addresses present', 'At least one item row']
    for i, t in enumerate(hdr):
        chk(46, 152 + i * 28)
        p.text(62, 158 + i * 28, t, 15, INK, BODY)
    p.add('</g>')
    # item rules
    p.note(400, 98, 360, 372, MINT, '', [], rot=0.7, check=False)
    p.add('<g transform="rotate(0.7 580 284)">')
    p.text(416, 128, 'Per-item rules', 21, INK, BOLD, weight='bold')
    it = ['Description · HS code · UOM present', 'Origin + destination province', 'Buyer type + document number', 'Sale type matches scenario', 'Quantity > 0 (max 4 decimals)', 'Unit price > 0', 'Tax rate between 0 and 100',
          'Fixed / notified value present', 'SRO schedule no. present', 'SRO item serial no. present']
    for i, t in enumerate(it):
        chk(422, 152 + i * 28)
        p.text(438, 158 + i * 28, t, 15, INK, BODY)
    p.add('</g>')
    # identifier tester
    p.note(776, 98, 322, 232, SKY, 'NTN / CNIC checker', [], rot=1, check=False)
    p.text(792, 154, '/^[0-9A-Z]{7}$|^[0-9]{13}$/', 16, '#c2185b', SCRIPT, weight='bold')
    ex = [('F443122', True, 'NTN (alphanumeric)'), ('4765371', True, 'NTN (digits)'), ('1234567890123', True, 'CNIC 13 digits'), ('12345', False, 'too short'), ('f44-3122', False, 'dash removed → 7 chars OK?')]
    ex = ex[:4]
    for i, (v, ok, d) in enumerate(ex):
        y = 186 + i * 35
        p.rect(790, y - 18, 296, 28, fill=WHITE, stroke=INK, sw=1.8, rx=7)
        p.text(802, y + 2, v, 16, INK, BOLD, weight='bold')
        p.text(962, y + 1, d, 13, MUTED, BODY)
        chk(1072, y - 4, ok)
    p.text(792, 322, 'input is uppercased & stripped first', 14, CORAL, SCRIPT, weight='bold')
    # scenario rule
    p.card(776, 346, 322, 124, fill=WHITE, title='Scenario ⇄ type ⇄ sale type', size=14, tsize=17, shadow=True,
           lines=['SN018 → services_fed_st_mode → "Services (FED in ST Mode)"', 'SN019 → sale_tax_fed → "Services"', 'other IDs: only "scenario required"'], bullet=True)
    # chips
    p.text(24, 502, 'Allowed provinces (FBR names)', 19, CORAL, SCRIPT, weight='bold')
    chips = ['CAPITAL TERRITORY', 'PUNJAB', 'SINDH', 'KHYBER PAKHTUNKHWA', 'BALOCHISTAN', 'AZAD JAMMU AND KASHMIR', 'GILGIT BALTISTAN']
    x, y = 24, 512
    for i, c in enumerate(chips):
        w = est(c, 13, True) + 22
        if x + w > 760:
            x, y = 24, y + 30
        p.pill(x, y, c, [PINK, ORANGE, LIME, MINT, SKY, PURPLE, YELLOW][i], INK, 13, stroke=INK)
        x += w + 8
    p.text(24, 612, 'Buyer types', 19, CORAL, SCRIPT, weight='bold')
    x = 24
    for c, col in (('Registered', MINT), ('Unregistered', YELLOW), ('Unregistered Distributor', ORANGE), ('Retail Consumer', PINK)):
        w = p.pill(x, 622, c, col, INK, 13, stroke=INK)
        x += w + 8
    p.note(24, 668, 360, 86, PINK, 'Aliases accepted', ['Islamabad / ICT → CAPITAL TERRITORY', 'KPK → KHYBER PAKHTUNKHWA'], rot=-1, size=14, tsize=17, pad=10)
    p.note(400, 668, 360, 86, LIME, 'Two validators, one rule file', ['same function runs in the browser and on the server', 'plus FBR\'s own checks via the bridge'], rot=0.8, size=14, tsize=17, pad=10)
    p.note(776, 500, 322, 254, ORANGE, 'Typical error messages', ['Invoice date cannot be in the future', 'Tax period must be within the last 6 months', 'Seller NTN/CNIC must be 7 characters (NTN) or 13 numeric digits (CNIC)', 'Item 2: quantity must be greater than 0', 'Item 1: SRO schedule number is required'], rot=-0.8, size=14, tsize=18)
    return p


def f4():
    p = Page('FEATURES 4/10', 'Tax Maths — a Worked Example', 14, TOTAL, '#e08a00', 'calculateInvoiceTotals()')
    # invoice sketch
    p.rect(24, 98, 740, 330, fill=WHITE, stroke=INK, sw=2.6, rx=10)
    p.add(f'<path d="M25,99 H763 V132 H25 Z" fill="{DNAVY}"/>')
    p.text(40, 122, 'Sample invoice · Scenario SN019 · Services · 16%', 18, WHITE, BOLD, weight='bold')
    heads = ['#', 'Description', 'Qty', 'Unit price', 'Sale value', 'Rate', 'Tax']
    xs = [40, 74, 330, 400, 500, 610, 670]
    for h, x in zip(heads, xs):
        p.text(x, 158, h, 15, CORAL, BOLD, weight='bold')
    p.line(34, 166, 754, 166, INK, 2)
    rows = [('1', 'Consulting services', '10', '5,000', '50,000', '16%', '8,000'), ('2', 'Software support', '2', '12,500', '25,000', '16%', '4,000'), ('3', 'Training day', '1', '8,000', '8,000', '16%', '1,280')]
    for i, r in enumerate(rows):
        y = 192 + i * 34
        if i % 2:
            p.rect(34, y - 20, 720, 32, fill='#f3f1ff', stroke='none', rx=0)
        for v, x in zip(r, xs):
            p.text(x, y, v, 17, INK, BODY)
    # formulas
    p.note(40, 296, 210, 62, YELLOW, 'saleValue', ['qty × unitPrice'], rot=-1.5, size=15, tsize=17, pad=9, bullet=False)
    p.note(270, 296, 230, 62, PINK, 'taxAmount', ['saleValue × rate ÷ 100'], rot=1.2, size=15, tsize=17, pad=9, bullet=False)
    p.note(520, 296, 230, 62, MINT, 'itemSNo', ['row number, auto'], rot=-1, size=15, tsize=17, pad=9, bullet=False)
    p.text(40, 392, 'Rows are recalculated on every edit (UPDATE_ITEM) and again when saved.', 16, NAVY, SCRIPT, weight='bold')
    p.text(40, 414, 'Item 3 is deliberately 8,000 × 16% = 1,280 — shows a non-round tax.', 14, MUTED, BODY)
    # totals
    p.card(790, 98, 310, 330, fill=D_SURF, stroke=INK, title='', lines=[], sw=2.6)
    p.text(808, 128, 'TotalsCard', 20, D_PINK, BOLD, weight='bold')
    tot = [('Total Sale Value', '83,000.00', D_BLUE), ('Total Tax Amount', '13,280.00', D_AMB), ('Total Bill Amount', '96,280.00', D_MINT)]
    for i, (l, v, c) in enumerate(tot):
        y = 150 + i * 88
        p.rect(806, y, 278, 74, fill=D_ALT, stroke=c, sw=2, rx=10)
        p.text(820, y + 26, l, 15, D_MUT, BODY)
        p.text(820, y + 60, 'PKR ' + v, 26, WHITE, BOLD, weight='bold')
    # sigma chain
    p.note(24, 452, 240, 112, SKY, 'Σ saleValue', ['50,000 + 25,000 + 8,000', '= 83,000'], rot=-1, size=17, tsize=19, bullet=False)
    p.text(272, 520, '+', 40, CORAL, MARKER, 'middle')
    p.note(290, 452, 240, 112, ORANGE, 'Σ taxAmount', ['8,000 + 4,000 + 1,280', '= 13,280'], rot=1, size=17, tsize=19, bullet=False)
    p.text(538, 520, '=', 40, CORAL, MARKER, 'middle')
    p.note(556, 452, 250, 112, MINT, 'Total Bill', ['83,000 + 13,280', '= 96,280'], rot=-1, size=17, tsize=19, bullet=False)
    p.note(830, 452, 268, 112, PINK, 'Where totals show up', ['form totals card', 'submission & FBR modals', 'dashboards & CSV exports'], rot=1.2, size=14.5, tsize=18)
    p.note(24, 590, 500, 160, LIME, 'Good to know', ['Total Bill ≠ Σ totalValues (that field is PFAD-only)', 'extraTax is sent to FBR as a string; other tax fields as numbers', 'Money columns stay Numbers in MongoDB; display uses 2 decimals'], rot=-0.6, size=15, tsize=19)
    p.note(546, 590, 552, 160, YELLOW, 'Reporting basis', ['Monthly buckets use the TAX PERIOD month/year', 'Dashboards & trend % compare current vs previous month (Asia/Karachi)', 'New = activity after a zero month · 0% when both months are zero'], rot=0.6, size=15, tsize=19)
    return p


def f5():
    p = Page('FEATURES 5/10', 'Scenarios & Environments', 15, TOTAL, '#2b7de9', 'what gets sent where')
    p.text(24, 108, 'Scenario profiles  (lib/fbr/scenarioProfiles.js)', 20, CORAL, SCRIPT, weight='bold')
    # compare table
    heads = ['', 'SN019', 'SN018']
    rows = [('submissionType', 'sale_tax_fed', 'services_fed_st_mode'), ('saleType', 'Services', 'Services (FED in ST Mode)'), ('default HS code', '9815.9000', '—'),
            ('default tax rate', '16 %', '—'), ('SRO schedule', 'ICTO TABLE II', '—'), ('SRO item no.', '1(i)', '—')]
    x0, y0 = 24, 120
    cw = [160, 190, 250]
    p.rect(x0, y0, 600, 32, fill=DNAVY, stroke=INK, sw=2.4, rx=8)
    xx = x0
    for h, w in zip(heads, cw):
        p.text(xx + 12, y0 + 22, h, 17, WHITE, BOLD, weight='bold')
        xx += w
    for r, row in enumerate(rows):
        y = y0 + 32 + r * 34
        p.rect(x0, y, 600, 34, fill=[YELLOW, MINT][0] if False else ('#fff9c4' if r % 2 == 0 else '#e8fff4'), stroke=INK, sw=1.4, rx=0)
        xx = x0
        for c, w in zip(row, cw):
            p.text(xx + 12, y + 23, c, 15.5, INK, BOLD if xx == x0 else BODY, weight='bold' if xx == x0 else 'normal')
            xx += w
    p.note(660, 112, 214, 130, PINK, 'On scenario change', ['submissionType set', 'every item row gets saleType, HS, rate, SRO defaults'], rot=1.5, size=14, tsize=17, pad=10)
    p.note(890, 112, 208, 130, LIME, 'Other scenario IDs', ['accepted by validator', 'only "required" is checked', 'add a profile to extend'], rot=-1.4, size=14, tsize=17, pad=10)
    p.note(660, 262, 438, 78, YELLOW, 'Adding SN0xx later', ['profile + <select> option + validator rule'], rot=0.5, size=14.5, tsize=17, pad=10)

    # env flowchart
    p.text(24, 380, 'Environment & token selection  (/api/fbr/submit)', 20, CORAL, SCRIPT, weight='bold')
    p.rect(24, 396, 150, 58, fill=SKY, stroke=INK, sw=2.4, rx=12)
    p.text(99, 421, 'Submission.', 15, INK, BOLD, 'middle', weight='bold')
    p.text(99, 440, 'fbrEnvironment', 15, INK, BOLD, 'middle', weight='bold')
    p.arrow([(176, 425), (226, 425)], 'coral')
    p.diamond(300, 425, 150, 100, YELLOW, 'production ?', 15)
    p.arrow([(300, 476), (300, 540)], 'navy', label='no', ldx=-16, ldy=0)
    p.arrow([(376, 425), (440, 425)], 'green', label='yes', ldy=-8)
    p.rect(442, 396, 200, 58, fill=MINT, stroke=INK, sw=2.4, rx=12)
    p.text(542, 421, 'use', 15, INK, BOLD, 'middle', weight='bold')
    p.text(542, 440, 'fbrProductionToken', 15, INK, BOLD, 'middle', weight='bold')
    p.rect(190, 542, 220, 58, fill=ORANGE, stroke=INK, sw=2.4, rx=12)
    p.text(300, 567, 'use', 15, INK, BOLD, 'middle', weight='bold')
    p.text(300, 586, 'fbrSandboxToken', 15, INK, BOLD, 'middle', weight='bold')
    p.arrow([(412, 572), (500, 572), (500, 478)], 'navy')
    p.arrow([(542, 456), (542, 478)], 'navy')
    p.diamond(560, 520, 160, 90, PINK, 'token set ?', 15)
    p.arrow([(640, 520), (700, 520)], 'green', label='yes', ldy=-8)
    p.rect(702, 492, 230, 56, fill=LIME, stroke=INK, sw=2.4, rx=12)
    p.text(817, 516, 'send X-FBR-Token', 15, INK, BOLD, 'middle', weight='bold')
    p.text(817, 535, 'header = company token', 13, MUTED, BODY, 'middle')
    p.arrow([(560, 566), (560, 612)], 'coral', label='no', ldx=-16, ldy=0)
    p.rect(442, 614, 260, 56, fill=PURPLE, stroke=INK, sw=2.4, rx=12)
    p.text(572, 638, 'omit header → bridge', 15, INK, BOLD, 'middle', weight='bold')
    p.text(572, 657, 'falls back to its default token', 13, MUTED, BODY, 'middle')
    # env pills
    p.note(950, 380, 148, 150, YELLOW, 'Env badges', [], rot=1.2, size=14, tsize=18, check=False)
    p.pill(966, 436, 'Sandbox', '#ffd84d', INK, 15, stroke=INK)
    p.pill(966, 472, 'Production', '#43d19e', INK, 15, stroke=INK)
    p.text(966, 516, 'shown in records', 13, MUTED, BODY)
    p.note(24, 628, 400, 126, PINK, 'Safety rules', ['a sandbox token is NEVER sent for production (and vice-versa)', 'receipt stores the environment actually selected'], rot=-0.8, size=14.5, tsize=18)
    p.note(720, 580, 380, 174, MINT, 'Headers to the bridge', ['Authorization (API key)', 'X-Request-ID · X-Idempotency-Key (<id>:submit)', 'X-FBR-Environment', 'X-FBR-Token (optional)', 'timeout 35 s → FBR_TIMEOUT'], rot=0.7, size=14.5, tsize=18)
    return p


def f6():
    p = Page('FEATURES 6/10', 'Admin Dashboard — Annotated', 16, TOTAL, '#d6336c', 'super admin portal')
    wx, wy, ww, wh = 30, 96, 800, 540
    p.window(wx, wy, ww, wh, 'Admin Control Panel · /admin/dashboard', D_BG)
    sidebar(p, wx + 1, wy + 30, 108, wh - 31, ['Dashboard', 'Companies', 'Users', 'All Submissions', 'Reference Data'], 0, 'ADMIN PORTAL')
    mx = wx + 116
    mw = ww - 124
    topbar(p, mx, wy + 31, mw, 'Admin Control Panel')
    hero(p, mx, wy + 60, mw, 52, 'WELCOME BACK', 'Taxmission', 'Dashboard', 'Overview of all companies, submissions, and tax activity')
    cy = wy + 120
    smalls = [('Total Companies', '2', D_BLUE), ('Active Companies', '2', D_MINT), ('Company Users', '5', D_PURP), ('Total Submissions', '99', D_PURP),
              ('Draft', '11', D_AMB), ('Validated', '0', D_MINT), ('Submitted', '63', D_BLUE), ('Failed', '25', D_PINK)]
    for i, (l, v, c) in enumerate(smalls):
        stat(p, mx + (i % 4) * 106, cy + (i // 4) * 44, 101, 40, l, v, c)
    finance(p, mx + 426, cy, 123, 84, 'Total Sale Value', '14.7M', D_PURP)
    finance(p, mx + 553, cy, 121, 84, 'Total Tax Amount', '11,036', D_AMB)
    r3 = cy + 92
    dcard(p, mx, r3, 190, 130)
    dtext(p, mx + 8, r3 + 14, 'Submissions Status', 9.5, D_TXT, True)
    donut(p, mx + 55, r3 + 76, 30, [(0.11, D_AMB), (0.0, D_MINT), (0.636, D_BLUE), (0.253, D_PINK)])
    dtext(p, mx + 55, r3 + 80, '99', 13, WHITE, True, 'middle')
    for i, (l, c) in enumerate([('Draft', D_AMB), ('Validated', D_MINT), ('Submitted', D_BLUE), ('Failed', D_PINK)]):
        p.circle(mx + 108, r3 + 56 + i * 15, 3.5, c, 'none', 0)
        dtext(p, mx + 116, r3 + 59 + i * 15, l, 8.5, D_TXT)
    dcard(p, mx + 196, r3, 280, 130)
    dtext(p, mx + 204, r3 + 14, 'Sales vs Tax Amount', 9.5, D_TXT, True)
    spark(p, mx + 206, r3 + 34, 260, 66, D_PURP, [0.9, 0.8, 0.55, 0.65, 0.4, 0.5, 0.25, 0.4, 0.3, 0.5, 0.35, 0.45])
    spark(p, mx + 206, r3 + 34, 260, 66, D_PINK, [0.98, 0.98, 0.97, 0.98, 0.97, 0.98, 0.97, 0.98, 0.97, 0.98, 0.97, 0.98])
    dtext(p, mx + 206, r3 + 120, 'Jan  Mar  May  Jul  Sep  Nov', 8, D_MUT)
    dcard(p, mx + 482, r3, 192, 130)
    dtext(p, mx + 490, r3 + 14, 'Quick Actions', 9.5, D_TXT, True)
    for i, (l, c) in enumerate([('Add Company', D_PINK), ('Add User', D_BLUE), ('Create Submission', D_MINT), ('Upload Ref. Data', D_PURP)]):
        p.rect(mx + 489, r3 + 22 + i * 26, 178, 22, fill=D_ALT, stroke=D_LINE, sw=1, rx=5)
        p.rect(mx + 493, r3 + 26 + i * 26, 14, 14, fill=c, stroke='none', rx=3)
        dtext(p, mx + 513, r3 + 37 + i * 26, l, 8.5, D_TXT)
    r4 = r3 + 138
    dcard(p, mx, r4, 390, wh - (r4 - wy) - 8)
    dtext(p, mx + 8, r4 + 14, 'Recent Submissions', 9.5, D_TXT, True)
    table_rows(p, mx + 8, r4 + 30, 372, ['#', 'Company', 'Period', 'Sale (PKR)', 'Status'],
               [('001', 'FGK BACK OFFICE', 'Sep 2026', '2,450,000', 'Submitted'), ('002', 'MANAGE OUTSRC', 'Sep 2026', '1,200,000', 'Failed'), ('003', 'FGK BACK OFFICE', 'Aug 2026', '3,500,000', 'Draft')], 14)
    dcard(p, mx + 396, r4, 278, wh - (r4 - wy) - 8)
    dtext(p, mx + 404, r4 + 14, 'Company Performance', 9.5, D_TXT, True)
    for i, (n, f) in enumerate([('FGK BACK OFFICE', 0.75), ('MANAGE OUTSOURCE', 0.4)]):
        yy = r4 + 28 + i * 28
        dtext(p, mx + 404, yy + 8, n, 8.5, D_TXT)
        p.rect(mx + 404, yy + 14, 255, 5, fill=D_ALT, stroke='none', rx=2)
        p.rect(mx + 404, yy + 14, 255 * f, 5, fill=D_PURP, stroke='none', rx=2)

    # annotations
    notes = [
        (850, 98, YELLOW, '1 · Sidebar + topbar', ['5 links, active glow', 'search · activity · account']),
        (850, 208, PINK, '2 · 8 live metric cards', ['percent vs last month', 'sparklines from real data']),
        (850, 318, MINT, '3 · Status donut', ['5 statuses · this month / all', 'year selector on chart']),
        (850, 428, SKY, '4 · Quick actions', ['add company · add user', 'submissions · reference data']),
        (850, 538, ORANGE, '5 · Tables', ['recent submissions', 'company ranking, scrollable']),
    ]
    for (x, y, c, t, ls) in notes:
        p.note(x, y, 248, 90, c, t, ls, rot=[1, -1, 1.3, -0.8, 1][notes.index((x, y, c, t, ls))], size=14, tsize=17, pad=10)
    p.arrow([(850, 140), (824, 160)], 'coral', curve=10)
    p.arrow([(850, 250), (824, 240)], 'coral', curve=10)
    p.arrow([(850, 360), (700, 360)], 'coral', curve=-14)
    p.arrow([(850, 470), (824, 410)], 'coral', curve=14)
    p.arrow([(850, 585), (824, 570)], 'coral', curve=10)
    # bottom row
    bn = [(YELLOW, 'Data source', ['GET /api/admin/stats', 'status counts · 12-month series', 'card trends · rankings']), (PINK, 'Search (Ctrl+K)', ['GET /api/admin/search?q=', 'bounded, escaped results', 'companies · users · submissions']),
          (MINT, 'Layout rule', ['desktop ≥ 1100 × 600 fits the viewport', 'tables scroll inside cards', 'mobile: stacked + drawer']), (LIME, 'Time zone', ['Asia/Karachi month boundaries', 'tax-period buckets'])]
    for i, (c, t, ls) in enumerate(bn):
        p.note(30 + i * 270, 656, 252, 100, c, t, ls, rot=[-0.8, 0.8, -0.6, 0.8][i], size=13.5, tsize=17, pad=9)
    return p


def f7():
    p = Page('FEATURES 7/10', 'Accountant & Supervisor Dashboards', 17, TOTAL, '#7a5af8', 'two portals · one theme')
    # accountant
    ax, ay, aw, ah = 24, 94, 530, 390
    p.window(ax, ay, aw, ah, 'Accountant · /company/dashboard', D_BG)
    sidebar(p, ax + 1, ay + 30, 84, ah - 31, ['Dashboard', 'New Submission', 'Invoice Items', 'Submissions', 'FBR Invoices', 'My Profile'], 0, 'ACCOUNTANT')
    mx, mw = ax + 90, aw - 96
    topbar(p, mx, ay + 31, mw, 'MANAGE OUTSOURCE (PVT) LTD', False)
    hero(p, mx, ay + 60, mw, 46, 'WELCOME BACK', 'Accountant', 'Dashboard', 'Monitor your submission progress')
    for i, (l, v, c) in enumerate([('Total Subs', '16', D_BLUE), ('This Month', '0', D_PINK), ('Submitted', '5', D_BLUE), ('Total Sales', '3.35M', D_AMB), ('Total Tax', '2,080', D_PURP), ('Total Bill', '3.36M', D_PINK)]):
        stat(p, mx + i * 72, ay + 114, 69, 36, l, v, c, '↑ 14%')
    dcard(p, mx, ay + 156, 228, 110)
    dtext(p, mx + 8, ay + 170, 'Monthly Bill Amount', 9, D_TXT, True)
    bar_chart(p, mx + 12, ay + 180, 205, 66, [0.0, 0.0, 0.0, 0.9, 0.6, 0.0])
    dtext(p, mx + 10, ay + 258, 'May   Jun   Jul   Aug   Sep   Oct', 7.5, D_MUT)
    dcard(p, mx + 234, ay + 156, 200, 110)
    dtext(p, mx + 242, ay + 170, 'Status Breakdown', 9, D_TXT, True)
    status_bars(p, mx + 242, ay + 182, 184, [('Draft', 0.5, D_AMB, 8), ('Validated', 0.02, D_MINT, 0), ('Submitted', 0.31, D_BLUE, 5), ('Failed', 0.18, D_PINK, 3)], 18)
    dcard(p, mx, ay + 272, 228, 108)
    dtext(p, mx + 8, ay + 286, 'Recent Activity', 9, D_TXT, True)
    table_rows(p, mx + 8, ay + 302, 214, ['Buyer', 'Period', 'Status'], [('IT MISTRY', '9/2026', 'Submitted'), ('IT MISTRY', '9/2026', 'Failed'), ('Arslan', '9/2026', 'Failed')], 17)
    dcard(p, mx + 234, ay + 272, 200, 108)
    dtext(p, mx + 242, ay + 286, 'Top Buyers (5)', 9, D_TXT, True)
    table_rows(p, mx + 242, ay + 302, 186, ['Buyer', 'Bill'], [('IT MISTRY', '3.3M'), ('Test Buyer', '3,480'), ('Arslan', '2,320')], 17)

    # supervisor
    sx, sy, sw, sh = 569, 94, 530, 390
    p.window(sx, sy, sw, sh, 'Supervisor · /supervisor/dashboard', D_BG)
    sidebar(p, sx + 1, sy + 30, 84, sh - 31, ['Dashboard', 'Submissions', 'FBR Invoices', 'My Profile'], 0, 'SUPERVISOR')
    mx, mw = sx + 90, sw - 96
    topbar(p, mx, sy + 31, mw, 'MANAGE OUTSOURCE (PVT) LTD', True)
    hero(p, mx, sy + 60, mw, 46, 'SUPERVISOR PORTAL', 'Submission', 'Dashboard', 'Track · Ensure compliance · Drive accuracy')
    dcard(p, mx, sy + 112, 266, 46)
    dtext(p, mx + 8, sy + 128, '31% submitted', 12, WHITE, True)
    dtext(p, mx + 220, sy + 128, '5 of 16', 8.5, D_MUT)
    p.rect(mx + 8, sy + 136, 250, 6, fill=D_ALT, stroke='none', rx=3)
    p.rect(mx + 8, sy + 136, 78, 6, fill=D_MINT, stroke='none', rx=3)
    dtext(p, mx + 8, sy + 152, 'progress includes production + sandbox', 7, D_MUT)
    stat(p, mx + 272, sy + 112, 76, 46, 'Ready', '0', D_MINT, '')
    stat(p, mx + 352, sy + 112, 82, 46, 'Failed', '3', D_PINK, '')
    finance(p, mx, sy + 164, 140, 46, 'Sales (PKR)', '3.35M', D_PURP)
    finance(p, mx + 146, sy + 164, 140, 46, 'Tax (PKR)', '2,080', D_AMB)
    finance(p, mx + 292, sy + 164, 142, 46, 'Bills (PKR)', '3.36M', D_BLUE)
    dcard(p, mx, sy + 216, 208, 90)
    dtext(p, mx + 8, sy + 230, 'Status Breakdown', 9, D_TXT, True)
    status_bars(p, mx + 8, sy + 238, 192, [('Draft', 0.5, '#8d93d8', 8), ('Validated', 0.0, D_MINT, 0), ('Ready', 0.0, D_MINT, 0), ('Submitted', 0.31, D_MINT, 5), ('Failed', 0.18, D_PINK, 3)], 12)
    dcard(p, mx + 214, sy + 216, 220, 90)
    dtext(p, mx + 222, sy + 230, 'Monthly Submission Volume', 9, D_TXT, True)
    bar_chart(p, mx + 226, sy + 240, 196, 46, [0, 0, 0, 1.0, 0.6, 0])
    dcard(p, mx, sy + 312, 434, 68)
    dtext(p, mx + 8, sy + 326, 'Recent Submission Activity', 9, D_TXT, True)
    table_rows(p, mx + 8, sy + 342, 418, ['Buyer', 'Tax period', 'Status', 'Bill'], [('IT MISTRY LIMITED', '9/2026', 'Submitted', '1,378,253'), ('Arslan', '9/2026', 'Failed', '1,160')], 14)

    # notes
    an = [(24, YELLOW, 'Accountant API', ['GET /api/company/stats', '6-month trend + status mix', 'top 5 buyers by total bill']), (292, PINK, 'Interactions', ['3 / 6 month chart toggle', 'all / this-month status', 'buyer sort controls'])]
    for x, c, t, ls in an:
        p.note(x, 504, 252, 116, c, t, ls, rot=-0.8 if x < 100 else 0.8, size=14, tsize=17.5, pad=10)
    sn = [(569, MINT, 'Supervisor API', ['GET /api/supervisor/stats', 'read-only · company scoped', 'no integration tokens']), (837, SKY, 'Reports', ['summary CSV download', 'progress counts both envs', 'ready / failed links'])]
    for x, c, t, ls in sn:
        p.note(x, 504, 252, 116, c, t, ls, rot=0.8 if x < 700 else -0.8, size=14, tsize=17.5, pad=10)
    p.note(24, 640, 530, 116, ORANGE, 'Shared pieces', ['PortalShell · PortalSidebar · Topbar wrap both portals', 'PortalTheme.module.css: navy tables, badges, alerts, print reset', 'mobile ≤ 960px: sidebar becomes a focus-trapped drawer'], rot=-0.5, size=14.5, tsize=18)
    p.note(569, 640, 530, 116, LIME, 'Supervisor = view only', ['no create / edit / delete / submit actions', 'search → opens record modal via ?record=', 'CSV export contains every matching record'], rot=0.5, size=14.5, tsize=18)
    return p


def f8():
    p = Page('FEATURES 8/10', 'UI Design System', 18, TOTAL, CORAL, 'colours · type · components')
    # palette
    p.text(24, 108, 'App palette', 20, CORAL, SCRIPT, weight='bold')
    sw = [('#4B4E6D', 'primary navy-purple', WHITE), ('#FF6372', 'coral accent / danger', WHITE), ('#B3B6CB', 'soft lavender', INK), ('#F0F0F0', 'light app bg', INK), ('#090e25', 'dark portal bg', WHITE),
          ('#171e3a', 'card surface', WHITE), ('#b4baff', 'portal primary', INK), ('#ff637f', 'portal accent', WHITE), ('#32e6b4', 'success mint', INK), ('#ffc258', 'warning amber', INK), ('#263354', 'table hover', WHITE), ('#8f7bff', 'chart purple', WHITE)]
    for i, (c, n, tc) in enumerate(sw):
        x = 24 + (i % 6) * 126
        y = 118 + (i // 6) * 100
        rot = [-2, 1.5, -1, 2, -1.5, 1][i % 6]
        p.add(f'<g transform="rotate({rot} {x+55} {y+42})"><rect x="{x+3}" y="{y+4}" width="112" height="84" rx="6" fill="#000" opacity=".15"/><rect x="{x}" y="{y}" width="112" height="84" rx="6" fill="{c}" stroke="{INK}" stroke-width="2"/><rect x="{x}" y="{y+56}" width="112" height="28" fill="#fff" stroke="{INK}" stroke-width="2"/></g>')
        p.add(f'<g transform="rotate({rot} {x+55} {y+42})">')
        p.text(x + 8, y + 24, c.upper(), 15, tc, BOLD, weight='bold')
        p.text(x + 8, y + 74, n, 12, INK, BODY)
        p.add('</g>')
    # sticky colours
    p.text(790, 108, 'Sticky-note accents (illustrations)', 18, CORAL, SCRIPT, weight='bold')
    for i, c in enumerate([YELLOW, PINK, MINT, SKY, ORANGE, PURPLE, LIME]):
        p.rect(790 + (i % 4) * 78, 120 + (i // 4) * 62, 68, 52, fill=c, stroke=shade(c, .7), sw=1.5, rx=3, rot=[-3, 2, -2, 3][i % 4])
    p.note(790, 250, 310, 66, MINT, 'Status colours', [], rot=0.8, size=13, tsize=17, check=False)
    x = 802
    for t, c in (('Draft', '#ffc258'), ('Validated', '#32e6b4'), ('Submitted', '#4b8bff'), ('Failed', '#ff637f')):
        w = p.pill(x, 284, t, c, INK if c != '#4b8bff' else WHITE, 12, padx=7, h=20)
        x += w + 5

    # typography
    p.card(24, 330, 380, 200, fill=WHITE, title='Typography', size=14, tsize=19, shadow=True)
    p.text(40, 380, 'Tilt Neon — headings', 26, CORAL, BOLD, weight='bold')
    p.text(40, 408, 'TikTok Sans — body & tables', 20, NAVY, BODY)
    p.text(40, 434, 'Arial — portal form controls', 16, NAVY, 'Arial, sans-serif')
    p.text(40, 462, 'H1 22px  ·  base 15px  ·  small 13px', 15, MUTED, BODY)
    p.text(40, 486, 'Radius 6 / 10 / 14  ·  soft navy shadows', 15, MUTED, BODY)
    p.text(40, 510, 'Sidebar 240–260px · Topbar 56–64px', 15, MUTED, BODY)

    # buttons
    p.card(420, 330, 330, 200, fill=D_SURF, stroke=INK, title='', shadow=True)
    p.text(436, 358, 'Buttons & inputs', 19, D_PINK, BOLD, weight='bold')
    p.rect(436, 372, 100, 32, fill=D_PINK, stroke='none', rx=9)
    p.text(486, 394, 'Primary', 15, WHITE, BOLD, 'middle', weight='bold')
    p.rect(546, 372, 90, 32, fill='none', stroke=D_MUT, sw=1.6, rx=9)
    p.text(591, 394, 'Ghost', 15, D_TXT, BOLD, 'middle', weight='bold')
    p.rect(646, 372, 90, 32, fill='none', stroke=D_PINK, sw=1.6, rx=9)
    p.text(691, 394, 'Danger', 15, D_PINK, BOLD, 'middle', weight='bold')
    p.rect(436, 420, 300, 32, fill=D_ALT, stroke=D_LINE, sw=1.4, rx=8)
    p.text(448, 441, 'Search companies, users…        Ctrl+K', 14, D_MUT, BODY)
    p.rect(436, 464, 142, 32, fill=D_ALT, stroke=D_LINE, sw=1.4, rx=8)
    p.text(448, 485, 'This Month  ▾', 14, D_TXT, BODY)
    p.pill(594, 468, 'Sandbox', '#ffd84d', INK, 13, stroke=INK)
    p.pill(670, 468, 'Production', '#43d19e', INK, 13, stroke=INK)

    # badges + table
    p.card(766, 330, 334, 200, fill=D_SURF, stroke=INK, title='', shadow=True)
    p.text(782, 358, 'Tables & badges', 19, D_PINK, BOLD, weight='bold')
    table_rows(p, 782, 382, 300, ['#', 'Buyer', 'Status'], [('1', 'IT MISTRY', 'Submitted'), ('2', 'Arslan', 'Failed'), ('3', 'Walk-in', 'Draft'), ('4', 'Test Buyer', 'Validated')], 24, 11)
    p.text(782, 508, 'row hover #263354 · sticky headers · inner scroll', 12.5, D_MUT, BODY)

    # assets
    p.text(24, 560, 'Supplied artwork  (public/images)', 20, CORAL, SCRIPT, weight='bold')
    assets = [('login_background.png', 'login page background', PINK), ('dashbord_background_styles.png', 'admin area backdrop', SKY), ('sidebar_backgroundimage.png', 'sidebar art', MINT), ('taxmission_dashboard_title_background.png', 'dashboard hero', YELLOW),
              ('Mnagae_taxmission_logo_new.png', 'cropped logo (login + sidebar)', ORANGE), ('*_dashbord_desing.png', 'visual references only', LIME)]
    for i, (f, d, c) in enumerate(assets):
        x = 24 + (i % 3) * 360
        y = 572 + (i // 3) * 92
        p.note(x, y, 344, 76, c, f, [d], rot=[-0.8, 0.8, -0.5][i % 3], size=14, tsize=14.5, pad=9, bullet=False)
    return p


def f9():
    p = Page('FEATURES 9/10', 'Component Tree & Navigation', 19, TOTAL, '#1f9d63', 'React component map')

    def node(x, y, w, h, c, t, sub=''):
        p.rect(x + 2, y + 3, w, h, fill=INK, stroke='none', rx=9, opacity=.18)
        p.rect(x, y, w, h, fill=c, stroke=INK, sw=2.2, rx=9)
        p.text(x + w / 2, y + (h / 2 + (-2 if sub else 5)), t, 14.5, INK, BOLD, 'middle', weight='bold')
        if sub:
            p.text(x + w / 2, y + h / 2 + 14, sub, 12, MUTED, BODY, 'middle')
    node(440, 96, 240, 40, NAVY, '')
    p.text(560, 122, 'app/layout.js  (fonts · globals)', 15, WHITE, BOLD, 'middle', weight='bold')
    # roles
    roles = [(80, PINK, 'admin/layout.js', 'AdminSidebar + AdminTopbar'), (400, MINT, 'company/layout.js', 'PortalShell · accountant'), (720, SKY, 'supervisor/layout.js', 'PortalShell · supervisor')]
    for x, c, t, s in roles:
        node(x, 170, 260, 54, c, t, s)
        p.arrow([(560, 138), (x + 130, 168)], 'navy', curve=0)
    # page leafs
    kids = [
        (24, PINK, ['Dashboard: AdminDashboardCards + Overview', 'Companies: CompanyTable · CompanyForm · CompanyDetailModal', 'Users: UserTable · UserForm', 'All Submissions: AdminFilterBar + SubmissionViewModal', 'Reference Data: ReferenceDataTable · Form']),
        (380, MINT, ['Dashboard: CompanyDashboardCards', 'New / Edit: SubmissionForm (+ reducer)', '   InvoiceItemsEditor · TotalsCard · ValidationErrors', '   PayloadPreview · FbrSuccessModal', 'Records / FBR Invoices: PortalFilterBar + view modals', 'Invoice Items · Profile (PortalProfile)']),
        (736, SKY, ['Dashboard: SupervisorDashboard + ReportUi', 'Submissions / FBR Invoices: SupervisorRecords', '   SubmissionViewModal · ReceiptViewModal', 'Profile: SupervisorProfile', 'Data hook: useSupervisorData (read-only)', 'reporting.js: dates · CSV helpers']),
    ]
    for (x, c, ls), (rx, _, _, _) in zip(kids, roles):
        p.arrow([(rx + 130, 226), (x + 170, 258)], 'coral')
        p.note(x, 260, 340, 170, c, '', [], rot=0, tape=False, check=False)
        yy = 284
        for l in ls:
            for i, w_ in enumerate(wrap(l, 316, 14)):
                p.text(x + 14 + (14 if l.startswith('   ') else 0), yy, w_.strip() if i == 0 and l.startswith('   ') else w_, 14, INK, BODY)
                yy += 17
    # shared
    p.text(24, 456, 'Shared building blocks', 20, CORAL, SCRIPT, weight='bold')
    shared = [(YELLOW, 'SubmissionViewModal', 'print-ready A4 · 2 item tables'), (ORANGE, 'ReceiptViewModal', 'FBR invoice view · totals'), (LIME, 'PasswordConfirmModal', 'guards deletes'),
              (PURPLE, 'PortalFilterBar', 'filters apply on Filter'), (PINK, 'AdminIcon', 'icon set for nav & cards'), (SKY, 'PortalTheme.module.css', 'shared portal styling')]
    for i, (c, t, s) in enumerate(shared):
        p.note(24 + i * 180, 466, 168, 70, c, t, [s], rot=[-1.2, 1, -0.8, 1.2, -1, 0.8][i], size=12.5, tsize=14, pad=8, bullet=False, tape=True)
    # mini sidebars
    p.text(24, 566, 'Sidebar menus', 20, CORAL, SCRIPT, weight='bold')
    menus = [('Admin', PINK, ['Dashboard', 'Companies', 'Users', 'All Submissions', 'Reference Data']),
             ('Accountant', MINT, ['Dashboard', 'New Submission', 'Invoice Items', 'Submissions', 'FBR Invoices', 'My Profile']),
             ('Supervisor', SKY, ['Dashboard', 'Submissions', 'FBR Invoices', 'My Profile'])]
    for i, (n, c, ls) in enumerate(menus):
        x = 24 + i * 272
        p.rect(x, 576, 262, 176, fill=D_BG, stroke=INK, sw=2.2, rx=10)
        p.pill(x + 10, 584, n, c, INK, 13, stroke=INK)
        for j, l in enumerate(ls):
            cx = x + 10 + (j % 2) * 126
            cy = 632 + (j // 2) * 38
            p.rect(cx, cy - 15, 120, 28, fill='rgba(255,99,127,0.25)' if j == 0 else D_SURF, stroke=D_PINK if j == 0 else D_LINE, sw=1.4, rx=7)
            p.text(cx + 60, cy + 4, l, 12.5, D_TXT, BOLD, 'middle', weight='bold')
    p.note(850, 548, 250, 100, LIME, 'Conventions', ['thin pages, logic in lib/', 'CSS module per portal', 'modals print via .print-area'], rot=1, size=13, tsize=16, pad=9)
    p.note(850, 656, 250, 100, YELLOW, 'Responsive', ['≥1100px: fixed sidebar', '<960px: drawer + stacked cards', 'checked 320 → 1920px'], rot=-0.8, size=13, tsize=16, pad=9)
    return p


def f10():
    p = Page('FEATURES 10/10', 'Submission Form & A4 Print Modal', 20, TOTAL, '#e08a00', 'where invoices are made & shown')
    # form wireframe
    p.window(24, 94, 640, 470, 'New Submission · /company/submissions/new', D_BG)
    fx = 40
    def field(x, y, w, label, val='', col=D_ALT, req=False):
        dtext(p, x, y, label + (' *' if req else ''), 8.5, D_MUT)
        p.rect(x, y + 4, w, 18, fill=col, stroke=D_LINE, sw=1, rx=4)
        dtext(p, x + 5, y + 17, val, 9, D_TXT)
    dtext(p, fx, 144, 'Seller & invoice header', 11, D_PINK, True)
    field(fx, 156, 190, 'Seller Registration No.', 'FGK… (select)', req=True)
    field(fx + 200, 156, 120, 'Tax Period', 'Sep 2026', req=True)
    field(fx + 330, 156, 130, 'Submission Type', 'sale_tax_fed')
    field(fx + 470, 156, 140, 'Scenario ID', 'SN019 ▾', req=True)
    field(fx, 196, 190, 'FBR Environment', 'Sandbox ▾')
    field(fx + 200, 196, 410, 'Auto-fill items for this seller', 'pick a saved item template…')
    dtext(p, fx, 252, 'Invoice items', 11, D_PINK, True)
    heads = ['#', 'Buyer', 'Description', 'HS', 'Qty', 'Price', 'Rate', 'Tax', 'SRO', '']
    hx = [fx, fx + 22, fx + 100, fx + 210, fx + 280, fx + 330, fx + 390, fx + 440, fx + 500, fx + 590]
    p.rect(fx - 4, 258, 620, 16, fill='#293255', stroke='none', rx=3)
    for h, x in zip(heads, hx):
        dtext(p, x, 270, h, 8.5, D_TXT, True)
    for r in range(3):
        y = 280 + r * 24
        p.rect(fx - 4, y, 620, 22, fill='#12182f' if r % 2 == 0 else D_SURF, stroke=D_LINE, sw=.6, rx=0)
        vals = [str(r + 1), 'IT MISTRY', 'Consulting', '9815.9000', '10', '5,000', '16', '8,000', 'ICTO T.II', '✕'][:10]
        for v, x in zip(vals, hx):
            dtext(p, x, y + 15, v, 8.5, D_TXT if v != '✕' else D_PINK)
    p.rect(fx, 356, 110, 20, fill='none', stroke=D_MINT, sw=1.4, rx=6)
    dtext(p, fx + 55, 370, '+ Add item', 9, D_MINT, True, 'middle')
    p.rect(fx + 500, 330, 110, 0, fill='none')
    # totals
    for i, (l, v, c) in enumerate([('Total Sale', '83,000', D_BLUE), ('Total Tax', '13,280', D_AMB), ('Total Bill', '96,280', D_MINT)]):
        p.rect(fx + 200 + i * 135, 386, 128, 44, fill=D_SURF, stroke=c, sw=1.6, rx=8)
        dtext(p, fx + 208 + i * 135, 402, l, 8.5, D_MUT)
        dtext(p, fx + 208 + i * 135, 422, v, 14, WHITE, True)
    p.rect(fx, 446, 150, 28, fill='none', stroke=D_MUT, sw=1.6, rx=8)
    dtext(p, fx + 75, 464, 'Save Draft', 11, D_TXT, True, 'middle')
    p.rect(fx + 160, 446, 130, 28, fill='none', stroke=D_MINT, sw=1.6, rx=8)
    dtext(p, fx + 225, 464, 'Validate', 11, D_MINT, True, 'middle')
    p.rect(fx + 300, 446, 160, 28, fill=D_PINK, stroke='none', rx=8)
    dtext(p, fx + 380, 464, 'Submit to FBR', 11, WHITE, True, 'middle')
    p.rect(fx, 488, 610, 58, fill='rgba(255,99,127,0.12)', stroke=D_PINK, sw=1.2, rx=8)
    dtext(p, fx + 10, 504, 'ValidationErrors', 10, D_PINK, True)
    dtext(p, fx + 10, 519, '• Item 2: quantity must be greater than 0', 9, D_TXT)
    dtext(p, fx + 10, 533, '• Buyer NTN/CNIC must be 7 characters (NTN) or 13 numeric digits (CNIC)', 9, D_TXT)

    # A4 modal
    ax, ay, aw, ah = 690, 94, 410, 470
    p.rect(ax + 5, ay + 6, aw, ah, fill=INK, stroke='none', rx=4, opacity=.25)
    p.rect(ax, ay, aw, ah, fill=WHITE, stroke=INK, sw=2.4, rx=4)
    p.text(ax + 14, ay + 26, 'Submission / FBR Invoice  (A4)', 15, INK, BOLD, weight='bold')
    p.line(ax + 10, ay + 34, ax + aw - 10, ay + 34, INK, 1.5)
    p.rect(ax + 12, ay + 44, 184, 58, fill='#eef0ff', stroke=LAV2, sw=1, rx=4)
    p.text(ax + 20, ay + 60, 'Seller', 12, CORAL, BOLD, weight='bold')
    p.text(ax + 20, ay + 76, 'FGK Back Office · NTN 4765371', 11, INK, BODY)
    p.text(ax + 20, ay + 92, 'Punjab', 11, INK, BODY)
    p.rect(ax + 204, ay + 44, 192, 58, fill='#fff3f4', stroke=LAV2, sw=1, rx=4)
    p.text(ax + 212, ay + 60, 'Buyer', 12, CORAL, BOLD, weight='bold')
    p.text(ax + 212, ay + 76, 'IT MISTRY LIMITED', 11, INK, BODY)
    p.text(ax + 212, ay + 92, 'Sindh', 11, INK, BODY)
    for t, y in (('Items table 1: description · HS · qty · price · value', 114), ('Items table 2: extra tax · further tax · ST withheld · SRO', 188)):
        p.rect(ax + 12, ay + y, 384, 18, fill=DNAVY, stroke='none', rx=3)
        p.text(ax + 18, ay + y + 13, t, 10.5, WHITE, BODY)
        for r in range(2):
            p.rect(ax + 12, ay + y + 18 + r * 20, 384, 20, fill='#f7f7fb' if r % 2 == 0 else WHITE, stroke=LAV2, sw=.8, rx=0)
            p.line(ax + 80, ay + y + 18 + r * 20 + 5, ax + 250, ay + y + 18 + r * 20 + 5, LAV2, 2)
    p.text(ax + 12, ay + 268, 'Totals', 13, CORAL, BOLD, weight='bold')
    for i, (l, v) in enumerate([('Total Sale Value', '83,000.00'), ('Total Tax', '13,280.00'), ('Total Bill', '96,280.00')]):
        p.text(ax + 200, ay + 268 + i * 20, l, 12, INK, BODY)
        p.text(ax + 396, ay + 268 + i * 20, v, 12, INK, BOLD, 'end', weight='bold')
    p.text(ax + 12, ay + 345, 'Print area = one page: html/body capped at 281mm,', 12, MUTED, BODY)
    p.text(ax + 12, ay + 361, 'modal made static, backdrop un-fixed.', 12, MUTED, BODY)
    p.rect(ax + 12, ay + 380, 384, 70, fill='#fff9c4', stroke='none', rx=4, opacity=.6, dash=None)
    p.text(ax + 20, ay + 402, 'beforeprint → hide siblings of the modal', 12, INK, BOLD, weight='bold')
    p.text(ax + 20, ay + 420, 'afterprint  → restore them', 12, INK, BOLD, weight='bold')
    p.text(ax + 20, ay + 438, 'styles/print.css reveals only .print-area', 12, INK, BOLD, weight='bold')
    p.arrow([(666, 330), (688, 330)], 'coral', sw=3)
    p.text(677, 318, 'view', 14, CORAL, SCRIPT, 'middle', weight='bold')

    notes = [(YELLOW, 'Form layout', ['seller header → item grid → totals → actions', 'grid scrolls horizontally on small screens', 'totals stack on mobile']),
             (PINK, 'Three actions', ['Save Draft → POST / PUT', 'Validate → /validate (draft ⇄ validated)', 'Submit → save + /api/fbr/submit']),
             (MINT, 'Success path', ['FbrSuccessModal with receipt', 'view / print from FBR Invoices', 'status chip turns Submitted']),
             (SKY, 'Print QA', ['one A4 page for modals', 'check Chrome & Firefox', 'Receipt modal relies on CSS only'])]
    for i, (c, t, ls) in enumerate(notes):
        p.note(24 + i * 270, 600, 252, 150, c, t, ls, rot=[-0.8, 0.8, -0.6, 0.9][i], size=14, tsize=17.5, pad=10)
    p.callout(560, 586, 'forms = pen & paper, modals = A4 paper', CORAL, 17, -1.5, 'middle')
    return p


PAGES = [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10]
