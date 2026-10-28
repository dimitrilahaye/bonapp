/**
 * @module pdf
 * @description Génération du PDF d'un menu et partage via la feuille native.
 *              window.print() est un no-op en PWA standalone sur iOS : on
 *              dessine donc le PDF nous-mêmes et on passe par navigator.share.
 *              La page est rendue sur un canvas (emoji et polices de l'app
 *              gérés par le système), puis emballée dans un PDF par jsPDF.
 */

import { jsPDF } from 'jspdf'
import { getMenuById } from './storage.js'
import { fmtWeekLabel, fmtShortAbbrev } from './utils.js'

// ─── Mise en page (mm, A4 portrait) ───────────────────────────────────────────

const PAGE_W   = 210
const PAGE_H   = 297
const MARGIN   = 15
const DATE_W   = 32
const ROW_H    = 22
const ROW_GAP  = 3
const SLOT_PAD = 4

/** Résolution du rendu : ~200 dpi, net à l'impression sans saturer la mémoire iOS */
const PX_PER_MM = 1654 / PAGE_W

/** Couleurs reprises du @media print de style.css */
const C = {
  ink:      '#2C1810',
  brown:    '#6B4226',
  muted:    '#9B8574',
  border:   '#C9B08A',
  slotBg:   '#F2E8D5',
  filledBg: '#FBF6EB',
  filledBd: '#D4BFA0',
  evenBg:   '#F5EDE0'
}

const EMOJI_FONTS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"'
const DISPLAY = `"Playfair Display", Georgia, "Times New Roman", serif, ${EMOJI_FONTS}`
const BODY    = `"Lora", Georgia, "Times New Roman", serif, ${EMOJI_FONTS}`

// ─── Helpers canvas ───────────────────────────────────────────────────────────

/** @param {number} v - mm → px */
const mm = v => v * PX_PER_MM

/**
 * Construit une déclaration `font` canvas à partir d'une taille en points.
 * @param {string} style - ex. 'italic 400', '700'
 * @param {number} pt
 * @param {string} family
 * @returns {string}
 */
const font = (style, pt, family) => `${style} ${mm(pt * 0.3528)}px ${family}`

/**
 * Découpe une chaîne en graphèmes (un emoji composé reste entier).
 * @param {string} text
 * @returns {string[]}
 */
function graphemes (text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(text), s => s.segment)
  }
  return Array.from(text)
}

/**
 * Tronque `text` sur une ligne de largeur `maxW` px, avec « … » si nécessaire.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxW
 * @returns {string}
 */
function fitText (ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  const parts = graphemes(text)
  while (parts.length > 1 && ctx.measureText(`${parts.join('').trimEnd()}…`).width > maxW) parts.pop()
  return `${parts.join('').trimEnd()}…`
}

/**
 * Trace un rectangle arrondi rempli et bordé (coordonnées en mm).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} fill
 * @param {string} stroke
 */
function box (ctx, x, y, w, h, fill, stroke) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(mm(x), mm(y), mm(w), mm(h), mm(1))
  else ctx.rect(mm(x), mm(y), mm(w), mm(h))
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = mm(0.3)
  ctx.strokeStyle = stroke
  ctx.stroke()
}

// ─── Rendu ────────────────────────────────────────────────────────────────────

/**
 * Dessine une case Midi / Soir.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} icon
 * @param {string} label
 * @param {string|undefined} recipe
 */
function drawSlot (ctx, x, y, w, h, icon, label, recipe) {
  box(ctx, x, y, w, h, recipe ? C.filledBg : C.slotBg, recipe ? C.filledBd : C.border)

  const midY = mm(y + h / 2)
  ctx.font = font('400', 9, BODY)
  ctx.fillText(icon, mm(x + SLOT_PAD), midY)

  ctx.font = font('500', 7, BODY)
  ctx.fillStyle = C.muted
  ctx.fillText(label.toUpperCase(), mm(x + SLOT_PAD + 5.5), midY)

  const textX = x + SLOT_PAD + 15
  ctx.font = font('italic 400', 10, BODY)
  ctx.fillStyle = recipe ? C.ink : C.border
  ctx.fillText(fitText(ctx, recipe || '—', mm(x + w - SLOT_PAD - textX)), mm(textX), midY)
}

