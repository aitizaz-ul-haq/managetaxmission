from lib import *

TOTAL = 20


def a1():
    p = Page('ARCHITECTURE 1/5', 'The Big Picture', 1, TOTAL, CORAL, 'who talks to what')
    # actors
    p.person(95, 118, 'Super Admin', PINK, '/admin/*')
    p.person(95, 262, 'Accountant', MINT, '/company/*')
    p.person(95, 406, 'Supervisor', SKY, '/supervisor/*')
    p.text(95, 520, '3 roles, 1 login page', 17, CORAL, SCRIPT, 'middle', weight='bold')
    p.text(95, 538, 'role decides the portal', 14, MUTED, BODY, 'middle')
    for y in (150, 294, 438):
        p.arrow([(150, y), (252, 300)], 'navy', label='', curve=0)
    p.text(120, 100, 'HTTPS + JWT cookie', 17, NAVY, SCRIPT, 'middle', weight='bold')

    # next.js container
    p.rect(255, 100, 470, 410, fill='rgba(180,186,255,0.13)', stroke=NAVY, sw=3, rx=18, dash='10 7')
    p.pill(275, 86, 'Next.js 14 · App Router · one deployable app', NAVY, WHITE, 14)
    p.card(275, 128, 430, 82, fill=PINK, title='React 18 UI  (JavaScript, no TypeScript)', lines=['app/login · admin · company · supervisor pages', 'components/ forms, modals, dashboards, shells'], size=14.5, tsize=17)
    p.card(275, 238, 430, 82, fill=YELLOW, title='API Route Handlers  ·  47 endpoints', lines=['app/api/{auth,admin,company,supervisor,fbr}/**/route.js', 'JSON in / JSON out, no-cache on dashboards'], size=14.5, tsize=17)
    p.card(275, 348, 205, 140, fill=MINT, title='Guards', lines=['getCurrentUser()', 'requireAdmin', 'requireCompanyUser', 'requireSupervisor', 'JWT + bcryptjs'], size=14, tsize=17)
    p.card(500, 348, 205, 140, fill=SKY, title='Domain lib/', lines=['validators/', 'taxmission/ (totals)', 'fbr/ (mapper+client)', 'stats for 3 dashboards'], size=14, tsize=17)
    p.arrow([(490, 210), (490, 236)], 'coral', label='fetch()', ldx=32, ldy=4)
    p.arrow([(378, 320), (378, 346)], 'coral')
    p.arrow([(602, 320), (602, 346)], 'coral')

    # mongo
    p.cylinder(790, 118, 130, 130, MINT, 'MongoDB', 17)
    p.text(855, 217, '6 collections', 13.5, INK, BODY, 'middle')
    p.text(855, 232, 'via Mongoose 9', 13.5, INK, BODY, 'middle')
    p.arrow([(725, 290), (790, 200)], 'green', label='read / write', ldx=-8, ldy=-4, curve=18)

    # bridge + FBR
    p.card(768, 318, 175, 100, fill=ORANGE, title='FBR Bridge', lines=['separate service', 'API key + idempotency', 'X-FBR-Environment'], size=14, tsize=18)
    p.arrow([(705, 372), (766, 372)], 'coral', label='HTTPS', ldy=-8)
    p.card(955, 300, 140, 135, fill=LAV, title='FBR / PRAL', lines=['Federal Board', 'of Revenue', 'Pakistan'], size=14, tsize=18)
    p.pill(968, 392, 'Sandbox', YELLOW, INK, 12.5, stroke=INK)
    p.pill(1030, 392, 'Prod', MINT, INK, 12.5, stroke=INK)
    p.arrow([(943, 368), (953, 368)], 'navy')
    p.text(930, 450, 'browser never calls the bridge —', 14.5, CORAL, SCRIPT, 'middle', rot=-2, weight='bold')
    p.text(930, 468, 'server-side only', 14.5, CORAL, SCRIPT, 'middle', rot=-2, weight='bold')

    # stack notes
    notes = [
        (YELLOW, 'Frontend', ['React 18', 'Next 14 App Router', 'Plain CSS + CSS modules', 'Fonts: Tilt Neon, TikTok Sans'], -1.5),
        (PINK, 'Backend', ['Next route handlers', 'Mongoose 9 models', 'JWT (7 days) + cookies', 'bcryptjs hashing'], 1.2),
        (MINT, 'Integration', ['FBR Bridge HTTP client', '35 s default timeout', 'Receipts audit log', 'Sandbox / Production'], -1),
        (SKY, 'Reporting', ['Asia/Karachi months', 'Admin / Accountant / Supervisor', 'CSV export (supervisor)', 'Print-ready A4 modals'], 1.5),
        (ORANGE, 'Quality', ['yarn lint', 'test:admin · test:company', 'test:supervisor', 'Mock-API browser checks'], -1.2),
    ]
    x = 36
    for col, t, ls, r in notes:
        p.note(x, 574, 200, 160, col, t, ls, rot=r, size=14.5, tsize=19)
        x += 213
    p.callout(900, 556, '← tech stack at a glance', CORAL, 18, -2)
    return p


