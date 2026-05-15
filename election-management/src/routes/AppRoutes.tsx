import { Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { VerifyEmailRoute } from '@/components/auth/VerifyEmailRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage'
import { AdminDashboardPage } from '@/pages/dashboards/AdminDashboardPage'
import { CreateElectionPage } from '@/pages/creator/CreateElectionPage'
import { EditElectionPage } from '@/pages/creator/EditElectionPage'
import { CreatorDashboardPage } from '@/pages/dashboards/CreatorDashboardPage'
import { VoterDashboardPage } from '@/pages/dashboards/VoterDashboardPage'
import { ElectionDetailsPage } from '@/pages/ElectionDetailsPage'
import { VotingPage } from '@/pages/VotingPage'
import { ElectionResultsPage } from '@/pages/ElectionResultsPage'
import { ResultsIndexPage } from '@/pages/ResultsIndexPage'
import { CreatorApprovedRoute } from '@/components/creator/CreatorApprovedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/elections/:id" element={<ElectionDetailsPage />} />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsIndexPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/elections/:id/results"
        element={
          <ProtectedRoute>
            <ElectionResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/elections/:id/vote"
        element={
          <ProtectedRoute allowedRoles={['voter']}>
            <VotingPage />
          </ProtectedRoute>
        }
      />

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
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
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
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAuditLogsPage />
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
