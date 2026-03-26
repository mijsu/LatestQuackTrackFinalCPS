'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DAYS } from '@/types';
import { useAppStore } from '@/store';
import { Calendar as CalendarIcon, Filter, Printer, Download, User, MapPin, Users, Clock, Layers, Search, LayoutGrid, BookOpen, ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime12Hour, formatTimeRange, calculateBlocks } from '@/lib/utils';
import type { Schedule, User, Section, Room } from '@/types';

// Constants for grid sizing - Desktop
const ROW_HEIGHT = 56;
const HALF_ROW_HEIGHT = ROW_HEIGHT / 2;

// Constants for grid sizing - Mobile (slightly smaller than desktop)
const ROW_HEIGHT_MOBILE = 48;
const HALF_ROW_HEIGHT_MOBILE = ROW_HEIGHT_MOBILE / 2;

// Time range for the grid (7:00 to 21:00)
const START_HOUR = 7;
const END_HOUR = 21;

// Maximum schedules to display per day (one per time slot)
const MAX_SCHEDULES_PER_DAY = 14;

export function CalendarView() {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { calendarFilters, setCalendarFilters } = useAppStore();

  // Dialog state for showing multiple schedules
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
    schedules: Schedule[];
  } | null>(null);

  // View mode state (calendar or grid)
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');

  // Filter expanded state
  const [filterExpanded, setFilterExpanded] = useState(false);

  const isFaculty = session?.user?.role === 'faculty';

  useEffect(() => {
    if (isFaculty && session?.user?.id) {
      setCalendarFilters({ faculty: session.user.id });
    }
  }, [isFaculty, session?.user?.id, setCalendarFilters]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session?.user]);

  const fetchData = async () => {
    try {
      const [schedulesRes, usersRes, sectionsRes, roomsRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/users?role=faculty'),
        fetch('/api/sections'),
        fetch('/api/rooms'),
      ]);

      const schedulesData = await schedulesRes.json();
      const usersData = await usersRes.json();
      const sectionsData = await sectionsRes.json();
      const roomsData = await roomsRes.json();

      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setFaculty(Array.isArray(usersData) ? usersData : []);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setSchedules([]);
      setFaculty([]);
      setSections([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = useMemo(() => {
    const effectiveFacultyFilter = isFaculty ? session?.user?.id : calendarFilters.faculty;
    
    return schedules.filter(s => {
      if (calendarFilters.section !== 'all' && s.sectionId !== calendarFilters.section) return false;
      if (effectiveFacultyFilter !== 'all' && effectiveFacultyFilter && s.facultyId !== effectiveFacultyFilter) return false;
      if (calendarFilters.day !== 'all' && s.day !== calendarFilters.day) return false;
      if (calendarFilters.room !== 'all' && s.roomId !== calendarFilters.room) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (s.subject?.subjectName?.toLowerCase().includes(query)) ||
          (s.subject?.subjectCode?.toLowerCase().includes(query)) ||
          (s.faculty?.name?.toLowerCase().includes(query)) ||
          (s.section?.sectionName?.toLowerCase().includes(query)) ||
          (s.room?.roomName?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [schedules, calendarFilters, isFaculty, session?.user?.id, searchQuery]);

  // Helper function to check if schedule is within visible time range (7:00 AM - 9:00 PM)
  const isWithinVisibleTimeRange = (startTime: string, endTime: string): boolean => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    // Schedule must start at or after 7:00 AM and end at or before 9:00 PM
    return startHour >= START_HOUR && endHour <= END_HOUR;
  };

  // Group schedules by day and time slot
  // Returns a map of "day-startTime" -> Schedule[]
  // Only includes schedules within the visible time range (7:00 AM - 9:00 PM)
  const schedulesBySlot = useMemo(() => {
    const slotMap = new Map<string, Schedule[]>();
    
    filteredSchedules.forEach(schedule => {
      // Only include schedules within the visible time range
      if (!isWithinVisibleTimeRange(schedule.startTime, schedule.endTime)) {
        return;
      }
      const key = `${schedule.day}-${schedule.startTime}-${schedule.endTime}`;
      const existing = slotMap.get(key) || [];
      existing.push(schedule);
      slotMap.set(key, existing);
    });

    return slotMap;
  }, [filteredSchedules]);

  // Get grouped schedules for a specific day (only show one per time slot)
  // Limited to MAX_SCHEDULES_PER_DAY (14) cards per day
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

    // Sort by start time and limit to MAX_SCHEDULES_PER_DAY
    return daySchedules
      .sort((a, b) => a.firstSchedule.startTime.localeCompare(b.firstSchedule.startTime))
      .slice(0, MAX_SCHEDULES_PER_DAY);
  };

  // Calculate position for a schedule card
  const getSchedulePosition = (schedule: Schedule, isMobile: boolean = false) => {
    const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
    const halfRowHeight = isMobile ? HALF_ROW_HEIGHT_MOBILE : HALF_ROW_HEIGHT;
    const [startHour] = schedule.startTime.split(':').map(Number);
    const [endHour] = schedule.endTime.split(':').map(Number);

    const top = (startHour - START_HOUR) * rowHeight + halfRowHeight;
    const height = (endHour - startHour) * rowHeight;

    return { top, height };
  };

  // Calculate z-index for schedule card based on start time
  // Later start times get higher z-index for proper overlapping
  // 7am-8am = z-1, 8am-9am = z-2, 9am-10am = z-3, etc.
  const getScheduleZIndex = (startTime: string): number => {
    const [hours] = startTime.split(':').map(Number);
    // Z-index is based on hour difference from start hour (7am)
    // 7am = 1, 8am = 2, 9am = 3, ... 9pm = 15
    return hours - START_HOUR + 1;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('calendar-print-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the calendar');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PTC Schedule Calendar</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f4f4f4; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>PTC Schedule Calendar</h1>
          <p style="text-align: center;">Generated on ${new Date().toLocaleDateString()}</p>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExport = () => {
    const headers = ['Day', 'Start Time', 'End Time', 'Blocks', 'Subject', 'Subject Code', 'Faculty', 'Section', 'Room', 'Status'];
    const rows = filteredSchedules.map(s => [
      s.day,
      s.startTime,
      s.endTime,
      calculateBlocks(s.startTime, s.endTime),
      s.subject?.subjectName || '',
      s.subject?.subjectCode || '',
      s.faculty?.name || '',
      s.section?.sectionName || '',
      s.room?.roomName || '',
      s.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ptc-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'generated': return 'bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'modified': return 'bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'conflict': return 'bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleScheduleClick = (day: string, startTime: string, endTime: string, allSchedules: Schedule[]) => {
    setSelectedSlot({
      day,
      startTime,
      endTime,
      schedules: allSchedules,
    });
  };

  // Total grid height - include the full last hour (END_HOUR)
  const gridHeight = (END_HOUR - START_HOUR + 1) * ROW_HEIGHT;
  const gridHeightMobile = (END_HOUR - START_HOUR + 1) * ROW_HEIGHT_MOBILE;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CalendarIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isFaculty ? 'My Schedule' : 'Schedule Calendar'}
          </h1>
          <p className="text-muted-foreground">
            {isFaculty ? 'View your class schedules' : 'View and manage class schedules'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-0 sm:p-0">
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer select-none flex items-center justify-between" onClick={() => setFilterExpanded(!filterExpanded)}>
          <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
              {/* Show active filter count */}
              {(calendarFilters.section !== 'all' || calendarFilters.day !== 'all' || calendarFilters.room !== 'all' || (!isFaculty && calendarFilters.faculty !== 'all') || searchQuery) && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {[calendarFilters.section !== 'all', calendarFilters.day !== 'all', calendarFilters.room !== 'all', !isFaculty && calendarFilters.faculty !== 'all', !!searchQuery].filter(Boolean).length}
                </span>
              )}
          </div>
          <motion.div
            animate={{ rotate: filterExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </motion.div>
        </div>
        
        <AnimatePresence>
          {filterExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2 sm:space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 sm:pl-10 sm:pr-10 sm:py-2.5 text-xs sm:text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
                
                {/* Filter Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Section</label>
                    <Select
                      value={calendarFilters.section}
                      onValueChange={(value) => setCalendarFilters({ section: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.sectionName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isFaculty && (
                    <div className="space-y-1">
                      <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Faculty</label>
                      <Select
                        value={calendarFilters.faculty}
                        onValueChange={(value) => setCalendarFilters({ faculty: value })}
                      >
                        <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Faculty</SelectItem>
                          {faculty.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Day</label>
                    <Select
                      value={calendarFilters.day}
                      onValueChange={(value) => setCalendarFilters({ day: value as typeof calendarFilters.day })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Days</SelectItem>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Room</label>
                    <Select
                      value={calendarFilters.room}
                      onValueChange={(value) => setCalendarFilters({ room: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.roomName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Schedule Stats with View Toggle */}
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex gap-2 sm:gap-4 shrink-0">
          <span>Total Schedules: <strong className="text-foreground">{filteredSchedules.length}</strong></span>
          {viewMode === 'calendar' && (
            <span>Time Slots: <strong className="text-foreground">{schedulesBySlot.size}</strong></span>
          )}
        </div>
        {/* View Toggle */}
        <div className="flex gap-0.5 border rounded-md p-0.5 shrink-0">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="h-7 px-2 sm:h-8 sm:px-3"
          >
            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-7 px-2 sm:h-8 sm:px-3"
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Calendar Grid with Half-Block Support */}
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
                      const zIndex = getScheduleZIndex(firstSchedule.startTime);
                      
                      return (
                        <div
                          key={key}
                          className={`absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer select-none calendar-card-hover ${getStatusColor(firstSchedule.status)}`}
                          style={{ top: top + 2, height: height - 4, zIndex }}
                          onClick={() => handleScheduleClick(day, firstSchedule.startTime, firstSchedule.endTime, allSchedules)}
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
                      const zIndex = getScheduleZIndex(firstSchedule.startTime);

                      return (
                        <div
                          key={key}
                          className={`absolute left-0.5 right-0.5 rounded-md border overflow-hidden cursor-pointer select-none calendar-card-hover-mobile ${getStatusColor(firstSchedule.status)}`}
                          style={{ top: top + 1, height: height - 2, zIndex }}
                          onClick={() => handleScheduleClick(day, firstSchedule.startTime, firstSchedule.endTime, allSchedules)}
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
              <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">Approved</Badge>
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">Generated</Badge>
              <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">Modified</Badge>
              <Badge variant="outline" className="bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700">Conflict</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {/* Quick Stats - Hidden for faculty */}
          {!isFaculty && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{filteredSchedules.length}</div>
                  <p className="text-sm text-muted-foreground">Total Schedules</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-emerald-600">
                    {filteredSchedules.filter(s => s.status === 'approved').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredSchedules.filter(s => s.status === 'generated').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Generated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredSchedules.filter(s => s.status === 'conflict').length}
                  </div>
                  <p className="text-sm text-muted-foreground">With Conflicts</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Schedule Cards Grid */}
          <Card>
            <CardContent className="pt-6">
              {filteredSchedules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No schedules found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="max-h-[500px] md:max-h-none overflow-y-auto md:overflow-visible">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSchedules.map((schedule) => (
                      <div key={schedule.id} className="rounded-lg border bg-card p-4 calendar-grid-card-hover cursor-pointer select-none">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{schedule.subject?.subjectCode}</p>
                                <p className="text-xs text-muted-foreground">{schedule.subject?.subjectName}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(schedule.status)}>
                              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={schedule.faculty?.image || ''} alt={schedule.faculty?.name || ''} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {schedule.faculty?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{schedule.faculty?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{schedule.section?.sectionName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{schedule.room?.roomName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{schedule.day}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium">
                                {formatTimeRange(schedule.startTime, schedule.endTime)}
                              </p>
                              {!isFaculty && (
                                <span className="text-xs text-muted-foreground">
                                  {calculateBlocks(schedule.startTime, schedule.endTime)} blocks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Schedule Detail Dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Schedules for {selectedSlot?.day} - {selectedSlot && formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedSlot?.schedules.length} schedule(s) at this time slot
            </p>
            <AnimatePresence>
              {selectedSlot?.schedules.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${getStatusColor(schedule.status)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{schedule.subject?.subjectCode}</p>
                    <Badge variant="outline" className="text-xs">
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{schedule.subject?.subjectName}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{schedule.faculty?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{schedule.room?.roomName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{schedule.section?.sectionName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTimeRange(schedule.startTime, schedule.endTime)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
