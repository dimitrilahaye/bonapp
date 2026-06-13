/**
 * @module components/autocomplete
 * @description Champ de saisie avec autocomplétion à partir d'une liste locale.
 */

/**
 * @typedef {Object} AutocompleteOptions
 * @property {string}                  placeholder - Placeholder du champ
 * @property {string[]}                suggestions  - Liste de suggestions disponibles
 * @property {string}                  [value]      - Valeur initiale du champ
 * @property {function(string): void}  [onSubmit]   - Appelé lors d'une validation par Entrée
 */

/**
 * Crée un champ de saisie avec autocomplétion.
 * Retourne un élément DOM prêt à être inséré.
 *
 * @param {AutocompleteOptions} options
 * @returns {HTMLElement}
 */
export function createAutocomplete ({ placeholder, suggestions, value = '', onSubmit }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'autocomplete'

  /* ── Champ de saisie ───────────────────────────────────────────────────── */

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = placeholder
  input.value = value
  input.autocomplete = 'off'
  input.spellcheck = false
  input.className = 'autocomplete__input'
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-haspopup', 'listbox')

  /* ── Liste de suggestions ──────────────────────────────────────────────── */

  const list = document.createElement('ul')
  list.className = 'autocomplete__list'
  list.setAttribute('role', 'listbox')
  list.hidden = true

  wrapper.appendChild(input)
  wrapper.appendChild(list)

  /* ── Logique de filtrage ───────────────────────────────────────────────── */

  /**
   * Filtre les suggestions et met à jour la liste déroulante.
   * @param {string} query
   */
  function updateList (query) {
    const q = query.trim().toLowerCase()
    list.innerHTML = ''

    if (!q || !suggestions.length) {
      list.hidden = true
      return
    }

    const filtered = suggestions
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, 7)

    if (!filtered.length) {
      list.hidden = true
      return
    }

    filtered.forEach(name => {
      const li = document.createElement('li')
      li.className = 'autocomplete__item'
      li.textContent = name
      li.setAttribute('role', 'option')
      li.setAttribute('tabindex', '0')

      // Sélection via clic (mousedown pour éviter le blur du champ)
      li.addEventListener('mousedown', e => {
        e.preventDefault()
        input.value = name
        list.hidden = true
      })

      // Sélection via clavier (Entrée ou Espace)
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          input.value = name
          list.hidden = true
          input.focus()
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          /** @type {HTMLElement|null} */
          const next = li.nextElementSibling
          next?.focus()
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prev = li.previousElementSibling
          if (prev) {
            /** @type {HTMLElement} */ (prev).focus()
          } else {
            input.focus()
          }
        }
        if (e.key === 'Escape') {
          list.hidden = true
          input.focus()
        }
      })

      list.appendChild(li)
    })

    list.hidden = false
    positionList()
  }

  function positionList () {
    const rect = wrapper.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8

    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      list.style.top = 'calc(100% + 4px)'
      list.style.bottom = ''
      list.style.maxHeight = Math.max(80, spaceBelow) + 'px'
    } else {
      list.style.top = ''
      list.style.bottom = 'calc(100% + 4px)'
      list.style.maxHeight = Math.max(80, spaceAbove) + 'px'
    }
  }

  /* ── Événements du champ ───────────────────────────────────────────────── */

  input.addEventListener('input', () => updateList(input.value))

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      list.hidden = true
      const val = input.value.trim()
      if (val) onSubmit?.(val)
    }
    if (e.key === 'Escape') {
      list.hidden = true
    }
    if (e.key === 'ArrowDown' && !list.hidden) {
      e.preventDefault()
      /** @type {HTMLElement|null} */
      const first = list.querySelector('li')
      first?.focus()
    }
  })

  input.addEventListener('blur', () => {
    // Délai pour laisser le mousedown sur un item s'exécuter avant de fermer
    setTimeout(() => { list.hidden = true }, 160)
  })

  return wrapper
}
