import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';
import ProfilePage from './components/ProfilePage';
import ChangePasswordPage from './components/ChangePasswordPage';
import DashboardPage from './components/DashboardPage';
import OrdersPage from './components/OrdersPage';
import OrderDetailsPage from './components/OrderDetailsPage';
import TasksPage from './components/TasksPage';
import TaskDetailsPage from './components/TaskDetailsPage';
import ShootingsPage from './components/ShootingsPage';
import ShootingDetailsPage from './components/ShootingDetailsPage';
import ContentPage from './components/ContentPage';
import ContentDetailsPage from './components/ContentDetailsPage';
import ProgramsPage from './components/ProgramsPage';
import ProgramDetailsPage from './components/ProgramDetailsPage';
import EpisodeDetailsPage from './components/EpisodeDetailsPage';
import DepartmentsPage from './components/DepartmentsPage';
import DeskDetailsPage from './components/DeskDetailsPage';
import TeamDetailsPage from './components/TeamDetailsPage';
import UsersPage from './components/UsersPage';
import UserDetailsPage from './components/UserDetailsPage';
import PermissionsPage from './components/PermissionsPage';
import NotificationsPage from './components/NotificationsPage';
import AdminProceduresPage from './components/administrative/AdminProceduresPage';
import AdminProcCategoryOrdersPage from './components/administrative/AdminProcCategoryOrdersPage';
import AdminProcOrderDetailsPage from './components/administrative/AdminProcOrderDetailsPage';
import AdminProcTaskDetailsPage from './components/administrative/AdminProcTaskDetailsPage';
import AdminProcArchivePage from './components/administrative/AdminProcArchivePage';
import MyLeaveRequestPage from './components/administrative/MyLeaveRequestPage';
import MyAdminTasksPage from './components/administrative/MyAdminTasksPage';
import WelcomePage from './components/WelcomePage';
import { useAuth } from './contexts/AuthContext';
import {
  NotificationsPage as NotificationsPlaceholder
} from './components/Placeholders';

// المستخدمين المسموح لهم بلوحة التحكم
const DASHBOARD_ALLOWED_IDS = ['74', '39', '73', '71', '72']; // غازي، نغم كيلاني، رناد، رغد، لمى

function SmartRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  const isAllowed = DASHBOARD_ALLOWED_IDS.includes(user.id?.toString() || '');
  return <Navigate to={isAllowed ? '/dashboard' : '/welcome'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<MainLayout />}>
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailsPage />} />
        <Route path="/shootings" element={<ShootingsPage />} />
        <Route path="/shootings/:id" element={<ShootingDetailsPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/content/:id" element={<ContentDetailsPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailsPage />} />
        <Route path="/episodes/:id" element={<EpisodeDetailsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/desks/:id" element={<DeskDetailsPage />} />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* قسم الإجراءات الإدارية */}
        <Route path="/administrative" element={<AdminProceduresPage />} />
        <Route path="/administrative/archive" element={<AdminProcArchivePage />} />
        <Route path="/administrative/categories/:categoryId" element={<AdminProcCategoryOrdersPage />} />
        <Route path="/administrative/orders/:id" element={<AdminProcOrderDetailsPage />} />
        <Route path="/administrative/tasks/:id" element={<AdminProcTaskDetailsPage />} />

        {/* خدمات الموظفين (متاحة للجميع) */}
        <Route path="/my-leave-request" element={<MyLeaveRequestPage />} />
        <Route path="/my-admin-tasks" element={<MyAdminTasksPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}