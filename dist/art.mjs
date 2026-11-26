const shape = {
  moon: '<path d="M30 7A18 18 0 1 0 41 34 17 17 0 0 1 30 7Z"/><path d="m37 10 1.5 4.5L43 16l-4.5 1.5L37 22l-1.5-4.5L31 16l4.5-1.5Z"/>',
  sun: '<circle cx="24" cy="24" r="9"/><path d="M24 3v7m0 28v7M3 24h7m28 0h7M9 9l5 5m20 20 5 5M9 39l5-5m20-20 5-5"/>',
  wave: '<path d="M5 17c9-12 15 12 24 0 6-8 10-4 14 0M5 26c9-12 15 12 24 0 6-8 10-4 14 0M5 35c9-12 15 12 24 0 6-8 10-4 14 0"/>',
  star: '<path d="m24 3 4.5 16.5L45 24l-16.5 4.5L24 45l-4.5-16.5L3 24l16.5-4.5Z"/><circle cx="24" cy="24" r="4"/>',
  spark: '<path d="m24 5 4 15 15 4-15 4-4 15-4-15-15-4 15-4Z"/><path d="M8 5v6m-3-3h6m29 29v6m-3-3h6"/><circle cx="24" cy="24" r="1"/>',
  bird: '<path d="M5 32c9-1 12-9 15-15 0 10 6 15 15 13l8-13-13 7c-5-9-13-13-23-12l9 8M20 30l-5 10 11-6"/>',
  flower: '<path d="M24 24C3-3 45-3 24 24Zm0 0C-8 20 11-10 24 24Zm0 0C-10 33-7 7 24 24Zm0 0C4 55-8 26 24 24Zm0 0C45 51 3 51 24 24Zm0 0C56 28 37 58 24 24Zm0 0C58 15 55 41 24 24Zm0 0C44-7 56 22 24 24Z"/><circle cx="24" cy="24" r="3"/>'
};
export function icon(name, className = '') {
  return `<svg class="line-icon ${className}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape[name] || shape.star}</svg>`;
}
export const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
export function moonPhases() {
  const waxing = '<path d="M0-6A6 6 0 0 1 0 6A3.8 6 0 0 0 0-6Z" fill="currentColor"/>';
  const half = '<path d="M0-6A6 6 0 0 1 0 6Z" fill="currentColor"/>';
  return `<svg class="moon-phases" viewBox="0 0 220 20" fill="none" aria-hidden="true">${[17,48,79,110,141,172,203].map((x,i) => `<g transform="translate(${x} 10)"><circle r="${i === 3 ? 7 : 6}" stroke="currentColor" stroke-width=".7" opacity="${i === 0 || i === 6 ? '.5' : '.85'}" ${i === 3 ? 'fill="currentColor"' : ''}/>${i === 1 ? waxing : i === 2 ? half : i === 4 ? `<g transform="scale(-1 1)">${half}</g>` : i === 5 ? `<g transform="scale(-1 1)">${waxing}</g>` : ''}</g>${i < 6 ? `<path d="M${x+11} 10h9" stroke="currentColor" stroke-width=".5" opacity=".35"/>` : ''}`).join('')}</svg>`;
}
export function machine(suffix = 'hero') {
  const particles = Array.from({ length: 36 }, (_, i) => {
    const a = i * 2.399963;
    const r = 21 + Math.sqrt(i / 36) * 125;
    const x = 290 + Math.cos(a) * r;
    const y = 251 + Math.sin(a) * r;
    const size = i % 5 === 0 ? 5 : 2 + (i % 3);
    const color = ['#f2dcaa', '#a8c9d6', '#b6cfb2', '#ddc1b6'][i % 4];
    return `<circle class="mote" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${size}" fill="${color}" style="--delay:${(i % 7) * -.6}s"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${size * 3}" fill="${color}" opacity=".055"/>`;
  }).join('');
  return `<svg class="fortune-machine" viewBox="0 0 620 600" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="brass-${suffix}" x1="140" y1="140" x2="490" y2="490" gradientUnits="userSpaceOnUse"><stop stop-color="#9a8963"/><stop offset=".25" stop-color="#ede0b6"/><stop offset=".45" stop-color="#a18c5d"/><stop offset=".64" stop-color="#dfc99a"/><stop offset="1" stop-color="#74613c"/></linearGradient>
      <radialGradient id="glass-${suffix}" cx=".34" cy=".3" r=".8"><stop stop-color="#34515b" stop-opacity=".65"/><stop offset=".55" stop-color="#152f3a" stop-opacity=".85"/><stop offset="1" stop-color="#0a1a23"/></radialGradient>
      <radialGradient id="halo-${suffix}"><stop stop-color="#ad9860" stop-opacity=".18"/><stop offset=".6" stop-color="#8b8963" stop-opacity=".06"/><stop offset="1" stop-color="#a89060" stop-opacity="0"/></radialGradient>
      <linearGradient id="stand-${suffix}" x1="190" y1="420" x2="380" y2="540" gradientUnits="userSpaceOnUse"><stop stop-color="#263a40"/><stop offset=".45" stop-color="#16272f"/><stop offset="1" stop-color="#0d1c25"/></linearGradient>
      <linearGradient id="shine-${suffix}" x1="180" y1="140" x2="400" y2="350" gradientUnits="userSpaceOnUse"><stop stop-color="#f4e3b7" stop-opacity=".45"/><stop offset=".4" stop-color="#f4e3b7" stop-opacity="0"/><stop offset="1" stop-color="#f4e3b7" stop-opacity=".1"/></linearGradient>
      <filter id="glow-${suffix}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="290" cy="522" rx="184" ry="25" fill="#02090c" opacity=".35"/>
    <circle cx="290" cy="265" r="268" fill="url(#halo-${suffix})"/>
    <g class="orbit-lines" stroke="#c0ad7b" opacity=".23"><circle cx="290" cy="251" r="213" stroke-dasharray="1 10"/><path d="M79 251a211 211 0 0 1 211-211m0 422a211 211 0 0 0 211-211"/><path d="M290 29v20M68 251h20m404 0h20"/></g>
    <g fill="#c8b27f"><path d="m112 94 2 8 8 2-8 2-2 8-2-8-8-2 8-2Z"/><circle cx="102" cy="376" r="2"/><circle cx="434" cy="65" r="1.5"/><circle cx="527" cy="334" r="2"/></g>
    <g class="machine-moon" transform="translate(455 96)"><path d="M30 7A18 18 0 1 0 41 34 17 17 0 0 1 30 7Z" fill="url(#brass-${suffix})" opacity=".9"/><path d="m42 8 1.5 5.5L49 15l-5.5 1.5L42 22l-1.5-5.5L35 15l5.5-1.5Z" fill="#d8c897"/></g>
    <path d="M195 396h190l19 112H176Z" fill="url(#stand-${suffix})" stroke="#8d7b54"/>
    <path d="m207 408-14 88m180-88 14 88" stroke="#ccb482" stroke-opacity=".35"/>
    <path d="M183 500h215a8 8 0 0 1 8 8v13H175v-13a8 8 0 0 1 8-8Z" fill="#14242d" stroke="url(#brass-${suffix})"/>
    <path d="M164 521h252v10H164Z" fill="url(#brass-${suffix})"/>
    <path d="M184 255h-31v160m244-160h31v160" stroke="url(#brass-${suffix})" stroke-width="9"/>
    <path d="M428 255h57" stroke="url(#brass-${suffix})" stroke-width="8"/>
    <g class="crank"><path d="M480 255v65h35" stroke="url(#brass-${suffix})" stroke-width="8" stroke-linecap="round"/><rect x="504" y="303" width="38" height="33" rx="14" fill="#293b40" stroke="url(#brass-${suffix})"/><path d="M513 306v26m8-26v26m8-26v26" stroke="#bca77a" stroke-opacity=".3"/></g>
    <circle cx="290" cy="251" r="166" fill="#0d202a" stroke="url(#brass-${suffix})" stroke-width="8"/>
    <circle cx="290" cy="251" r="157" fill="url(#glass-${suffix})" stroke="#b29c69" stroke-opacity=".7"/>
    <g class="drum">
      <path d="m290 89 114.5 47.5L452 251l-47.5 114.5L290 413l-114.5-47.5L128 251l47.5-114.5Z" stroke="url(#brass-${suffix})" stroke-width="3"/>
      <ellipse cx="290" cy="251" rx="77" ry="161" stroke="#c2ac7d" stroke-opacity=".35"/>
      <ellipse cx="290" cy="251" rx="133" ry="161" stroke="#c2ac7d" stroke-opacity=".23"/>
      <path d="M137 205q153 40 306 0M137 297q153-40 306 0M290 90v322" stroke="#c2ac7d" stroke-opacity=".23"/>
      ${particles}
      <circle cx="290" cy="251" r="144" fill="url(#shine-${suffix})"/>
      <circle cx="290" cy="251" r="155" stroke="#e9d7aa" stroke-opacity=".4"/>
    </g>
    <g class="orb-core"><circle cx="290" cy="251" r="30" fill="#e9d7a7" opacity=".14" filter="url(#glow-${suffix})"/><path d="m290 218 6 27 27 6-27 6-6 27-6-27-27-6 27-6Z" fill="#f2e4bf"/><circle cx="290" cy="251" r="5" fill="#fff9e9"/></g>
    <path d="M188 155a140 140 0 0 1 110-45" stroke="#fff5d8" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>
    <rect x="263" y="432" width="54" height="18" rx="9" fill="#09171e" stroke="#ad9565"/>
    <g class="prize-ball"><circle cx="290" cy="441" r="13" fill="#d9c092"/><circle cx="287" cy="437" r="5" fill="#f8e9c7"/><circle cx="290" cy="441" r="22" fill="#e3c89a" opacity=".3" filter="url(#glow-${suffix})"/></g>
    <path d="M247 475h86l-8 14h-70Z" fill="#14262e" stroke="#b49c6d"/>
    <text x="290" y="555" text-anchor="middle" fill="#bca77a" font-family="Georgia,serif" font-size="10" letter-spacing="5">A LITTLE MOMENT OF CHANCE</text>
  </svg>`;
}
export function talisman(theme, index = '01') {
  return `<div class="talisman" style="--card-accent:${theme.color}"><div class="talisman-frame"><span class="talisman-top">TOMA · SOUND FORTUNE</span><div class="talisman-orbit"><span class="talisman-star star-a">✦</span><span class="talisman-star star-b">✧</span><span class="talisman-star star-c">·</span>${icon(theme.glyph)}</div><span class="talisman-word">${theme.roman}</span><span class="talisman-number">NO. ${index}</span></div></div>`;
}
