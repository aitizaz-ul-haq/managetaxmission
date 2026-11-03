from lib import *

TOTAL = 20


def d1():
    p = Page('DATABASE 1/5', 'Entity Relationship Map', 6, TOTAL, '#1f9d63', '6 collections · MongoDB')
    U = p.schema(30, 100, 250, 'User', PINK, [
        ('_id', 'ObjectId', '', 'PK'), ('fullName', 'String', '', ''), ('email', 'String', '', 'UQ'), ('role', 'enum', '', 'ENUM'),
        ('personnelType', 'enum', '', 'ENUM'), ('companyId', 'ObjectId', '', 'FK'), ('status', 'enum', '', 'ENUM')], size=13.5, rowh=21, cols=(0.50, 0))
    C = p.schema(400, 100, 270, 'Company', YELLOW, [
        ('_id', 'ObjectId', '', 'PK'), ('companyName', 'String', '', ''), ('legalName', 'String', '', ''), ('ntn', 'String', '', ''),
        ('strn', 'String', '', ''), ('province', 'String', '', ''), ('fbrSandboxToken', 'String', '', ''), ('fbrProductionToken', 'String', '', ''),
        ('branches[]', 'Branch', '', 'EMB'), ('status', 'enum', '', 'ENUM')], size=13.5, rowh=21, cols=(0.58, 0))
    I = p.schema(820, 100, 270, 'InvoiceItem', MINT, [
        ('_id', 'ObjectId', '', 'PK'), ('companyId', 'ObjectId', '', 'FK'), ('createdBy', 'ObjectId', '', 'FK'), ('registrationNo', 'String', '', ''),
        ('itemDescription', 'String', '', ''), ('type', 'enum', '', 'ENUM'), ('status', 'enum', '', 'ENUM')], size=13.5, rowh=21, cols=(0.56, 0))
    R = p.schema(30, 385, 250, 'ReferenceData', SKY, [
        ('_id', 'ObjectId', '', 'PK'), ('type', 'enum (9)', '', 'ENUM'), ('label', 'String', '', ''), ('value', 'Mixed', '', ''),
        ('extraData', 'Mixed', '', ''), ('status', 'enum', '', 'ENUM'), ('createdBy', 'ObjectId', '', 'FK')], size=13.5, rowh=21, cols=(0.50, 0))
    S = p.schema(400, 410, 270, 'Submission', ORANGE, [
        ('_id', 'ObjectId', '', 'PK'), ('companyId', 'ObjectId', '', 'FK'), ('createdBy', 'ObjectId', '', 'FK'), ('taxPeriod M/Y', 'Number', '', ''),
        ('scenarioId', 'String', '', ''), ('fbrEnvironment', 'enum', '', 'ENUM'), ('totals (3)', 'Number', '', ''), ('status', 'enum (5)', '', 'ENUM'),
        ('itemList[]', 'Item', '', 'EMB'), ('fbrPayload', 'Mixed', '', ''), ('fbrResponse', 'Mixed', '', '')], size=13.5, rowh=21, cols=(0.58, 0))
    F = p.schema(820, 420, 270, 'FbrReceipt', PURPLE, [
        ('_id', 'ObjectId', '', 'PK'), ('companyId', 'ObjectId', '', 'FK'), ('createdBy', 'ObjectId', '', 'FK'), ('submissionRef', 'ObjectId', '', 'FK'),
        ('action', 'validate|submit', '', 'ENUM'), ('success', 'Boolean', '', ''), ('environment', 'String', '', ''), ('invoicePayload', 'Mixed', '', ''), ('fbrResponse', 'Mixed', '', '')], size=13.5, rowh=21, cols=(0.50, 0))

    def yr(d, i):
        return d['rows'][i]
    # relationships
    p.arrow([(282, yr(U, 5)), (398, yr(C, 0))], 'coral', sw=3, curve=0)
    p.text(366, 232, 'works for', 16, CORAL, SCRIPT, 'middle', weight='bold', rot=-25)
    p.text(292, yr(U, 5) + 18, 'N', 16, INK, BOLD, weight='bold')
    p.text(380, yr(C, 0) + 22, '1', 16, INK, BOLD, weight='bold')
    p.arrow([(672, yr(C, 0)), (818, yr(I, 1))], 'green', sw=3)
    p.text(745, yr(C, 0) - 8, 'owns items', 16, '#1f9d63', SCRIPT, 'middle', weight='bold')
    p.arrow([(535, C['y'] + C['h'] + 2), (535, S['y'] - 2)], 'purple', sw=3)
    p.text(545, 380, 'files', 16, '#7a5af8', SCRIPT, weight='bold')
    p.text(520, 372, '1', 16, INK, BOLD, weight='bold', anchor='end')
    p.text(520, 404, 'N', 16, INK, BOLD, weight='bold', anchor='end')
    p.arrow([(672, yr(S, 0) + 4), (818, yr(F, 3))], 'amber', sw=3)
    p.text(748, yr(S, 0) - 6, 'audit receipts', 16, '#e08a00', SCRIPT, 'middle', weight='bold')
    p.arrow([(155, U['y'] + U['h'] + 2), (155, R['y'] - 2)], 'blue', sw=3)
    p.text(168, 340, 'maintains', 16, '#2b7de9', SCRIPT, weight='bold')
    p.path(f"M282,{yr(U, 6)} H336 V{yr(S, 2)} H398", stroke=ARROW_COLORS['navy'], sw=2.6, dash='7 5', marker='navy')
    p.text(322, 410, 'created by (user → submission)', 14, NAVY, SCRIPT, 'middle', weight='bold', rot=-90)

    p.note(820, 316, 270, 92, YELLOW, 'Tenant key = companyId', ['on User, Submission, FbrReceipt, InvoiceItem'], rot=1.4, size=14, tsize=17, pad=9)
    p.note(30, 604, 250, 140, LIME, 'How to read', ['PK primary key · FK reference', 'UQ unique · ENUM fixed values', 'EMB embedded sub-document', 'N : 1 = many to one'], rot=-1.2, size=14, tsize=18, pad=9)
    p.note(400, 706, 270, 54, PINK, 'No SQL joins — refs via Mongoose', [], rot=0.8, tsize=16, pad=8, check=False)
    p.note(820, 668, 270, 88, SKY, 'All collections have', ['createdAt / updatedAt', '(Mongoose timestamps)'], rot=-1.1, size=14, tsize=17, pad=9)
    return p


