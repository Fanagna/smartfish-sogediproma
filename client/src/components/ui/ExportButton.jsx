import { useState } from 'react'
import { FiDownload, FiFile, FiGrid, FiChevronDown } from 'react-icons/fi'
import Spinner from './Spinner'

/**
 * Bouton d'export réutilisable avec menu déroulant PDF / Excel
 *
 * @param {Object} props
 * @param {Function} props.onExportPDF - Fonction appelée pour l'export PDF
 * @param {Function} props.onExportExcel - Fonction appelée pour l'export Excel
 * @param {string} props.label - Texte du bouton (défaut: "Exporter")
 * @param {string} props.size - 'sm' | 'md' (défaut: 'md')
 * @param {boolean} props.loading - État de chargement
 * @param {Object} props.style - Styles supplémentaires
 */
export default function ExportButton({
  onExportPDF,
  onExportExcel,
  label = 'Exporter',
  size = 'md',
  loading = false,
  style,
}) {
  const [open, setOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const handlePDF = async () => {
    setPdfLoading(true)
    try {
      await onExportPDF?.()
    } catch (err) {
      const toastModule = await import('react-hot-toast')
      toastModule.default?.error('Erreur lors de l\'export PDF')
    } finally {
      setPdfLoading(false)
      setOpen(false)
    }
  }

  const handleExcel = async () => {
    setExcelLoading(true)
    try {
      await onExportExcel?.()
    } catch (err) {
      const toastModule = await import('react-hot-toast')
      toastModule.default?.error('Erreur lors de l\'export Excel')
    } finally {
      setExcelLoading(false)
      setOpen(false)
    }
  }

  const isSaving = pdfLoading || excelLoading
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading || isSaving}
        className={`flex items-center gap-2 rounded-xl font-medium transition-all ${
          loading || isSaving ? 'opacity-60 cursor-not-allowed' : ''
        } ${sizeClasses}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
          ...style,
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)' }}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
      >
        {isSaving ? (
          <Spinner className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} border-current`} />
        ) : (
          <FiDownload className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        {isSaving ? 'Export...' : label}
        <FiChevronDown className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 min-w-[180px] z-50"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(16px)',
            }}>
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={handlePDF}
                disabled={!onExportPDF || pdfLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)' }}>
                  <FiFile className="w-4 h-4 text-danger" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>PDF</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rapport formaté</p>
                </div>
                {pdfLoading && <Spinner className="w-4 h-4 border-primary" />}
              </button>

              <button
                onClick={handleExcel}
                disabled={!onExportExcel || excelLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}>
                  <FiGrid className="w-4 h-4 text-success" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Excel</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tableau de données</p>
                </div>
                {excelLoading && <Spinner className="w-4 h-4 border-primary" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
