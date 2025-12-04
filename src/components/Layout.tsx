import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <Header />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto min-h-0">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


