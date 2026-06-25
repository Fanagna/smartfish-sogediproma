import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'

export default function DashboardExecutif() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/dashboard-executif-avance', { replace: true })
  }, [navigate])
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-lg font-bold text-theme-primary">Redirection vers Exécutif Avancé...</p>
      </div>
    </div>
  )
}
