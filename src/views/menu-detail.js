import { getMenuById, deleteMenus, saveMenu, getAllRecipeNames } from '../storage.js'
import { toISO, fmtShort, fmtWeekLabel } from '../utils.js'
import { navigate } from '../router.js'
import { setActiveNav } from '../components/navbar.js'
import { openRecipeModal } from '../components/modal.js'

const PDF_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="12" y1="18" x2="12" y2="12"/>
  <line x1="9" y1="15" x2="15" y2="15"/>
</svg>`

const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`

/**
 * Crée une barre d'actions sticky avec les boutons PDF et suppression.
 * @param {string} id
 * @returns {HTMLElement}
 */
function makeFabBar (id) {
  const bar = document.createElement('div')
  bar.className = 'detail-fab-bar'

  const pdfBtn = document.createElement('button')
  pdfBtn.className = 'btn--fab btn--fab-pdf'
  pdfBtn.setAttribute('aria-label', 'Partager en PDF')
  pdfBtn.innerHTML = PDF_ICON
  pdfBtn.addEventListener('click', () => window.print())

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'btn--fab btn--fab-delete'
  deleteBtn.setAttribute('aria-label', 'Supprimer ce menu')
  deleteBtn.innerHTML = TRASH_ICON
  deleteBtn.addEventListener('click', () => {
    if (!confirm('Supprimer ce menu définitivement ?')) return
    deleteMenus([id])
    navigate('/history')
  })

  bar.appendChild(pdfBtn)
  bar.appendChild(deleteBtn)
  return bar
}

/**
 * Affiche le détail d'un menu.
 * @param {HTMLElement} container
 * @param {string} id
 */
export function renderMenuDetail (container, id) {
  setActiveNav('/history')

  const menu = getMenuById(id)
  if (!menu) { navigate('/history'); return }

  container.innerHTML = ''

  // ── En-tête d'impression ──────────────────────────────────────────────────

  const printHeader = document.createElement('div')
  printHeader.className = 'print-header'
  printHeader.innerHTML = `
    <span class="print-header__logo">🍽️</span>
    <span class="print-header__title">BonApp</span>
    <span class="print-header__week">${fmtWeekLabel(menu.startDate, menu.endDate)}</span>
  `
  container.appendChild(printHeader)

  // ── En-tête écran ─────────────────────────────────────────────────────────

  const header = document.createElement('div')
  header.className = 'view-header'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn btn--icon'
  backBtn.setAttribute('aria-label', "Retour à l'historique")
  backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`
  backBtn.addEventListener('click', () => navigate('/history'))

  const titleEl = document.createElement('span')
  titleEl.className = 'view-header__title'
  titleEl.style.fontSize = '13px'
  titleEl.textContent = fmtWeekLabel(menu.startDate, menu.endDate)

  header.appendChild(backBtn)
  header.appendChild(titleEl)
  container.appendChild(header)

  // ── Grille des jours ──────────────────────────────────────────────────────

  const grid = document.createElement('div')
  grid.className = 'calendar'
  const todayISO = toISO(new Date())

  menu.days.forEach((day, dayIdx) => {
    const dayEl = document.createElement('div')
    dayEl.className = 'calendar__day'

    const dateEl = document.createElement('div')
    dateEl.className = `calendar__date${day.date === todayISO ? ' calendar__date--today' : ''}`
    dateEl.textContent = fmtShort(day.date)

    const slotsEl = document.createElement('div')
    slotsEl.className = 'calendar__slots'

    ;/** @type {Array<{key: 'midi'|'soir', icon: string, label: string}>} */([
      { key: 'midi', icon: '☀️', label: 'Midi' },
      { key: 'soir', icon: '🌙', label: 'Soir' }
    ]).forEach(({ key, icon, label }) => {
      const meal = day[key]
      const slot = document.createElement('div')
      slot.className = `calendar__slot${meal ? ' calendar__slot--filled' : ''}`
      slot.setAttribute('role', 'button')
      slot.setAttribute('tabindex', '0')

      slot.innerHTML = `
        <span class="calendar__slot-icon">${icon}</span>
        <span class="calendar__slot-label">${label}</span>
        <span class="calendar__slot-recipe">${meal?.recipe ?? '+ Ajouter'}</span>
      `

      function openSlotModal () {
        openRecipeModal({
          title: `${fmtShort(day.date)} — ${label}`,
          initialValue: meal?.recipe ?? '',
          suggestions: getAllRecipeNames(),
          showDelete: !!meal,
          onDelete: () => {
            menu.days[dayIdx][key] = null
            saveMenu(menu)
            renderMenuDetail(container, id)
          },
          onConfirm: value => {
            menu.days[dayIdx][key] = { recipe: value }
            saveMenu(menu)
            renderMenuDetail(container, id)
          }
        })
      }

      slot.addEventListener('click', openSlotModal)
      slot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlotModal() }
      })

      slotsEl.appendChild(slot)
    })

    dayEl.appendChild(dateEl)
    dayEl.appendChild(slotsEl)
    grid.appendChild(dayEl)
  })

  container.appendChild(grid)

  // ── Barre d'actions fixe (bas, collée à la navbar) ────────────────────────

  const fabBottom = makeFabBar(id)
  fabBottom.classList.add('detail-fab-bar--bottom')
  container.appendChild(fabBottom)

  const spacer = document.createElement('div')
  spacer.style.height = '62px'
  container.appendChild(spacer)
}
