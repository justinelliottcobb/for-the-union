import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { Sidebar } from '@components/Sidebar';
import { DashboardPage } from '@/routes/dashboard';
import { ExercisePage } from '@/routes/exercise';
import { ProgressPage } from '@/routes/progress';
import { SettingsPage } from '@/routes/settings';

export default function App() {
  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'md' }}
      padding="md"
    >
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercise/:categoryId/:exerciseId" element={<ExercisePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}