import sys, subprocess, os, importlib
sys.path.insert(0, os.path.dirname(__file__))
from lib import build_html

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FONTS = open(os.path.join(ROOT, 'fonts', 'fonts-local.css')).read().replace('url(', 'url(fonts/')

groups = {}
for mod in ('pages_arch', 'pages_db', 'pages_feat'):
    try:
        m = importlib.import_module(mod)
    except ModuleNotFoundError:
        continue
    groups[mod] = [f() for f in m.PAGES]

names = {
    'pages_arch': '1_Architecture_Diagrams',
    'pages_db': '2_Database_Schemas',
    'pages_feat': '3_Core_Features_and_UI_Design',
}
out_dir = os.path.join(ROOT, 'pdf')
os.makedirs(out_dir, exist_ok=True)
tmp = os.path.join(ROOT, 'build')
os.makedirs(tmp, exist_ok=True)


def render(pages, name):
    doc = build_html(pages, FONTS, name.replace('_', ' '))
    hp = os.path.join(ROOT, f'{name}.html')
    open(hp, 'w').write(doc)
    pdf = os.path.join(out_dir, f'ManageTaxMission_{name}.pdf')
    subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                    '--virtual-time-budget=6000', f'--print-to-pdf={pdf}', 'file://' + hp], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return pdf


all_pages = []
for mod, pages in groups.items():
    for pg in pages:
        for w in pg.warn:
            print(f'[warn] p{pg.num} {w}')
    all_pages += pages
    print(render(pages, names[mod]))
if len(groups) == 3:
    print(render(all_pages, '0_COMPLETE_All_20_Pages'))