def a2():
    p = Page('ARCHITECTURE 2/5', 'Layers & Folder Map', 2, TOTAL, '#7a5af8', 'top to bottom')
    layers = [
        (PINK, '1  Pages & Components', 'app/*/page.js  ·  components/**', 'React client components, reducers, CSS modules'),
        (PURPLE, '2  Layout Shells', 'AdminSidebar · AdminTopbar · PortalShell', 'Role shells: nav, search, account menu, mobile drawer'),
        (YELLOW, '3  API Route Handlers', 'app/api/**/route.js', 'Parse request → guard → validate → model → JSON'),
        (MINT, '4  Auth Guards', 'lib/auth/*', 'getCurrentUser · requireAdmin · requireCompanyUser · requireSupervisor'),
        (SKY, '5  Domain Logic', 'lib/validators · lib/taxmission · lib/fbr', 'Rules, totals, scenario profiles, FBR mapping, stats'),
        (ORANGE, '6  Data Models', 'models/*.js  ·  lib/mongodb.js', 'Company · User · Submission · FbrReceipt · InvoiceItem · ReferenceData'),
    ]
    y = 100
    for i, (c, t, f, d) in enumerate(layers):
        r = [-0.6, 0.5, -0.4, 0.6, -0.5, 0.4][i]
        p.note(120, y, 610, 82, c, '', [], rot=r, tape=False, check=False)
        p.text(140, y + 30, t, 22, INK, BOLD, weight='bold', rot=r)
        p.text(140, y + 55, f, 16, CORAL, SCRIPT, weight='bold', rot=r)
        p.text(140, y + 73, d, 14, INK, BODY, rot=r)
        if i < len(layers) - 1:
            p.arrow([(425, y + 84), (425, y + 108)], 'coral', sw=3)
        y += 108
    # left rails
    p.arrow([(60, 120), (60, 700)], 'navy', sw=4, label='request', lcolor=NAVY, lsize=18, ldx=-18, ldy=0)
    p.arrow([(92, 700), (92, 120)], 'coral', sw=4, dash='8 6')
    p.text(78, 740, 'response ↑', 17, CORAL, SCRIPT, 'middle', weight='bold')

    # right: key folders
    p.note(770, 98, 320, 168, LIME, 'lib/fbr', ['bridgeClient.js  HTTP client', 'mapSubmissionToInvoice.js', 'scenarioProfiles.js  SN018/SN019', 'fbrStatus.js · exampleInvoice.js'], rot=1.3, size=15.5, tsize=20)
    p.note(770, 282, 320, 150, ORANGE, 'lib/validators + taxmission', ['submissionValidator (shared client + server)', 'companyValidator · userValidator', 'calculateInvoiceTotals', 'prepareFbrPayload'], rot=-1.2, size=15.5, tsize=20)
    p.note(770, 448, 320, 142, SKY, 'lib/{admin,company,supervisor}', ['dashboardStats.js builders', 'reportingPeriods (Karachi tz)', 'readAccess · syncCompanyPersonnel'], rot=1, size=15.5, tsize=20)
    p.note(770, 606, 320, 132, PINK, 'styles/ + public/images', ['variables.css · print.css', 'sidebar / hero / login art', 'CSS modules per portal'], rot=-1, size=15.5, tsize=20)
    p.callout(745, 760, 'rule: pages never touch the database directly', CORAL, 18, -1.5, 'start')
    return p


