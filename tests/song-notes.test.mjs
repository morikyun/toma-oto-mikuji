import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeShareURL } from '../dist/engine.mjs';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const songs = read('../dist/songs.json');
const catalog = read('../research/catalog.json');
const noteFiles = fs.readdirSync(new URL('../dist/notes/', import.meta.url)).filter(name => name.endsWith('.json'));
const KINDS = new Set(['ブログ', 'YouTube', '新月・満月配信']);
const HOSTS = new Set(['ameblo.jp', 'www.youtube.com']);
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const assertSourceLink = (url) => {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'https:');
  assert.ok(HOSTS.has(parsed.hostname), `unexpected link host: ${url}`);
};

test('the published catalog is the editing catalog plus generated keywords and lyricists', () => {
  assert.equal(songs.length, catalog.length);
  songs.forEach((song, i) => {
    const { keywords, lyricist, ...rest } = song;
    assert.deepEqual(rest, catalog[i]);
    assert.ok(Array.isArray(keywords) && keywords.length >= 1 && keywords.length <= 5, `${song.title}: keywords`);
    assert.ok(keywords.every(word => typeof word === 'string' && word.trim() && word.length <= 20), `${song.title}: keyword text`);
    assert.equal(new Set(keywords).size, keywords.length);
    assert.ok(Array.isArray(lyricist) && lyricist.length >= 1 && lyricist.every(Boolean), `${song.title}: lyricist`);
  });
});

test('every song has one notes file whose keywords, commentary and links are usable', () => {
  assert.deepEqual(noteFiles.sort(), songs.map(song => `${song.id}.json`).sort());
  for (const song of songs) {
    const notes = read(`../dist/notes/${song.id}.json`);
    assert.equal(notes.id, song.id);
    assert.deepEqual(notes.keywords.map(k => k.word), song.keywords);
    assert.ok(notes.keywords.every(k => k.text && k.text.length > 10), `${song.title}: keyword notes`);
    assert.ok(notes.headline, `${song.title}: headline`);
    assert.ok(notes.overview.length >= 1 && notes.overview.every(p => typeof p === 'string' && p.trim()));
    for (const remark of notes.toma) {
      assert.ok(remark.text && remark.title && KINDS.has(remark.kind) && isDate(remark.date), `${song.title}: remark`);
      assertSourceLink(remark.url);
    }
    const dates = notes.mentions.map(m => m.date);
    assert.deepEqual(dates, [...dates].sort().reverse(), `${song.title}: mentions are newest first`);
    assert.equal(new Set(notes.mentions.map(m => m.url)).size, notes.mentions.length);
    for (const mention of notes.mentions) {
      assert.ok(mention.title && KINDS.has(mention.kind) && isDate(mention.date), `${song.title}: mention`);
      assertSourceLink(mention.url);
    }
  }
});

test('shared links carry the displayed keyword number only when there is one', () => {
  const base = 'https://example.pages.dev/?old=1#main';
  const params = (keyword) => new URLSearchParams(new URL(makeShareURL(base, songs[0].id, 'courage', keyword)).hash.slice(1));
  assert.equal(params(2).get('kw'), '2');
  assert.equal(params(0).get('kw'), '0');
  for (const keyword of [undefined, null, -1, 1.5, NaN, '2']) assert.equal(params(keyword).has('kw'), false);
  assert.equal(params(3).get('song'), songs[0].id);
  assert.equal(params(3).get('tone'), 'courage');
});
