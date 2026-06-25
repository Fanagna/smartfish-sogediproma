/**
 * Utilitaire d'export PDF et Excel pour SmartFish SOGEDIPROMA
 * Supporte : Captures, Stocks, Ventes, Exportations, KPIs
 *
 * Dépendances : jspdf, jspdf-autotable, xlsx
 * Installation : npm install jspdf jspdf-autotable xlsx
 */

let jsPDF, autoTableLoaded = false, XLSX

// ─── Chargement asynchrone des librairies ───
async function loadPdfLibs() {
  if (jsPDF && autoTableLoaded) return
  const jspdfModule = await import('jspdf')
  await import('jspdf-autotable')  // side-effect: étend jsPDF.prototype
  jsPDF = jspdfModule.default
  autoTableLoaded = true
}

async function loadExcelLibs() {
  if (XLSX) return
  const xlsxModule = await import('xlsx')
  XLSX = xlsxModule.default || xlsxModule
}

// ─── Helpers ───
const formatCurrency = (v) => v != null && !isNaN(v) ? `${Number(v).toLocaleString('fr-MG')} Ar` : '— Ar'

const formatNumber = (v, d = 1) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const formatDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

/**
 * Convertit un tableau de données en colonnes pour l'export
 * @param {Object[]} columns - Définition des colonnes [{ key, label, render?, align? }]
 * @param {Object[]} data - Données brutes
 * @returns {{ headers: string[], rows: string[][] }}
 */
function prepareTableData(columns, data) {
  const headers = columns.map(c => c.label)
  const rows = data.map(item =>
    columns.map(col => {
      if (col.render) return col.render(item)
      const val = col.key.split('.').reduce((obj, k) => obj?.[k], item)
      return val !== null && val !== undefined ? String(val) : '—'
    })
  )
  return { headers, rows }
}

// ─── PDF Export ───

/**
 * Exporte des données tabulaires en PDF
 * @param {Object[]} data - Les données à exporter
 * @param {Object[]} columns - Définition des colonnes [{ key, label, render?, align? }]
 * @param {string} title - Titre du rapport
 * @param {string} filename - Nom du fichier (sans extension)
 * @param {Object} options - Options supplémentaires
 */
export async function exportToPDF(data, columns, title = 'Rapport', filename = 'export', options = {}) {
  await loadPdfLibs()

  const doc = new jsPDF({ orientation: options.orientation || 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── En-tête ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235) // primary blue
  doc.text('SMARTFISH SOGEDIPROMA', pageWidth / 2, 18, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(title, pageWidth / 2, 26, { align: 'center' })

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Généré le ${formatDateShort(new Date())} • ${data.length} enregistrement(s)`, pageWidth / 2, 32, { align: 'center' })

  // ── Ligne de séparation ──
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(0.3)
  doc.line(14, 36, pageWidth - 14, 36)

  // ── Tableau ──
  const { headers, rows } = prepareTableData(columns, data)

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 40, bottom: 20 },
    didDrawPage: (data) => {
      // ── Pied de page ──
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `SmartFish SOGEDIPROMA • Page ${data.pageNumber} sur ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    },
  })

  // ── Résumé en pied ──
  const finalY = doc.lastAutoTable.finalY || 40
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'italic')
  doc.text(`Total: ${data.length} ligne(s) • SMARTFISH SOGEDIPROMA — Système de gestion halieutique intelligent`, 14, finalY + 10)

  // ── Sauvegarde ──
  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── Excel Export ───

/**
 * Exporte des données tabulaires en Excel (.xlsx)
 * @param {Object[]} data - Les données à exporter
 * @param {Object[]} columns - Définition des colonnes [{ key, label, render? }]
 * @param {string} filename - Nom du fichier (sans extension)
 * @param {string} sheetName - Nom de l'onglet
 */
