import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { THEMES, QUESTIONS, normalizeAnswers, getProfile, getCandidates, drawSong, songTheme, makeShareURL } from '../dist/engine.mjs';

const songs = JSON.parse(fs.readFileSync(new URL('../dist/songs.json', import.meta.url), 'utf8'));
const keys = Object.keys(THEMES).sort();
let allAnswers = [[]];
for (const question of QUESTIONS) allAnswers = allAnswers.flatMap(answers => question.options.map(option => [...answers, option.id]));

test('the published catalog contains unique songs with usable official links and six valid themes', () => {
  assert.equal(songs.length, 51);
  assert.equal(new Set(songs.map(song => song.id)).size, songs.length);
  const albums = Object.fromEntries([...new Set(songs.map(song => song.album))].map(album => [album, songs.filter(song => song.album === album).length]));
  assert.deepEqual(albums, {
    '響新共命': 9, 'Connect a New World': 8, '松明': 8, '逆針': 4,
    'ひかりむすび': 5, 'こころむすび': 6, 'あめむすび': 6, '誓い': 5
  });
  for (const song of songs) {
    assert.ok(song.title && song.artist && song.description && song.album);
    assert.equal(new URL(song.url).hostname, 'linkco.re');
    if (song.lyricsUrl) assert.equal(new URL(song.lyricsUrl).hostname, 'linkco.re');
    else assert.equal(song.album, '誓い');
    assert.deepEqual(Object.keys(song.themes).sort(), keys);
    assert.ok(Object.values(song.themes).every(value => Number.isInteger(value) && value >= 0 && value <= 3));
    assert.ok(Object.values(song.themes).some(value => value > 0));
    assert.ok(song.evidence.length > 0);
    assert.ok(song.evidence.every(source => new URL(source.url).protocol === 'https:' && source.note));
  }
});

test('all 768 answer combinations draw from the intended candidate set, avoid the previous song and reach every song', () => {
  assert.equal(allAnswers.length, 768);
  const reachable = new Set();
  for (const answers of allAnswers) {
    const candidates = getCandidates(songs, answers);
    const pool = QUESTIONS[4].options.find(option => option.id === answers[4]).pool;
    assert.equal(candidates.length, pool);
    for (const candidate of candidates) reachable.add(candidate.song.id);
    for (const random of [0, .2, .5, .8, .9999999]) {
      const drawn = drawSong(songs, answers, null, () => random);
      assert.ok(candidates.some(candidate => candidate.song.id === drawn.id));
      assert.notEqual(drawSong(songs, answers, drawn.id, () => random).id, drawn.id);
      assert.ok(drawn.themes[songTheme(drawn, answers)] > 0);
    }
  }
  assert.equal(reachable.size, songs.length);
});

test('answer meaning changes the selection toward its strongest theme', () => {
  const rest = ['tired', 'hold', 'self', 'pray', 'close'];
  const courage = ['excited', 'push', 'tomorrow', 'begin', 'close'];
  assert.ok(getProfile(rest).rest > getProfile(rest).courage);
  assert.ok(getCandidates(songs, rest).every(item => item.song.themes.rest >= 2));
  assert.ok(getCandidates(songs, courage).every(item => item.song.themes.courage >= 2));
  assert.notDeepEqual(getCandidates(songs, rest).map(item => item.song.id), getCandidates(songs, courage).map(item => item.song.id));
});

test('skipping questions preserves the skipped state and gives every song a chance if all are skipped', () => {
  const skipped = ['any', 'any', 'any', 'any', 'adventure'];
  assert.deepEqual(normalizeAnswers(skipped), skipped);
  assert.equal(getCandidates(songs, skipped).length, songs.length);
  assert.deepEqual(normalizeAnswers(['invalid', 'hold', null, 'pray', 'invalid']), [null, 'hold', null, 'pray', null]);
  assert.equal(drawSong([], skipped), null);
  assert.equal(drawSong([songs[0]], skipped, songs[0].id).id, songs[0].id);
});

test('shared links identify a fixed song without including the answers or query parameters', () => {
  const url = new URL(makeShareURL('https://example.netlify.app/?old=1#main', songs[0].id, 'courage'));
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('song'), songs[0].id);
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('tone'), 'courage');
  assert.ok(!url.href.includes('answers'));
});
