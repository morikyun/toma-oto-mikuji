export const THEMES = {
  rest: { label: '自分に還る', phrase: 'ひと息、あなたに還る。', color: '#a9c7bd', roman: 'QUIET', glyph: 'moon' },
  courage: { label: '一歩を踏み出す', phrase: '小さな一歩に、光を。', color: '#d6b487', roman: 'COURAGE', glyph: 'sun' },
  release: { label: '心を解き放つ', phrase: '心のままに、ほどけて。', color: '#c4aac7', roman: 'RELEASE', glyph: 'bird' },
  connection: { label: 'つながりを感じる', phrase: 'あなたの音が、響きあう。', color: '#d4a5a1', roman: 'TOGETHER', glyph: 'flower' },
  discovery: { label: '新しい世界へ', phrase: 'まだ知らない、あなたへ。', color: '#a3becf', roman: 'DISCOVERY', glyph: 'star' },
  prayer: { label: '祈りをたどる', phrase: '静かな願いを、ひとつ。', color: '#c7c39d', roman: 'PRAYER', glyph: 'spark' }
};

export const QUESTIONS = [
  {
    title: '今のあなたは、どんな気分？', en: 'FEEL YOUR HEART', hint: '一番近いものを、直感で選んでみてください。', weight: 1,
    options: [
      { id: 'tired', label: 'ちょっと、ひと休みしたい', sub: '自分のペースを取り戻したい', icon: 'moon', weights: { rest: 3, prayer: 1 } },
      { id: 'unsettled', label: '気持ちが、ゆらいでいる', sub: '心の中をそっとほどきたい', icon: 'wave', weights: { release: 3, rest: 1 } },
      { id: 'gentle', label: '穏やかな気持ちでいる', sub: 'このやさしい時間を味わいたい', icon: 'flower', weights: { connection: 2, rest: 2, prayer: 1 } },
      { id: 'excited', label: 'なんだか、ワクワクする', sub: '新しい何かに出会いたい', icon: 'star', weights: { discovery: 3, courage: 2 } }
    ]
  },
  {
    title: '音楽に、何をもらいたい？', en: 'LISTEN TO YOUR WISH', hint: '今の心が求めているものは、どれでしょう。', weight: 1.8,
    options: [
      { id: 'hold', label: 'そっと、寄り添ってほしい', sub: 'そのままの自分でいられる時間', icon: 'moon', weights: { rest: 3, connection: 1 } },
      { id: 'push', label: '背中を、押してほしい', sub: '踏み出す勇気を、少しだけ', icon: 'sun', weights: { courage: 3, discovery: 1 } },
      { id: 'free', label: '思いきり、解き放ちたい', sub: 'ためていた気持ちを外へ', icon: 'bird', weights: { release: 3, courage: 1 } },
      { id: 'connect', label: 'つながりを、感じたい', sub: '誰かや、世界と響きあいたい', icon: 'flower', weights: { connection: 3, prayer: 1 } }
    ]
  },
  {
    title: '今、心を向けたいのは？', en: 'FOLLOW YOUR FEELING', hint: 'ふっと浮かぶ景色を、大切に。', weight: 1.2,
    options: [
      { id: 'self', label: '自分の、いちばん奥へ', sub: '本当の気持ちに耳をすませる', icon: 'moon', weights: { rest: 3, prayer: 2 } },
      { id: 'someone', label: '大切な、あの人へ', sub: '出会いとつながりを思い出す', icon: 'flower', weights: { connection: 3 } },
      { id: 'tomorrow', label: 'これからの、私へ', sub: 'まだ見ぬ明日に思いをはせる', icon: 'sun', weights: { courage: 2, discovery: 2 } },
      { id: 'world', label: '広い、広い世界へ', sub: 'いつもの景色から少し遠くへ', icon: 'star', weights: { discovery: 3, release: 1, prayer: 1 } }
    ]
  },
  {
    title: '心にとまる言葉を、ひとつ。', en: 'CHOOSE A LITTLE SIGN', hint: '理由はなくても大丈夫。今、惹かれるものを。', weight: 1,
    options: [
      { id: 'begin', label: 'はじまり', sub: '新しい扉をひらく', icon: 'sun', weights: { courage: 2, discovery: 3 } },
      { id: 'bond', label: 'つながり', sub: 'めぐりあう、響きあう', icon: 'flower', weights: { connection: 3 } },
      { id: 'pray', label: '祈り', sub: '見えないものを想う', icon: 'spark', weights: { prayer: 3, rest: 1 } },
      { id: 'open', label: '解き放つ', sub: '私のままで、自由に', icon: 'bird', weights: { release: 3, courage: 1 } }
    ]
  },
  {
    title: '最後は、どんな出会いにする？', en: 'LEAVE A LITTLE TO CHANCE', hint: 'あとは、ひと粒の偶然にまかせて。', weight: 0,
    options: [
      { id: 'close', label: '今の私に、ぴったりの一曲', sub: '選んだ気持ちを、大切に', icon: 'moon', pool: 3 },
      { id: 'adventure', label: '少し意外な、出会いも', sub: '心の扉を、もう少しひらいて', icon: 'star', pool: 5 },
      { id: 'fate', label: 'ご縁に、おまかせ', sub: '気持ちを手がかりに、広く出会う', icon: 'spark', pool: 8 }
    ]
  }
];