def d2():
    p = Page('DATABASE 2/5', 'Submission = one invoice', 7, TOTAL, CORAL, 'header + itemList[]')
    W_ = 258
    S1 = p.schema(24, 98, W_, 'Submission · header', ORANGE, [
        ('companyId', 'ObjectId', '', 'FK'), ('createdBy', 'ObjectId', '', 'FK'), ('submissionType', 'String', '', ''), ('scenarioId', 'SN018|SN019', '', ''),
        ('fbrEnvironment', 'sandbox|prod', '', 'ENUM'), ('taxPeriodMonth', 'Number', '', ''), ('taxPeriodYear', 'Number', '', ''),
        ('invoiceType', 'String', '', ''), ('invoiceDate', 'YYYY-MM-DD', '', ''), ('invoiceNumber', 'String', '', '')], size=12.5, rowh=19, cols=(0.50, 0))
    S2 = p.schema(24, 340, W_, 'Submission · totals + state', YELLOW, [
        ('totalSaleValue', 'Number', '', ''), ('totalTaxAmount', 'Number', '', ''), ('totalBillAmount', 'Number', '', ''),
        ('status', 'enum (5)', '', 'ENUM'), ('validationStatus', 'enum (3)', '', 'ENUM'), ('validationErrors', '[String]', '', ''),
        ('fbrPayload', 'Mixed', '', ''), ('fbrResponse', 'Mixed', '', ''), ('submittedAt', 'Date', '', '')], size=12.5, rowh=19, cols=(0.52, 0))
    S3 = p.schema(296, 98, W_, 'Submission · parties', PINK, [
        ('sellerBusinessName', 'String', '', ''), ('sellerNTN', 'String', '', ''), ('sellerProvince', 'String', '', ''), ('sellerAddress', 'String', '', ''),
        ('buyerBusinessName', 'String', '', ''), ('buyerNTN', 'String', '', ''), ('buyerCNIC', 'String', '', ''), ('buyerProvince', 'String', '', ''),
        ('buyerAddress', 'String', '', ''), ('buyerType', 'String', '', '')], size=12.5, rowh=19, cols=(0.64, 0))
    I1 = p.schema(568, 98, W_, 'itemList[] · price & sale', MINT, [
        ('itemSNo', 'Number', '', 'EMB'), ('itemDescription', 'String', '', ''), ('hsCode', 'String', '', ''), ('uom', 'String', '', ''),
        ('quantity', 'Number', '', ''), ('unitPrice', 'Number', '', ''), ('saleValue', 'Number', '', ''), ('taxRate', 'Number', '', ''),
        ('taxAmount', 'Number', '', ''), ('saleType', 'String', '', ''), ('discount', 'Number', '', ''), ('totalValueOfSales', 'Number', '', ''),
        ('fixedNotifiedValue', 'Number', '', '')], size=12.5, rowh=19, cols=(0.58, 0))
    I2 = p.schema(840, 98, W_, 'itemList[] · tax, buyer, SRO', SKY, [
        ('extraTax', 'Number', '', ''), ('furtherTax', 'Number', '', ''), ('fedPayable', 'Number', '', ''), ('stWithheldAtSource', 'Number', '', ''),
        ('sroScheduleNo', 'String', '', ''), ('sroItemSerialNo', 'String', '', ''), ('buyerNTN / CNIC', 'String', '', ''), ('buyerBusinessName', 'String', '', ''),
        ('buyerType', 'String', '', ''), ('buyerProvince', 'String', '', ''), ('sellerProvince', 'String', '', ''), ('buyerAddress', 'String', '', ''),
        ('invoiceType·No·Date', 'String', '', ''), ('invoiceReferenceNo', 'String', '', ''), ('reasons · reasonRemarks', 'String', '', ''), ('petroleumLevyOn', 'String', '', '')], size=12.5, rowh=19, cols=(0.66, 0))
    # brackets
    p.note(296, 340, W_, 128, LIME, 'One invoice per submission', ['Seller comes from the top level', 'Buyer comes from the FIRST item row', 'Every row becomes items[]'], rot=-1, size=14, tsize=17, pad=9)
    p.note(568, 408, W_, 94, PURPLE, 'Item row ≈ 33 fields', ['embedded array — no _id join', 'edited as a grid in the UI'], rot=1, size=14, tsize=17, pad=9)
    p.note(296, 484, W_, 156, YELLOW, 'Calculated on save', ['saleValue = qty × unitPrice', 'taxAmount = saleValue × taxRate / 100', 'totalBill = Σ saleValue + Σ taxAmount'], rot=-0.5, size=14.5, tsize=18)
    p.note(24, 572, 258, 160, MINT, 'Status values', ['draft → validated', '→ ready_for_submission', '→ submitted | failed'], rot=1, size=14.5, tsize=18)
    p.note(296, 656, 258, 88, PINK, 'validationStatus', ['pending · valid · invalid'], rot=-1, size=14.5, tsize=17, pad=9)
    p.note(568, 520, 258, 222, ORANGE, 'Typed carefully', ['NTN: 7 alphanumerics', 'CNIC: 13 digits', 'dates stored YYYY-MM-DD strings', 'fbrPayload keeps the exact JSON sent', 'fbrResponse keeps bridge envelope'], rot=0.8, size=14, tsize=18, pad=9)
    p.note(840, 470, W_, 270, SKY, 'Why embed items?', ['An invoice is read and written as a whole', 'One round-trip loads the form', 'Print modals and FBR mapping read one doc', 'Totals live beside the rows they sum'], rot=-0.8, size=15, tsize=19)
    return p


