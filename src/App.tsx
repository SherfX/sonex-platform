import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { PageLoader } from './components/ui/PageLoader'
import { PublicLayout } from './components/layout/PublicLayout'
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { ServicesPage } from './pages/public/ServicesPage'
import { ContactPage } from './pages/public/ContactPage'
import { OurWorkPage } from './pages/public/OurWorkPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PortalLayout } from './pages/portal/PortalLayout'
import { DashboardPage } from './pages/portal/DashboardPage'
import { ProjectDetailPage } from './pages/portal/ProjectDetailPage'
import { BoqPage } from './pages/portal/BoqPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { EnquiriesPage } from './pages/admin/EnquiriesPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { AdminBoqPage } from './pages/admin/AdminBoqPage'
import { DownloadRequestsPage } from './pages/admin/DownloadRequestsPage'
import { ProgressUploadPage } from './pages/admin/ProgressUploadPage'
import { PublicChatsPage } from './pages/admin/PublicChatsPage'
import { SiteContentPage } from './pages/admin/SiteContentPage'
import { ShowcaseProjectsPage } from './pages/admin/ShowcaseProjectsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

const STAFF_ROLES = new Set(['super_admin', 'admin', 'staff'])

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ id: string } | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user ? { id: data.session.user.id } : null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession?.user ? { id: nextSession.user.id } : null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <PageLoader label="Checking your session…" />
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) {
        if (mounted) setState('denied')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (mounted) {
        setState(profile?.role && STAFF_ROLES.has(profile.role) ? 'allowed' : 'denied')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (state === 'loading') return <PageLoader label="Loading admin…" />
  if (state === 'denied') return <Navigate to="/portal" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/work" element={<OurWorkPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:id/boq" element={<BoqPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="projects/:id/boq" element={<AdminBoqPage />} />
            <Route path="download-requests" element={<DownloadRequestsPage />} />
            <Route path="projects/:id/progress" element={<ProgressUploadPage />} />
            <Route path="chats" element={<PublicChatsPage />} />
            <Route path="content" element={<SiteContentPage />} />
            <Route path="showcase" element={<ShowcaseProjectsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}