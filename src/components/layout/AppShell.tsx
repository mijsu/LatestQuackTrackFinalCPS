'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { MaintenancePage } from '@/components/maintenance/MaintenancePage';
import { Loader2 } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { status, data: session } = useSession();
  const { sidebarCollapsed } = useAppStore();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  // Check maintenance mode
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setMaintenanceMode(data.maintenance_mode === 'true');
          setMaintenanceMessage(data.maintenance_message || '');
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    if (status !== 'loading') {
      checkMaintenance();
    }
  }, [status]);

  // Loading state
  if (status === 'loading' || checkingMaintenance) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Maintenance mode check - admins can still access
  const isAdmin = session?.user?.role === 'admin';
  if (maintenanceMode && !isAdmin && session) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Notification Provider for real-time toast notifications */}
      <NotificationProvider />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          // Desktop: apply margin for sidebar
          'md:transition-all',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64',
          // Mobile: no margin, full width
          'ml-0'
        )}
      >
        {/* Header */}
        <Header />
        
        {/* Main Content with bottom padding for mobile nav */}
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
