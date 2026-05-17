import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { MfaRoute } from '@/components/auth/MfaRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RecoveryRoute } from '@/components/auth/RecoveryRoute'
import { VerifyEmailRoute } from '@/components/auth/VerifyEmailRoute'
import { BrowseElectionsPage } from '@/pages/BrowseElectionsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { MfaVerifyPage } from '@/pages/MfaVerifyPage'
import { AccountSecurityPage } from '@/pages/AccountSecurityPage'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminElectionDetailPage } from '@/pages/admin/AdminElectionDetailPage'
import { AdminElectionsPage } from '@/pages/admin/AdminElectionsPage'
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage'
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminRequestsPage } from '@/pages/admin/AdminRequestsPage'
import { AdminSecurityPage } from '@/pages/admin/AdminSecurityPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminVotersPage } from '@/pages/admin/AdminVotersPage'
import { CreatorLayout } from '@/components/creator/layout/CreatorLayout'
import { CreateElectionPage } from '@/pages/creator/CreateElectionPage'
import { CreatorCandidatesPage } from '@/pages/creator/CreatorCandidatesPage'
import { CreatorControlPage } from '@/pages/creator/CreatorControlPage'
import { CreatorElectionDetailPage } from '@/pages/creator/CreatorElectionDetailPage'
import { CreatorMyElectionsPage } from '@/pages/creator/CreatorMyElectionsPage'
import { CreatorNotificationsPage } from '@/pages/creator/CreatorNotificationsPage'
import { CreatorParticipantsPage } from '@/pages/creator/CreatorParticipantsPage'
import { CreatorProfilePage } from '@/pages/creator/CreatorProfilePage'
import { CreatorReportsPage } from '@/pages/creator/CreatorReportsPage'
import { CreatorResultsPage } from '@/pages/creator/CreatorResultsPage'
import { CreatorSecretIdsPage } from '@/pages/creator/CreatorSecretIdsPage'
import { CreatorSettingsPage } from '@/pages/creator/CreatorSettingsPage'
import { EditElectionPage } from '@/pages/creator/EditElectionPage'
import { ElectionJoinPage } from '@/pages/ElectionJoinPage'
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
      <Route path="/browse-elections" element={<BrowseElectionsPage />} />
      <Route path="/elections/:id" element={<ElectionDetailsPage />} />
      <Route path="/elections/:id/join" element={<ElectionJoinPage />} />
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
          <RecoveryRoute>
            <ResetPasswordPage />
          </RecoveryRoute>
        }
      />

      <Route
        path="/mfa-verify"
        element={
          <MfaRoute>
            <MfaVerifyPage />
          </MfaRoute>
        }
      />

      <Route
        path="/account/security"
        element={
          <ProtectedRoute>
            <AccountSecurityPage />
          </ProtectedRoute>
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
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="requests" element={<AdminRequestsPage />} />
        <Route path="elections" element={<AdminElectionsPage />} />
        <Route path="elections/:id" element={<AdminElectionDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="voters" element={<AdminVotersPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="security" element={<AdminSecurityPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
      <Route path="/admin/approvals" element={<Navigate to="/admin/requests" replace />} />
      <Route
        path="/creator"
        element={
          <ProtectedRoute allowedRoles={['election_creator']}>
            <CreatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CreatorDashboardPage />} />
        <Route
          path="elections"
          element={
            <CreatorApprovedRoute>
              <CreatorMyElectionsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="candidates"
          element={
            <CreatorApprovedRoute>
              <CreatorCandidatesPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="participants"
          element={
            <CreatorApprovedRoute>
              <CreatorParticipantsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="control"
          element={
            <CreatorApprovedRoute>
              <CreatorControlPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="secret-ids"
          element={
            <CreatorApprovedRoute>
              <CreatorSecretIdsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="results"
          element={
            <CreatorApprovedRoute>
              <CreatorResultsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <CreatorApprovedRoute>
              <CreatorNotificationsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <CreatorApprovedRoute>
              <CreatorReportsPage />
            </CreatorApprovedRoute>
          }
        />
        <Route path="settings" element={<CreatorSettingsPage />} />
        <Route path="profile" element={<CreatorProfilePage />} />
        <Route
          path="elections/new"
          element={
            <CreatorApprovedRoute>
              <CreateElectionPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="elections/:id"
          element={
            <CreatorApprovedRoute>
              <CreatorElectionDetailPage />
            </CreatorApprovedRoute>
          }
        />
        <Route
          path="elections/:id/edit"
          element={
            <CreatorApprovedRoute>
              <EditElectionPage />
            </CreatorApprovedRoute>
          }
        />
      </Route>
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
