import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { genererRapport } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { FiFile, FiCalendar, FiDownload, FiRefreshCw, FiInfo, FiCpu, FiClock, FiCheckCircle, FiBarChart2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TYPES_RAPPORTS = [
  { value: 'journalier', label: 'Journalier', icon: FiClock, color: 'bg-accent/10 text-accent', desc: 'Rapport du jour avec les KPIs clés' },
  { value: 'hebdomadaire', label: 'Hebdomadaire', icon: FiCalendar, color: 'bg-primary/10 text-primary', desc: 'Bilan de la semaine écoulée' },
  { value: 'mensuel', label: 'Mensuel', icon: FiBarChart2, color: 'bg-warning/10 text-warning', desc: 'Analyse complète du mois' },
]

export default function RapportsIA() {
  const [type, setType] = useState('hebdomadaire')
  const [rapportContent, setRapportContent] = useState(null)

  const generateMutation = useMutation({
    mutationFn: genererRapport,
    onSuccess: (data) => {
      const contenu = data?.contenu || data?.rapport?.contenu || ''
      if (contenu) {
        setRapportContent({ titre: data?.titre || data?.rapport?.titre || `Rapport ${type}`, contenu })
        toast.success('Rapport généré avec succès')
      } else {
        toast.error('Contenu du rapport vide')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur de génération')
  })

  const downloadAsMarkdown = () => {
    if (!rapportContent) return
    const blob = new Blob([rapportContent.contenu], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${type}-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Rapport téléchargé')
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl"><FiFile className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Rapports IA</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA13</span>
          </div>
          <p className="text-theme-secondary ml-1">Génération intelligente de rapports par IA — {rapportContent ? 'Rapport prêt' : 'Sélectionnez un type'}</p>
        </div>
      </div>

      {/* Type selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TYPES_RAPPORTS.map(t => (
          <button key={t.value} onClick={() => { setType(t.value); setRapportContent(null) }}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              type === t.value ? 'border-accent bg-accent/5 shadow-lg' : 'border-theme-subtle bg-theme-elevated hover:border-gray-300'
            }`}>
            <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center mb-3`}>
              <t.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-theme-primary">{t.label}</h3>
            <p className="text-xs text-theme-secondary mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => generateMutation.mutate(type)} disabled={generateMutation.isPending} className="flex items-center gap-2">
          {generateMutation.isPending ? <Spinner className="w-4 h-4 border-2 border-white/30 border-t-white" /> : <FiCpu className="w-4 h-4" />}
          {generateMutation.isPending ? 'Génération en cours...' : `Générer le rapport ${type}`}
        </Button>
        {rapportContent && (
          <Button variant="secondary" onClick={downloadAsMarkdown} className="flex items-center gap-2">
            <FiDownload className="w-4 h-4" /> Télécharger (.md)
          </Button>
        )}
      </div>

      {/* Report content */}
      {generateMutation.isPending && (
        <Card variant="glass" className="!p-8">
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner className="w-12 h-12 border-4 border-accent/30 border-t-accent" />
            <div className="text-center">
              <p className="text-lg font-bold text-theme-primary">Génération du rapport {type}</p>
              <p className="text-sm text-theme-secondary mt-1">L'IA analyse les données et rédige le rapport...</p>
            </div>
          </div>
        </Card>
      )}

      {rapportContent && !generateMutation.isPending && (
        <Card variant="glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success/10 rounded-xl"><FiCheckCircle className="w-5 h-5 text-success" /></div>
              <div>
                <h3 className="text-lg font-bold text-theme-primary">{rapportContent.titre}</h3>
                <p className="text-xs text-theme-secondary">Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={downloadAsMarkdown} className="flex items-center gap-2">
              <FiDownload className="w-4 h-4" /> Télécharger
            </Button>
          </div>
          <div className="prose prose-sm max-w-none bg-theme-surface rounded-xl p-6 border border-theme-subtle overflow-auto max-h-[500px] custom-scrollbar">
            {rapportContent.contenu.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-theme-primary mt-6 mb-2">{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-theme-primary mt-5 mb-2">{line.slice(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-theme-primary mt-4 mb-1">{line.slice(4)}</h3>
              if (line.startsWith('- ')) return <li key={i} className="text-sm text-theme-primary ml-4 list-disc">{line.slice(2)}</li>
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-bold text-theme-primary my-1">{line.slice(2, -2)}</p>
              if (line.trim() === '') return <div key={i} className="h-2" />
              return <p key={i} className="text-sm text-theme-primary leading-relaxed">{line}</p>
            })}
          </div>
        </Card>
      )}

      {!rapportContent && !generateMutation.isPending && (
        <div className="text-center py-16">
          <FiFile className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun rapport généré</h3>
          <p className="text-theme-tertiary mb-6">Choisissez un type de rapport et cliquez sur Générer</p>
        </div>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiFile className="w-5 h-5 text-accent" /></div>
          <div><h3 className="font-bold text-theme-primary mb-1">À propos d'IA13</h3><p className="text-sm text-theme-secondary">Génère des rapports détaillés (journalier, hebdomadaire, mensuel) avec résumé exécutif, KPIs, analyse des captures, stocks, flotte, ventes, exportations, anomalies et recommandations. Téléchargeable en Markdown.</p></div>
        </div>
      </Card>
    </div>
  )
}
