import { saveMenu } from '../storage.js'
import { generateId, toISO, getDayRange } from '../utils.js'
import { setActiveNav } from '../components/navbar.js'
import { buildDayGrid, createMoveState } from '../components/day-slots.js'
import { navigate } from '../router.js'

/** @type {import('../storage.js').WeekMenu|null} */
let menu = null
let state = createMoveState()

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

export function renderCreate (container) {
  setActiveNav('/create')
  menu = null
  state = createMoveState()
  container.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'view-header'
  const title = document.createElement('h1')
  title.className = 'view-header__title'
  title.style.textAlign = 'left'
  title.textContent = 'Nouveau menu'
  header.appendChild(title)
  container.appendChild(header)

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

function renderGrid (gridContainer, saveBtn) {
  gridContainer.innerHTML = ''
  if (!menu) return

  const filled = menu.days.reduce((n, d) => n + (d.midi ? 1 : 0) + (d.soir ? 1 : 0), 0)
  saveBtn.disabled = filled === 0

  const grid = buildDayGrid({
    menu,
    state,
    dragScope: gridContainer,
    rerender: () => renderGrid(gridContainer, saveBtn)
  })

  gridContainer.appendChild(grid)
}
