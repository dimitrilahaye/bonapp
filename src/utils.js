/**
 * @module utils
 * @description Utilitaires de dates et identifiants pour BonApp.
 */

/** @type {string[]} Noms des jours (dim=0 … sam=6) */
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** @type {string[]} Noms des mois (jan=0 … déc=11) */
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
]

// ─── Identifiants ─────────────────────────────────────────────────────────────

/**
 * Génère un identifiant unique (UUID v4 ou fallback aléatoire).
 * @returns {string}
 */
export function generateId () {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Semaines ─────────────────────────────────────────────────────────────────

/**
 * Retourne la date du lundi de la semaine contenant `date`.
 * @param {Date} [date] - Date de référence (aujourd'hui par défaut)
 * @returns {Date}
 */
export function getMondayOfWeek (date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

/**
 * Retourne les 7 dates d'une semaine (lun → dim) à partir du lundi.
 * @param {Date} monday
 * @returns {Date[]}
 */
export function getWeekDays (monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

/**
 * Décale un lundi de `offset` semaines.
 * @param {Date} monday
 * @param {number} offset - Négatif pour reculer, positif pour avancer
 * @returns {Date}
 */
export function offsetWeek (monday, offset) {
  const d = new Date(monday)
  d.setDate(d.getDate() + offset * 7)
  return d
}

// ─── Formatage de dates ────────────────────────────────────────────────────────

/**
 * Convertit une Date en chaîne ISO YYYY-MM-DD (date locale, sans décalage UTC).
 * @param {Date} date
 * @returns {string}
 */
export function toISO (date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Retourne toutes les dates entre startISO et endISO inclus.
 * @param {string} startISO
 * @param {string} endISO
 * @returns {Date[]}
 */
export function getDayRange (startISO, endISO) {
  const result = []
  const d = fromISO(startISO)
  const end = fromISO(endISO)
  while (d <= end) {
    result.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return result
}

/**
 * Parse une chaîne ISO YYYY-MM-DD en Date locale (sans décalage UTC).
 * @param {string} iso
 * @returns {Date}
 */
export function fromISO (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Formate une date de façon courte : "Lundi 10 juin".
 * @param {string|Date} date
 * @returns {string}
 */
export function fmtShort (date) {
  const d = typeof date === 'string' ? fromISO(date) : date
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/**
 * Formate une date de façon longue : "10 juin 2026".
 * @param {string|Date} date
 * @returns {string}
 */
export function fmtLong (date) {
  const d = typeof date === 'string' ? fromISO(date) : date
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Génère le label de plage d'un menu : "Menu du 10 juin au 16 juin 2026".
 * @param {string} startDate - ISO
 * @param {string} endDate   - ISO
 * @returns {string}
 */
export function fmtWeekLabel (startDate, endDate) {
  const s = fromISO(startDate)
  const e = fromISO(endDate)
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  const start = sameMonth
    ? `${s.getDate()}`
    : sameYear
      ? `${s.getDate()} ${MONTHS[s.getMonth()]}`
      : fmtLong(s)
  return `Menu du ${start} au ${fmtLong(e)}`
}
