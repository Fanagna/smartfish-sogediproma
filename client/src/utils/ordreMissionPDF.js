/**
 * Générateur PDF pour l'Ordre de Mission SmartFish SOGEDIPROMA
 * Utilise jspdf + jspdf-autotable pour produire un document formaté
 */

let jsPDF, autoTableLoaded = false

async function loadPdfLibs() {
  if (jsPDF && autoTableLoaded) return
  const jspdfModule = await import('jspdf')
  await import('jspdf-autotable')
  jsPDF = jspdfModule.default
  autoTableLoaded = true
}

/**
 * Convertit un nombre en toutes lettres (français)
 * Ex: 192000 → "CENT QUATRE VINGT DOUZE MILLE ARIARY"
 */
function nombreEnLettres(nombre) {
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF']
  const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF']
  const tens = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX']

  function convertBelow1000(n) {
    if (n === 0) return ''
    let result = ''
    const hundreds = Math.floor(n / 100)
    const remainder = n % 100

    if (hundreds > 0) {
      if (hundreds === 1) result += 'CENT '
      else result += units[hundreds] + ' CENT '
    }

    if (remainder > 0) {
      if (remainder < 10) result += units[remainder] + ' '
      else if (remainder < 20) result += teens[remainder - 10] + ' '
      else {
        const ten = Math.floor(remainder / 10)
        const unit = remainder % 10
        if (ten === 7 || ten === 9) {
          result += tens[ten - 1] + '-'
          result += teens[remainder - (ten * 10) + 10 - 1] + ' '
        } else {
          result += tens[ten] + ' '
          if (unit > 0) result += units[unit] + ' '
        }
      }
    }

    return result
  }

  if (nombre === 0) return 'ZÉRO ARIARY'
  
  const milliards = Math.floor(nombre / 1000000000)
  const millions = Math.floor((nombre % 1000000000) / 1000000)
  const milliers = Math.floor((nombre % 1000000) / 1000)
  const reste = nombre % 1000

  let result = ''

  if (milliards > 0) {
    result += convertBelow1000(milliards) + 'MILLIARD' + (milliards > 1 ? 'S ' : ' ')
  }
  if (millions > 0) {
    result += convertBelow1000(millions) + 'MILLION' + (millions > 1 ? 'S ' : ' ')
  }
  if (milliers > 0) {
    if (milliers === 1) result += 'MILLE '
    else result += convertBelow1000(milliers) + 'MILLE '
  }
  if (reste > 0) {
    result += convertBelow1000(reste)
  }

  return result.trim() + ' ARIARY'
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

/**
 * Formate une heure
 */
function formatHeure(h) {
  if (!h) return '—'
  return h
}

/**
 * Calcule la somme totale des indemnités équipage
 */
function totalIndemnites(equipage) {
  if (!Array.isArray(equipage)) return 0
  return equipage.reduce((sum, m) => sum + ((m.montantUnitaire || 0) * (m.nombreJours || 0)), 0)
}

/**
 * Génère le document PDF de l'Ordre de Mission
 * @param {Object} om - Les données de l'ordre de mission
 */
export async function generateOrdreMissionPDF(om) {
  await loadPdfLibs()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginLeft = 15
  const marginRight = 15
  const contentWidth = pageWidth - marginLeft - marginRight
  let y = 15

  // ── Utilities ──
  const primaryColor = [0, 51, 102]      // Bleu foncé
  const accentColor = [0, 102, 153]       // Bleu moyen
  const textColor = [51, 51, 51]          // Gris foncé
  const lightGray = [240, 240, 240]
  const white = [255, 255, 255]

  function setFont(style = 'normal', size = 10) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  function addSeparator(yPos, color = primaryColor, width = contentWidth) {
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPos, marginLeft + width, yPos)
    return yPos + 3
  }

  function drawCell(text, x, y, w, h, opts = {}) {
    const { align = 'left', bold = false, size = 8, color = textColor, fill = null, border = false } = opts
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2])
      doc.rect(x, y, w, h, 'F')
    }
    if (border) {
      doc.setDrawColor(150, 150, 150)
      doc.setLineWidth(0.2)
      doc.rect(x, y, w, h, 'S')
    }
    setFont(bold ? 'bold' : 'normal', size)
    doc.setTextColor(color[0], color[1], color[2])
    const textX = align === 'right' ? x + w - 2 : align === 'center' ? x + w / 2 : x + 2
    const textY = y + h / 2 + 1.5
    doc.text(String(text), textX, textY, { align: align === 'right' ? 'right' : align === 'center' ? 'center' : 'left', maxWidth: w - 4 })
  }

  function drawSimpleTable(headers, rows, startY, opts = {}) {
    const { headerBg = primaryColor, fontSize = 7, colWidths = null } = opts
    const rowHeight = 6
    const colCount = headers.length

    // Column widths
    const widths = colWidths || Array(colCount).fill(contentWidth / colCount)

    // Header
    let xPos = marginLeft
    headers.forEach((h, i) => {
      drawCell(h, xPos, startY, widths[i], rowHeight, {
        bold: true, size: fontSize, color: white,
        fill: headerBg, border: true, align: 'center'
      })
      xPos += widths[i]
    })

    let currentY = startY + rowHeight

    // Rows
    rows.forEach((row, rowIdx) => {
      xPos = marginLeft
      const bgColor = rowIdx % 2 === 0 ? null : lightGray
      row.forEach((cell, colIdx) => {
        drawCell(cell, xPos, currentY, widths[colIdx], rowHeight, {
          size: fontSize, color: textColor,
          fill: bgColor, border: true,
          align: colIdx === 0 ? 'left' : 'center'
        })
        xPos += widths[colIdx]
      })
      currentY += rowHeight
    })

    return currentY + 2
  }

  // ── Vérifier si on a besoin d'une nouvelle page ──
  function checkPage(newY, needed = 40) {
    if (newY > pageHeight - 30) {
      doc.addPage()
      return 15
    }
    return newY
  }

  // ════════════════════════════════════════════════════════════════
  // 1. EN-TÊTE
  // ════════════════════════════════════════════════════════════════

  // Logo / Nom société
  setFont('bold', 16)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('SMARTFISH SOGEDIPROMA', marginLeft, y)
  y += 7

  setFont('normal', 9)
  doc.setTextColor(100, 100, 100)
  doc.text('Société de Gestion et de Développement des Produits Marins', marginLeft, y)
  y += 5
  doc.text('Tél: +261 34 XX XXX XX — Email: contact@smartfish.mg', marginLeft, y)
  y += 5

  // Ligne de séparation
  y = addSeparator(y, primaryColor)
  y += 3

  // Titre
  setFont('bold', 14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('ORDRE DE MISSION', pageWidth / 2, y, { align: 'center' })
  y += 8

  // Numéro et Date sur fond bleu
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(marginLeft, y, contentWidth, 8, 'F')
  setFont('bold', 10)
  doc.setTextColor(white[0], white[1], white[2])
  doc.text(`N° ${om.numero || '_______________'}`, marginLeft + 3, y + 5.5)
  doc.text(`Date: ${formatDate(om.date)}`, marginLeft + contentWidth / 2, y + 5.5)
  y += 12

  // ════════════════════════════════════════════════════════════════
  // 2. TABLEAU MOYENS
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y)

  // Titre de section
  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('MOYENS HUMAINS ET MATÉRIELS', marginLeft, y)
  y += 5

  const moyensHeaders = ['Désignation', 'Détails']
  const moyensRows = [
    ['Bateau', `${om.bateauNom} — ${om.bateauType}`],
    ['Objet de la mission', om.objetMission],
    ['Destination', om.destination],
    ['Chef de mission', om.chefMission],
    ['Capitaine', om.capitaine],
  ]
  const moyensWidths = [50, contentWidth - 50]

  y = drawSimpleTable(moyensHeaders, moyensRows, y, { fontSize: 8, colWidths: moyensWidths })
  y += 2

  // ════════════════════════════════════════════════════════════════
  // 3. DATES / HEURES
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('DATES ET HEURES DE MISSION', marginLeft, y)
  y += 5

  const dateHeaders = ['', 'Date', 'Heure']
  const dateRows = [
    ['Départ', formatDate(om.dateDepart), formatHeure(om.heureDepart)],
    ['Arrivée', formatDate(om.dateArrivee), formatHeure(om.heureArrivee)],
  ]
  const dateWidths = [contentWidth * 0.3, contentWidth * 0.35, contentWidth * 0.35]

  y = drawSimpleTable(dateHeaders, dateRows, y, { fontSize: 8, colWidths: dateWidths })
  y += 2

  // ════════════════════════════════════════════════════════════════
  // 4. VIDANGE (GRAISSAGE)
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('GRAISSAGE / VIDANGE', marginLeft, y)
  y += 5

  const graissageHeaders = ['Désignation', 'Date', 'Total (H)', 'Prochaine Vidange (H)']
  const graissageWidths = [contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25]
  const graissageRows = [[
    'Moteur principal',
    om.vidangeDate ? formatDate(om.vidangeDate) : '—',
    om.vidangeTotal != null ? `${om.vidangeTotal} H` : '—',
    om.vidangeProchaine != null ? `${om.vidangeProchaine} H` : '—'
  ]]

  y = drawSimpleTable(graissageHeaders, graissageRows, y, { fontSize: 8, colWidths: graissageWidths })
  y += 2

  // ════════════════════════════════════════════════════════════════
  // 5. CARBURANT
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('CARBURANT', marginLeft, y)
  y += 5

  const carbuHeaders = ['Stock Restant (L)', 'Remplissage (L)', 'Stock Départ (L)', 'Consommation (L)', 'Stock Arrivée (L)']
  const carbuWidths = Array(5).fill(contentWidth / 5)
  const carbuRows = [[
    om.carburantRestant != null ? `${om.carburantRestant}` : '—',
    om.carburantRemplissage != null ? `${om.carburantRemplissage}` : '—',
    om.carburantDepart != null ? `${om.carburantDepart}` : '—',
    om.carburantConsommation != null ? `${om.carburantConsommation}` : '—',
    om.carburantArrivee != null ? `${om.carburantArrivee}` : '—'
  ]]

  y = drawSimpleTable(carbuHeaders, carbuRows, y, { fontSize: 8, colWidths: carbuWidths })
  y += 2

  // ════════════════════════════════════════════════════════════════
  // 6. ÉQUIPAGE & INDEMNITÉS
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('ÉQUIPAGE / INDEMNITÉS', marginLeft, y)
  y += 5

  const equipage = Array.isArray(om.equipage) ? om.equipage : []
  const indemHeaders = ['Nom & Prénom', 'Fonction', 'Mt Unitaire (Ar)', 'Nb Jours', 'Total (Ar)']
  const indemWidths = [
    contentWidth * 0.3,
    contentWidth * 0.25,
    contentWidth * 0.17,
    contentWidth * 0.13,
    contentWidth * 0.15
  ]

  const indemRows = equipage.map(m => [
    m.nom || '—',
    m.fonction || '—',
    (m.montantUnitaire || 0).toLocaleString('fr-MG'),
    String(m.nombreJours || 0),
    ((m.montantUnitaire || 0) * (m.nombreJours || 0)).toLocaleString('fr-MG')
  ])

  if (indemRows.length === 0) {
    indemRows.push(['—', '—', '—', '—', '—'])
  }

  y = drawSimpleTable(indemHeaders, indemRows, y, { fontSize: 7, colWidths: indemWidths })

  // Total indemnités
  const totalIndem = totalIndemnites(equipage)
  setFont('bold', 8)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(`Total Indemnités: ${totalIndem.toLocaleString('fr-MG')} Ar`, marginLeft + contentWidth - 60, y, { align: 'right' })
  y += 4

  // Heures de parcours
  if (om.dateDepart && om.dateArrivee) {
    const hDep = new Date(om.dateDepart)
    const hArr = new Date(om.dateArrivee)
    const diffMs = Math.abs(hArr - hDep)
    const heures = Math.floor(diffMs / 3600000)
    const minutes = Math.floor((diffMs % 3600000) / 60000)
    setFont('italic', 7)
    doc.setTextColor(80, 80, 80)
    doc.text(`Durée de la mission: ${heures}h ${minutes}min`, marginLeft + contentWidth - 60, y, { align: 'right' })
    y += 4
  }

  y += 2

  // Total en lettres
  setFont('italic', 7)
  doc.setTextColor(80, 80, 80)
  doc.text(`Arrêté la présente somme à: ${nombreEnLettres(totalIndem)}`, marginLeft, y)
  y += 5

  // ════════════════════════════════════════════════════════════════
  // 7. MARCHANDISES À EMBARQUER
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y, 60)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('MARCHANDISES À EMBARQUER', marginLeft, y)
  y += 5

  const marchandises = Array.isArray(om.marchandises) ? om.marchandises : []
  const mdHeaders = ['N°', 'Désignation', 'Quantité', 'Unité', 'Observation']
  const mdWidths = [8, contentWidth * 0.35, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.25]

  const mdRows = marchandises.length > 0
    ? marchandises.map((m, i) => [
        String(i + 1),
        m.designation || '—',
        m.quantite != null ? String(m.quantite) : '—',
        m.unite || '—',
        m.observation || '—'
      ])
    : [['—', 'Aucune marchandise', '—', '—', '—']]

  y = drawSimpleTable(mdHeaders, mdRows, y, { fontSize: 7, colWidths: mdWidths })
  y += 2

  // ════════════════════════════════════════════════════════════════
  // 8. PASSAGERS
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y, 60)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('PASSAGERS', marginLeft, y)
  y += 5

  const passagers = Array.isArray(om.passagers) ? om.passagers : []
  const passHeaders = ['N°', 'Nom & Prénom', 'N° CIN', 'Fonction']
  const passWidths = [8, contentWidth * 0.35, contentWidth * 0.3, contentWidth * 0.27]

  const passRows = passagers.length > 0
    ? passagers.map((p, i) => [
        String(i + 1),
        p.nom || '—',
        p.cin || '—',
        p.fonction || '—'
      ])
    : [['—', 'Aucun passager', '—', '—']]

  y = drawSimpleTable(passHeaders, passRows, y, { fontSize: 7, colWidths: passWidths })
  y += 4

  // ════════════════════════════════════════════════════════════════
  // 9. DIVERS FRAIS
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y, 60)

  setFont('bold', 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('DIVERS FRAIS', marginLeft, y)
  y += 5

  const diversFrais = Array.isArray(om.diversFrais) ? om.diversFrais : []
  const dfHeaders = ['N°', 'Désignation', 'Montant (Ar)']
  const dfWidths = [8, contentWidth * 0.52, contentWidth * 0.40]

  const dfRows = diversFrais.length > 0
    ? diversFrais.map((d, i) => [
        String(i + 1),
        d.designation || '—',
        (d.montant || 0).toLocaleString('fr-MG')
      ])
    : [['—', 'Aucun frais', '—']]

  y = drawSimpleTable(dfHeaders, dfRows, y, { fontSize: 7, colWidths: dfWidths })
  
  // Total divers frais
  const totalDF = diversFrais.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0)
  if (totalDF > 0) {
    setFont('bold', 8)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(`Total Divers Frais: ${totalDF.toLocaleString('fr-MG')} Ar`, marginLeft + contentWidth - 50, y, { align: 'right' })
    y += 6
  } else {
    y += 2
  }

  // ════════════════════════════════════════════════════════════════
  // 10. SIGNATURES
  // ════════════════════════════════════════════════════════════════

  y = checkPage(y, 50)

  if (y > pageHeight - 50) {
    doc.addPage()
    y = 15
  }

  // Ligne de séparation
  y = addSeparator(y, primaryColor)
  y += 5

  setFont('bold', 9)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('SIGNATURES', pageWidth / 2, y, { align: 'center' })
  y += 8

  // 3 blocs de signature côte à côte
  const sigWidth = contentWidth / 3
  const sigPositions = [
    { label: 'L\'ARMEMENT', x: marginLeft },
    { label: 'LA DIRECTION', x: marginLeft + sigWidth },
    { label: 'LE CAPITAINE', x: marginLeft + sigWidth * 2 }
  ]

  sigPositions.forEach((sig) => {
    setFont('bold', 8)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(sig.label, sig.x + sigWidth / 2, y, { align: 'center' })
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    // Ligne de signature
    doc.line(sig.x + 5, y + 25, sig.x + sigWidth - 5, y + 25)
    setFont('normal', 7)
    doc.setTextColor(120, 120, 120)
    doc.text('Nom & Signature', sig.x + sigWidth / 2, y + 30, { align: 'center' })
  })

  y += 38

  // ── Footer ──
  setFont('normal', 7)
  doc.setTextColor(150, 150, 150)
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `SmartFish SOGEDIPROMA — Ordre de Mission N° ${om.numero || '...'} — Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  // ── Sauvegarde ──
  const safeFilename = (om.numero || 'ordre_mission').replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`Ordre_Mission_${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`)

  // ── Impression directe ──
  return doc
}

/**
 * Génère et imprime directement l'Ordre de Mission
 */
export async function printOrdreMission(om) {
  const doc = await generateOrdreMissionPDF(om)
  doc.autoPrint()
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Export de la fonction nombreEnLettres pour le composant
export { nombreEnLettres, totalIndemnites }
