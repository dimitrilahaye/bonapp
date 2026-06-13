import './style.css'
import { initRouter, route } from './router.js'
import { createNavbar } from './components/navbar.js'
import { renderCalendar } from './views/calendar.js'
import { renderCreate } from './views/create.js'
import { renderHistory } from './views/history.js'
import { renderMenuDetail } from './views/menu-detail.js'

function boot () {
  const app = document.getElementById('app')
  if (!app) throw new Error('#app introuvable dans le DOM')

  const main = document.createElement('main')
  main.id = 'main-content'
  main.className = 'main'

  const navbar = createNavbar()

  app.appendChild(main)
  app.appendChild(navbar)

  route('/calendar', () => renderCalendar(main))
  route('/create',   () => renderCreate(main))
  route('/menu/:id', ({ id }) => renderMenuDetail(main, id))
  route('/history',  () => renderHistory(main))

  initRouter()
}

boot()