def a3():
    p = Page('ARCHITECTURE 3/5', 'Login, JWT & Role Guards', 3, TOTAL, '#1f9d63', 'who may do what')
    # sequence diagram: login
    p.text(30, 105, 'Login sequence', 22, CORAL, SCRIPT, weight='bold')
    xs = {'b': 100, 'a': 285, 'd': 470}
    for k, lbl, c in (('b', 'Browser\n/login', SKY), ('a', 'POST\n/api/auth/login', YELLOW), ('d', 'MongoDB\nUser · Company', MINT)):
        xx = xs[k]
        p.rect(xx - 66, 118, 132, 46, c, INK, 2.2, 9)
        for i, l in enumerate(lbl.split('\n')):
            p.text(xx, 138 + i * 16, l, 14, INK, BOLD, 'middle', weight='bold')
        p.line(xx, 166, xx, 560, NAVY, 2, '6 6')
    steps = [
        (190, 'b', 'a', 'email + password', 'coral'),
        (230, 'a', 'd', 'findOne(email)', 'navy'),
        (262, 'd', 'a', 'user + company', 'green'),
        (300, 'a', 'a', 'status active? bcrypt compare', 'navy'),
        (345, 'a', 'a', 'sign JWT {userId, role, personnelType, companyId} · 7d', 'purple'),
        (395, 'a', 'b', 'Set-Cookie auth_token', 'coral'),
        (440, 'b', 'b', 'redirect by role (getDashboardPath)', 'navy'),
    ]
    for y, f, t, lbl, col in steps:
        if f == t:
            xx = xs[f]
            p.path(f'M{xx},{y} h38 v20 h-38', stroke=ARROW_COLORS[col], sw=2.4, marker=col)
            p.text(xx + 46, y + 14, lbl, 14.5, INK, BODY)
        else:
            p.arrow([(xs[f] + (6 if xs[t] > xs[f] else -6), y), (xs[t] + (-6 if xs[t] > xs[f] else 6), y)], col, label=lbl, ldy=-7, lsize=15)
    p.note(40, 470, 290, 92, YELLOW, 'Cookie flags', ['httpOnly · sameSite=lax · path=/', 'secure in production · 7 day maxAge'], rot=-1.2, size=14, tsize=17)
    p.note(350, 468, 215, 100, PINK, 'Safe failures', ['Wrong user/password → 401', 'Inactive user/company → 403', 'No password set → 401'], rot=1, size=13.5, tsize=17)

    # every request
    p.text(605, 105, 'On every API request', 22, CORAL, SCRIPT, weight='bold')
    steps2 = [(SKY, 'cookies().get("auth_token")'), (PURPLE, 'verifyToken(JWT)'), (MINT, 'User.findById → must be active'), (YELLOW, 'company_user ⇒ Company must be active'), (PINK, 'requireX() → role check or 403')]
    y = 122
    for i, (c, t) in enumerate(steps2):
        p.card(605, y, 300, 40, fill=c, title='', lines=[], rx=10)
        p.text(617, y + 26, f'{i+1}.  {t}', 15, INK, BOLD, weight='bold')
        if i < 4:
            p.arrow([(755, y + 41), (755, y + 54)], 'coral', sw=2.4)
        y += 55
    p.note(925, 118, 175, 168, LIME, 'Live checks', ['Role changes take effect immediately', 'Deleted / inactive users lose access', 'No trust in stale JWT claims'], rot=1.5, size=13.5, tsize=17)

    # matrix
    p.text(605, 420, 'Access matrix', 22, CORAL, SCRIPT, weight='bold')
    cols = ['Area', 'Admin', 'Accountant', 'Supervisor']
    cx = [612, 740, 850, 975]
    rowsm = [('/admin/* + API', '✔', '✘', '✘'), ('/company/* + API', '✘', '✔', '✘'), ('/api/fbr/submit', '✘', '✔', '✘'), ('/supervisor/* (GET only)', '✘', '✘', '✔'), ('/api/auth/*', '✔', '✔', '✔')]
    p.rect(605, 432, 495, 28, DNAVY, INK, 2, 8)
    for c, x in zip(cols, cx):
        p.text(x, 452, c, 15, WHITE, BOLD, weight='bold')
    y = 460
    for i, r in enumerate(rowsm):
        p.rect(605, y, 495, 30, WHITE if i % 2 == 0 else '#f3f1ff', INK, 1.2, 0)
        for j, (v, x) in enumerate(zip(r, cx)):
            col = INK if j == 0 else ('#1f9d63' if v == '✔' else CORAL)
            p.text(x + (0 if j == 0 else 14), y + 21, v, 14 if j == 0 else 20, col, BODY if j == 0 else BOLD, weight='bold' if j else 'normal')
        y += 30
    p.note(40, 590, 330, 148, ORANGE, 'Two roles, three personas', ['super_admin → /admin/dashboard', 'company_user + accountant → /company/dashboard', 'company_user + supervisor → /supervisor/dashboard'], rot=-1, size=14.5, tsize=18)
    p.note(395, 590, 170, 148, PINK, 'Passwords', ['bcryptjs hash', '≥ 8 chars for supervisors', 'verify-password gate for deletes'], rot=1.3, size=13.5, tsize=17)
    p.note(605, 628, 495, 110, MINT, 'Every query is tenant-scoped', ['Company routes always filter by companyId from the session', 'Supervisor APIs: GET only, no-store cache, safe company fields, no FBR tokens'], rot=-0.6, size=14.5, tsize=18)
    return p


