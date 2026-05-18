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
import {
  NotificationsPage as NotificationsPlaceholder
} from './components/Placeholders';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}