def d3():
    p = Page('DATABASE 3/5', 'Company · User · Branch', 8, TOTAL, '#7a5af8', 'tenants and people')
    C1 = p.schema(24, 98, 330, 'Company · FBR registration', YELLOW, [
        ('registrationNo', 'String', '', ''), ('referenceNo', 'String', '', ''), ('salesTaxRegistered', 'Boolean', '', ''), ('salesTaxRegisteredDate', 'String', '', ''),
        ('category', 'String', '', ''), ('ppRegIncNo', 'String', '', ''), ('registeredOn', 'String', '', ''), ('taxOffice', 'String', '', ''),
        ('incomeTaxStatus', 'String', '', ''), ('salesTaxStatus', 'String', '', '')], size=13.5, rowh=21, cols=(0.58, 0))
    C2 = p.schema(374, 98, 350, 'Company · identity & integration', ORANGE, [
        ('companyName *', 'String', '', ''), ('legalName *', 'String', '', ''), ('ntn *', 'String', '', ''), ('strn', 'String', '', ''),
        ('province *', 'String', '', ''), ('address *', 'String', '', ''), ('email · cell', 'String', '', ''),
        ('fbrSandboxToken', 'String', '', ''), ('fbrProductionToken', 'String', '', ''), ('branches[]', 'Branch', '', 'EMB'),
        ('status', 'active|inactive|suspended', '', 'ENUM'), ('settings{ }', 'Object', '', 'EMB'), ('createdBy', 'ObjectId', '', 'FK')], size=13.5, rowh=21, cols=(0.50, 0))
    U = p.schema(744, 98, 350, 'User', PINK, [
        ('_id', 'ObjectId', '', 'PK'), ('fullName *', 'String', '', ''), ('email *', 'String (lowercase)', '', 'UQ'), ('phone', 'String', '', ''),
        ('password', 'String (bcrypt hash)', '', ''), ('role *', 'super_admin | company_user', '', 'ENUM'), ('personnelType', 'accountant | supervisor | null', '', 'ENUM'),
        ('companyId', 'ObjectId → Company', '', 'FK'), ('status', 'active | inactive', '', 'ENUM'), ('lastLoginAt', 'Date', '', ''), ('createdBy', 'ObjectId → User', '', 'FK')], size=13, rowh=21, cols=(0.40, 0))
    B = p.schema(374, 420, 350, 'Branch  (embedded in Company)', MINT, [
        ('name', 'String', '', ''), ('address', 'String', '', ''), ('principalActivity', 'String', '', '')], size=13.5, rowh=21, cols=(0.50, 0))
    St = p.schema(374, 548, 350, 'settings  (embedded object)', SKY, [
        ('defaultInvoiceType', 'String', '', ''), ('defaultTaxRate', 'Number', '', ''), ('allowSubmission', 'Boolean', '', '')], size=13.5, rowh=21, cols=(0.58, 0))
    p.note(24, 372, 330, 108, LIME, '* means required', ['Company: name, legalName, ntn, province, address', 'User: fullName, email, role'], rot=-1, size=14.5, tsize=18)
    p.note(24, 498, 330, 122, PINK, 'Who is who', ['super_admin → no company', 'company_user + accountant → creates invoices', 'company_user + supervisor → read-only reports'], rot=1, size=14.5, tsize=18)
    p.note(24, 638, 330, 112, YELLOW, 'Supervisor sign-in', ['Needs a password set by an admin', '≥ 8 chars, bcrypt hashed', 'blank on edit = keep existing'], rot=-0.8, size=14.5, tsize=18)
    p.note(744, 380, 350, 112, MINT, 'Safety checks at runtime', ['inactive user → blocked', 'inactive company → blocked', 'role + personnel re-read from DB'], rot=1, size=14.5, tsize=18)
    p.note(744, 512, 350, 116, ORANGE, 'FBR tokens', ['One token per environment', 'Production never reuses the sandbox token', 'Empty token → bridge default'], rot=-1, size=14.5, tsize=18)
    p.note(374, 664, 350, 84, PURPLE, 'Company status', ['active · inactive · suspended'], rot=0.8, size=15, tsize=18, pad=9)
    p.note(744, 648, 350, 100, SKY, 'Personnel sync', ['lib/personnel/syncCompanyPersonnel keeps', 'company contacts ↔ user accounts aligned'], rot=0.8, size=14, tsize=18)
    return p