export const emptyAnswers = () => Array(QUESTIONS.length).fill(null);
export function normalizeAnswers(answers) {
  return QUESTIONS.map((q, i) => (i < 4 && answers?.[i] === 'any') || q.options.some(o => o.id === answers?.[i]) ? answers[i] : null);
}
export function getProfile(answers) {
  const scores = Object.fromEntries(Object.keys(THEMES).map(key => [key, 0]));
  QUESTIONS.forEach((q, i) => {
    const option = q.options.find(o => o.id === answers?.[i]);
    for (const [key, value] of Object.entries(option?.weights || {})) scores[key] += value * q.weight;
  });
  return scores;
}
export function rankSongs(songs, answers) {
  const profile = getProfile(answers);
  const keys = Object.keys(THEMES);
  const profileNorm = Math.hypot(...Object.values(profile));
  return songs.map(song => {
    const songNorm = Math.hypot(...keys.map(k => song.themes[k] || 0));
    const score = profileNorm && songNorm
      ? keys.reduce((sum, k) => sum + profile[k] * (song.themes[k] || 0), 0) / (profileNorm * songNorm)
      : 0;
    return { song, score };
  }).sort((a, b) => b.score - a.score || a.song.id.localeCompare(b.song.id));
}
export function getCandidates(songs, answers) {
  const mode = QUESTIONS[4].options.find(o => o.id === answers?.[4]) || QUESTIONS[4].options[1];
  const ranked = rankSongs(songs, answers);
  if (ranked.every(item => item.score === 0)) return ranked;
  // A narrow match keeps the same-sized draw pool without ever leaving an empty result.
  return ranked.slice(0, Math.min(mode.pool, ranked.length));
}
export function drawSong(songs, answers, previousId = null, random = Math.random) {
  let candidates = getCandidates(songs, answers);
  if (candidates.length > 1) candidates = candidates.filter(item => item.song.id !== previousId);
  if (!candidates.length) return null;
  const weights = candidates.map(item => 0.3 + item.score ** 2);
  let cursor = Math.min(0.999999999, Math.max(0, random())) * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    cursor -= weights[i];
    if (cursor < 0) return candidates[i].song;
  }
  return candidates.at(-1).song;
}
export function songTheme(song, answers = []) {
  const profile = getProfile(answers);
  return Object.keys(THEMES).sort((a, b) =>
    (song.themes[b] || 0) * (1 + profile[b]) - (song.themes[a] || 0) * (1 + profile[a])
  )[0];
}
export function songTags(song) {
  return Object.keys(THEMES).filter(k => song.themes[k] > 0)
    .sort((a, b) => song.themes[b] - song.themes[a]).slice(0, 2);
}
export function makeShareURL(base, songId, theme, keyword = null) {
  const url = new URL(base);
  const params = { song: songId, tone: theme };
  if (Number.isInteger(keyword) && keyword >= 0) params.kw = String(keyword);
  url.hash = new URLSearchParams(params).toString();
  url.search = '';
  return url.href;
}
