import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardExecutif from './pages/DashboardExecutif'
import DashboardIA from './pages/DashboardIA'
import DashboardCommercial from './pages/DashboardCommercial'
import DashboardDurabilite from './pages/DashboardDurabilite'
import DashboardExport from './pages/DashboardExport'
import DashboardOperationnel from './pages/DashboardOperationnel'
import DashboardExecutifAvance from './pages/DashboardExecutifAvance'
import Flotte from './pages/Flotte'
import Captures from './pages/Captures'
import Stocks from './pages/Stocks'
import Anomalies from './pages/Anomalies'
import Clients from './pages/Clients'
import AchatsLocaux from './pages/AchatsLocaux'
import Exportations from './pages/Exportations'
import VentesLocales from './pages/VentesLocales'
import Cartographie from './pages/Cartographie'
import OrdreMission from './pages/OrdreMission'
import Users from './pages/Users'

// Pages IA (14 modules)
import AnalyseRisque from './pages/ia/AnalyseRisque'
import AnomaliesIA from './pages/ia/AnomaliesIA'
import ChatbotExecutif from './pages/ia/ChatbotExecutif'
import DetectionFraude from './pages/ia/DetectionFraude'
import MaintenancePredictive from './pages/ia/MaintenancePredictive'
import OptimisationFlotte from './pages/ia/OptimisationFlotte'
import PredictionsCaptures from './pages/ia/PredictionsCaptures'
import PrevisionExport from './pages/ia/PrevisionExport'
import PrevisionVentes from './pages/ia/PrevisionVentes'
import PrixMarche from './pages/ia/PrixMarche'
import RapportsIA from './pages/ia/RapportsIA'
import RecommandationsDG from './pages/ia/RecommandationsDG'
import StockIntelligence from './pages/ia/StockIntelligence'
import ZonesPeche from './pages/ia/ZonesPeche'

// ─── Configuration centralisée des routes protégées ───
// Chaque route peut optionnellement spécifier un tableau `roles` pour restreindre l'accès.
// Si `roles` est absent, tout utilisateur authentifié peut accéder à la page.
const dashboardRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/dashboard-executif', element: <DashboardExecutif /> },
  { path: '/dashboard-executif-avance', element: <DashboardExecutifAvance />, roles: ['ADMIN'] },
  { path: '/dashboard-ia', element: <DashboardIA /> },
  { path: '/dashboard-commercial', element: <DashboardCommercial />, roles: ['ADMIN', 'CAPITAINE'] },
  { path: '/dashboard-durabilite', element: <DashboardDurabilite />, roles: ['ADMIN'] },
  { path: '/dashboard-export', element: <DashboardExport />, roles: ['ADMIN'] },
  { path: '/dashboard-operationnel', element: <DashboardOperationnel /> },
]

const gestionRoutes = [
  { path: '/flotte', element: <Flotte /> },
  { path: '/ordres-mission', element: <OrdreMission /> },
  { path: '/captures', element: <Captures /> },
  { path: '/stocks', element: <Stocks /> },
  { path: '/anomalies', element: <Anomalies /> },
  { path: '/clients', element: <Clients /> },
  { path: '/achats-locaux', element: <AchatsLocaux /> },
  { path: '/exportations', element: <Exportations /> },
  { path: '/ventes-locales', element: <VentesLocales /> },
  { path: '/cartographie', element: <Cartographie /> },
  { path: '/users', element: <Users />, roles: ['ADMIN'] },
]

const iaRoutes = [
  { path: '/ia/analyse-risque', element: <AnalyseRisque /> },
  { path: '/ia/anomalies', element: <AnomaliesIA /> },
  { path: '/ia/chatbot', element: <ChatbotExecutif /> },
  { path: '/ia/detection-fraude', element: <DetectionFraude /> },
  { path: '/ia/maintenance-predictive', element: <MaintenancePredictive /> },
  { path: '/ia/optimisation-flotte', element: <OptimisationFlotte /> },
  { path: '/ia/predictions-captures', element: <PredictionsCaptures /> },
  { path: '/ia/prevision-export', element: <PrevisionExport /> },
  { path: '/ia/prevision-ventes', element: <PrevisionVentes /> },
  { path: '/ia/prix-marche', element: <PrixMarche /> },
  { path: '/ia/rapports', element: <RapportsIA /> },
  { path: '/ia/recommandations-dg', element: <RecommandationsDG /> },
  { path: '/ia/stock-intelligence', element: <StockIntelligence /> },
  { path: '/ia/zones-peche', element: <ZonesPeche /> },
]

// Helper : applique ProtectedRoute avec restriction de rôle si nécessaire
const renderRoute = ({ path, element, roles }) => (
  <Route key={path} path={path} element={roles ? <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute> : element} />
)

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" /> : children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {dashboardRoutes.map(renderRoute)}
                {gestionRoutes.map(renderRoute)}
                {iaRoutes.map(renderRoute)}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