def d4():
    p = Page('DATABASE 4/5', 'Receipts · Items · Reference Data', 9, TOTAL, '#2b7de9', 'audit + lookup lists')
    F = p.schema(24, 98, 360, 'FbrReceipt  (audit log)', PURPLE, [
        ('companyId', 'ObjectId → Company', '', 'FK'), ('createdBy', 'ObjectId → User', '', 'FK'), ('submissionRef', 'ObjectId → Submission', '', 'FK'), ('submissionId', 'String', '', ''),
        ('action', 'validate | submit', '', 'ENUM'), ('invoicePayload', 'Mixed (JSON sent)', '', ''), ('success', 'Boolean', '', ''), ('mock', 'Boolean', '', ''),
        ('environment', 'sandbox | production', '', ''), ('requestId', 'String', '', ''), ('httpStatus', 'Number', '', ''), ('fbrResponse', 'Mixed', '', ''),
        ('errorCode', 'String', '', ''), ('errorMessage', 'String', '', ''), ('rawEnvelope', 'Mixed', '', ''), ('receivedAt', 'Date', '', '')], size=13, rowh=20, cols=(0.38, 0))
    I = p.schema(404, 98, 330, 'InvoiceItem  (saved item templates)', MINT, [
        ('companyId', 'ObjectId → Company', '', 'FK'), ('createdBy', 'ObjectId → User', '', 'FK'), ('registrationNo *', 'String', '', ''), ('itemDescription *', 'String', '', ''),
        ('productDescription', 'String', '', ''), ('buyerAddress', 'String', '', ''), ('saleOriginProvinceOfSupplier', 'String', '', ''), ('destinationOfSupply', 'String', '', ''),
        ('type', 'buyer type', '', 'ENUM'), ('status', 'active | inactive', '', 'ENUM')], size=13, rowh=20, cols=(0.67, 0))
    p.text(412, 368, 'index  { companyId: 1, status: 1 }', 15.5, '#2b7de9', SCRIPT, weight='bold')
    R = p.schema(754, 98, 340, 'ReferenceData  (dropdown values)', SKY, [
        ('type', 'enum (9)', '', 'ENUM'), ('label *', 'String', '', ''), ('value *', 'Mixed', '', ''), ('extraData', 'Mixed {}', '', ''),
        ('status', 'active | inactive', '', 'ENUM'), ('createdBy', 'ObjectId → User', '', 'FK')], size=13, rowh=20, cols=(0.40, 0))
    # enum chips
    p.text(754, 290, 'ReferenceData.type values', 18, CORAL, SCRIPT, weight='bold')
    chips = ['province', 'invoice_type', 'buyer_type', 'tax_rate', 'hs_code', 'sale_type', 'document_type', 'uom', 'sro_schedule']
    cols_ = [SKY, MINT, YELLOW, PINK, ORANGE, LIME, PURPLE, SKY, MINT]
    x, y = 754, 300
    for c, col in zip(chips, cols_):
        w = est(c, 13, True) + 20
        if x + w > 1094:
            x, y = 754, y + 30
        p.pill(x, y, c, col, INK, 13, stroke=INK)
        x += w + 8
    p.note(404, 384, 330, 90, YELLOW, 'Buyer type (InvoiceItem.type)', ['Unregistered · Registered', 'Unrecognised · Retail Consumer'], rot=-1, size=14.5, tsize=17, pad=10)
    p.note(754, 406, 340, 106, LIME, 'Admin-managed lists', ['Provinces, HS codes, tax rates, UOM,', 'SRO schedules feed the invoice form via', 'GET /api/reference-data'], rot=1, size=14, tsize=18)
    # envelope mock
    p.rect(24, 482, 360, 268, '#12182f', INK, 2.4, 10)
    p.rect(24, 482, 360, 28, '#293255', INK, 2.4, 10)
    p.text(38, 502, 'rawEnvelope  (bridge response)', 14, WHITE, BOLD, weight='bold')
    code = ['{', '  "success": true,', '  "requestId": "…uuid…",', '  "httpStatus": 200,', '  "environment": "sandbox",', '  "mock": false,', '  "fbrResponse": {', '     "validationResponse": {…},', '     "invoiceStatuses": […] },', '  "error": { "code", "message" },', '  "receivedAt": "ISO date"', '}']
    for i, l in enumerate(code):
        p.text(38, 530 + i * 17.8, l, 13.5, MINT if '"' in l else WHITE, "'Kalam', monospace")
    p.note(404, 492, 330, 124, ORANGE, 'Bridge error codes', ['FBR_TIMEOUT (35 s default)', 'FBR_NETWORK_ERROR', 'FBR_UNEXPECTED_RESPONSE', 'plus FBR\'s own status codes'], rot=0.8, size=14.5, tsize=18)
    p.note(404, 634, 330, 116, PINK, 'Receipts never lost', ['A receipt is written for success and', 'failure so there is always an audit trail', 'viewable under FBR Invoices'], rot=-0.8, size=14, tsize=18)
    p.note(754, 526, 340, 112, MINT, 'getFbrInvoiceStatus()', ['Reads status from the envelope:', 'status → statusCode → invoiceStatuses[0]', 'shown as the badge in FBR Invoices'], rot=-0.8, size=14, tsize=18)
    p.note(754, 656, 340, 94, SKY, 'Delete is gated', ['Receipt / submission deletes ask for the', 'user\'s password (verify-password)'], rot=1, size=14, tsize=18)
    return p