export async function exportToExcel(data, columns, filename = 'export', sheetName = 'Données') {
  await loadExcelLibs()

  const { headers, rows } = prepareTableData(columns, data)
  const wsData = [headers, ...rows]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // ── Style de l'en-tête (largeur des colonnes) ──
  ws['!cols'] = columns.map((col, i) => {
    const maxLen = Math.max(
      (col.label || '').length,
      ...data.map(item => {
        const val = col.key.split('.').reduce((obj, k) => obj?.[k], item)
        return String(val || '').length
      })
    )
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) }
  })

  // ── Création du Workbook ──
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)) // Excel max sheet name: 31 chars

  // ── Sauvegarde ──
  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_')
  XLSX.writeFile(wb, `${safeFilename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ─── Rapports prédéfinis ───

/**
 * Exporte un rapport complet de captures en PDF
 */
export async function exportCapturesReport(captures) {
  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDateShort(r.date) },
    { key: 'bateau.nom', label: 'Bateau' },
    { key: 'espece', label: 'Espèce' },
    { key: 'poids', label: 'Poids (kg)', render: (r) => formatNumber(r.poids, 1) },
    { key: 'quantite', label: 'Qté' },
    { key: 'zonePeche', label: 'Zone' },
    { key: 'user.prenom', label: 'Enregistré par', render: (r) => r.user ? `${r.user.prenom} ${r.user.nom}` : '—' },
  ]
  await exportToPDF(captures, columns, 'Rapport des Captures', 'captures', { orientation: 'landscape' })
}

/**
 * Exporte un rapport de stocks en PDF
 */
export async function exportStocksReport(stocks) {
  const columns = [
    { key: 'espece', label: 'Espèce' },
    { key: 'quantite', label: 'Quantité', render: (r) => formatNumber(r.quantite, 1) },
    { key: 'unite', label: 'Unité' },
    { key: 'seuil', label: 'Seuil', render: (r) => formatNumber(r.seuil, 1) },
    { key: 'bateau.nom', label: 'Bateau' },
    { key: 'alerte', label: 'Alerte', render: (r) => (r.alerte || r.quantite <= r.seuil) ? '⚠️ Oui' : '✓ Non' },
    { key: 'dateEntree', label: 'Date entrée', render: (r) => formatDateShort(r.dateEntree) },
  ]
  await exportToPDF(stocks, columns, 'Rapport des Stocks', 'stocks', { orientation: 'landscape' })
}

/**
 * Exporte un rapport de ventes en PDF
 */
export async function exportVentesReport(ventes) {
  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDateShort(r.date) },
    { key: 'espece', label: 'Espèce' },
    { key: 'quantite', label: 'Qté (kg)', render: (r) => formatNumber(r.quantite, 1) },
    { key: 'prixUnitaire', label: 'Prix unit.', render: (r) => formatCurrency(r.prixUnitaire) },
    { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
    { key: 'typeClient', label: 'Type client' },
    { key: 'user.prenom', label: 'Vendeur', render: (r) => r.user ? `${r.user.prenom} ${r.user.nom}` : '—' },
  ]

  const totalCA = ventes.reduce((s, v) => s + v.total, 0)
  const totalKg = ventes.reduce((s, v) => s + v.quantite, 0)

  await exportToPDF(ventes, columns, `Rapport des Ventes — CA: ${formatCurrency(totalCA)} — ${formatNumber(totalKg)} kg`, 'ventes', { orientation: 'landscape' })
}

/**
 * Exporte un rapport d'exportations en PDF
 */
export async function exportExportationsReport(exportations) {
  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDateShort(r.date) },
    { key: 'espece', label: 'Espèce' },
    { key: 'quantite', label: 'Qté (kg)', render: (r) => formatNumber(r.quantite, 1) },
    { key: 'paysDestination', label: 'Destination' },
    { key: 'prixTotal', label: 'CA', render: (r) => formatCurrency(r.prixTotal) },
    { key: 'statut', label: 'Statut' },
    { key: 'user.prenom', label: 'Responsable', render: (r) => r.user ? `${r.user.prenom} ${r.user.nom}` : '—' },
  ]

  const totalCA = exportations.reduce((s, e) => s + e.prixTotal, 0)
  const totalKg = exportations.reduce((s, e) => s + e.quantite, 0)

  await exportToPDF(exportations, columns, `Rapport des Exportations — CA: ${formatCurrency(totalCA)} — ${formatNumber(totalKg)} kg`, 'exportations', { orientation: 'landscape' })
}