def a4():
    p = Page('ARCHITECTURE 4/5', 'Submit an Invoice to FBR', 4, TOTAL, '#e08a00', 'end-to-end sequence')
    cols = [
        (85, 'Accountant\nUI', SKY), (240, 'POST\n/api/fbr/submit', YELLOW), (395, 'MongoDB', MINT), (545, 'mapSubmission\nToInvoice()', LIME),
        (700, 'bridgeClient\ncallBridge()', ORANGE), (855, 'FBR Bridge', PINK), (1010, 'FBR\nSandbox / Prod', PURPLE),
    ]
    xs = {}
    for x, lbl, c in cols:
        xs[lbl] = x
        p.rect(x - 62, 98, 124, 46, c, INK, 2.2, 9)
        for i, l in enumerate(lbl.split('\n')):
            p.text(x, 118 + i * 16 - (6 if len(lbl.split('\n')) == 1 else 0) + (6 if len(lbl.split('\n')) == 1 else 0), l, 13.5, INK, BOLD, 'middle', weight='bold')
        p.line(x, 146, x, 650, NAVY, 2, '6 6')
    X = [c[0] for c in cols]
    msgs = [
        (176, 0, 1, '1  click "Submit to FBR"', 'coral'),
        (212, 1, 1, '2  requireCompanyUser', 'navy'),
        (258, 1, 2, '3  Submission.findOne(_id, companyId)', 'navy'),
        (290, 2, 1, 'submission doc', 'green'),
        (326, 1, 3, '4  map → FBR invoice JSON', 'navy'),
        (358, 3, 1, 'invoice', 'green'),
        (394, 1, 2, '5  Company token for env', 'navy'),
        (432, 1, 4, '6  submitInvoice(env, token)', 'coral'),
        (466, 4, 5, '7  POST …/invoices/submit', 'coral'),
        (500, 5, 6, '8  forward to FBR', 'purple'),
        (534, 6, 5, 'FBR response', 'green'),
        (566, 5, 4, 'envelope', 'green'),
        (602, 1, 2, '9  FbrReceipt + Submission.save', 'navy'),
        (636, 1, 0, '10  JSON success / 502', 'coral'),
    ]
    for y, f, t, lbl, col in msgs:
        if f == t:
            xx = X[f]
            p.path(f'M{xx},{y} h30 v16 h-30', stroke=ARROW_COLORS[col], sw=2.2, marker=col)
            p.text(xx + 36, y + 13, lbl, 15, INK, BODY)
        else:
            d = 6 if X[t] > X[f] else -6
            p.arrow([(X[f] + d, y), (X[t] - d, y)], col, label=lbl, ldy=-6, lsize=15.5, sw=2.2)
    # headers note
    p.note(36, 660, 330, 100, YELLOW, 'Headers sent to the bridge', ['Authorization · X-Request-ID', 'X-Idempotency-Key = <id>:submit', 'X-FBR-Environment · X-FBR-Token (opt.)'], rot=-1, size=13.5, tsize=17)
    p.note(386, 660, 280, 100, MINT, 'Token selection', ['production → fbrProductionToken', 'sandbox → fbrSandboxToken', 'empty → header omitted'], rot=1, size=13.5, tsize=17)
    p.note(686, 660, 200, 100, PINK, 'Always logged', ['FbrReceipt created for', 'success AND failure'], rot=-1.3, size=13.5, tsize=17)
    p.note(906, 660, 194, 100, SKY, 'Result', ['ok → status submitted', 'else → status failed', 'submittedAt stamped'], rot=1.2, size=13.5, tsize=17)
    return p