def d5():
    p = Page('DATABASE 5/5', 'Status Flow & Data Mapping', 10, TOTAL, '#e08a00', 'life of one submission')
    # state machine
    p.text(30, 105, 'Submission.status state machine', 22, CORAL, SCRIPT, weight='bold')
    nodes = {'draft': (100, 200, ORANGE), 'validated': (320, 200, SKY), 'ready': (540, 200, PURPLE), 'submitted': (800, 150, MINT), 'failed': (800, 270, PINK)}
    labels = {'draft': 'draft', 'validated': 'validated', 'ready': 'ready_for_\nsubmission', 'submitted': 'submitted', 'failed': 'failed'}
    for k, (x, y, c) in nodes.items():
        p.rect(x - 70, y - 30, 140, 60, c, INK, 2.6, 30)
        for i, l in enumerate(labels[k].split('\n')):
            p.text(x, y + 6 + (i - (len(labels[k].split('\n')) - 1) / 2) * 17 - 0, l, 17, INK, BOLD, 'middle', weight='bold')
    p.pill(60, 120, 'START', '#1f9d63', WHITE, 13)
    p.arrow([(100, 150), (100, 168)], 'green')
    p.arrow([(172, 195), (248, 195)], 'coral', label='validate ok', ldy=-8)
    p.arrow([(248, 215), (172, 215)], 'navy', label='invalid → stays draft', ldy=26, lsize=14)
    p.arrow([(392, 200), (468, 200)], 'coral', label='prepare payload', ldy=-8, lsize=14.5)
    p.arrow([(612, 185), (728, 158)], 'green', label='FBR success', ldy=-12, lsize=15)
    p.arrow([(612, 218), (728, 262)], 'coral', label='FBR error', ldy=26, ldx=0, lsize=15)
    p.arrow([(800, 238), (800, 184)], 'amber', dash='6 5', label='retry', ldx=26, ldy=6, lsize=15)
    p.note(40, 270, 300, 100, YELLOW, 'Editable while', ['status is draft or validated'], rot=-1, size=15, tsize=18, pad=10)
    p.note(360, 270, 340, 100, LIME, 'On every FBR call', ['FbrReceipt row + fbrResponse + fbrPayload', 'stored; submittedAt only on success'], rot=0.8, size=14.5, tsize=18, pad=10)
    p.note(920, 118, 175, 170, SKY, 'Dashboards count', ['5 statuses:', 'draft · validated · ready · submitted · failed', 'by tax period'], rot=1.4, size=14, tsize=18)

    # mapping table
    p.text(30, 410, 'Submission field  →  FBR invoice payload', 22, CORAL, SCRIPT, weight='bold')
    rows = [
        ('sellerNTN', 'sellerNTNCNIC'), ('buyerNTN | buyerCNIC', 'buyerNTNCNIC'), ('buyerType', 'buyerRegistrationType'), ('sellerProvince', 'sellerProvince (FBR name)'),
        ('item.itemDescription', 'productDescription'), ('item.uom', 'uoM'), ('item.saleValue', 'valueSalesExcludingST'), ('item.taxAmount', 'salesTaxApplicable'),
        ('item.stWithheldAtSource', 'salesTaxWithheldAtSource'), ('item.totalValueOfSales', 'totalValues'), ('item.fixedNotifiedValue', 'fixedNotifiedValueOrRetailPrice'), ('item.invoiceReferenceNo', 'invoiceRefNo'),
    ]
    cols_ = [(30, 330), (30 + 330, 0)]
    for i, (a, b) in enumerate(rows):
        col, row = i // 6, i % 6
        x0 = 30 + col * 520
        y0 = 428 + row * 36
        p.rect(x0, y0, 215, 28, [PINK, YELLOW, MINT, SKY, ORANGE, LIME][row], INK, 2, 6)
        p.text(x0 + 10, y0 + 20, a, 14.5, INK, BOLD, weight='bold')
        p.arrow([(x0 + 218, y0 + 14), (x0 + 262, y0 + 14)], 'coral', sw=2.6)
        p.rect(x0 + 266, y0, 235, 28, WHITE, INK, 2, 6)
        p.text(x0 + 276, y0 + 20, b, 14.5, '#1b5fa8', BOLD, weight='bold')
    p.note(30, 646, 330, 106, ORANGE, 'Type rules in the mapper', ['NTN/CNIC are strings', 'item.extraTax is a string', 'other tax fields are numbers'], rot=-1, size=14.5, tsize=18)
    p.note(380, 650, 330, 100, MINT, 'Display names', ['Islamabad → CAPITAL TERRITORY · KPK → KHYBER', 'PAKHTUNKHWA · invoice type title-cased'], rot=0.8, size=14, tsize=18, pad=10)
    p.note(730, 650, 365, 100, PINK, 'Total bill (modal)', ['Σ valueSalesExcludingST + Σ salesTaxApplicable', '(not Σ totalValues — that is PFAD only)'], rot=-0.8, size=14, tsize=18, pad=10)
    return p


PAGES = [d1, d2, d3, d4, d5]
