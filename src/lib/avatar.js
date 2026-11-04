// Draws a cartoon avatar as an SVG string. The same name always gives the same face.

const SKIN = ['#F6C9A3', '#E9B48A', '#C98E63', '#8D5A3C', '#F2D1B3']
const HAIR = ['#2A1D1A', '#4A2E1F', '#161616', '#8B5A2B', '#C9A24A', '#6B6B76']
const BGS = ['#FFC83D', '#8EE3C2', '#FFB3C1', '#A9B6FF', '#FFD6A5', '#B8E0FF']
const SHIRT = ['#2B2F55', '#E5506E', '#5468FF', '#2DBB8B', '#14163A', '#F2B53C']

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function avatar(seed) {
  const h = hash(String(seed || 'you').toLowerCase())
  const pick = (arr, n) => arr[(h >>> (n * 4)) % arr.length]
  const skin = pick(SKIN, 0), hair = pick(HAIR, 1), bg = pick(BGS, 2), shirt = pick(SHIRT, 3)
  const style = (h >>> 16) % 3
  const glasses = ((h >>> 19) & 1) === 1

  let back = '', front = ''
  if (style === 0) {
    front = `<path d="M18.5 25c-1-9 5-15 14-15 9 0 14.5 6 13 15-2-4-4-6.5-7-7.5-5 2-12 2-16 .5-2 1.5-3.5 4-4 7z" fill="${hair}"/>`
  } else if (style === 1) {
    back = `<path d="M16 31c-1.5-14 5-22 16-22s17.5 8 16 22v15h-7V31H23v15h-7z" fill="${hair}"/>`
    front = `<path d="M19 25c1-8 7-11.5 13-11.5S44 17 45 25c-4-3.5-9-5.5-13-5.5S23 21.5 19 25z" fill="${hair}"/>`
  } else {
    back = `<circle cx="32" cy="17" r="14" fill="${hair}"/><circle cx="20" cy="22" r="6" fill="${hair}"/><circle cx="44" cy="22" r="6" fill="${hair}"/>`
    front = `<path d="M20 24c2-6 7-8 12-8s10 2 12 8c-4-2.5-8-3.5-12-3.5S24 21.5 20 24z" fill="${hair}"/>`
  }
  const specs = glasses
    ? `<g fill="none" stroke="#2A1D1A" stroke-width="1.5"><rect x="22" y="25" width="8.5" height="6.5" rx="3"/><rect x="33.5" y="25" width="8.5" height="6.5" rx="3"/><path d="M30.5 28h3"/></g>`
    : ''

  return `<svg class="av" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/>${back}`
    + `<path d="M8 64c2-13 12-19 24-19s22 6 24 19z" fill="${shirt}"/><rect x="27" y="36" width="10" height="11" rx="4" fill="${skin}"/>`
    + `<path d="M27 44.5l5 5 5-5z" fill="#fff" opacity=".9"/>`
    + `<ellipse cx="32" cy="27" rx="13" ry="14.5" fill="${skin}"/><ellipse cx="19.2" cy="28" rx="2.4" ry="3.4" fill="${skin}"/><ellipse cx="44.8" cy="28" rx="2.4" ry="3.4" fill="${skin}"/>`
    + `${front}${specs}<circle cx="26.2" cy="28.3" r="1.3" fill="#2A1D1A"/><circle cx="37.8" cy="28.3" r="1.3" fill="#2A1D1A"/>`
    + `<path d="M27.5 35c1.5 2 7.5 2 9 0" fill="none" stroke="#8A4B32" stroke-width="1.7" stroke-linecap="round"/></svg>`
}
