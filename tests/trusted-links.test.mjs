import test from 'node:test';
import assert from 'node:assert/strict';
import {checkTrustedLinks, readLinkInputs} from '../scripts/check-trusted-links.mjs';

const original = await readLinkInputs();
const copy = () => structuredClone(original);

test('current approved links and all 51 song destinations pass', () => {
  assert.deepEqual(checkTrustedLinks(copy()), {songs: 51});
});

test('another form on the same Google domain is rejected', () => {
  const input = copy();
  input.privacy = input.privacy.replace('https://forms.gle/Mmrmu9xTuYpot9Dz6', 'https://forms.gle/another-form');
  assert.throws(() => checkTrustedLinks(input), /お問い合わせフォーム/);
});

test('a lookalike YouTube hostname and another channel on YouTube are rejected', () => {
  for (const replacement of ['https://www.youtube.com.attacker.example/@TomaSource/streams', 'https://www.youtube.com/@another-channel/streams']) {
    const input = copy();
    input.notebook = input.notebook.replace('https://www.youtube.com/@TomaSource/streams', replacement);
    assert.throws(() => checkTrustedLinks(input), /公式配信チャンネル/);
  }
});

test('another product from the same shop and a changed Powered by destination are rejected', () => {
  const product = copy();
  product.notebook = product.notebook.replace('/items/166793310', '/items/123456');
  assert.throws(() => checkTrustedLinks(product), /商品ページ/);
  for (const page of ['index', 'privacy', 'notFound']) {
    const input = copy();
    input[page] = input[page].replaceAll('https://toma-oshikatsubu.pages.dev/', 'https://toma-oshikatsubu.pages.dev/another-path');
    assert.throws(() => checkTrustedLinks(input), /Powered by/);
  }
});

test('an extra unapproved artist link cannot hide beside an approved link', () => {
  const input = copy();
  input.app += '<a href="https://www.tunecore.co.jp/artists/another-artist">公式</a>';
  assert.throws(() => checkTrustedLinks(input), /承認済み/);
});

test('a different release or lyrics page on linkco.re is rejected', () => {
  const release = copy();
  release.songs[0].url = 'https://linkco.re/another-release?lang=ja';
  assert.throws(() => checkTrustedLinks(release), /公式配信・歌詞/);
  const lyrics = copy();
  lyrics.songs[0].lyricsUrl = lyrics.songs[1].lyricsUrl;
  assert.throws(() => checkTrustedLinks(lyrics), /公式配信・歌詞/);
});

test('duplicate song IDs and unchecked new songs cannot bypass the catalog snapshot', () => {
  const duplicate = copy();
  duplicate.songs[1] = {...duplicate.songs[0]};
  assert.throws(() => checkTrustedLinks(duplicate), /重複/);
  const unknown = copy();
  unknown.songs[0].id = 'song-9999999';
  assert.throws(() => checkTrustedLinks(unknown), /未確認/);
});
