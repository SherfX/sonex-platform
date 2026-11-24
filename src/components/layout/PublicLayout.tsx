import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { ChatWidget } from '../public/ChatWidget'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}