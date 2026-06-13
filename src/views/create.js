import { getAllRecipeNames, saveMenu } from '../storage.js'
import { generateId, toISO, fmtShort, getDayRange } from '../utils.js'
import { openRecipeModal } from '../components/modal.js'
import { setActiveNav } from '../components/navbar.js'
import { navigate } from '../router.js'

/** @type {import('../storage.js').WeekMenu|null} */
let menu = null

/** @type {{dayIdx: number, key: string}|null} */
let dragState = null

/**
 * Synchronise les jours du menu avec le range de dates.
 * Préserve les repas déjà saisis pour les dates qui restent dans la plage.
 * @param {string} startISO
 * @param {string} endISO
 */
function updateMenuDates (startISO, endISO) {
  const days = getDayRange(startISO, endISO).map(d => {
    const iso = toISO(d)
    const existing = menu?.days.find(day => day.date === iso)
    return existing ?? { date: iso, midi: null, soir: null }
  })

  if (!menu) {
    menu = { id: generateId(), startDate: startISO, endDate: endISO, days, savedAt: 0 }
  } else {
    menu.startDate = startISO
    menu.endDate = endISO
    menu.days = days
  }
}

/**
 * Affiche la vue de création d'un menu.
 * @param {HTMLElement} container
 */
export function renderCreate (container) {
  setActiveNav('/create')

  // Réinitialise l'état à chaque ouverture
  menu = null
  dragState = null

  container.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'view-header'
  const title = document.createElement('h1')
  title.className = 'view-header__title'
  title.style.textAlign = 'left'
  title.textContent = 'Nouveau menu'
  header.appendChild(title)
  container.appendChild(header)

  // Date range picker
  const today = toISO(new Date())
  const endDefault = new Date()
  endDefault.setDate(endDefault.getDate() + 6)
  const endDefaultISO = toISO(endDefault)

  const picker = document.createElement('div')
  picker.className = 'date-picker'
  picker.innerHTML = `
    <div class="date-picker__group">
      <label class="date-picker__label" for="create-from">Du</label>
      <input type="date" id="create-from" class="date-picker__input" value="${today}">
    </div>
    <div class="date-picker__group">
      <label class="date-picker__label" for="create-to">Au</label>
      <input type="date" id="create-to" class="date-picker__input" value="${endDefaultISO}">
    </div>
  `
  container.appendChild(picker)

  const fromInput = /** @type {HTMLInputElement} */ (picker.querySelector('#create-from'))
  const toInput   = /** @type {HTMLInputElement} */ (picker.querySelector('#create-to'))

  const gridContainer = document.createElement('div')
  container.appendChild(gridContainer)

  // Toolbar sticky avec le bouton d'enregistrement (une seule fois, en bas)
  const saveToolbar = document.createElement('div')
  saveToolbar.className = 'create-save-toolbar'
  const saveBtn = document.createElement('button')
  saveBtn.className = 'btn btn--primary btn--full'
  saveBtn.textContent = 'Enregistrer le menu'
  saveBtn.disabled = true
  saveBtn.addEventListener('click', () => {
    if (!menu) return
    menu.savedAt = Date.now()
    saveMenu(menu)
    navigate(`/menu/${menu.id}`)
  })
  saveToolbar.appendChild(saveBtn)
  container.appendChild(saveToolbar)

  const spacer = document.createElement('div')
  spacer.style.height = '62px'
  container.appendChild(spacer)

  updateMenuDates(today, endDefaultISO)
  renderGrid(gridContainer, saveBtn)

  fromInput.addEventListener('change', () => {
    if (!fromInput.value || !toInput.value) return
    if (toInput.value < fromInput.value) toInput.value = fromInput.value
    updateMenuDates(fromInput.value, toInput.value)
    renderGrid(gridContainer, saveBtn)
  })

  toInput.addEventListener('change', () => {
    if (!fromInput.value || !toInput.value) return
    if (toInput.value < fromInput.value) fromInput.value = toInput.value
    updateMenuDates(fromInput.value, toInput.value)
    renderGrid(gridContainer, saveBtn)
  })
}

/**
 * @param {HTMLElement} gridContainer
 * @param {HTMLButtonElement} saveBtn
 */
function renderGrid (gridContainer, saveBtn) {
  gridContainer.innerHTML = ''
  if (!menu) return

  const filled = menu.days.reduce((n, d) => n + (d.midi ? 1 : 0) + (d.soir ? 1 : 0), 0)
  saveBtn.disabled = filled === 0

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
      slot.dataset.dayIdx = String(dayIdx)
      slot.dataset.key = key

      if (meal) slot.setAttribute('draggable', 'true')

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
            renderGrid(gridContainer, saveBtn)
          },
          onConfirm: value => {
            menu.days[dayIdx][key] = { recipe: value }
            renderGrid(gridContainer, saveBtn)
          }
        })
      }

      slot.addEventListener('click', () => {
        if (slot.classList.contains('is-dragging')) return
        openSlotModal()
      })
      slot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlotModal() }
      })

      // ── Drag source ──────────────────────────────────────────────────────
      slot.addEventListener('dragstart', e => {
        if (!meal) { e.preventDefault(); return }
        dragState = { dayIdx, key }
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '')
        requestAnimationFrame(() => slot.classList.add('is-dragging'))
      })
      slot.addEventListener('dragend', () => {
        dragState = null
        slot.classList.remove('is-dragging')
        gridContainer.querySelectorAll('.drop-target').forEach(s => s.classList.remove('drop-target'))
      })

      // ── Drop target ──────────────────────────────────────────────────────
      slot.addEventListener('dragover', e => {
        if (!dragState) return
        if (dragState.dayIdx === dayIdx && dragState.key === key) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        gridContainer.querySelectorAll('.drop-target').forEach(s => s.classList.remove('drop-target'))
        slot.classList.add('drop-target')
      })
      slot.addEventListener('dragleave', e => {
        if (!slot.contains(/** @type {Node} */ (e.relatedTarget))) {
          slot.classList.remove('drop-target')
        }
      })
      slot.addEventListener('drop', e => {
        e.preventDefault()
        slot.classList.remove('drop-target')
        if (!dragState) return
        const { dayIdx: srcDayIdx, key: srcKey } = dragState
        if (srcDayIdx === dayIdx && srcKey === key) { dragState = null; return }

        const srcMeal = menu.days[srcDayIdx][srcKey]
        const dstMeal = menu.days[dayIdx][key]
        menu.days[dayIdx][key] = srcMeal
        menu.days[srcDayIdx][srcKey] = dstMeal

        dragState = null
        renderGrid(gridContainer, saveBtn)
      })

      slotsEl.appendChild(slot)
    })

    dayEl.appendChild(dateEl)
    dayEl.appendChild(slotsEl)
    grid.appendChild(dayEl)
  })

  gridContainer.appendChild(grid)
}
