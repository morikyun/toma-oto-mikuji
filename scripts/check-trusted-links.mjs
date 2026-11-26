import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';

// Approved public destinations as of 2026-11-23. Updating these requires the
// operator's confirmation; this check complements review, not access control.
const approved = {
  contact: 'https://forms.gle/Mmrmu9xTuYpot9Dz6',
  notebook: 'https://pienipisara2.thebase.in/items/166793310',
  operator: 'https://toma-oshikatsubu.pages.dev/',
  streams: 'https://www.youtube.com/@TomaSource/streams',
  toma: 'https://www.tunecore.co.jp/artists/tomasource?lang=ja',
  kamimusuhi: 'https://www.tunecore.co.jp/artists/kamimusuhi',
  cloudflarePrivacy: 'https://www.cloudflare.com/privacypolicy/',
  cloudflareCookies: 'https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/',
  googlePrivacy: 'https://policies.google.com/privacy?hl=ja'
};

// Exact song-to-release pairs prevent links to another artist on the same host.
const releases = [
  ['pSdF1XPm', [3274365, 3274369, 3274372, 3274374, 3274378, 3274380, 3274384, 3274386, 3274387]],
  ['Z6GsbBAA', [1804387, 1804431, 1804432, 1804436, 1804437, 1804439, 1804440, 1804442]],
  ['umD0nEaD', [2310402, 2310409, 2310411, 2310416, 2310417, 2310419, 2310420, 2310421]],
  ['TTZuMtpA', [2213371, 2213372, 2213374, 2213377]],
  ['fsf4azfq', [1690518, 1690541, 1690542, 1690546, 1690548]],
  ['Yy9NShVs', [1824960, 1824962, 1824965, 1824966, 1824968, 1824970]],
  ['8B4bBhFs', [4942742, 4943103, 4950000, 4950007, 4950022, 4950049]],
  ['NEu1EsFy', [1116329, 1116391, 1116395, 1116399, 1116405], false]
];
const approvedSongs = new Map(releases.flatMap(([release, ids, lyrics = true]) => ids.map(id => [
  `song-${id}`, {
    url: `https://linkco.re/${release}?lang=ja`,
    lyricsUrl: lyrics ? `https://linkco.re/${release}/songs/${id}/lyrics?lang=ja` : null
  }
])));

function anchors(source) {
  return [...source.matchAll(/<a\b([^>]*?)>/gs)].map(([, attributes]) => ({
    href: attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/s)?.[2],
    classes: (attributes.match(/\bclass\s*=\s*(["'])(.*?)\1/s)?.[2] || '').split(/\s+/)
  }));
}

function objectURL(source, name) {
  const object = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\{([^}]+)\\}`, 's'))?.[1];
  return object?.match(/\burl\s*:\s*(['"])(.*?)\1/s)?.[2];
}

function checkStaticLinks(source, allowed, label) {
  for (const {href} of anchors(source)) {
    if (!href || href.startsWith('${')) continue;
    if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) continue;
    assert.ok(allowed.includes(href), `${label}: 承認済みのリンク先と一致しません。運営者に確認してください。`);
  }
}

export function checkTrustedLinks({index, privacy, notFound, notebook, app, songs}) {
  const contact = anchors(privacy).filter(link => link.classes.includes('privacy-contact-link'));
  assert.deepEqual(contact.map(link => link.href), [approved.contact], 'お問い合わせフォームの変更には運営者の確認が必要です。');
  for (const [label, source] of [['トップ', index], ['プライバシー', privacy], ['404', notFound]]) {
    const footer = source.match(/<p\b[^>]*class=["']footer-powered["'][^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
    assert.deepEqual(anchors(footer).map(link => link.href), [approved.operator], `${label}: Powered byの変更には運営者の確認が必要です。`);
  }
  assert.equal(objectURL(notebook, 'NOTEBOOK'), approved.notebook, 'ノートの商品ページの変更には運営者の確認が必要です。');
  assert.equal(objectURL(notebook, 'MOON_STREAMS'), approved.streams, '公式配信チャンネルの変更には運営者の確認が必要です。');
  assert.ok(anchors(index).some(link => link.href === approved.toma), '公式配信一覧のリンクが見つかりません。');
  for (const url of [approved.toma, approved.kamimusuhi]) {
    assert.ok(anchors(app).some(link => link.href === url), '公式アーティストのリンクが見つかりません。');
  }
  checkStaticLinks(index, [approved.operator, approved.toma], 'トップ');
  checkStaticLinks(app, [approved.toma, approved.kamimusuhi], '音みくじ');
  checkStaticLinks(privacy, [approved.contact, approved.operator, approved.cloudflarePrivacy, approved.cloudflareCookies, approved.googlePrivacy], 'プライバシー');
  checkStaticLinks(notFound, [approved.operator], '404');
  checkStaticLinks(notebook, [approved.notebook, approved.streams], 'ノート・配信');

  assert.ok(Array.isArray(songs), '楽曲カタログが配列ではありません。');
  assert.equal(songs.length, approvedSongs.size, '楽曲の追加・削除には承認済みリンク一覧の確認が必要です。');
  assert.equal(new Set(songs.map(song => song.id)).size, songs.length, '楽曲IDが重複しています。');
  for (const song of songs) {
    const expected = approvedSongs.get(song.id);
    assert.ok(expected, '未確認の楽曲IDです。運営者に確認してください。');
    assert.deepEqual({url: song.url, lyricsUrl: song.lyricsUrl}, expected, `${song.id}: 公式配信・歌詞ページの変更には運営者の確認が必要です。`);
  }
  return {songs: songs.length};
}

export async function readLinkInputs(root = fileURLToPath(new URL('../', import.meta.url))) {
  const read = path => fs.readFile(new URL(path, pathToFileURL(`${root.replace(/\/$/, '')}/`)), 'utf8');
  const [index, privacy, notFound, notebook, app, catalog] = await Promise.all([
    read('dist/index.html'), read('dist/privacy/index.html'), read('cloudflare/404.html'),
    read('dist/notebook.mjs'), read('dist/app.mjs'), read('dist/songs.json')
  ]);
  return {index, privacy, notFound, notebook, app, songs: JSON.parse(catalog)};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = checkTrustedLinks(await readLinkInputs());
    console.log(`Approved contact, official links and ${result.songs} song destinations verified.`);
  } catch (error) {
    // Assertion diffs contain the altered URL, so print only the review instruction.
    console.error(error instanceof Error ? error.message.split('\n')[0] : 'Trusted link check failed.');
    process.exitCode = 1;
  }
}
