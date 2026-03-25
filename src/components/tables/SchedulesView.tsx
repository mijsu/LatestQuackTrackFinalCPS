'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, MoreHorizontal, Pencil, Trash2, CalendarDays, Clock, User, MapPin, BookOpen,
  Users, AlertTriangle, AlertCircle, CheckCircle, Lightbulb, Sparkles, ArrowRight, Loader2,
  Filter, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import type { Schedule, User, Section, Room, Subject, DayOfWeek } from '@/types';
import { DAYS, TIME_OPTIONS } from '@/types';
import { formatTimeRange } from '@/lib/utils';
import { useAppStore } from '@/store';

interface Conflict {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  conflictingSchedule: {
    id: string;
    subject?: { subjectCode: string; subjectName: string } | null;
    faculty?: { name: string } | null;
    room?: { roomName: string } | null;
    section?: { sectionName: string } | null;
    day: string;
    startTime: string;
    endTime: string;
  } | null;
}

interface AvailableSlot {
  day: string;
  startTime: string;
  endTime: string;
  score: number;
  reasons: string[];
}

export function SchedulesView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Conflict detection state
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    subjectId: 'all',
    facultyId: 'all',
    sectionId: 'all',
    roomId: 'all',
    day: 'all',
    status: 'all',
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Get conflict resolution context from store
  const { conflictResolutionContext, clearConflictResolutionContext } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle conflict resolution context - open edit/delete modal when navigating from conflicts
  useEffect(() => {
    if (!loading && conflictResolutionContext && schedules.length > 0) {
      const { scheduleIdToEdit, scheduleIdToDelete } = conflictResolutionContext;
      
      if (scheduleIdToEdit) {
        const schedule = schedules.find(s => s.id === scheduleIdToEdit);
        if (schedule) {
          handleEdit(schedule);
          clearConflictResolutionContext();
        }
      } else if (scheduleIdToDelete) {
        const schedule = schedules.find(s => s.id === scheduleIdToDelete);
        if (schedule) {
          handleDelete(schedule);
          clearConflictResolutionContext();
        }
      }
    }
  }, [loading, conflictResolutionContext, schedules]);

  const fetchData = async () => {
    try {
      const [schedulesRes, usersRes, sectionsRes, roomsRes, subjectsRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/users?role=faculty'),
        fetch('/api/sections'),
        fetch('/api/rooms'),
        fetch('/api/subjects'),
      ]);

      const schedulesData = await schedulesRes.json();
      const usersData = await usersRes.json();
      const sectionsData = await sectionsRes.json();
      const roomsData = await roomsRes.json();
      const subjectsData = await subjectsRes.json();

      // Check for API errors
      if (usersData.error) {
        console.error('Faculty API error:', usersData.error);
        toast.error(`Failed to load faculty: ${usersData.error}`);
      }
      
      // Ensure we always set arrays (APIs might return error objects)
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setFaculty(Array.isArray(usersData) ? usersData : []);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
      // Show warning if no faculty available
      if (!Array.isArray(usersData) || usersData.length === 0) {
        console.warn('No faculty members found. Please add faculty users first.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      // Set empty arrays on error
      setSchedules([]);
      setFaculty([]);
      setSections([]);
      setRooms([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Check for conflicts when form data changes
  const checkConflicts = useCallback(async () => {
    const { facultyId, roomId, sectionId, day, startTime, endTime } = formData;
    
    // Only check if we have all required fields
    if (!facultyId || !roomId || !sectionId || !day || !startTime || !endTime) {
      setConflicts([]);
      return;
    }

    // Validate time order
    if (startTime >= endTime) {
      return;
    }

    setCheckingConflicts(true);
    try {
      const res = await fetch('/api/schedules/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId,
          roomId,
          sectionId,
          day,
          startTime,
          endTime,
          excludeScheduleId: selectedSchedule?.id,
        }),
      });

      const data = await res.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  }, [formData, selectedSchedule?.id]);

  // Get available slots suggestions
  const fetchAvailableSlots = useCallback(async () => {
    const { facultyId, roomId, sectionId, day } = formData;
    
    // Need at least one resource to check availability
    if (!facultyId && !roomId && !sectionId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const params = new URLSearchParams();
      if (facultyId) params.append('facultyId', facultyId as string);
      if (roomId) params.append('roomId', roomId as string);
      if (sectionId) params.append('sectionId', sectionId as string);
      if (day) params.append('day', day as string);
      if (selectedSchedule?.id) params.append('excludeScheduleId', selectedSchedule.id);
      
      // Calculate duration from current form data
      const startTime = formData.startTime as string;
      const endTime = formData.endTime as string;
      if (startTime && endTime && endTime > startTime) {
        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
        const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
        const durationHours = Math.ceil((endMinutes - startMinutes) / 60);
        params.append('duration', durationHours.toString());
      } else {
        params.append('duration', '3'); // Default 3 hours
      }

      const res = await fetch(`/api/schedules/check-conflicts?${params.toString()}`);
      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  }, [formData, selectedSchedule?.id]);

  // Check conflicts when relevant form fields change
  useEffect(() => {
    if (dialogOpen) {
      checkConflicts();
    }
  }, [dialogOpen, formData.facultyId, formData.roomId, formData.sectionId, formData.day, formData.startTime, formData.endTime, checkConflicts]);

  // Fetch available slots when resources change
  useEffect(() => {
    if (dialogOpen) {
      fetchAvailableSlots();
    }
  }, [dialogOpen, formData.facultyId, formData.roomId, formData.sectionId, fetchAvailableSlots]);

  const handleCreate = () => {
    setSelectedSchedule(null);
    setFormData({
      subjectId: '',
      facultyId: '',
      sectionId: '',
      roomId: '',
      day: 'Monday',
      startTime: '08:00',
      endTime: '10:00',
    });
    setFormErrors({});
    setConflicts([]);
    setAvailableSlots([]);
    setDialogOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      subjectId: schedule.subjectId,
      facultyId: schedule.facultyId,
      sectionId: schedule.sectionId,
      roomId: schedule.roomId,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    setFormErrors({});
    setConflicts([]);
    setAvailableSlots([]);
    setDialogOpen(true);
  };

  // Apply suggested slot
  const handleApplySlot = (slot: AvailableSlot) => {
    setFormData(prev => ({
      ...prev,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    toast.success(`Applied suggested slot: ${slot.day} ${slot.startTime} - ${slot.endTime}`);
  };

  const handleDelete = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.subjectId) errors.subjectId = 'Subject is required';
    if (!formData.facultyId) errors.facultyId = 'Faculty is required';
    if (!formData.sectionId) errors.sectionId = 'Section is required';
    if (!formData.roomId) errors.roomId = 'Room is required';
    if (!formData.day) errors.day = 'Day is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.endTime = 'End time must be after start time';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const url = selectedSchedule ? `/api/schedules/${selectedSchedule.id}` : '/api/schedules';
      const method = selectedSchedule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          modifiedBy: 'current-user',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.conflicts && data.conflicts.length > 0) {
          toast.warning(`Schedule ${selectedSchedule ? 'updated' : 'created'} with ${data.conflicts.length} conflict(s)`);
        } else {
          toast.success(selectedSchedule ? 'Schedule updated' : 'Schedule created');
        }
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('Operation failed');
    }
  };

  const confirmDelete = async () => {
    if (!selectedSchedule) return;

    try {
      const res = await fetch(`/api/schedules/${selectedSchedule.id}?modifiedBy=current-user`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Schedule deleted');
        setDeleteDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  // Filter schedules based on selected filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      if (filters.subjectId !== 'all' && schedule.subjectId !== filters.subjectId) return false;
      if (filters.facultyId !== 'all' && schedule.facultyId !== filters.facultyId) return false;
      if (filters.sectionId !== 'all' && schedule.sectionId !== filters.sectionId) return false;
      if (filters.roomId !== 'all' && schedule.roomId !== filters.roomId) return false;
      if (filters.day !== 'all' && schedule.day !== filters.day) return false;
      if (filters.status !== 'all' && schedule.status !== filters.status) return false;
      return true;
    });
  }, [schedules, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== 'all').length;
  }, [filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      subjectId: 'all',
      facultyId: 'all',
      sectionId: 'all',
      roomId: 'all',
      day: 'all',
      status: 'all',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class: string }> = {
      approved: { variant: 'default', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      generated: { variant: 'secondary', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      modified: { variant: 'outline', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      conflict: { variant: 'destructive', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
    };
    const style = styles[status] || styles.generated;
    return <Badge variant={style.variant} className={style.class}>{status}</Badge>;
  };

  const columns: ColumnDef<Schedule>[] = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = row.original.subject;
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{subject?.subjectCode}</p>
              <p className="text-xs text-muted-foreground">{subject?.subjectName}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'faculty',
      header: 'Faculty',
      cell: ({ row }) => {
        const faculty = row.original.faculty;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={faculty?.image || ''} alt={faculty?.name || ''} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {faculty?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{faculty?.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'section',
      header: 'Section',
      cell: ({ row }) => {
        const section = row.original.section;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{section?.sectionName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'room',
      header: 'Room',
      cell: ({ row }) => {
        const room = row.original.room;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{room?.roomName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'day',
      header: 'Day & Time',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.day}</p>
            <p className="text-xs text-muted-foreground">
              {formatTimeRange(row.original.startTime, row.original.endTime)}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const schedule = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(schedule)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CalendarDays className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Schedules</h1>
          <p className="text-muted-foreground">Create and manage class schedules</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-sm text-muted-foreground">Total Schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {schedules.filter(s => s.status === 'approved').length}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {schedules.filter(s => s.status === 'generated').length}
            </div>
            <p className="text-sm text-muted-foreground">Generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {schedules.filter(s => s.status === 'conflict').length}
            </div>
            <p className="text-sm text-muted-foreground">With Conflicts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-0 sm:p-0">
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer select-none flex items-center justify-between" onClick={() => setFiltersExpanded(!filtersExpanded)}>
          <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: filtersExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </motion.div>
        </div>
        
        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Subject</label>
                    <Select
                      value={filters.subjectId}
                      onValueChange={(value) => setFilters({ ...filters, subjectId: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.subjectCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Faculty</label>
                    <Select
                      value={filters.facultyId}
                      onValueChange={(value) => setFilters({ ...filters, facultyId: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Faculty</SelectItem>
                        {faculty.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Section</label>
                    <Select
                      value={filters.sectionId}
                      onValueChange={(value) => setFilters({ ...filters, sectionId: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>{section.sectionName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Room</label>
                    <Select
                      value={filters.roomId}
                      onValueChange={(value) => setFilters({ ...filters, roomId: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>{room.roomName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Day</label>
                    <Select
                      value={filters.day}
                      onValueChange={(value) => setFilters({ ...filters, day: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Days</SelectItem>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="generated">Generated</SelectItem>
                        <SelectItem value="modified">Modified</SelectItem>
                        <SelectItem value="conflict">Conflict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Results count */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        Showing {filteredSchedules.length} of {schedules.length} schedules
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredSchedules}
            searchKey="day"
            searchPlaceholder="Search by day..."
            mobileCardRender={(schedule) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{schedule.subject?.subjectCode}</p>
                      <p className="text-xs text-muted-foreground">{schedule.subject?.subjectName}</p>
                    </div>
                  </div>
                  {getStatusBadge(schedule.status)}
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
                  <p className="text-sm font-medium">
                    {formatTimeRange(schedule.startTime, schedule.endTime)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(schedule)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
            <DialogDescription>
              {selectedSchedule ? 'Update schedule details' : 'Fill in the details to create a new schedule'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Column - Form Fields */}
            <div className="px-6 py-4 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={formData.subjectId as string || ''}
                      onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    >
                      <SelectTrigger className={formErrors.subjectId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.subjectCode} - {subject.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.subjectId && (
                      <p className="text-xs text-destructive">{formErrors.subjectId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select
                      value={formData.facultyId as string || ''}
                      onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                      disabled={faculty.length === 0}
                    >
                      <SelectTrigger className={formErrors.facultyId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={faculty.length === 0 ? "No faculty available" : "Select faculty"} />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No faculty members found.
                            <br />
                            Please add faculty users first.
                          </div>
                        ) : (
                          faculty.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.facultyId && (
                      <p className="text-xs text-destructive">{formErrors.facultyId}</p>
                    )}
                    {faculty.length === 0 && (
                      <p className="text-xs text-amber-500">
                        No faculty available. Go to Users to add faculty members.
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select
                      value={formData.sectionId as string || ''}
                      onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                    >
                      <SelectTrigger className={formErrors.sectionId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>{section.sectionName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.sectionId && (
                      <p className="text-xs text-destructive">{formErrors.sectionId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select
                      value={formData.roomId as string || ''}
                      onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    >
                      <SelectTrigger className={formErrors.roomId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.roomName} ({room.capacity} seats)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.roomId && (
                      <p className="text-xs text-destructive">{formErrors.roomId}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select
                      value={formData.day as string || 'Monday'}
                      onValueChange={(value) => setFormData({ ...formData, day: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={formData.startTime as string || '08:00'}
                      onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                    >
                      <SelectTrigger className={formErrors.startTime ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.startTime && (
                      <p className="text-xs text-destructive">{formErrors.startTime}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select
                      value={formData.endTime as string || '10:00'}
                      onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                    >
                      <SelectTrigger className={formErrors.endTime ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.endTime && (
                      <p className="text-xs text-destructive">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Conflict Detection - Compact for left column */}
                <AnimatePresence mode="wait">
                  {checkingConflicts ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center py-3"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking for conflicts...</span>
                      </div>
                    </motion.div>
                  ) : conflicts.length > 0 ? (
                    <motion.div
                      key="conflicts"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold text-sm">Conflicts Detected ({conflicts.length})</AlertTitle>
                      </Alert>
                      <div className="space-y-1">
                        {conflicts.map((conflict, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/20"
                          >
                            <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                {conflict.type === 'faculty_double_booking' && 'Faculty Double Booking'}
                                {conflict.type === 'room_double_booking' && 'Room Double Booking'}
                                {conflict.type === 'section_overlap' && 'Section Schedule Overlap'}
                              </p>
                              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                                {conflict.description}
                              </p>
                              {conflict.conflictingSchedule && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-red-600/80 dark:text-red-400/80 bg-red-500/10 rounded px-2 py-1">
                                  {conflict.conflictingSchedule.subject && (
                                    <span className="font-medium">{conflict.conflictingSchedule.subject.subjectCode}</span>
                                  )}
                                  <span className="text-red-400">•</span>
                                  <span>{conflict.conflictingSchedule.day}</span>
                                  <span className="text-red-400">•</span>
                                  <span className="font-medium">
                                    {formatTimeRange(conflict.conflictingSchedule.startTime, conflict.conflictingSchedule.endTime)}
                                  </span>
                                  {conflict.conflictingSchedule.room && (
                                    <>
                                      <span className="text-red-400">•</span>
                                      <span>{conflict.conflictingSchedule.room.roomName}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : formData.facultyId && formData.roomId && formData.sectionId && formData.day && formData.startTime && formData.endTime ? (
                    <motion.div
                      key="no-conflicts"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert className="border-emerald-500/50 bg-emerald-500/10 py-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <AlertTitle className="text-sm text-emerald-700 dark:text-emerald-400">No Conflicts - Slot Available</AlertTitle>
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column - Suggested Available Slots */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Suggested Available Slots</span>
                  {loadingSlots && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                
                {availableSlots.length > 0 ? (
                  <ScrollArea className="h-[calc(60vh-80px)] w-full rounded-md border">
                    <div className="p-2 space-y-2">
                      {availableSlots.slice(0, 15).map((slot, index) => (
                        <motion.div
                          key={`${slot.day}-${slot.startTime}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                          onClick={() => handleApplySlot(slot)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{slot.day}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeRange(slot.startTime, slot.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
                              {slot.reasons.slice(0, 2).map((reason, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center h-40 border rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Finding available slots...</span>
                    </div>
                  </div>
                ) : !formData.facultyId && !formData.roomId && !formData.sectionId ? (
                  <div className="flex items-center justify-center h-40 border rounded-lg border-dashed">
                    <div className="text-center text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select faculty, room, or section</p>
                      <p className="text-xs">to see available slot suggestions</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 border rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No alternative slots found</p>
                      <p className="text-xs">Try different resources or reduce duration</p>
                    </div>
                  </div>
                )}

                {/* Selected Slot Preview */}
                {formData.day && formData.startTime && formData.endTime && !checkingConflicts && conflicts.length === 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Selected Slot:</p>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{formData.day as string}</span>
                      <Clock className="h-4 w-4 text-primary ml-2" />
                      <span className="text-sm">{formatTimeRange(formData.startTime as string, formData.endTime as string)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              className="w-full sm:w-auto"
              disabled={checkingConflicts || conflicts.length > 0}
            >
              {selectedSchedule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
