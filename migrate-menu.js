/**
 * migrate-menu.js
 * Copiez-collez ce fichier dans la console du navigateur (sur l'app BonApp ouverte).
 *
 * 1. Renseignez START_DATE et REPAS ci-dessous
 * 2. Collez le script dans la console
 * 3. Rechargez l'app — le menu apparaît dans Semaine et Historique
 */

// ─── À personnaliser ──────────────────────────────────────────────────────────

const START_DATE = '2026-06-16' // premier jour du menu (YYYY-MM-DD)

// Un objet par jour, dans l'ordre. null = repas non renseigné.
// Mettez l'émoji de votre choix directement dans le nom de la recette.
const REPAS = [
  { midi: '🍗 Poulet rôti',          soir: '🥗 Salade niçoise'      },
  { midi: '🥧 Quiche lorraine',       soir: '🥣 Soupe de légumes'    },
  { midi: '🍝 Spaghetti bolognaise',  soir: '🍳 Omelette aux herbes' },
  { midi: '🥩 Steak haricots verts',  soir: '🥑 Tartines avocat'     },
  { midi: '🍚 Risotto champignons',   soir: '🍜 Soupe miso'          },
  { midi: '🍔 Burger maison',         soir: null                     },
  { midi: null,                       soir: '🧀 Raclette'            },
]

// ─── Script (ne pas modifier) ─────────────────────────────────────────────────

;(function () {
  const KEY = 'bonapp_menus'

  function toISO (date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function addDays (isoDate, n) {
    const [y, mo, d] = isoDate.split('-').map(Number)
    const date = new Date(y, mo - 1, d)
    date.setDate(date.getDate() + n)
    return toISO(date)
  }

  function meal (name) {
    if (!name) return null
    return { recipe: name }
  }

  if (REPAS.length === 0) {
    console.error('❌ REPAS est vide — renseignez au moins un jour.')
    return
  }

  const endDate = addDays(START_DATE, REPAS.length - 1)

  const days = REPAS.map((repas, i) => ({
    date: addDays(START_DATE, i),
    midi: meal(repas.midi ?? null),
    soir: meal(repas.soir ?? null),
  }))

  const menu = {
    id: crypto.randomUUID(),
    startDate: START_DATE,
    endDate,
    days,
    savedAt: Date.now(),
  }

  let all = []
  try { all = JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch {}

  // Remplace un menu existant sur la même plage de dates, sinon ajoute
  const existing = all.findIndex(m => m.startDate === START_DATE)
  if (existing >= 0) {
    all[existing] = menu
    console.log('♻️  Menu existant remplacé.')
  } else {
    all.unshift(menu)
    console.log('✅ Menu ajouté.')
  }

  localStorage.setItem(KEY, JSON.stringify(all))

  const filled = days.reduce((n, d) => n + (d.midi ? 1 : 0) + (d.soir ? 1 : 0), 0)
  console.log(`   ${REPAS.length} jour(s) · ${filled} repas · du ${START_DATE} au ${endDate}`)
  console.log('   Rechargez l\'app pour voir le menu.')
})()
