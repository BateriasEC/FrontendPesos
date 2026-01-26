import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { XMarkIcon } from '@heroicons/react/24/outline'

const HEADER_HEIGHT = '83px'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-white">
      
      {/* HEADER */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex relative min-h-screen">
        
        {/* OVERLAY MOBILE */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed left-0 z-40
            w-64 md:w-60
            top-[${HEADER_HEIGHT}]
            bottom-0
            transform
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            transition-transform duration-300 ease-in-out
            bg-black/20 border-r border-white/10
          `}
        >
          {/* CONTENEDOR INTERNO */}
          <div className="h-full flex flex-col p-3 overflow-y-auto">
            
            {/* HEADER MOBILE */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="font-semibold text-white">Menú</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded hover:bg-white/20"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* SIDEBAR */}
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* CONTENIDO */}
        <main
          className="
            flex-1 w-full
            min-h-screen
            overflow-y-auto
            pt-[calc(83px+12px)]
            md:ml-60
            p-3 sm:p-4 md:p-6
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
