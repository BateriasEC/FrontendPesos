import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-60
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
          bg-black/20 border-r border-white/10
          overflow-y-auto
        `}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="font-semibold text-white">Menú</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded hover:bg-white/10"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto min-h-0 w-full">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


