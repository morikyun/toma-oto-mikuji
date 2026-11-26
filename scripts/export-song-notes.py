#!/usr/bin/env python3
"""歌詞のことば・歌詞の解説・とおまさんが語っていること・この曲が出てくる発信を、
発信アーカイブ（toma-blog-archive）から音みくじ用に書き出します。

  research/catalog.json ＋ アーカイブ → dist/songs.json（keywords・lyricist を追加）
                                      → dist/notes/<曲ID>.json（結果画面の「この曲を、もう少し深く。」）

アーカイブ側の元データ：
  _システム/歌詞/解説/<番号>.json   … 見出し・解説・キーワード・とおまさんの話（曲ID song-<番号> と対応）
  _システム/歌詞/index.json         … 作詞者
  08_歌詞/曲/♪<曲名>.md            … 「この曲が出てくる発信」の一覧（リブログは除外）
  ブログ・YouTube・新月満月配信の各ノート … リンク先URL（frontmatter の url）

使い方：python3 scripts/export-song-notes.py [--archive ~/Documents/toma-blog-archive]
"""
import argparse
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'research' / 'catalog.json'
SONGS = ROOT / 'dist' / 'songs.json'
NOTES = ROOT / 'dist' / 'notes'
DEFAULT_ARCHIVE = Path.home() / 'Documents' / 'toma-blog-archive'
KIND_LABEL = {'ブログ': 'ブログ', 'YouTube': 'YouTube', 'YouTube（自動字幕）': 'YouTube',
              '新月・満月配信': '新月・満月配信', '新月・満月配信（自動字幕）': '新月・満月配信'}
MENTION_LINE = re.compile(r'^- (\d{4}-\d{2}-\d{2})　(\S+)　\[\[([^|\]]+)', re.M)


def frontmatter(path):
    match = re.match(r'---\n(.*?)\n---', path.read_text(encoding='utf-8'), re.S)
    data = {}
    for line in (match.group(1).splitlines() if match else []):
        key, sep, value = line.partition(':')
        if sep and not line.startswith((' ', '-')):
            data[key.strip()] = value.strip().strip('"')
    return data


def load_sources(archive):
    """ノート名（stem）→ タイトル・日付・URL・リブログかどうか"""
    sources = {}
    for folder in (archive / '04_ブログ記事', archive / '03_YouTube動画' / '全文', archive / '02_新月満月配信' / '全文'):
        for path in folder.rglob('*.md'):
            data = frontmatter(path)
            if data.get('url', '').startswith('https://'):
                sources[path.stem] = {'title': data.get('title') or path.stem, 'date': data.get('date', ''),
                                      'url': data['url'], 'reblog': data.get('reblog') == 'true'}
    return sources


def song_note_path(archive, title):
    folder = archive / '08_歌詞' / '曲'
    exact = folder / f'♪{title}.md'
    if exact.exists():
        return exact
    found = sorted(folder.glob(f'♪{title}（*）.md'))   # 同名曲がほかの作品にもあるとき
    return found[0] if found else None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--archive', help='発信アーカイブのフォルダー（既定：環境変数 TOMA_ARCHIVE または ~/Documents/toma-blog-archive）')
    args = parser.parse_args()
    archive = Path(args.archive or os.getenv('TOMA_ARCHIVE') or DEFAULT_ARCHIVE).expanduser()
    lyrics = archive / '_システム' / '歌詞'
    if not (lyrics / '解説').is_dir():
        parser.exit(1, f'アーカイブの歌詞解説が見つかりません：{lyrics / "解説"}\n')

    sources = load_sources(archive)
    lyricists = {}
    for release in json.loads((lyrics / 'index.json').read_text(encoding='utf-8'))['releases']:
        for song in release['songs']:
            lyricists[str(song['id'])] = [name for role, name in song.get('credits', []) if role == '作詞者']

    warnings = []

    def link(song, stem):
        source = sources.get(stem)
        if not source:
            warnings.append(f'{song["title"]}：リンク先が見つかりません（{stem}）')
        return source

    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    NOTES.mkdir(parents=True, exist_ok=True)
    songs, totals = [], {'keywords': 0, 'toma': 0, 'mentions': 0}
    for item in catalog:
        song = dict(item)
        number = song['id'].removeprefix('song-')
        note_file = lyrics / '解説' / f'{number}.json'
        note = json.loads(note_file.read_text(encoding='utf-8')) if note_file.exists() else {}
        if not note:
            warnings.append(f'{song["title"]}：歌詞の解説がまだありません（{note_file.name}）')

        keywords = [{'word': k['word'], 'text': k['text']} for k in note.get('keywords', []) if k.get('word')]
        song['keywords'] = [k['word'] for k in keywords]
        song['lyricist'] = lyricists.get(number, [])

        toma = []
        for remark in note.get('toma', []):
            source = link(song, remark.get('stem', ''))
            toma.append({'text': remark['text'], 'kind': KIND_LABEL.get(remark['kind'], remark['kind']),
                         'title': remark['title'], 'date': remark['date'], 'url': source['url'] if source else None})

        mentions = []
        note_md = song_note_path(archive, song['title'])
        if note_md is None:
            warnings.append(f'{song["title"]}：アーカイブの曲ノートが見つかりません')
        else:
            section = re.search(r'^## この曲が出てくる発信.*?$(.*?)(?=^## |\Z)', note_md.read_text(encoding='utf-8'), re.M | re.S)
            for date, kind, stem in MENTION_LINE.findall(section.group(1) if section else ''):
                if 'リブログ' in kind:
                    continue
                source = link(song, stem)
                if source and not source['reblog']:
                    mentions.append({'date': date, 'kind': KIND_LABEL.get(kind, kind), 'title': source['title'], 'url': source['url']})
            mentions.sort(key=lambda m: m['date'], reverse=True)

        out = {'id': song['id'], 'headline': note.get('headline', ''),
               'overview': [p.strip() for p in note.get('overview', '').split('\n') if p.strip()],
               'keywords': keywords, 'toma': toma, 'mentions': mentions}
        (NOTES / f'{song["id"]}.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        songs.append(song)
        totals['keywords'] += len(keywords)
        totals['toma'] += len(toma)
        totals['mentions'] += len(mentions)

    ids = {song['id'] for song in songs}
    for stale in NOTES.glob('*.json'):
        if stale.stem not in ids:
            stale.unlink()
    SONGS.write_text(json.dumps(songs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'{len(songs)}曲を書き出しました：キーワード{totals["keywords"]}件、'
          f'とおまさんの話{totals["toma"]}件、この曲が出てくる発信{totals["mentions"]}件')
    print(f'  {SONGS.relative_to(ROOT)}')
    print(f'  {NOTES.relative_to(ROOT)}/')
    for warning in warnings:
        print('  注意：' + warning)


if __name__ == '__main__':
    main()
