import { THEMES, QUESTIONS, emptyAnswers, normalizeAnswers, drawSong, songTheme, songTags, makeShareURL } from './engine.mjs';
import { icon, arrow, machine, talisman, moonPhases } from './art.mjs';
import { renderNotebook } from './notebook.mjs';

const $ = (selector) => document.querySelector(selector);
const main = $('#main');
const modal = $('#modal');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const storage = {
  get(key, session = false) { try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; } },
  set(key, value, session = false) { try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* Private browsing still supports the full experience. */ } }
};
const STORE_KEY = 'toma-oto-session-v1';
let songs = [];
let state = { view: 'home', step: 0, answers: emptyAnswers(), resultId: null, theme: null, shared: false, kw: null };
let soundOn = storage.get('toma-oto-sound') === 'on';
let audioContext;
let audioTimers = [];
let spinTimer;
let spinning = false;
let pendingSong;
let toastTimer;
let focusBeforeModal;

function save() { storage.set(STORE_KEY, JSON.stringify(state), true); }
function isReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function setHash(value = '') { history.replaceState(null, '', `${location.pathname}${location.search}${value ? `#${value}` : ''}`); }
function focusHeading() { const heading = main.querySelector('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); }
function showView(markup, focus = true) {
  main.innerHTML = markup;
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus) focusHeading();
  save();
}
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3800);
}
function updateSoundButton() {
  const button = $('[data-action="sound"]');
  button.setAttribute('aria-pressed', String(soundOn));
  button.setAttribute('aria-label', `演出音を${soundOn ? 'オフ' : 'オン'}にする`);
  button.querySelector('.sound-label').textContent = `音 ${soundOn ? 'ON' : 'OFF'}`;
}
function chime(frequency = 660, duration = .5, volume = .025) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Sound is optional. */ }
}
function stopSpin() {
  clearTimeout(spinTimer);
  audioTimers.forEach(clearTimeout);
  audioTimers = [];
  spinning = false;
  pendingSong = null;
}
function startQuiz() {
  stopSpin();
  setHash();
  state = { view: 'quiz', step: 0, answers: emptyAnswers(), resultId: null, theme: null, shared: false, kw: null };
  renderQuiz();
}
function renderHome(focus = true) {
  state.view = 'home';
  setHash();
  document.title = 'とおまの音みくじ — いまのあなたに、響く一曲を。';
  const startButton = `<button class="button-primary" data-action="start">今日の一曲を探す ${arrow}</button><span class="hero-time"><span>✧</span> 5つの質問 · 約1分</span>`;
  showView(`<section class="hero view-enter">
    <div class="hero-copy"><span class="eyebrow">A SONG UNDER THE MOON</span><h1>いまのあなたに、<br><em>響く一曲</em>を。</h1><p class="hero-intro">月の光に、ひと息ついて。<br>心に、5つの小さな問いかけ。<br>とおまの音楽と出会う、小さな旅へ。</p><div class="hero-action">${startButton}</div></div>
    <div class="hero-art">${machine('home')}</div>
    <div class="mobile-hero-action">${startButton}</div>
  </section>
  <div class="steps" aria-label="音みくじの楽しみ方"><div class="step"><span class="step-number">01</span><div><strong>心にたずねる</strong><p>今の気分を、直感で選んで。</p></div></div><div class="step"><span class="step-number">02</span><div><strong>光をまわす</strong><p>ひと粒の偶然に、まかせて。</p></div></div><div class="step"><span class="step-number">03</span><div><strong>音に出会う</strong><p>今日の一曲を、聴いてみよう。</p></div></div></div>
  <p class="home-note">總水とおまとカミムスヒの ${songs.length} 曲から、今のあなたへ。<button data-action="catalog">収録曲をみる ↗</button></p>`, focus);
}
function renderQuiz() {
  state.view = 'quiz';
  const question = QUESTIONS[state.step];
  const selected = state.answers[state.step];
  const enabled = question.options.some(option => option.id === selected);
  showView(`<section class="quiz view-enter">
    <div class="quiz-top"><button class="text-button" data-action="back">${arrow}${state.step ? 'ひとつ前の問いへ' : 'はじめの画面へ'}</button><span class="quiz-count"><strong>${String(state.step + 1).padStart(2, '0')}</strong> / 05</span></div>
    <div class="progress-track" role="progressbar" aria-label="質問の進み具合" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${state.step + 1}">${QUESTIONS.map((_, i) => `<span class="${i < state.step ? 'done' : i === state.step ? 'current' : ''}"></span>`).join('')}</div>
    <div class="question-title"><span class="eyebrow">${question.en}</span><h1 id="question-title">${question.title}</h1><p>${question.hint}</p></div>
    <fieldset class="question-options ${question.options.length === 3 ? 'three-options' : ''}" aria-labelledby="question-title">${question.options.map(option => `<label class="option"><input type="radio" name="answer" value="${option.id}" ${selected === option.id ? 'checked' : ''}><span>${icon(option.icon)}</span><span><span class="option-label">${option.label}</span><span class="option-sub">${option.sub}</span></span><span class="option-check" aria-hidden="true"></span></label>`).join('')}</fieldset>
    <div class="quiz-bottom"><button class="skip-question" data-action="skip">${state.step === 4 ? '直感にまかせる' : '今は選ばず、次へ'}</button><button class="button-primary" data-action="next" ${enabled ? '' : 'disabled'}>${state.step === 4 ? '光のガラガラへ' : '次の問いへ'} ${arrow}</button></div>
    <p class="answered-summary">${state.step === 0 ? '正解はありません。今のあなたのままで。' : '選んだ言葉が、少しずつ音になっていく。'}</p>
  </section>`);
}
function nextQuestion(skip = false) {
  if (skip) state.answers[state.step] = state.step === 4 ? 'adventure' : 'any';
  if (!state.answers[state.step]) return;
  chime(420 + state.step * 70, .22, .012);
  if (state.step < 4) { state.step++; renderQuiz(); }
  else { renderDraw(); }
}
function renderDraw() {
  state.view = 'draw';
  setHash();
  showView(`<section class="draw-screen view-enter"><button class="text-button" data-action="edit-answers">${arrow}問いにもどる</button><span class="eyebrow">A LITTLE MOMENT OF CHANCE</span><h1>さあ、光をひとまわし。</h1><p class="draw-intro">あなたの言葉が、光になりました。<br>どんな一曲に、出会えるでしょう。</p><div class="draw-machine-wrap"><button class="machine-button" data-action="spin" aria-label="ハンドルを回して一曲を引く">${machine('draw')}</button></div><button class="button-primary" data-action="spin">光のガラガラをまわす ${arrow}</button><p class="draw-hint" id="draw-status" role="status">ハンドル、またはボタンを押してください。</p><button class="skip-spin" data-action="skip-spin" hidden>演出をスキップ</button></section>`);
}
function beginSpin() {
  if (spinning) return;
  pendingSong = drawSong(songs, state.answers, state.resultId || storage.get('toma-oto-last'));
  if (!pendingSong) { toast('曲が見つかりませんでした。もう一度お試しください。'); return; }
  spinning = true;
  const reduced = isReducedMotion();
  const duration = reduced ? 300 : 2900;
  $('.draw-screen').classList.add('is-spinning');
  document.querySelectorAll('[data-action="spin"]').forEach(el => { el.disabled = true; });
  $('[data-action="edit-answers"]').disabled = true;
  $('#draw-status').textContent = 'あなたへの一曲を、選んでいます…';
  $('[data-action="skip-spin"]').hidden = false;
  if (soundOn) {
    chime(540, .17, .012);
    for (let i = 1; i <= 7; i++) audioTimers.push(setTimeout(() => chime(540 + i * 75, .2, .014), i * 220));
  }
  spinTimer = setTimeout(finishSpin, duration);
}
function finishSpin() {
  if (!spinning || !pendingSong) return;
  const song = pendingSong;
  stopSpin();
  state.resultId = song.id;
  state.theme = songTheme(song, state.answers);
  state.shared = false;
  state.kw = null;
  storage.set('toma-oto-last', song.id);
  chime(880, 1.2, .03);
  renderResult();
}
function renderResult() {
  const song = songs.find(s => s.id === state.resultId);
  if (!song) return renderHome();
  state.view = 'result';
  const themeKey = THEMES[state.theme] && song.themes[state.theme] > 0 ? state.theme : songTheme(song, state.answers);
  state.theme = themeKey;
  const theme = THEMES[themeKey];
  const words = Array.isArray(song.keywords) ? song.keywords : [];
  if (!(Number.isInteger(state.kw) && state.kw >= 0 && state.kw < words.length)) state.kw = words.length ? Math.floor(Math.random() * words.length) : null;
  const pickWord = state.kw === null ? '' : words[state.kw];
  const resultHeading = pickWord
    ? `<h1 class="result-word"><span class="word-source">「${escape(song.title)}」の歌詞から</span><span class="word-line"><span class="word-quote">「</span>${escape(pickWord)}<span class="word-quote">」</span></span></h1><button class="word-jump" data-action="jump-keyword">このことばの解説へ <span aria-hidden="true">↓</span></button>`
    : `<h1>${theme.phrase}</h1>`;
  const deepSection = `<section class="song-deep" aria-labelledby="song-deep-heading"><span class="eyebrow">MORE ABOUT THIS SONG</span><h2 id="song-deep-heading">この曲を、もう少し深く。</h2><div class="song-deep-body" id="song-deep-body" aria-live="polite"><p class="song-deep-status">解説を読み込んでいます…</p></div></section>`;
  const shareURL = makeShareURL(location.href, song.id, themeKey, state.kw);
  setHash(new URL(shareURL).hash.slice(1));
  document.title = `${song.title} — とおまの音みくじ`;
  const desire = QUESTIONS[1].options.find(o => o.id === state.answers[1]);
  const keyword = QUESTIONS[3].options.find(o => o.id === state.answers[3]);
  const chosen = [desire?.label, keyword?.label].filter(Boolean);
  const reason = chosen.length
    ? `${chosen.map(t => `「${t}」`).join('、')}。選んだ気持ちを手がかりに、${theme.label}というテーマで出会った一曲です。`
    : `${theme.label}というテーマから、今日の一曲をお届けします。`;
  showView(`<section class="result-screen view-enter"><div class="result-top">${resultHeading}${moonPhases()}</div><div class="result-content">${talisman(theme, String(songs.indexOf(song) + 1).padStart(2, '0'))}<div class="song-copy"><p class="song-overline">${state.shared ? 'この音みくじで出会った一曲' : '今日、あなたに届いた一曲'}</p><h2 class="result-title">${escape(song.title)}</h2><p class="song-artist">${escape(song.artist)}</p><p class="song-album">${song.project !== song.artist ? `${escape(song.project)}<br>` : ''}『${escape(song.album)}』収録 · ${song.year}</p><div class="song-tags">${songTags(song).map(key => `<span>${THEMES[key].label}</span>`).join('')}</div><p class="song-description">${escape(song.description)}</p><a class="button-primary result-link" href="${escape(song.url)}" target="_blank" rel="noopener noreferrer">公式配信で聴く <span aria-hidden="true">↗</span></a><p class="listen-note">収録作品のページで、お好きな配信サービスを選べます。</p>${state.shared ? `<p class="shared-note">あなたの気分でも、一曲を探してみませんか。</p><button class="button-secondary shared-start" data-action="start">私の一曲を探す ${arrow}</button>` : `<div class="result-reason"><p class="reason-label">この曲と出会った理由</p><p>${escape(reason)}</p></div>`}</div></div><div class="result-actions">${!state.shared ? '<button class="button-secondary" data-action="redraw"><span aria-hidden="true">↻</span> もう一曲、出会う</button>' : ''}<button class="button-secondary" data-action="share">${icon('spark')} 結果をシェア</button></div><div class="result-restart"><button class="text-button" data-action="start">${arrow}気分を変えて、はじめから</button></div>${deepSection}</section>${renderNotebook()}`);
  void loadSongNotes(song);
}