def a5():
    p = Page('ARCHITECTURE 5/5', 'API & Page Route Map', 5, TOTAL, '#2b7de9', '47 endpoints')
    M = {'GET': '#1f9d63', 'POST': '#2b7de9', 'PUT': '#e08a00', 'DEL': CORAL}

    def group(x, y, w, h, color, title, guard, rows, rot=0):
        p.note(x, y, w, h, color, '', [], rot=rot, check=False)
        cx, cy = x + w / 2, y + h / 2
        p.add(f'<g transform="rotate({rot} {cx} {cy})">')
        p.text(x + 12, y + 26, title, 19, INK, BOLD, weight='bold')
        p.pill(x + w - 12 - est(guard, 11.5, True) - 20, y + 9, guard, DNAVY, WHITE, 11.5)
        yy = y + 44
        for meths, path in rows:
            xx = x + 12
            for m in meths:
                wpill = p.pill(xx, yy - 13, m, M[m], WHITE, 11, padx=6, h=17)
                xx += wpill + 4
            p.text(xx + 4, yy, path, 14.5, INK, BODY)
            yy += 25
        p.add('</g>')

    group(26, 98, 350, 262, PINK, 'Admin  /api/admin', 'requireAdmin', [
        (['GET'], '/stats  ·  /search?q='),
        (['GET', 'POST'], '/companies'),
        (['GET', 'PUT', 'DEL'], '/companies/[id]'),
        (['GET', 'POST'], '/users'),
        (['GET', 'PUT', 'DEL'], '/users/[id]'),
        (['GET'], '/submissions  ·  /submissions/[id]'),
        (['GET', 'POST'], '/reference-data'),
        (['PUT', 'DEL'], '/reference-data/[id]'),
    ], -0.8)
    group(392, 98, 372, 262, MINT, 'Accountant  /api/company', 'requireCompanyUser', [
        (['GET'], '/profile  ·  /stats'),
        (['GET', 'POST'], '/invoice-items'),
        (['PUT', 'DEL'], '/invoice-items/[id]'),
        (['GET', 'POST'], '/submissions'),
        (['GET', 'PUT', 'DEL'], '/submissions/[id]'),
        (['POST'], '/submissions/[id]/validate'),
        (['POST'], '/submissions/[id]/prepare-payload'),
        (['POST'], '/submissions/[id]/submit  (placeholder)'),
    ], 0.7)
    p.text(402, 384, 'the real FBR push lives here ↓', 17, CORAL, SCRIPT, weight='bold')
    group(392, 396, 372, 96, '#FFE3A8', 'FBR  /api/fbr', 'requireCompanyUser', [
        (['POST'], '/submit  →  bridge + receipt'),
        (['GET', 'DEL'], '/receipts  ·  /receipts/[id]'),
    ], -0.5)
    group(26, 382, 350, 124, SKY, 'Supervisor  /api/supervisor', 'requireSupervisor', [
        (['GET'], '/stats  ·  /profile'),
        (['GET'], '/submissions  ·  /fbr-invoices'),
        (['GET'], 'read-only, company-scoped, no-store'),
    ], 0.6)
    group(26, 526, 350, 122, YELLOW, 'Auth  /api/auth', 'public / session', [
        (['POST'], '/login  ·  /logout'),
        (['GET'], '/me'),
        (['POST'], '/change-password  ·  /verify-password'),
    ], -0.5)
    group(392, 512, 372, 100, LIME, 'Shared', 'session', [
        (['GET'], '/api/reference-data  (dropdown lists)'),
        (['POST'], '/api/seed  (setup, secret key)'),
    ], 0.5)

    # page routes
    p.text(790, 112, 'UI page routes', 22, CORAL, SCRIPT, weight='bold')
    pr = [
        (PINK, 'Admin', ['/admin/dashboard', '/admin/companies · /new · /[id]', '/admin/users · /new · /[id]', '/admin/submissions · /[id]', '/admin/reference-data']),
        (MINT, 'Accountant', ['/company/dashboard', '/company/submissions/new · /[id]', '/company/records (submissions)', '/company/fbr-records · invoice-items', '/company/profile']),
        (SKY, 'Supervisor', ['/supervisor/dashboard', '/supervisor/submissions', '/supervisor/fbr-invoices', '/supervisor/profile']),
    ]
    y = 124
    for i, (c, t, ls) in enumerate(pr):
        h = 24 + len(ls) * 19 + 26
        p.note(790, y, 312, h, c, t, ls, rot=[0.8, -0.8, 0.6][i], size=13.5, tsize=17, bullet=False)
        y += h + 14
    p.note(26, 668, 738, 84, ORANGE, 'Conventions', ['Dynamic segments use [id] folders · routes export GET / POST / PUT / DELETE functions', 'Guards return { error } 403 early · dashboards add Cache-Control: no-store · pages redirect by role'], rot=-0.4, size=14, tsize=17, pad=9)
    p.callout(800, 740, 'tip: green GET = read-only', '#1f9d63', 17, -2)
    return p


PAGES = [a1, a2, a3, a4, a5]
