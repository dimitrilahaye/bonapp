/**
 * @module pdf
 * @description Génération du PDF d'un menu et partage via la feuille native.
 *              window.print() est un no-op en PWA standalone sur iOS : on
 *              dessine donc le PDF nous-mêmes et on passe par navigator.share.
 */

import { jsPDF } from 'jspdf'
import { getMenuById } from './storage.js'
import { fmtWeekLabel, fmtShortAbbrev } from './utils.js'

// ─── Mise en page (mm, A4 portrait) ───────────────────────────────────────────

const PAGE_W   = 210
const MARGIN   = 15
const DATE_W   = 32
const ROW_H    = 22
const ROW_GAP  = 3
const SLOT_PAD = 4

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

// ─── Construction ─────────────────────────────────────────────────────────────

/**
 * Tronque `text` sur une ligne de largeur `maxW`, avec « … » si nécessaire.
 * @param {jsPDF} doc
 * @param {string} text
 * @param {number} maxW
 * @returns {string}
 */
function fitText (doc, text, maxW) {
  if (doc.getTextWidth(text) <= maxW) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > maxW) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/**
 * Dessine une case Midi / Soir.
 * @param {jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} label
 * @param {string|undefined} recipe
 */
function drawSlot (doc, x, y, w, h, label, recipe) {
  doc.setFillColor(recipe ? C.filledBg : C.slotBg)
  doc.setDrawColor(recipe ? C.filledBd : C.border)
  doc.roundedRect(x, y, w, h, 1, 1, 'FD')

  const midY = y + h / 2 + 1.2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(C.muted)
  doc.text(label.toUpperCase(), x + SLOT_PAD, midY)

  const textX = x + SLOT_PAD + 11
  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(recipe ? C.ink : C.border)
  doc.text(fitText(doc, recipe || '—', x + w - SLOT_PAD - textX), textX, midY)
}

/**
 * Construit le PDF d'un menu de la semaine.
 * @param {import('./storage.js').WeekMenu} menu
 * @returns {Blob}
 */
export function buildMenuPdf (menu) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const contentW = PAGE_W - MARGIN * 2

  // En-tête
  let y = MARGIN + 6
  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(C.brown)
  doc.text('BonApp', MARGIN, y)

  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(C.muted)
  doc.text(fmtWeekLabel(menu.startDate, menu.endDate), PAGE_W - MARGIN, y, { align: 'right' })

  y += 4
  doc.setDrawColor(C.brown)
  doc.setLineWidth(0.7)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  doc.setLineWidth(0.3)

  // Une ligne par jour
  y += 6
  const slotsX = MARGIN + DATE_W + SLOT_PAD
  const slotW = (contentW - DATE_W - SLOT_PAD * 3) / 2
  const slotH = ROW_H - SLOT_PAD * 2

  menu.days.forEach((day, i) => {
    doc.setDrawColor(C.border)
    doc.setFillColor(i % 2 === 1 ? C.evenBg : '#FFFFFF')
    doc.roundedRect(MARGIN, y, contentW, ROW_H, 1, 1, 'FD')
    doc.line(MARGIN + DATE_W, y, MARGIN + DATE_W, y + ROW_H)

    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(C.brown)
    doc.text(fmtShortAbbrev(day.date), MARGIN + 3, y + ROW_H / 2 + 1.3)

    drawSlot(doc, slotsX, y + SLOT_PAD, slotW, slotH, 'Midi', day.midi?.recipe)
    drawSlot(doc, slotsX + slotW + SLOT_PAD, y + SLOT_PAD, slotW, slotH, 'Soir', day.soir?.recipe)

    y += ROW_H + ROW_GAP
  })

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
