import { navigate } from '../router.js'

const ITEMS = [
  {
    path: '/calendar',
    label: 'Semaine',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`
  },
  {
    path: '/history',
    label: 'Historique',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8v4l3 3"/>
      <path d="M3.05 11a9 9 0 1 1 .5 4"/>
      <path d="M3 3v5h5"/>
    </svg>`
  }
]

/** @type {HTMLElement|null} */
let navbarEl = null

/**
 * Crée la barre de navigation et la retourne.
 * @returns {HTMLElement}
 */
export function createNavbar () {
  const nav = document.createElement('nav')
  nav.className = 'navbar'

  const semaineItem = ITEMS[0]
  const semaineBtn = document.createElement('button')
  semaineBtn.className = 'navbar__item'
  semaineBtn.dataset.path = semaineItem.path
  semaineBtn.setAttribute('aria-label', semaineItem.label)
  semaineBtn.innerHTML = `${semaineItem.icon}<span>${semaineItem.label}</span>`
  semaineBtn.addEventListener('click', () => navigate(semaineItem.path))
  nav.appendChild(semaineBtn)

  const plusBtn = document.createElement('button')
  plusBtn.className = 'navbar__plus'
  plusBtn.setAttribute('aria-label', 'Nouveau menu')
  plusBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`
  plusBtn.addEventListener('click', () => navigate('/create'))
  nav.appendChild(plusBtn)

  const histItem = ITEMS[1]
  const histBtn = document.createElement('button')
  histBtn.className = 'navbar__item'
  histBtn.dataset.path = histItem.path
  histBtn.setAttribute('aria-label', histItem.label)
  histBtn.innerHTML = `${histItem.icon}<span>${histItem.label}</span>`
  histBtn.addEventListener('click', () => navigate(histItem.path))
  nav.appendChild(histBtn)

  navbarEl = nav
  return nav
}

/**
 * Met à jour l'état actif de la navbar.
 * @param {string} activePath
 */
export function setActiveNav (activePath) {
  if (!navbarEl) return
  navbarEl.querySelectorAll('.navbar__item').forEach(btn => {
    const path = /** @type {HTMLElement} */ (btn).dataset.path ?? ''
    btn.classList.toggle('navbar__item--active', activePath.startsWith(path))
    btn.setAttribute('aria-current', activePath.startsWith(path) ? 'page' : 'false')
  })
  const plusBtn = navbarEl.querySelector('.navbar__plus')
  if (plusBtn) {
    plusBtn.classList.toggle('navbar__plus--active', activePath === '/create')
  }
}