const notesCache = new Map();
const safeURL = (value) => /^https:\/\//.test(value || '') ? escape(value) : '';
function renderSongNotes(song, notes) {
  const keywords = notes.keywords || [];
  const overview = notes.overview || [];
  const toma = notes.toma || [];
  const mentions = notes.mentions || [];
  const lyricist = (song.lyricist || []).join('・');
  const meta = (item) => `<span class="deep-meta">${escape(String(item.date || '').replaceAll('-', '.'))} · ${escape(item.kind)}</span>`;
  const source = (item) => item.url ? `<a href="${safeURL(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)} <span aria-hidden="true">↗</span></a>` : `<span>${escape(item.title)}</span>`;
  const summary = (en, title, count) => `<summary><span class="deep-summary-en">${en}</span><span class="deep-summary-title">${title}</span>${count ? `<span class="deep-count">${count}件</span>` : ''}</summary>`;
  const keyword = (k, i) => `<div id="kw-note-${i}" class="${i === state.kw ? 'is-picked' : ''}"><dt>「${escape(k.word)}」${i === state.kw ? '<span class="picked-badge">今回のことば</span>' : ''}</dt><dd>${escape(k.text)}</dd></div>`;
  let markup = '';
  if (notes.headline || overview.length || keywords.length) markup += `<details class="deep-item" open>${summary('LYRICS NOTE', '歌詞の解説')}<div class="deep-content">
    ${notes.headline ? `<p class="deep-lead">${escape(notes.headline)}</p>` : ''}${overview.map(p => `<p>${escape(p)}</p>`).join('')}
    ${keywords.length ? `<h3 class="deep-subheading">キーワード</h3><dl class="deep-keywords">${keywords.map(keyword).join('')}</dl>` : ''}
    <p class="deep-credit">${lyricist ? `<span>作詞：${escape(lyricist)}</span>` : ''}${song.lyricsUrl ? `<a href="${safeURL(song.lyricsUrl)}" target="_blank" rel="noopener noreferrer">公式の歌詞ページ <span aria-hidden="true">↗</span></a>` : ''}</p>
    <p class="deep-note">歌詞をもとにした、当サイトの読み解きです。</p></div></details>`;
  if (toma.length) markup += `<details class="deep-item">${summary('TOMA SAYS', 'とおまさんが語っていること', toma.length)}<div class="deep-content"><ul class="deep-list">${toma.map(t => `<li><p>${escape(t.text)}</p><p class="deep-source">${meta(t)}${source(t)}</p></li>`).join('')}</ul><p class="deep-note">ブログや配信の内容を、当サイトで要約しています。正確な言葉は、元の発信でご確認ください。</p></div></details>`;
  if (mentions.length) markup += `<details class="deep-item">${summary('ON AIR &amp; BLOG', 'この曲が出てくる発信', mentions.length)}<div class="deep-content"><ul class="deep-list deep-mentions">${mentions.map(m => `<li>${meta(m)}${source(m)}</li>`).join('')}</ul><p class="deep-note">曲名が書かれている・話されているブログと配信です。新しい順に並べています。</p></div></details>`;
  if (!toma.length && !mentions.length) markup += '<p class="deep-empty">この曲について話しているブログや配信は、<br>まだ見つかっていません。</p>';
  return markup;
}
async function loadSongNotes(song) {
  try {
    let notes = notesCache.get(song.id);
    if (!notes) {
      const response = await fetch(`./notes/${encodeURIComponent(song.id)}.json`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Song notes unavailable');
      notes = await response.json();
      notesCache.set(song.id, notes);
    }
    const body = $('#song-deep-body');
    if (body && state.view === 'result' && state.resultId === song.id) body.innerHTML = renderSongNotes(song, notes);
  } catch {
    const body = $('#song-deep-body');
    if (body && state.resultId === song.id) body.innerHTML = '<p class="song-deep-status">解説を読み込めませんでした。時間をおいて、もう一度お試しください。</p>';
  }
}
function jumpToKeyword() {
  const target = document.getElementById(`kw-note-${state.kw}`) || $('.song-deep');
  if (!target) return;
  target.closest('details')?.setAttribute('open', '');
  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
}
function openModal(content) {
  if (!modal.open) focusBeforeModal = document.activeElement;
  $('#modal-body').innerHTML = content;
  if (!modal.open) modal.showModal();
}
function closeModal() { if (modal.open) modal.close(); }
function showAbout() {
  openModal(`<span class="eyebrow">ABOUT THIS LITTLE JOURNEY</span><h2 class="modal-heading" id="modal-title">音との出会いに、<br>少しの偶然を。</h2><div class="modal-prose"><p>いつも聴いている曲にも、まだ知らない曲にも。<br>今のあなたの気持ちから、とおまさんの音楽に出会うための、小さな音みくじです。</p><div class="about-how"><span>心にたずねる<small>5つの問いに答える</small></span><span>光をまわす<small>ひと粒の偶然を楽しむ</small></span><span>音に出会う<small>公式配信で聴く</small></span></div><p>公式歌詞や作品紹介、ご本人の楽曲解説を手がかりに、それぞれの曲のテーマを読み解きました。回答に近い曲の中から、ひとつの音を選びます。「もう一曲」で、新しい出会いも楽しめます。</p><p>イシュタールの「誓い」「Connect a New World」「響新共命」、Shinshokuの「逆針」「松明」、カミムスヒの「ひかりむすび」「こころむすび」「あめむすび」の8作品、${songs.length}曲を収録しています。</p><p class="about-small">本サイトは總水とおまさんの音楽を紹介する非公式ファンサイトです。曲の紹介文とテーマ、結果画面の「歌詞の解説」は、制作側の解釈によるものです。「とおまさんが語っていること」は、ブログや配信の内容を当サイトで要約したものです。いずれも、ご本人の言葉そのもの・公式の推薦ではありません。</p><p class="about-small">回答はこのブラウザー内に保存されます。回答をサーバーへ送信することはありません。音のボタンで切り替えられるのは抽選の演出音です。</p><p><a href="https://www.tunecore.co.jp/artists/tomasource?lang=ja" target="_blank" rel="noopener noreferrer">總水とおま 公式配信一覧 ↗</a><br><a href="https://www.tunecore.co.jp/artists/kamimusuhi" target="_blank" rel="noopener noreferrer">カミムスヒ 公式配信一覧 ↗</a></p></div>`);
}
function showCatalog() {
  openModal(`<span class="eyebrow">THE SONG COLLECTION</span><h2 class="modal-heading" id="modal-title">まだ出会っていない音へ。</h2><p class="modal-prose">気になる一曲から、聴いてみるのも。</p><div class="catalog-tools"><input class="search-input" id="song-search" type="search" placeholder="曲名・作品名で探す" aria-label="曲名・作品名で探す" autocomplete="off"><select class="catalog-filter" id="song-filter" aria-label="テーマで絞り込む"><option value="all">すべてのテーマ</option>${Object.entries(THEMES).map(([key, theme]) => `<option value="${key}">${theme.label}</option>`).join('')}</select></div><p class="catalog-count" id="catalog-count" role="status"></p><div class="catalog-list" id="catalog-list"></div>`);
  updateCatalog();
}
function updateCatalog() {
  const query = ($('#song-search')?.value || '').normalize('NFKC').trim().toLowerCase();
  const filter = $('#song-filter')?.value || 'all';
  const visible = songs.filter(song => `${song.title} ${song.album} ${song.project}`.normalize('NFKC').toLowerCase().includes(query) && (filter === 'all' || song.themes[filter] >= 2));
  $('#catalog-count').textContent = `${visible.length} 曲 / 全 ${songs.length} 曲`;
  $('#catalog-list').innerHTML = visible.length ? visible.map(song => `<article class="catalog-item">${icon(THEMES[songTheme(song)].glyph)}<div><h3 class="catalog-title">${escape(song.title)}</h3><p class="catalog-album">${escape(song.project)}<br>『${escape(song.album)}』 · ${song.year}</p></div><a href="${escape(song.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(song.title)}の収録作品を公式配信で聴く">聴く ↗</a></article>`).join('') : '<p class="catalog-empty">見つかりませんでした。<br>別の言葉やテーマで探してみてください。</p>';
}
function showShare() {
  const song = songs.find(s => s.id === state.resultId);
  if (!song) return;
  const url = makeShareURL(location.href, song.id, state.theme, state.kw);
  openModal(`<span class="eyebrow">PASS THE MUSIC ON</span><h2 class="modal-heading" id="modal-title">出会った音を、<br>おすそわけ。</h2><p class="modal-prose">カードを保存したり、リンクを送ったり。<br>今日の一曲を、大切な人にも。</p><div class="share-preview"><h3>${escape(song.title)}</h3><p>${escape(song.artist)} · とおまの音みくじ</p></div><div class="share-actions"><button class="button-primary" data-action="copy-link">リンクをコピー ${arrow}</button><button class="button-secondary" data-action="save-card">カード画像を保存 <span aria-hidden="true">↓</span></button></div><input class="share-url" aria-label="この一曲の共有リンク" value="${escape(url)}" readonly><p class="listen-note">リンクを開くと、同じ一曲が表示されます。</p>`);
}
async function copyLink() {
  const input = $('.share-url');
  if (!input) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(input.value);
    $('[data-action="copy-link"]').textContent = 'コピーしました ✓';
    toast('この一曲へのリンクをコピーしました。');
  } catch {
    input.focus();
    input.select();
    toast('リンクを選択しました。コピーしてお使いください。');
  }
}
function wrapText(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const char of text) {
    if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  return lines;
}
async function saveCard() {
  const song = songs.find(s => s.id === state.resultId);
  if (!song) return;
  const button = $('[data-action="save-card"]');
  button.disabled = true;
  button.textContent = 'カードを用意しています…';
  try {
    await document.fonts.ready;
    const theme = THEMES[state.theme];
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101e27';
    ctx.fillRect(0, 0, 1200, 1500);
    const glow = ctx.createRadialGradient(600, 500, 0, 600, 500, 570);
    glow.addColorStop(0, theme.color + '28');
    glow.addColorStop(1, '#101e2700');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 1500);
    ctx.strokeStyle = '#bdab7b';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 1100, 1400);
    ctx.strokeStyle = '#bdab7b55';
    ctx.strokeRect(67, 67, 1066, 1366);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ccba8e';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('T O M A  ·  S O U N D  F O R T U N E', 600, 150);
    for (let i = 0; i < 45; i++) {
      const x = 130 + (i * 229 % 950);
      const y = 205 + (i * 167 % 1030);
      ctx.globalAlpha = .15 + (i % 4) * .08;
      ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 3 : 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.color + '80';
    for (const radius of [190, 210]) { ctx.beginPath(); ctx.arc(600, 430, radius, 0, Math.PI * 2); ctx.stroke(); }
    ctx.save(); ctx.translate(600, 430); ctx.rotate(Math.PI / 4); ctx.strokeStyle = theme.color + '55'; ctx.strokeRect(-130, -130, 260, 260); ctx.restore();
    const svg = icon(theme.glyph).replace('class="line-icon "', 'xmlns="http://www.w3.org/2000/svg" width="180" height="180"').replace('currentColor', theme.color);
    const svgURL = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image(); image.src = svgURL; await image.decode(); ctx.drawImage(image, 510, 340, 180, 180);
    } finally { URL.revokeObjectURL(svgURL); }
    ctx.font = '25px Georgia, serif'; ctx.fillStyle = theme.color; ctx.fillText(theme.roman, 600, 715);
    ctx.font = '29px "Hiragino Mincho ProN", "Yu Mincho", serif'; ctx.fillStyle = '#eee9da'; ctx.fillText(theme.phrase, 600, 790);
    let size = 64;
    ctx.font = `${size}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
    let lines = wrapText(ctx, song.title, 960);
    while (lines.length > 2 && size > 40) { size -= 4; ctx.font = `${size}px "Hiragino Mincho ProN", "Yu Mincho", serif`; lines = wrapText(ctx, song.title, 960); }
    lines.forEach((line, i) => ctx.fillText(line, 600, 925 + i * (size + 30)));
    const titleEnd = 925 + (lines.length - 1) * (size + 30);
    ctx.font = '27px "Hiragino Mincho ProN", "Yu Mincho", serif'; ctx.fillStyle = '#bfcac3'; ctx.fillText(song.artist, 600, titleEnd + 66);
    ctx.font = '22px "Hiragino Kaku Gothic ProN", sans-serif'; ctx.fillStyle = '#94a7a7'; ctx.fillText(`『${song.album}』収録`, 600, titleEnd + 117);
    ctx.strokeStyle = '#bdab7b50'; ctx.beginPath(); ctx.moveTo(420, 1220); ctx.lineTo(780, 1220); ctx.stroke();
    ctx.font = '30px "Hiragino Mincho ProN", "Yu Mincho", serif'; ctx.fillStyle = '#dfd3b5'; ctx.fillText('とおまの音みくじ', 600, 1295);
    ctx.font = '19px "Hiragino Kaku Gothic ProN", sans-serif'; ctx.fillStyle = '#95a6a6'; ctx.fillText(location.hostname.includes('localhost') || location.hostname === '127.0.0.1' ? 'いまのあなたに、響く一曲を。' : location.hostname, 600, 1350);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Card export failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `とおまの音みくじ-${song.title}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    toast('カード画像を保存しました。');
  } catch { toast('画像を保存できませんでした。リンクのコピーをお使いください。'); }
  finally { button.disabled = false; button.textContent = 'カード画像を保存 ↓'; }
}

