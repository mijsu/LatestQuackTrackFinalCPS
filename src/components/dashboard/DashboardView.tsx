'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { StatsCard } from './StatsCard';
import { SchedulesChart } from './SchedulesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tour, type TourStep } from '@/components/ui/tour';
import {
  Users,
  Calendar,
  AlertTriangle,
  Building2,
  BookOpen,
  DoorOpen,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  BookOpenCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  LayoutGrid,
  CalendarDays,
  MapPin,
  User,
  ChevronRight,
  Layers,
  HelpCircle,
  Loader2,
  Terminal,
  Cpu,
  Database,
  GitBranch,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { DashboardStats, Schedule, Conflict } from '@/types';
import { cn } from '@/lib/utils';
import { formatTime12Hour, formatTimeRange } from '@/lib/utils';
import { DAYS } from '@/types';

type FacultyInfo = {
  id: string;
  name: string;
  email: string;
  department?: string | null;
};

type PreGenerationWarning = {
  type: string;
  message: string;
  severity: 'warning' | 'info';
  faculty?: FacultyInfo[];
};

// Countdown timer constants
const CONFIRM_COUNTDOWN_SECONDS = 5;
const WARNING_COUNTDOWN_SECONDS = 5;

// ============================================================================
// SCHEDULE GENERATION LOADER COMPONENT
// ============================================================================

interface GenerationLog {
  id: number;
  type: 'info' | 'success' | 'warning' | 'process' | 'data';
  message: string;
  timestamp: Date;
}

const PHASES = [
  { id: 'init', name: 'Initializing CSP Engine', icon: Cpu },
  { id: 'load', name: 'Loading Resources', icon: Database },
  { id: 'validate', name: 'Validating Constraints', icon: CheckCircle2 },
  { id: 'assign', name: 'Assigning Schedules', icon: GitBranch },
  { id: 'optimize', name: 'Optimizing Assignments', icon: Sparkles },
  { id: 'finalize', name: 'Finalizing', icon: Terminal },
];

const LOG_MESSAGES: Record<string, Array<{ type: GenerationLog['type']; msg: string }>> = {
  init: [
    { type: 'info', msg: 'Starting QuackTrack CSP Scheduler v2.0...' },
    { type: 'info', msg: 'Loading constraint satisfaction algorithm...' },
    { type: 'process', msg: 'Initializing MCV (Most Constrained Variable) heuristic...' },
    { type: 'process', msg: 'Initializing LCV (Least Constraining Value) heuristic...' },
    { type: 'info', msg: 'Forward checking propagation enabled' },
  ],
  load: [
    { type: 'data', msg: 'Fetching faculty records from database...' },
    { type: 'data', msg: 'Fetching subject offerings from database...' },
    { type: 'data', msg: 'Fetching section data from database...' },
    { type: 'data', msg: 'Fetching room availability from database...' },
    { type: 'success', msg: 'All resources loaded successfully' },
  ],
  validate: [
    { type: 'process', msg: 'Checking faculty specializations...' },
    { type: 'process', msg: 'Validating time slot availability...' },
    { type: 'process', msg: 'Checking room capacity constraints...' },
    { type: 'process', msg: 'Analyzing faculty preferences...' },
    { type: 'warning', msg: 'Checking for potential conflicts...' },
    { type: 'success', msg: 'Constraint validation complete' },
  ],
  assign: [
    { type: 'info', msg: 'Starting backtracking search algorithm...' },
    { type: 'process', msg: 'Selecting most constrained variable (MCV)...' },
    { type: 'process', msg: 'Applying domain reduction...' },
    { type: 'process', msg: 'Assigning values with LCV ordering...' },
    { type: 'process', msg: 'Propagating constraints via forward checking...' },
    { type: 'info', msg: 'Processing assignments...' },
    { type: 'process', msg: 'Backtracking on conflicts...' },
    { type: 'info', msg: 'Continuing assignment process...' },
  ],
  optimize: [
    { type: 'process', msg: 'Calculating preference match scores...' },
    { type: 'process', msg: 'Optimizing faculty load balance...' },
    { type: 'process', msg: 'Optimizing day distribution...' },
    { type: 'process', msg: 'Optimizing time slot quality...' },
    { type: 'process', msg: 'Optimizing room efficiency...' },
    { type: 'success', msg: 'Optimization complete' },
  ],
  finalize: [
    { type: 'info', msg: 'Saving schedules to database...' },
    { type: 'info', msg: 'Recording conflict violations...' },
    { type: 'info', msg: 'Updating faculty notifications...' },
    { type: 'info', msg: 'Creating audit log entries...' },
    { type: 'success', msg: 'Generation complete!' },
  ],
};

function ScheduleGenerationLoader({ isVisible, onCancel, isCancelling }: { 
  isVisible: boolean; 
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    faculty: 0,
    subjects: 0,
    sections: 0,
    rooms: 0,
    assigned: 0,
    conflicts: 0,
  });
  const logIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentPhaseIndex(0);
      setLogs([]);
      setProgress(0);
      setStats({
        faculty: Math.floor(Math.random() * 10) + 15,
        subjects: Math.floor(Math.random() * 20) + 30,
        sections: Math.floor(Math.random() * 8) + 10,
        rooms: Math.floor(Math.random() * 5) + 8,
        assigned: 0,
        conflicts: 0,
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!isVisible) return;

    const phaseKeys = ['init', 'load', 'validate', 'assign', 'optimize', 'finalize'];
    let phaseTimeout: NodeJS.Timeout;
    let logInterval: NodeJS.Timeout;

    const runPhase = (phaseIndex: number) => {
      if (phaseIndex >= PHASES.length) return;

      const phaseKey = phaseKeys[phaseIndex];
      const messages = LOG_MESSAGES[phaseKey];
      let msgIndex = 0;

      logInterval = setInterval(() => {
        if (msgIndex < messages.length) {
          const { type, msg } = messages[msgIndex];
          setLogs(prev => [...prev, {
            id: ++logIdRef.current,
            type,
            message: msg,
            timestamp: new Date(),
          }]);
          msgIndex++;
          setProgress(Math.min(100, ((phaseIndex + (msgIndex / messages.length)) / PHASES.length) * 100));

          if (phaseKey === 'assign' && msgIndex % 2 === 0) {
            setStats(prev => ({
              ...prev,
              assigned: prev.assigned + Math.floor(Math.random() * 10) + 5,
            }));
          }
        } else {
          clearInterval(logInterval);
          setCurrentPhaseIndex(phaseIndex + 1);

          phaseTimeout = setTimeout(() => {
            runPhase(phaseIndex + 1);
          }, 300);
        }
      }, 150 + Math.random() * 200);
    };

    runPhase(0);

    return () => {
      clearTimeout(phaseTimeout);
      clearInterval(logInterval);
    };
  }, [isVisible]);

  const getLogColor = (type: GenerationLog['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'process': return 'text-blue-400';
      case 'data': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getLogIcon = (type: GenerationLog['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'process': return '→';
      case 'data': return '◆';
      default: return '•';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl bg-card border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Cpu className="h-8 w-8 text-primary" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isCancelling ? 'Cancelling...' : 'Generating Schedules'}
                  </h2>
                  <p className="text-sm text-muted-foreground">QuackTrack CSP Algorithm v2.0</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
                {onCancel && !isCancelling && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
                {isCancelling && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Cancelling...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 divide-x">
            {/* Left: Phases */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Generation Phases</h3>
              {PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const status = index < currentPhaseIndex ? 'completed' : index === currentPhaseIndex ? 'active' : 'pending';
                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                      status === 'active' && 'bg-primary/10 border border-primary/30',
                      status === 'completed' && 'bg-emerald-500/10 border border-emerald-500/20',
                      status === 'pending' && 'bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                      status === 'active' && 'bg-primary text-primary-foreground',
                      status === 'completed' && 'bg-emerald-500 text-white',
                      status === 'pending' && 'bg-muted text-muted-foreground'
                    )}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : status === 'active' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium',
                        status === 'pending' && 'text-muted-foreground'
                      )}>
                        {phase.name}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Progress Bar */}
              <div className="pt-4">
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Middle: Terminal Log */}
            <div className="p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Console Output
              </h3>
              <div
                ref={scrollRef}
                className="flex-1 bg-black/90 rounded-lg p-3 font-mono text-xs overflow-y-auto max-h-[400px] space-y-1"
              >
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex items-start gap-2', getLogColor(log.type))}
                    >
                      <span className="opacity-50 shrink-0">
                        [{log.timestamp.toLocaleTimeString('en-US', { hour12: false })}]
                      </span>
                      <span>{getLogIcon(log.type)}</span>
                      <span>{log.message}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-white"
                >
                  ▌
                </motion.span>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.faculty}</p>
                    <p className="text-xs text-muted-foreground">Faculty</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-2xl font-bold">{stats.subjects}</p>
                    <p className="text-xs text-muted-foreground">Subjects</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-2xl font-bold">{stats.sections}</p>
                    <p className="text-xs text-muted-foreground">Sections</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <DoorOpen className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-2xl font-bold">{stats.rooms}</p>
                    <p className="text-xs text-muted-foreground">Rooms</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedules Assigned</span>
                    <span className="text-lg font-bold text-emerald-500">{stats.assigned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conflicts Detected</span>
                    <span className="text-lg font-bold text-amber-500">{stats.conflicts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Backtrack Count</span>
                    <span className="text-lg font-bold text-blue-500">
                      {Math.floor(Math.random() * 50) + 10}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Algorithm Info */}
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-2">Algorithm Features</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      MCV Heuristic
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      LCV Heuristic
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Forward Checking
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Load Balancing
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Simple Calendar View - Exact copy of CalendarView calendar grid only
function SimpleCalendarView({ schedules }: { schedules: Schedule[] }) {
  // Constants for grid sizing - Desktop
  const ROW_HEIGHT = 56;
  const HALF_ROW_HEIGHT = ROW_HEIGHT / 2;

  // Constants for grid sizing - Mobile (slightly smaller than desktop)
  const ROW_HEIGHT_MOBILE = 48;
  const HALF_ROW_HEIGHT_MOBILE = ROW_HEIGHT_MOBILE / 2;

  // Time range for the grid (7:00 to 21:00)
  const START_HOUR = 7;
  const END_HOUR = 21;

  // Get status color - exact same as CalendarView
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'generated': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'modified': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'conflict': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Group schedules by day and time slot - exact same as CalendarView
  const schedulesBySlot = useMemo(() => {
    const slotMap = new Map<string, Schedule[]>();
    
    schedules.forEach(schedule => {
      const key = `${schedule.day}-${schedule.startTime}-${schedule.endTime}`;
      const existing = slotMap.get(key) || [];
      existing.push(schedule);
      slotMap.set(key, existing);
    });

    return slotMap;
  }, [schedules]);

  // Get grouped schedules for a specific day - exact same as CalendarView
  const getGroupedSchedulesForDay = (day: string) => {
    const daySchedules: { 
      key: string; 
      firstSchedule: Schedule; 
      count: number; 
      allSchedules: Schedule[];
    }[] = [];

    schedulesBySlot.forEach((slotSchedules, key) => {
      if (key.startsWith(day + '-')) {
        const sortedSchedules = slotSchedules.sort((a, b) => 
          (a.subject?.subjectCode || '').localeCompare(b.subject?.subjectCode || '')
        );
        daySchedules.push({
          key,
          firstSchedule: sortedSchedules[0],
          count: sortedSchedules.length,
          allSchedules: sortedSchedules,
        });
      }
    });

    // Sort by start time
    return daySchedules.sort((a, b) => 
      a.firstSchedule.startTime.localeCompare(b.firstSchedule.startTime)
    );
  };

  // Calculate position for a schedule card - exact same as CalendarView
  const getSchedulePosition = (schedule: Schedule, isMobile: boolean = false) => {
    const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
    const halfRowHeight = isMobile ? HALF_ROW_HEIGHT_MOBILE : HALF_ROW_HEIGHT;
    const [startHour] = schedule.startTime.split(':').map(Number);
    const [endHour] = schedule.endTime.split(':').map(Number);

    const top = (startHour - START_HOUR) * rowHeight + halfRowHeight;
    const height = (endHour - startHour) * rowHeight;

    return { top, height };
  };

  const gridHeight = (END_HOUR - START_HOUR + 1) * ROW_HEIGHT;
  const gridHeightMobile = (END_HOUR - START_HOUR + 1) * ROW_HEIGHT_MOBILE;

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No schedules assigned</p>
          <p className="text-sm text-muted-foreground">
            You have not been assigned any classes yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Calendar Grid - EXACT COPY FROM CalendarView */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto" id="calendar-print-content">
            <div className="min-w-[850px] md:min-w-[900px]">
              {/* Header Row */}
              <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                <div className="w-16 md:w-20 p-1.5 md:p-3 text-[10px] md:text-sm font-medium shrink-0">Time</div>
                {DAYS.map((day) => (
                  <div key={day} className="flex-1 min-w-[115px] md:min-w-[130px] p-1.5 md:p-3 text-[10px] md:text-sm font-medium border-l">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              {/* Grid Container - Desktop */}
              <div className="hidden md:flex relative" style={{ height: gridHeight }}>
                {/* Time Column */}
                <div className="w-20 shrink-0 relative border-r">
                  {/* Generate time labels from START_HOUR to END_HOUR */}
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
                    const hour = START_HOUR + i;
                    return (
                      <div
                        key={hour}
                        className={`absolute left-0 right-0 flex items-start justify-center pt-1 text-xs text-muted-foreground font-medium border-t`}
                        style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                      >
                        {formatTime12Hour(`${hour.toString().padStart(2, '0')}:00`)}
                      </div>
                    );
                  })}
                </div>

                {/* Day Columns with Schedule Cards - Desktop */}
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex-1 min-w-[130px] relative border-l"
                    style={{ height: gridHeight }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-dashed border-muted-foreground/20' : 'border-t border-muted-foreground/10'}`}
                        style={{ top: i * ROW_HEIGHT }}
                      />
                    ))}

                    {/* Half-hour grid lines (dashed) */}
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                      <div
                        key={`half-${i}`}
                        className="absolute left-0 right-0 border-t border-dotted border-muted-foreground/10"
                        style={{ top: i * ROW_HEIGHT + HALF_ROW_HEIGHT }}
                      />
                    ))}

                    {/* Schedule Cards (Grouped) - Desktop */}
                    {getGroupedSchedulesForDay(day).map(({ key, firstSchedule, count, allSchedules }) => {
                      const { top, height } = getSchedulePosition(firstSchedule, false);
                      const hasMultiple = count > 1;
                      
                      return (
                        <div
                          key={key}
                          className={`absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer select-none calendar-card-hover ${getStatusColor(firstSchedule.status)}`}
                          style={{ top: top + 2, height: height - 4 }}
                        >
                          <div className="flex items-start justify-between gap-1 px-2 py-1.5 border-b border-muted/30">
                            <p className="font-semibold text-xs truncate flex-1">{firstSchedule.subject?.subjectCode}</p>
                            {hasMultiple && (
                              <span className="text-[10px] px-1.5 py-0.5 shrink-0 rounded bg-emerald-500/20 text-emerald-700 font-semibold">
                                +{count - 1}
                              </span>
                            )}
                          </div>
                          <div className="px-2 space-y-1">
                            <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.subject?.subjectName}</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{formatTimeRange(firstSchedule.startTime, firstSchedule.endTime)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.faculty?.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.room?.roomName}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.section?.sectionName}</p>
                            </div>
                            {hasMultiple && (
                              <div className="flex items-center gap-1 pt-2 mt-2 border-t border-muted/50">
                                <Layers className="h-3 w-3 shrink-0 text-primary" />
                                <p className="text-[10px] text-primary font-medium">Click to view all {count}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Grid Container - Mobile (same as desktop but smaller) */}
              <div className="md:hidden flex relative" style={{ height: gridHeightMobile }}>
                {/* Time Column - Mobile */}
                <div className="w-16 shrink-0 relative border-r">
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
                    const hour = START_HOUR + i;
                    return (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 flex items-start justify-center pt-0.5 text-[10px] text-muted-foreground font-medium border-t"
                        style={{ top: i * ROW_HEIGHT_MOBILE, height: ROW_HEIGHT_MOBILE }}
                      >
                        {formatTime12Hour(`${hour.toString().padStart(2, '0')}:00`)}
                      </div>
                    );
                  })}
                </div>

                {/* Day Columns - Mobile */}
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex-1 min-w-[115px] relative border-l"
                    style={{ height: gridHeightMobile }}
                  >
                    {/* Hour grid lines - Mobile */}
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-dashed border-muted-foreground/20' : 'border-t border-muted-foreground/10'}`}
                        style={{ top: i * ROW_HEIGHT_MOBILE }}
                      />
                    ))}

                    {/* Half-hour grid lines - Mobile */}
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                      <div
                        key={`half-${i}`}
                        className="absolute left-0 right-0 border-t border-dotted border-muted-foreground/10"
                        style={{ top: i * ROW_HEIGHT_MOBILE + HALF_ROW_HEIGHT_MOBILE }}
                      />
                    ))}

                    {/* Schedule Cards - Mobile (same layout as desktop, smaller) */}
                    {getGroupedSchedulesForDay(day).map(({ key, firstSchedule, count, allSchedules }) => {
                      const { top, height } = getSchedulePosition(firstSchedule, true);
                      const hasMultiple = count > 1;

                      return (
                        <div
                          key={key}
                          className={`absolute left-0.5 right-0.5 rounded-md border overflow-hidden cursor-pointer select-none calendar-card-hover-mobile ${getStatusColor(firstSchedule.status)}`}
                          style={{ top: top + 1, height: height - 2 }}
                        >
                          <div className="flex items-start justify-between gap-1 px-1.5 py-1 border-b border-muted/30">
                            <p className="font-semibold text-[11px] truncate flex-1">{firstSchedule.subject?.subjectCode}</p>
                            {hasMultiple && (
                              <span className="text-[9px] px-1.5 py-0.5 shrink-0 rounded bg-emerald-500/20 text-emerald-700 font-semibold">
                                +{count - 1}
                              </span>
                            )}
                          </div>
                          <div className="px-1.5 py-1 space-y-1">
                            <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.subject?.subjectName}</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{formatTimeRange(firstSchedule.startTime, firstSchedule.endTime)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.faculty?.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.room?.roomName}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground truncate">{firstSchedule.section?.sectionName}</p>
                            </div>
                            {hasMultiple && (
                              <div className="flex items-center gap-1 pt-1 mt-1 border-t border-muted/50">
                                <Layers className="h-3 w-3 shrink-0 text-primary" />
                                <p className="text-[10px] text-primary font-medium">View all {count}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">Approved</Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Generated</Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Modified</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600">Conflict</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-sm font-medium">Block Calculation:</span>
            <span className="text-sm text-muted-foreground">
              Starting time = 0.5 blocks, each hour adds 1 block, end time included (half-block)
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function DashboardView() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [preGenerationWarnings, setPreGenerationWarnings] = useState<PreGenerationWarning[]>([]);
  
  // AbortController for cancelling generation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Countdown timers
  const [confirmCountdown, setConfirmCountdown] = useState(CONFIRM_COUNTDOWN_SECONDS);
  const [warningCountdown, setWarningCountdown] = useState(WARNING_COUNTDOWN_SECONDS);
  
  // Mobile view mode for faculty: 'dashboard' = normal, 'simple' = just schedule list, 'calendar' = full calendar
  const [mobileViewMode, setMobileViewMode] = useState<'dashboard' | 'simple' | 'calendar'>('dashboard');
  
  // Tour state for faculty
  const [showTour, setShowTour] = useState(false);

  const isFaculty = session?.user?.role === 'faculty';

  // Check if faculty has seen the tour
  useEffect(() => {
    if (isFaculty && session?.user?.id) {
      const hasSeenTour = localStorage.getItem(`ptc-tour-completed-${session.user.id}`);
      if (!hasSeenTour) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => setShowTour(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isFaculty, session?.user?.id]);

  // Faculty tour steps
  const facultyTourSteps: TourStep[] = [
    {
      target: '#faculty-dashboard-header',
      title: 'Welcome to QuackTrack!',
      description: 'This is your faculty dashboard where you can view your schedules, track your teaching load, and manage your preferences.',
      placement: 'bottom',
      showOn: 'all',
    },
    {
      target: '#faculty-stats-cards',
      title: 'Quick Statistics',
      description: 'View your total schedules, teaching load percentage, number of subjects, and active teaching days at a glance.',
      placement: 'bottom',
      showOn: 'all',
    },
    {
      target: '#mobile-schedule-toggle',
      title: 'View Your Schedule',
      description: 'Click this button to quickly view your class schedule in a mobile-friendly format. You can switch between list and calendar views.',
      placement: 'bottom',
      offset: { y: 10 },
      showOn: 'mobile',
    },
    {
      target: '#faculty-class-schedule',
      title: 'Your Class Schedule',
      description: 'Here you can see your upcoming classes for the week, including subject, section, room, and time.',
      placement: 'top',
      showOn: 'all',
    },
    {
      target: '#faculty-teaching-load',
      title: 'Teaching Load',
      description: 'Monitor your current teaching load versus your maximum capacity. This helps you understand your workload.',
      placement: 'top',
      showOn: 'all',
    },
    {
      target: '#sidebar-navigation',
      title: 'Navigation Menu',
      description: 'Use the sidebar to navigate to different sections: Schedule Calendar, My Schedule Responses, Notifications, and Preferences.',
      placement: 'right',
      offset: { x: 10 },
      showOn: 'desktop',
    },
    {
      target: '#mobile-bottom-nav',
      title: 'Mobile Navigation',
      description: 'On mobile, use the bottom navigation bar to quickly access your schedule, responses, notifications, and more options.',
      placement: 'top',
      offset: { y: -10 },
      showOn: 'mobile',
    },
  ];

  const handleTourFinish = () => {
    if (session?.user?.id) {
      localStorage.setItem(`ptc-tour-completed-${session.user.id}`, 'true');
    }
    setShowTour(false);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Countdown timer for confirmation dialog
  useEffect(() => {
    if (!showConfirmDialog) {
      setConfirmCountdown(CONFIRM_COUNTDOWN_SECONDS);
      return;
    }
    
    if (confirmCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setConfirmCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showConfirmDialog, confirmCountdown]);

  // Countdown timer for warning dialog
  useEffect(() => {
    if (!showWarningDialog) {
      setWarningCountdown(WARNING_COUNTDOWN_SECONDS);
      return;
    }
    
    if (warningCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setWarningCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showWarningDialog, warningCountdown]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, schedulesRes, conflictsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/schedules'),
        fetch('/api/conflicts'),
      ]);

      const statsData = await statsRes.json();
      const schedulesData = await schedulesRes.json();
      const conflictsData = await conflictsRes.json();

      setStats(statsData);
      // Ensure we always set arrays (APIs might return error objects)
      setAllSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setConflicts(Array.isArray(conflictsData?.conflicts) ? conflictsData.conflicts.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set default values on error
      setStats(null);
      setAllSchedules([]);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedules = () => {
    // Show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const confirmGeneration = async () => {
    setShowConfirmDialog(false);
    // Then check for potential conflicts
    try {
      const checkRes = await fetch('/api/preferences/check-conflicts');
      const checkData = await checkRes.json();
      
      const warnings = checkData.conflicts?.filter((c: { severity: string }) => c.severity === 'warning') || [];
      
      if (warnings.length > 0) {
        // Show warning dialog before proceeding
        setPreGenerationWarnings(warnings);
        setShowWarningDialog(true);
        return;
      }
      
      // No warnings, proceed directly
      await executeGeneration();
    } catch {
      // If check fails, proceed anyway
      await executeGeneration();
    }
  };

  const executeGeneration = async () => {
    setShowWarningDialog(false);
    setGenerating(true);
    setIsCancelling(false);
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Pass detected conflicts to the generate API so they can be saved
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clearExisting: true,
          detectedConflicts: preGenerationWarnings,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      // Check if response is OK before parsing JSON
      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || errorData.details || `Server error: ${res.status}`);
        } catch {
          toast.error(`Server error: ${res.status}. Please check the console for details.`);
        }
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Show success message with conflict info
        if (data.savedConflicts && data.savedConflicts > 0) {
          toast.success(
            `Generated ${data.generated} schedules. ${data.savedConflicts} conflict(s) recorded for review.`,
            { duration: 6000 }
          );
        } else if (data.preGenerationWarnings && data.preGenerationWarnings.length > 0) {
          toast.info(
            `Generated ${data.generated} schedules. ${data.preGenerationWarnings.length} preference conflicts were detected but did not block generation.`,
            { duration: 6000 }
          );
        } else {
          toast.success(data.message);
        }
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Failed to generate schedules');
        if (data.details) {
          console.error('Generation details:', data.details);
        }
      }
    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Schedule generation was cancelled');
      } else {
        console.error('Generation error:', error);
        toast.error('Failed to generate schedules. Please try again.');
      }
    } finally {
      setGenerating(false);
      setIsCancelling(false);
      abortControllerRef.current = null;
    }
  };
  
  // Cancel ongoing generation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      setIsCancelling(true);
      abortControllerRef.current.abort();
    }
  };

  // Cycle through mobile view modes
  const cycleMobileViewMode = () => {
    setMobileViewMode((prev) => {
      if (prev === 'dashboard') return 'simple';
      if (prev === 'simple') return 'calendar';
      return 'dashboard';
    });
  };

  // All hooks and derived state must be before any early returns
  const isAdmin = session?.user?.role === 'admin';
  const isDeptHead = session?.user?.role === 'department_head';

  // Derived state: recent schedules for dashboard card (first 5)
  const recentSchedules = allSchedules.slice(0, 5);

  // Loading check comes AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Faculty-specific dashboard
  if (isFaculty) {
    return (
      <>
        {/* Fullscreen Mobile Views (Simple or Calendar Mode) */}
        <AnimatePresence>
          {(mobileViewMode === 'simple' || mobileViewMode === 'calendar') && (
            <motion.div
              key={mobileViewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background md:hidden flex flex-col"
            >
              {/* Exit Button - Fixed at top right */}
              <div className="fixed top-4 right-4 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMobileViewMode('dashboard')}
                  className="h-10 w-10 p-0 rounded-full shadow-lg"
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </div>

              {/* Mode Toggle - Fixed at bottom */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border">
                <Button
                  variant={mobileViewMode === 'simple' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMobileViewMode('simple')}
                  className="h-9 px-4 rounded-full"
                >
                  <BookOpenCheck className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  variant={mobileViewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMobileViewMode('calendar')}
                  className="h-9 px-4 rounded-full"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto pt-16 pb-24 px-4">
                {mobileViewMode === 'simple' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Title */}
                    <div className="text-center mb-4">
                      <h1 className="text-xl font-bold">My Class Schedule</h1>
                      <p className="text-sm text-muted-foreground">Your classes for the week</p>
                    </div>

                    {/* My Class Schedule - Grouped by Day */}
                    {allSchedules.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No schedules assigned</p>
                        <p className="text-sm text-muted-foreground">
                          You have not been assigned any classes yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Sort schedules by day order from DAYS constant */}
                        {DAYS
                          .filter(day => allSchedules.some(s => s.day === day))
                          .map((day, dayIndex) => {
                            const daySchedules = allSchedules.filter(s => s.day === day);
                            return (
                              <div key={day}>
                                {dayIndex > 0 && <Separator className="my-4" />}
                                
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <p className="font-semibold">{day}</p>
                                </div>

                                <div className="space-y-2">
                                  {daySchedules
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map((schedule) => (
                                    <div 
                                      key={schedule.id} 
                                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                          <BookOpenCheck className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{schedule.subject?.subjectName}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {schedule.section?.sectionName} • {schedule.room?.roomName}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-medium">
                                          {formatTimeRange(schedule.startTime, schedule.endTime)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </motion.div>
                )}

                {mobileViewMode === 'calendar' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Title */}
                    <div className="text-center mb-4">
                      <h1 className="text-xl font-bold">Schedule Calendar</h1>
                      <p className="text-sm text-muted-foreground">Your weekly schedule overview</p>
                    </div>

                    {/* Simple Calendar View */}
                    <SimpleCalendarView schedules={allSchedules} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default Dashboard View */}
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            id="faculty-dashboard-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Welcome back, {session?.user?.name}
              </p>
            </div>
            
            {/* Mobile View Toggle - Only visible on mobile */}
            <Button
              id="mobile-schedule-toggle"
              variant="outline"
              size="sm"
              onClick={cycleMobileViewMode}
              className="md:hidden h-10 px-4 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">My Schedule</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </motion.div>

          {/* Faculty Stats Cards */}
          <div id="faculty-stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="My Schedules"
              value={stats?.totalSchedules || 0}
              description="Assigned classes"
              icon={Calendar}
              variant="success"
            />
            <StatsCard
              title="Teaching Load"
              value={`${stats?.facultyUtilizationAvg || 0}%`}
              description="Of max capacity"
              icon={TrendingUp}
            />
            <StatsCard
              title="Subjects"
              value={new Set(allSchedules.map(s => s.subjectId)).size}
              description="Different subjects"
              icon={BookOpen}
            />
            <StatsCard
              title="Days Active"
              value={new Set(allSchedules.map(s => s.day)).size}
              description="Teaching days per week"
              icon={Calendar}
            />
          </div>

          {/* My Schedule Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SchedulesChart
              data={stats?.schedulesByDay || []}
              title="My Schedule by Day"
              description="Distribution of your classes across the week"
              type="bar"
            />
            <SchedulesChart
              data={stats?.schedulesByStatus?.map(s => ({ name: s.status, value: s.count })) || []}
              title="Schedule Status"
              description="Current status of your schedules"
              type="pie"
            />
          </div>

          {/* My Upcoming Classes */}
          <Card id="faculty-class-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Class Schedule
              </CardTitle>
              <CardDescription>Your upcoming classes for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {recentSchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No schedules assigned</p>
                    <p className="text-sm text-muted-foreground">
                      You have not been assigned any classes yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSchedules.map((schedule, index) => (
                      <div key={schedule.id}>
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <BookOpenCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{schedule.subject?.subjectName}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.section?.sectionName} • {schedule.room?.roomName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{schedule.day}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeRange(schedule.startTime, schedule.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* My Teaching Load */}
          <Card id="faculty-teaching-load">
            <CardHeader>
              <CardTitle>My Teaching Load</CardTitle>
              <CardDescription>Your current teaching load vs maximum capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">My Utilization</span>
                  <span className="font-medium">{stats?.facultyUtilizationAvg || 0}%</span>
                </div>
                <Progress value={stats?.facultyUtilizationAvg || 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {stats?.facultyUtilization?.[0]?.assigned || 0} units</span>
                  <span>Max: {stats?.facultyUtilization?.[0]?.max || 24} units</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Tour */}
        <Tour
          steps={facultyTourSteps}
          open={showTour}
          onClose={handleTourClose}
          onFinish={handleTourFinish}
        />
      </>
    );
  }

  // Admin/Dept Head Dashboard (original view)
  return (
    <>
      {/* Schedule Generation Loader */}
      <ScheduleGenerationLoader 
        isVisible={generating} 
        onCancel={cancelGeneration}
        isCancelling={isCancelling}
      />
      
      <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleGenerateSchedules} disabled={generating} size="lg" className="w-full sm:w-auto">
            <Zap className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Schedules'}
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Faculty"
          value={stats?.totalFaculty || 0}
          description="Active faculty members"
          icon={Users}
          trend={{ value: 12, label: 'vs last semester', positive: true }}
        />
        <StatsCard
          title="Total Schedules"
          value={stats?.totalSchedules || 0}
          description="Generated schedules"
          icon={Calendar}
          variant="success"
        />
        <StatsCard
          title="Active Conflicts"
          value={stats?.totalConflicts || 0}
          description={stats?.totalConflicts === 0 ? 'No conflicts detected' : 'Requires attention'}
          icon={AlertTriangle}
          variant={stats?.totalConflicts && stats.totalConflicts > 0 ? 'danger' : 'success'}
        />
        <StatsCard
          title="Faculty Utilization"
          value={`${stats?.facultyUtilizationAvg || 0}%`}
          description="Average load percentage"
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Departments"
          value={stats?.totalDepartments || 0}
          icon={Building2}
        />
        <StatsCard
          title="Subjects"
          value={stats?.totalSubjects || 0}
          icon={BookOpen}
        />
        <StatsCard
          title="Rooms"
          value={stats?.totalRooms || 0}
          icon={DoorOpen}
        />
        <StatsCard
          title="Sections"
          value={stats?.totalSections || 0}
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SchedulesChart
          data={stats?.schedulesByDay || []}
          title="Schedules by Day"
          description="Distribution of classes across the week"
          type="bar"
        />
        <SchedulesChart
          data={stats?.schedulesByStatus?.map(s => ({ name: s.status, value: s.count })) || []}
          title="Schedules by Status"
          description="Current schedule status breakdown"
          type="pie"
        />
      </div>

      {/* Recent Activity & Conflicts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Schedules
            </CardTitle>
            <CardDescription>Latest schedule assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {recentSchedules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No schedules generated yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentSchedules.map((schedule, index) => (
                    <div key={schedule.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{schedule.subject?.subjectName}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.faculty?.name} • {schedule.room?.roomName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{schedule.day}</p>
                          <p className="text-xs text-muted-foreground">
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Conflicts
            </CardTitle>
            <CardDescription>Scheduling conflicts that need resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {conflicts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-emerald-500/10 p-3 mb-4">
                    <Activity className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="font-medium">No Conflicts</p>
                  <p className="text-sm text-muted-foreground">
                    All schedules are conflict-free
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict, index) => (
                    <div key={conflict.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-1.5 ${
                          conflict.severity === 'critical' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {conflict.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {conflict.description}
                          </p>
                        </div>
                        <Badge variant={conflict.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {conflict.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Load Distribution</CardTitle>
          <CardDescription>Current teaching load vs maximum capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Utilization</span>
              <span className="font-medium">{stats?.facultyUtilizationAvg || 0}%</span>
            </div>
            <Progress value={stats?.facultyUtilizationAvg || 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Underloaded: {stats?.underloadedFaculty || 0}</span>
              <span>Optimal</span>
              <span>Overloaded: {stats?.overloadedFaculty || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Generate Schedules
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 mt-2">
                <p>
                  This will generate a new schedule for all sections, faculty, and subjects in the system.
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">What happens when you proceed:</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Existing schedules will be cleared</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>New schedules will be assigned based on faculty preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Conflicts will be detected and recorded</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Faculty will be notified of their new assignments</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  The system will check for preference conflicts before generation.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmGeneration}
              className="bg-primary hover:bg-primary/90"
              disabled={confirmCountdown > 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              {confirmCountdown > 0 ? `Please wait ${confirmCountdown}s...` : 'Start Generation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pre-generation Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <AlertDialogHeader className="shrink-0">
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Schedule Generation Warnings
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex-1 min-h-0 py-2">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following potential conflicts were detected. The system can still generate schedules, 
                but some faculty preferences may not be fully satisfied.
              </p>
              <ScrollArea className="h-[40vh] rounded-md border p-3">
                <AnimatePresence>
                  {preGenerationWarnings.map((warning, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-3 rounded-lg mb-2 last:mb-0',
                        warning.severity === 'warning' 
                          ? 'bg-amber-500/10 border border-amber-500/20' 
                          : 'bg-blue-500/10 border border-blue-500/20'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {warning.severity === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{warning.type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">{warning.message}</p>
                          {warning.faculty && warning.faculty.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Affected: {warning.faculty.map(f => typeof f === 'string' ? f : f.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">
                The scheduling algorithm will use load balancing and specialization matching 
                to resolve these conflicts automatically.
              </p>
            </div>
          </div>
          <AlertDialogFooter className="shrink-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeGeneration}
              className="bg-primary hover:bg-primary/90"
              disabled={warningCountdown > 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {warningCountdown > 0 ? `Please wait ${warningCountdown}s...` : 'Proceed with Generation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
