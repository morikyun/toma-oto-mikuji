#!/usr/bin/env python3
"""Prepare a static Cloudflare Pages folder and a dashboard-upload ZIP."""

import argparse
import html
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'cloudflare-pages'
ARCHIVE = ROOT / 'toma-oto-mikuji-cloudflare-pages.zip'


def site_origin(value):
    if not value:
        return None
    parts = urlsplit(value.strip())
    if (parts.scheme != 'https' or not parts.hostname or parts.username
            or parts.password or parts.port or parts.query or parts.fragment
            or parts.path not in ('', '/')):
        raise ValueError('公開URLは https://example.pages.dev/ のようなサイトのトップURLを指定してください。')
    return f'https://{parts.netloc}/'


def prepare(site_url):
    with tempfile.TemporaryDirectory(prefix='.pages-build-', dir=ROOT) as temp:
        staging = Path(temp)
        shutil.copytree(ROOT / 'dist', staging, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns('.DS_Store', 'Thumbs.db'))
        for name in ('_headers', '404.html'):
            shutil.copy2(ROOT / 'cloudflare' / name, staging / name)

        index_path = staging / 'index.html'
        document = index_path.read_text(encoding='utf-8')
        document = re.sub(r'^\s*<link rel="canonical"[^>]*>\n', '', document, flags=re.M)
        document = re.sub(r'^\s*<meta property="og:url"[^>]*>\n', '', document, flags=re.M)
        image_url = f'{site_url}assets/social-card.jpg' if site_url else '/assets/social-card.jpg'
        document, count = re.subn(
            r'<meta property="og:image" content="[^"]*">',
            f'<meta property="og:image" content="{html.escape(image_url, quote=True)}">', document)
        if count != 1:
            raise ValueError('og:image の設定が見つかりません。index.html を確認してください。')
        if site_url:
            escaped = html.escape(site_url, quote=True)
            metadata = (f'  <link rel="canonical" href="{escaped}">\n'
                        f'  <meta property="og:url" content="{escaped}">\n')
            document = document.replace('  <meta property="og:image"', metadata + '  <meta property="og:image"', 1)
        if 'https://toma-oto-mikuji.netlify.app' in document:
            raise ValueError('旧公開先への参照が残っています。')
        index_path.write_text(document, encoding='utf-8')

        files = sorted(path for path in staging.rglob('*') if path.is_file())
        if len(files) > 1000 or any(path.stat().st_size > 25 * 1024 * 1024 for path in files):
            raise ValueError('Cloudflare Pages のダッシュボードアップロード上限を超えています。')
        if OUTPUT.exists():
            shutil.rmtree(OUTPUT)
        shutil.copytree(staging, OUTPUT)
        with zipfile.ZipFile(ARCHIVE, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in files:
                archive.write(path, path.relative_to(staging))

    print(f'公開用フォルダー: {OUTPUT}')
    print(f'アップロード用ZIP: {ARCHIVE}')
    print(f'公開URL設定: {site_url or "未設定（サイトは利用可能。SNS共有画像の絶対URLは公開URL確定後に設定）"}')
    print('Cloudflareへのアップロードは行っていません。')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-url', help='公開するトップURL。未指定時は SITE_URL または cloudflare/config.json を使用')
    args = parser.parse_args()
    config = json.loads((ROOT / 'cloudflare/config.json').read_text(encoding='utf-8'))
    try:
        prepare(site_origin(args.site_url if args.site_url is not None else os.getenv('SITE_URL', config['siteUrl'])))
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')
