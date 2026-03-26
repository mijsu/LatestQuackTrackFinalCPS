'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useAppStore, type ViewMode } from '@/store';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  BookOpen,
  DoorOpen,
  GraduationCap,
  Settings,
  Bell,
  AlertTriangle,
  CalendarDays,
  UserCog,
  FileText,
  Shield,
  User,
  MessageSquareWarning,
  MoreHorizontal,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  id: ViewMode;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

// Primary navigation items for mobile bottom nav
const primaryNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin', 'faculty'] },
  { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'faculty'] },
  { id: 'schedules', label: 'Schedules', icon: CalendarDays, roles: ['admin'] },
  { id: 'faculty', label: 'Faculty', icon: Users, roles: ['admin'] },
  { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: ['admin'] },
  { id: 'rooms', label: 'Rooms', icon: DoorOpen, roles: ['admin'] },
  { id: 'sections', label: 'Sections', icon: GraduationCap, roles: ['admin'] },
  { id: 'departments', label: 'Depts', icon: Building2, roles: ['admin'] },
  { id: 'users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, roles: ['admin'] },
  { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  { id: 'preferences', label: 'Prefs', icon: Settings, roles: ['faculty'] },
  { id: 'my-responses', label: 'Responses', icon: MessageSquareWarning, roles: ['faculty'] },
  { id: 'notifications', label: 'Alerts', icon: Bell, roles: ['admin', 'faculty'] },
  { id: 'profile', label: 'Profile', icon: User, roles: ['admin', 'faculty'] },
  { id: 'settings', label: 'Settings', icon: Shield, roles: ['admin'] },
];

export function MobileBottomNav() {
  const { data: session } = useSession();
  const { viewMode, setViewMode } = useAppStore();

  const userRole = session?.user?.role || '';
  const filteredNavItems = primaryNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = (id: ViewMode) => {
    setViewMode(id);
  };

  return (
    <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80 safe-area-inset-bottom">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center justify-around px-2 py-2 gap-1">
          {filteredNavItems.slice(0, 5).map((item) => {
            const isActive = viewMode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[56px] h-14 px-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-8 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
          
          {/* More button - shows remaining items in a popover */}
          {filteredNavItems.length > 5 && (
            <MoreNavItems 
              items={filteredNavItems.slice(5)} 
              currentView={viewMode}
              onNavClick={handleNavClick}
            />
          )}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </nav>
  );
}

function MoreNavItems({ 
  items, 
  currentView, 
  onNavClick 
}: { 
  items: NavItem[]; 
  currentView: ViewMode;
  onNavClick: (id: ViewMode) => void;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);

  const handleItemClick = (id: ViewMode) => {
    onNavClick(id);
    setOpen(false);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    window.location.reload();
  };

  // Fetch user image for faculty
  useEffect(() => {
    const fetchUserImage = async () => {
      if (!session?.user?.id || session?.user?.role !== 'faculty') return;
      try {
        const res = await fetch(`/api/users/${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserImage(data.image);
        }
      } catch (error) {
        console.error('Error fetching user image:', error);
      }
    };
    
    if (session?.user?.role === 'faculty') {
      fetchUserImage();
    }
  }, [session?.user?.id, session?.user?.role]);

  const hasActiveItem = items.some(item => item.id === currentView);
  const isFaculty = session?.user?.role === 'faculty';

  // Get role badge info
  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      admin: { label: 'Admin', variant: 'default' },
      faculty: { label: 'Faculty', variant: 'outline' },
    };
    return badges[role] || { label: role, variant: 'outline' };
  };

  const roleBadge = getRoleBadge(session?.user?.role || '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] h-14 px-2 rounded-xl transition-all duration-200',
            hasActiveItem
              ? 'bg-green-500/15 text-green-600 dark:text-green-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          <MoreHorizontal className={cn(
            'h-5 w-5 mb-1 transition-transform duration-200',
            hasActiveItem && 'scale-110'
          )} />
          <span className={cn(
            'text-[10px] font-medium',
            hasActiveItem && 'font-semibold'
          )}>
            More
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end"
        side="top"
        sideOffset={8}
        className="w-72 p-0 rounded-2xl shadow-xl border-2 overflow-hidden"
      >
        {/* User Profile Section for Faculty */}
        {isFaculty && (
          <div className="p-4 bg-muted/30 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={userImage || session?.user?.image || ''} alt={session?.user?.name || ''} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                <Badge variant={roleBadge.variant} className="mt-1 text-[10px]">
                  {roleBadge.label}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="p-2">
          <p className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
            More Options
          </p>
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign Out for Faculty */}
        {isFaculty && (
          <div className="p-2 border-t">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
