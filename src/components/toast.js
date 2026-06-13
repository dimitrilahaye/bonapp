let toastEl = null
let hideTimer = null

/**
 * Affiche un toast de succès pendant 2 secondes.
 * @param {string} message
 */
export function showToast (message = 'Modification enregistrée') {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'toast'
    document.body.appendChild(toastEl)
  }

  toastEl.textContent = message
  toastEl.classList.remove('toast--hidden')
  toastEl.classList.add('toast--visible')

  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    toastEl.classList.remove('toast--visible')
    toastEl.classList.add('toast--hidden')
  }, 2000)
}