document.addEventListener('click', event => {
  const brand = event.target.closest('.brand');
  if (brand) { event.preventDefault(); stopSpin(); renderHome(); return; }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  switch (button.dataset.action) {
    case 'start': closeModal(); startQuiz(); break;
    case 'back': state.step > 0 ? (state.step--, renderQuiz()) : renderHome(); break;
    case 'next': nextQuestion(); break;
    case 'skip': nextQuestion(true); break;
    case 'edit-answers': state.step = 4; renderQuiz(); break;
    case 'spin': beginSpin(); break;
    case 'skip-spin': finishSpin(); break;
    case 'redraw': renderDraw(); beginSpin(); break;
    case 'about': showAbout(); break;
    case 'catalog': showCatalog(); break;
    case 'close-modal': closeModal(); break;
    case 'share': showShare(); break;
    case 'jump-keyword': jumpToKeyword(); break;
    case 'copy-link': void copyLink(); break;
    case 'save-card': void saveCard(); break;
    case 'retry': location.reload(); break;
    case 'sound': soundOn = !soundOn; storage.set('toma-oto-sound', soundOn ? 'on' : 'off'); updateSoundButton(); if (soundOn) chime(660, .3); break;
  }
});
document.addEventListener('change', event => {
  if (event.target.matches('input[name="answer"]')) {
    state.answers[state.step] = event.target.value;
    $('[data-action="next"]').disabled = false;
    save();
  }
  if (event.target.id === 'song-filter') updateCatalog();
});
document.addEventListener('input', event => { if (event.target.id === 'song-search') updateCatalog(); });
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
modal.addEventListener('close', () => { if (focusBeforeModal?.isConnected) focusBeforeModal.focus({ preventScroll: true }); });
window.addEventListener('hashchange', () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  const song = songs.find(s => s.id === hash.get('song'));
  if (song) { stopSpin(); state.resultId = song.id; state.theme = hash.get('tone'); state.kw = Number.parseInt(hash.get('kw'), 10); state.shared = true; state.answers = emptyAnswers(); renderResult(); }
  else if (!location.hash) renderHome();
});

