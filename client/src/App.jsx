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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard-executif" element={<DashboardExecutif />} />
                <Route path="/dashboard-executif-avance" element={<DashboardExecutifAvance />} />
                <Route path="/dashboard-ia" element={<DashboardIA />} />
                <Route path="/dashboard-commercial" element={<DashboardCommercial />} />
                <Route path="/dashboard-durabilite" element={<DashboardDurabilite />} />
                <Route path="/dashboard-export" element={<DashboardExport />} />
                <Route path="/dashboard-operationnel" element={<DashboardOperationnel />} />

                {/* Pages de gestion */}
                <Route path="/flotte" element={<Flotte />} />
                <Route path="/captures" element={<Captures />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/achats-locaux" element={<AchatsLocaux />} />
                <Route path="/exportations" element={<Exportations />} />
                <Route path="/ventes-locales" element={<VentesLocales />} />
                <Route path="/cartographie" element={<Cartographie />} />
                <Route path="/ordres-mission" element={<OrdreMission />} />
                <Route path="/users" element={<Users />} />

                {/* Pages IA (14 modules) */}
                <Route path="/ia/analyse-risque" element={<AnalyseRisque />} />
                <Route path="/ia/anomalies" element={<AnomaliesIA />} />
                <Route path="/ia/chatbot" element={<ChatbotExecutif />} />
                <Route path="/ia/detection-fraude" element={<DetectionFraude />} />
                <Route path="/ia/maintenance-predictive" element={<MaintenancePredictive />} />
                <Route path="/ia/optimisation-flotte" element={<OptimisationFlotte />} />
                <Route path="/ia/predictions-captures" element={<PredictionsCaptures />} />
                <Route path="/ia/prevision-export" element={<PrevisionExport />} />
                <Route path="/ia/prevision-ventes" element={<PrevisionVentes />} />
                <Route path="/ia/prix-marche" element={<PrixMarche />} />
                <Route path="/ia/rapports" element={<RapportsIA />} />
                <Route path="/ia/recommandations-dg" element={<RecommandationsDG />} />
                <Route path="/ia/stock-intelligence" element={<StockIntelligence />} />
                <Route path="/ia/zones-peche" element={<ZonesPeche />} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
