import { moonPhases } from './art.mjs';

export const NOTEBOOK = {
  title: '月の光が思い出させる 私の力 MOONLIGHT MEMORY 2027',
  url: 'https://pienipisara2.thebase.in/items/166793310',
  image: '/assets/moonlight-memory-2027.png',
  supervisor: '總水とおま',
  seller: '總水とおまオフィシャル オンラインショップ「PieniPisara」'
};

export const MOON_STREAMS = {
  url: 'https://www.youtube.com/@TomaSource/streams'
};

export function renderNotebook() {
  return `<aside class="notebook-section notebook-result" aria-label="總水とおまさんの配信とノートのご案内">
    <section class="notebook-transition moon-streams" aria-labelledby="moon-streams-heading">${moonPhases()}
      <span class="eyebrow">TOMA'S MOON LIVE</span>
      <p class="moon-streams-intro">この一曲で、とおまさんが気になったら。</p>
      <h2 id="moon-streams-heading">次は、新月・満月の配信で。</h2>
      <p class="notebook-transition-note">新月と満月、約2週間に一度。<br>總水とおまさんの配信を、<br class="moon-streams-mobile-break">YouTubeで楽しんでみませんか。</p>
      <a class="button-primary moon-streams-link" href="${MOON_STREAMS.url}" target="_blank" rel="noopener noreferrer" aria-label="新月・満月配信をYouTubeで見る（別タブ）">新月・満月配信をYouTubeで見る <span aria-hidden="true">↗</span></a>
      <p class="moon-streams-channel">總水とおま 公式チャンネルの「ライブ」へ</p>
    </section>
    <section aria-labelledby="notebook-heading-result">
      <div class="notebook-companion">
        <h2 id="notebook-heading-result">配信のおともに、願い事ノートを。</h2>
        <p>配信で心に残った言葉を、あなたの日々へ。</p>
      </div>
    <div class="notebook-promo">
      <a class="notebook-cover" href="${NOTEBOOK.url}" target="_blank" rel="noopener noreferrer" aria-label="${NOTEBOOK.title}の商品ページを公式オンラインショップで見る（別タブ）"><img src="${NOTEBOOK.image}" width="864" height="1080" loading="lazy" decoding="async" alt="月と星空を描いた『月の光が思い出させる 私の力 MOONLIGHT MEMORY 2027』の表紙イメージ"></a>
      <div class="notebook-copy">
        <p class="notebook-supervisor">總水とおま 監修 <span>新月・満月の願い事ノート</span></p>
        <h3>月の光が思い出させる<br>私の力</h3>
        <p class="notebook-name">MOONLIGHT MEMORY <span>2027</span></p>
        <p class="notebook-description">新月・満月の配信を楽しみながら、<br>自分の願いと、そのあと動いたことを書き留める。<br>月のめぐりとともに、自分の歩みを綴る一冊です。</p>
        <a class="button-secondary notebook-link" href="${NOTEBOOK.url}" target="_blank" rel="noopener noreferrer">公式オンラインショップで見る <span aria-hidden="true">↗</span></a>
        <p class="notebook-seller">取り扱い：${NOTEBOOK.seller}</p>
      </div>
    </div>
    </section>
  </aside>`;
}