async function init() {
  updateSoundButton();
  try {
    const response = await fetch('./songs.json', { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Song catalog unavailable');
    const catalog = await response.json();
    if (!Array.isArray(catalog) || !catalog.length) throw new Error('Empty catalog');
    songs = catalog;
    try {
      const cached = JSON.parse(storage.get(STORE_KEY, true));
      if (cached && ['home', 'quiz', 'draw', 'result'].includes(cached.view)) {
        state = { ...state, ...cached, answers: normalizeAnswers(cached.answers), step: Math.min(4, Math.max(0, Number(cached.step) || 0)) };
      }
    } catch { /* Start a fresh session if browser state is invalid. */ }
    const params = new URLSearchParams(location.hash.slice(1));
    const sharedSong = songs.find(song => song.id === params.get('song'));
    if (sharedSong) {
      if (state.resultId !== sharedSong.id) { state.shared = true; state.answers = emptyAnswers(); state.kw = null; }
      const sharedKeyword = Number.parseInt(params.get('kw'), 10);
      if (Number.isInteger(sharedKeyword)) state.kw = sharedKeyword;
      state.resultId = sharedSong.id;
      state.theme = params.get('tone');
      renderResult();
    } else if (state.view === 'quiz') renderQuiz();
    else if (state.view === 'draw') renderDraw();
    else if (state.view === 'result' && state.resultId) renderResult();
    else renderHome(false);
  } catch {
    main.innerHTML = `<section class="loading-screen"><span class="eyebrow">A LITTLE PAUSE</span><h1>音の準備が、うまくできませんでした。</h1><p>通信環境を確認して、もう一度お試しください。</p><button class="button-primary" data-action="retry">もう一度読み込む ${arrow}</button><a class="text-button" href="https://www.tunecore.co.jp/artists/tomasource?lang=ja" target="_blank" rel="noopener noreferrer">公式配信一覧を開く ↗</a></section>`;
  }
}
void init();
