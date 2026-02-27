import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-white">
      
      {/* HEADER */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex relative">
        
        {/* OVERLAY MOBILE */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ top: '83px' }}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed left-0 z-40
            w-64 md:w-60
            bottom-0
            transform
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            transition-transform duration-300 ease-in-out
            bg-[#1c1c1e] border-r border-white/10
          `}
          style={{ top: '83px' }}
        >
          {/* CONTENEDOR INTERNO */}
          <div className="h-full flex flex-col p-4 overflow-y-auto">
            
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
            min-h-[calc(100vh-83px)]
            overflow-y-auto
            md:ml-60
            p-4 sm:p-6 md:p-8
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
