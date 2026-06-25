// ─── Utilitaire monétaire — Ariary malgache (Ar) ───
// Formatage centralisé pour tout le projet SmartFish

/**
 * Formate un nombre en Ariary (MGA)
 * Exemples: 1500 → "1 500 Ar" | 2500000 → "2 500 000 Ar"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '— Ar'
  const num = Number(value)
  // Les montants en Ariary n'ont pas de décimales (monnaie non-subdivisée)
  return `${num.toLocaleString('fr-MG')} Ar`
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/**
 * Formate un poids en kg
 */
export function formatWeight(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  if (value >= 1000) return `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} t`
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg`
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
}

/**
 * Formate une date courte (fr-FR)
 */
export function formatDateShort(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

/**
 * Formate une devise pour les exports PDF (sans symbole Ar)
 */
export function formatCurrencyPlain(value) {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return Number(value).toLocaleString('fr-MG')
}
