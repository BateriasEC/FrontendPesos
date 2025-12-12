import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Catalogo from './pages/Catalogo'
import Pesajes from './pages/Pesajes'
import Reportes from './pages/Reportes'
import Recepcion from './pages/Recepcion'
import Entregas from './pages/Entregas'
import Etiqueta from './pages/Etiqueta'
import EtiquetaPublic from './pages/EtiquetaPublic'
import Clientes from './pages/Clientes'
import Vehiculos from './pages/Vehiculos'
import Gestiones from './pages/Gestiones'
import Tolerancias from './pages/Tolerancias'
import Repesos from './pages/Repesos'
import Productos from './pages/Productos'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/etiqueta/:id" element={<EtiquetaPublic />} />
        <Route element={<ProtectedRoute />}> 
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="pesajes" element={<Pesajes />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="recepcion" element={<Recepcion />} />
            <Route path="entregas" element={<Entregas />} />
            <Route path="etiqueta" element={<Etiqueta />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="vehiculos" element={<Vehiculos />} />
            <Route path="gestiones" element={<Gestiones />} />
            <Route path="tolerancias" element={<Tolerancias />} />
            <Route path="repesos" element={<Repesos />} />
            <Route path="productos" element={<Productos />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
