import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, AdminRoute } from './routes/RouteGuards';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';

// Patron Pages
import { PatronDashboard } from './pages/patron/PatronDashboard';
import { BrowseBooksPage } from './pages/patron/BrowseBooksPage';
import { MyBorrowingsPage } from './pages/patron/MyBorrowingsPage';
import { ScoreHistoryPage } from './pages/patron/ScoreHistoryPage';
import { MyDisputesPage } from './pages/patron/MyDisputesPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BooksManagementPage } from './pages/admin/BooksManagementPage';
import { PatronsManagementPage } from './pages/admin/PatronsManagementPage';
import { PatronDetailPage } from './pages/admin/PatronDetailPage';
import { BorrowRequestsPage } from './pages/admin/BorrowRequestsPage';
import { IssueBookPage } from './pages/admin/IssueBookPage';
import { ReturnProcessingPage } from './pages/admin/ReturnProcessingPage';
import { OverdueMonitoringPage } from './pages/admin/OverdueMonitoringPage';
import { DefaultersPage } from './pages/admin/DefaultersPage';
import { ScoreManagementPage } from './pages/admin/ScoreManagementPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

export default function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes with standard Layout (no sidebar) */}
        <Route element={<Layout withSidebar={false} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Patron Protected Routes (with sidebar) */}
        <Route
          path="/patron"
          element={
            <ProtectedRoute>
              <Layout withSidebar={true} />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatronDashboard />} />
          <Route path="books" element={<BrowseBooksPage />} />
          <Route path="borrowings" element={<MyBorrowingsPage />} />
          <Route path="score-history" element={<ScoreHistoryPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="disputes" element={<MyDisputesPage />} />
        </Route>

        {/* Admin Protected Routes (with sidebar) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout withSidebar={true} />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="books" element={<BooksManagementPage />} />
          <Route path="patrons" element={<PatronsManagementPage />} />
          <Route path="patrons/:id" element={<PatronDetailPage />} />
          <Route path="requests" element={<BorrowRequestsPage />} />
          <Route path="issue" element={<IssueBookPage />} />
          <Route path="return" element={<ReturnProcessingPage />} />
          <Route path="overdue" element={<OverdueMonitoringPage />} />
          <Route path="defaulters" element={<DefaultersPage />} />
          <Route path="scores" element={<ScoreManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
