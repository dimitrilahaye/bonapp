/**
 * @module components/modal
 * @description Modal de saisie de recette avec autocomplétion.
 */

import { createAutocomplete } from './autocomplete.js'

/**
 * @typedef {Object} RecipeModalOptions
 * @property {string}                  title         - Titre affiché dans la modal
 * @property {string}                  [initialValue]- Valeur pré-remplie du champ
 * @property {string[]}                suggestions   - Suggestions d'autocomplétion
 * @property {function(string): void}  onConfirm     - Appelé avec la valeur validée
 * @property {function(): void}        [onCancel]    - Appelé lors de l'annulation
 * @property {boolean}                 [showDelete]  - Afficher un bouton "Supprimer"
 * @property {function(): void}        [onDelete]    - Appelé lors de la suppression
 */

/**
 * @typedef {Object} ModalHandle
 * @property {function(): void} close - Ferme et détache la modal
 */

/**
 * Ouvre une modal de saisie de recette.
 *
 * @param {RecipeModalOptions} options
 * @returns {ModalHandle}
 */
export function openRecipeModal ({
  title,
  initialValue = '',
  suggestions,
  onConfirm,
  onCancel,
  showDelete = false,
  onDelete
}) {
  /* ── Overlay ────────────────────────────────────────────────────────────── */

  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', title)

  /* ── Boîte de la modal ──────────────────────────────────────────────────── */

  const box = document.createElement('div')
  box.className = 'modal'

  const heading = document.createElement('h2')
  heading.className = 'modal__title'
  heading.textContent = title

  /* ── Champ avec autocomplétion ──────────────────────────────────────────── */

  const autocomplete = createAutocomplete({
    placeholder: 'Nom de la recette',
    suggestions,
    value: initialValue,
    onSubmit: val => { onConfirm(val); close() }
  })

  /* ── Actions ────────────────────────────────────────────────────────────── */

  const actions = document.createElement('div')
  actions.className = 'modal__actions'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn btn--ghost'
  cancelBtn.textContent = 'Annuler'
  cancelBtn.addEventListener('click', () => { onCancel?.(); close() })

  const confirmBtn = document.createElement('button')
  confirmBtn.className = 'btn btn--primary'
  confirmBtn.textContent = 'Valider'
  confirmBtn.addEventListener('click', () => {
    /** @type {HTMLInputElement} */
    const input = autocomplete.querySelector('input')
    const val = input?.value.trim()
    if (val) { onConfirm(val); close() }
  })

  actions.appendChild(cancelBtn)

  if (showDelete && onDelete) {
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'btn btn--ghost-danger'
    deleteBtn.textContent = 'Effacer'
    deleteBtn.addEventListener('click', () => { onDelete(); close() })
    actions.appendChild(deleteBtn)
  }

  actions.appendChild(confirmBtn)

  box.appendChild(heading)
  box.appendChild(autocomplete)
  box.appendChild(actions)
  overlay.appendChild(box)
  document.body.appendChild(overlay)

  /* ── Focus initial ──────────────────────────────────────────────────────── */

  requestAnimationFrame(() => {
    /** @type {HTMLInputElement|null} */
    const input = autocomplete.querySelector('input')
    input?.focus()
    // Place le curseur en fin de valeur pré-remplie
    if (input && initialValue) {
      input.setSelectionRange(initialValue.length, initialValue.length)
    }
  })

  /* ── Fermeture ──────────────────────────────────────────────────────────── */

  /** Ferme et supprime la modal du DOM */
  function close () {
    overlay.remove()
    document.removeEventListener('keydown', onKeydown)
  }

  /** @param {KeyboardEvent} e */
  function onKeydown (e) {
    if (e.key === 'Escape') { onCancel?.(); close() }
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { onCancel?.(); close() }
  })

  document.addEventListener('keydown', onKeydown)

  return { close }
}
