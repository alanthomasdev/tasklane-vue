// Date helpers. Dates are stored as 'YYYY-MM-DD' strings and times as 'HH:MM'.

export const pad = n => String(n).padStart(2, '0')

/** Date object -> 'YYYY-MM-DD' (local time) */
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 'YYYY-MM-DD' -> Date object at local midnight */
export const parseISO = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** The Monday of the week that contains `d` */
export const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7))

/** Sorts tasks by date, then time */
export const byTime = (a, b) => (a.date + a.time).localeCompare(b.date + b.time)

/** '15:45' -> '3:45 PM' */
export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

/** '2026-11-05' -> 'Today', 'Tomorrow' or 'Thu, 5 Nov' */
export function fmtDate(s, today = iso(new Date())) {
  if (s === today) return 'Today'
  if (s === iso(addDays(parseISO(today), 1))) return 'Tomorrow'
  return parseISO(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
