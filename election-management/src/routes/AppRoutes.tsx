import { Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { VerifyEmailRoute } from '@/components/auth/VerifyEmailRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { AdminDashboardPage } from '@/pages/dashboards/AdminDashboardPage'
import { CreateElectionPage } from '@/pages/creator/CreateElectionPage'
import { EditElectionPage } from '@/pages/creator/EditElectionPage'
import { CreatorDashboardPage } from '@/pages/dashboards/CreatorDashboardPage'
import { VoterDashboardPage } from '@/pages/dashboards/VoterDashboardPage'
import { ElectionDetailsPage } from '@/pages/ElectionDetailsPage'
import { CreatorApprovedRoute } from '@/components/creator/CreatorApprovedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/elections/:id" element={<ElectionDetailsPage />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route
        path="/verify-email"
        element={
          <VerifyEmailRoute>
            <VerifyEmailPage />
          </VerifyEmailRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/dashboard"
        element={
          <ProtectedRoute allowedRoles={['election_creator']}>
            <CreatorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/elections/new"
        element={
          <ProtectedRoute allowedRoles={['election_creator']}>
            <CreatorApprovedRoute>
              <CreateElectionPage />
            </CreatorApprovedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/elections/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['election_creator']}>
            <CreatorApprovedRoute>
              <EditElectionPage />
            </CreatorApprovedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/voter/dashboard"
        element={
          <ProtectedRoute allowedRoles={['voter']}>
            <VoterDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
