import { getAllRecipeNames } from '../storage.js'
import { toISO, fmtShort, fmtShortAbbrev } from '../utils.js'
import { openRecipeModal } from './modal.js'
import { showToast } from './toast.js'

const GRIP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <line x1="8" y1="6" x2="16" y2="6"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
  <line x1="8" y1="18" x2="16" y2="18"/>
</svg>`

/**
 * @typedef {Object} SlotState
 * @property {{dayIdx: number, key: string}|null} move  - Slot sélectionné pour tap-to-move
 * @property {{dayIdx: number, key: string}|null} drag  - Slot en cours de drag
 */

/**
 * Crée un objet d'état partagé pour le déplacement de repas.
 * @returns {SlotState}
 */
export function createMoveState () {
  return { move: null, drag: null }
}

/**
 * Construit la grille de jours avec slots éditables, tap-to-move et drag & drop.
 *
 * @param {object} opts
 * @param {import('../storage.js').WeekMenu} opts.menu
 * @param {SlotState}    opts.state       - État partagé move/drag
 * @param {HTMLElement}  opts.dragScope   - Élément racine pour nettoyer .drop-target
 * @param {function(): void} opts.rerender
 * @returns {HTMLElement}  élément .calendar prêt à insérer
 */
export function buildDayGrid ({ menu, state, dragScope, rerender }) {
  const grid = document.createElement('div')
  grid.className = 'calendar'
  const todayISO = toISO(new Date())
  const isMoving = state.move !== null

  menu.days.forEach((day, dayIdx) => {
    const dayEl = document.createElement('div')
    dayEl.className = 'calendar__day'

    const dateEl = document.createElement('div')
    dateEl.className = `calendar__date${day.date === todayISO ? ' calendar__date--today' : ''}`
    dateEl.textContent = fmtShort(day.date)
    dateEl.dataset.abbrev = fmtShortAbbrev(day.date)

    const slotsEl = document.createElement('div')
    slotsEl.className = 'calendar__slots'

    ;/** @type {Array<{key: 'midi'|'soir', icon: string, label: string}>} */([
      { key: 'midi', icon: '☀️', label: 'Midi' },
      { key: 'soir', icon: '🌙', label: 'Soir' }
    ]).forEach(({ key, icon, label }) => {
      const meal = day[key]
      const isSource = state.move?.dayIdx === dayIdx && state.move?.key === key

      const slot = document.createElement('div')
      slot.className = [
        'calendar__slot',
        meal                        ? 'calendar__slot--filled'      : '',
        isSource                    ? 'calendar__slot--moving'       : '',
        isMoving && !isSource       ? 'calendar__slot--move-target'  : ''
      ].filter(Boolean).join(' ')
      slot.setAttribute('role', 'button')
      slot.setAttribute('tabindex', '0')

      slot.innerHTML = `
        <span class="calendar__slot-icon">${icon}</span>
        <span class="calendar__slot-label">${label}</span>
        <span class="calendar__slot-recipe">${meal?.recipe ?? (isMoving ? 'Poser ici' : '+ Ajouter')}</span>
      `

      // ── Icône grip (slots remplis uniquement) ────────────────────────────
      if (meal) {
        const gripBtn = document.createElement('button')
        gripBtn.className = `slot-grip${isSource ? ' slot-grip--active' : ''}`
        gripBtn.setAttribute('aria-label', isSource ? 'Annuler le déplacement' : 'Déplacer ce repas')
        gripBtn.innerHTML = GRIP_ICON
        gripBtn.addEventListener('click', e => {
          e.stopPropagation()
          state.move = isSource ? null : { dayIdx, key }
          rerender()
        })
        slot.appendChild(gripBtn)
      }

      // ── Clic / tap ───────────────────────────────────────────────────────
      slot.addEventListener('click', () => {
        if (isMoving) {
          if (isSource) {
            state.move = null
          } else {
            const srcMeal = menu.days[state.move.dayIdx][state.move.key]
            const dstMeal = meal
            menu.days[dayIdx][key] = srcMeal
            menu.days[state.move.dayIdx][state.move.key] = dstMeal
            state.move = null
            showToast('Repas déplacé')
          }
          rerender()
        } else {
          openSlotModal()
        }
      })

      slot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); slot.click() }
        if (e.key === 'Escape' && isMoving) { state.move = null; rerender() }
      })

      // ── Drag source ──────────────────────────────────────────────────────
      if (meal) {
        slot.setAttribute('draggable', 'true')

        slot.addEventListener('dragstart', e => {
          state.drag = { dayIdx, key }
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', '')
          requestAnimationFrame(() => slot.classList.add('is-dragging'))
        })
        slot.addEventListener('dragend', () => {
          state.drag = null
          slot.classList.remove('is-dragging')
          dragScope.querySelectorAll('.drop-target').forEach(s => s.classList.remove('drop-target'))
        })
      }

      // ── Drop target ──────────────────────────────────────────────────────
      slot.addEventListener('dragover', e => {
        if (!state.drag) return
        if (state.drag.dayIdx === dayIdx && state.drag.key === key) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        dragScope.querySelectorAll('.drop-target').forEach(s => s.classList.remove('drop-target'))
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
        if (!state.drag) return
        const { dayIdx: srcDayIdx, key: srcKey } = state.drag
        if (srcDayIdx === dayIdx && srcKey === key) { state.drag = null; return }
        const srcMeal = menu.days[srcDayIdx][srcKey]
        const dstMeal = menu.days[dayIdx][key]
        menu.days[dayIdx][key] = srcMeal
        menu.days[srcDayIdx][srcKey] = dstMeal
        state.drag = null
        showToast('Repas déplacé')
        rerender()
      })

      // ── Modal d'édition ──────────────────────────────────────────────────
      function openSlotModal () {
        openRecipeModal({
          title: `${fmtShort(day.date)} — ${label}`,
          initialValue: meal?.recipe ?? '',
          suggestions: getAllRecipeNames(),
          showDelete: !!meal,
          onDelete: () => {
            menu.days[dayIdx][key] = null
            showToast('Repas supprimé')
            rerender()
          },
          onConfirm: value => {
            menu.days[dayIdx][key] = { recipe: value }
            showToast(meal ? 'Repas modifié' : 'Repas ajouté')
            rerender()
          }
        })
      }

      slotsEl.appendChild(slot)
    })

    dayEl.appendChild(dateEl)
    dayEl.appendChild(slotsEl)
    grid.appendChild(dayEl)
  })

  return grid
}
