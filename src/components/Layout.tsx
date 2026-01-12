import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex relative min-h-screen">
        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Fixed en desktop para que se quede estático */}
        <aside className={` 
          fixed md:fixed left-0 z-50
          w-64 md:w-60
          top-14 md:top-14
          h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
          bg-black/20 border-r border-white/10
          overflow-y-auto
          
        `}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="font-semibold header-text text-white">Menú</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className=" p-2 rounded hover:bg-white/100"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>
         
        {/* Main content - Con margen superior para header y margen izquierdo para sidebar en desktop , fondo de la  pagina */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full pt-20 md:pt-20 md:ml-60 min-h-screen overflow-y-auto">
          <div className="max-w-full">
          
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