/**
 * Dessine la page A4 d'un menu sur un canvas.
 * @param {import('./storage.js').WeekMenu} menu
 * @returns {HTMLCanvasElement}
 */
function renderMenuCanvas (menu) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(mm(PAGE_W))
  canvas.height = Math.round(mm(PAGE_H))
  const ctx = canvas.getContext('2d')
  const contentW = PAGE_W - MARGIN * 2

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.textBaseline = 'middle'

  // En-tête
  let y = MARGIN + 5
  ctx.font = font('400', 18, DISPLAY)
  ctx.fillText('🍽️', mm(MARGIN), mm(y))
  ctx.font = font('700', 18, DISPLAY)
  ctx.fillStyle = C.brown
  ctx.fillText('BonApp', mm(MARGIN + 9), mm(y))

  ctx.font = font('italic 400', 10, BODY)
  ctx.fillStyle = C.muted
  ctx.textAlign = 'right'
  ctx.fillText(fmtWeekLabel(menu.startDate, menu.endDate), mm(PAGE_W - MARGIN), mm(y))
  ctx.textAlign = 'left'

  y += 6
  ctx.fillStyle = C.brown
  ctx.fillRect(mm(MARGIN), mm(y), mm(contentW), mm(0.7))

  // Une ligne par jour
  y += 6
  const slotsX = MARGIN + DATE_W + SLOT_PAD
  const slotW = (contentW - DATE_W - SLOT_PAD * 3) / 2
  const slotH = ROW_H - SLOT_PAD * 2

  menu.days.forEach((day, i) => {
    box(ctx, MARGIN, y, contentW, ROW_H, i % 2 === 1 ? C.evenBg : '#FFFFFF', C.border)
    ctx.fillStyle = C.border
    ctx.fillRect(mm(MARGIN + DATE_W), mm(y), mm(0.3), mm(ROW_H))

    ctx.font = font('700', 10, DISPLAY)
    ctx.fillStyle = C.brown
    ctx.fillText(fitText(ctx, fmtShortAbbrev(day.date), mm(DATE_W - 5)), mm(MARGIN + 3), mm(y + ROW_H / 2))

    drawSlot(ctx, slotsX, y + SLOT_PAD, slotW, slotH, '☀️', 'Midi', day.midi?.recipe)
    drawSlot(ctx, slotsX + slotW + SLOT_PAD, y + SLOT_PAD, slotW, slotH, '🌙', 'Soir', day.soir?.recipe)

    y += ROW_H + ROW_GAP
  })

  return canvas
}

/**
 * Construit le PDF d'un menu de la semaine.
 * @param {import('./storage.js').WeekMenu} menu
 * @returns {Blob}
 */
export function buildMenuPdf (menu) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const image = renderMenuCanvas(menu).toDataURL('image/jpeg', 0.92)
  doc.addImage(image, 'JPEG', 0, 0, PAGE_W, PAGE_H)
  return doc.output('blob')
}

// ─── Partage ──────────────────────────────────────────────────────────────────

/**
 * Génère le PDF du menu et ouvre la feuille de partage native.
 * Repli sur window.print() quand le partage de fichiers n'est pas disponible.
 * @param {string} id - Identifiant du menu
 */
export async function exportMenuPdf (id) {
  const menu = getMenuById(id)
  if (!menu) return

  const file = new File([buildMenuPdf(menu)], `bonapp-menu-${menu.startDate}.pdf`, { type: 'application/pdf' })

  if (!navigator.canShare?.({ files: [file] })) {
    window.print()
    return
  }

  try {
    await navigator.share({ files: [file], title: fmtWeekLabel(menu.startDate, menu.endDate) })
  } catch (err) {
    if (err.name !== 'AbortError') window.print()
  }
}
