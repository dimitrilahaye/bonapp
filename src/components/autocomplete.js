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

  /* ── Bouton clear ──────────────────────────────────────────────────────── */

  const clearBtn = document.createElement('button')
  clearBtn.type = 'button'
  clearBtn.className = 'autocomplete__clear'
  clearBtn.setAttribute('aria-label', 'Effacer')
  clearBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  clearBtn.hidden = !value

  clearBtn.addEventListener('mousedown', e => {
    e.preventDefault()
    input.value = ''
    clearBtn.hidden = true
    list.hidden = true
    input.focus()
  })

  /* ── Liste de suggestions ──────────────────────────────────────────────── */

  const list = document.createElement('ul')
  list.className = 'autocomplete__list'
  list.setAttribute('role', 'listbox')
  list.hidden = true

  wrapper.appendChild(input)
  wrapper.appendChild(clearBtn)
  // La liste est attachée à body pour ne jamais être contrainte par la modal
  document.body.appendChild(list)

  /* ── Logique de filtrage ───────────────────────────────────────────────── */

  /**
   * Filtre les suggestions et met à jour la liste déroulante.
   * @param {string} query
   */
  const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  function updateList (query) {
    const q = normalize(query.trim())
    list.innerHTML = ''

    if (!q || !suggestions.length) {
      list.hidden = true
      return
    }

    const filtered = suggestions
      .filter(s => normalize(s).includes(q))
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

    list.style.left = rect.left + 'px'
    list.style.width = rect.width + 'px'

    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      list.style.top = (rect.bottom + 4) + 'px'
      list.style.bottom = ''
      list.style.maxHeight = Math.max(80, spaceBelow) + 'px'
    } else {
      list.style.top = ''
      list.style.bottom = (window.innerHeight - rect.top + 4) + 'px'
      list.style.maxHeight = Math.max(80, spaceAbove) + 'px'
    }
  }

  /* ── Événements du champ ───────────────────────────────────────────────── */

  input.addEventListener('input', () => {
    updateList(input.value)
    clearBtn.hidden = !input.value
  })

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
