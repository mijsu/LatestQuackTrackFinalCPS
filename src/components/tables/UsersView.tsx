'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Plus, MoreHorizontal, Pencil, Trash2, UserCog, 
  Loader2, Mail, Copy, Check, AlertCircle,
  Filter, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Department } from '@/types';
import { SPECIALIZATION_OPTIONS } from '@/types';
import { useAppStore } from '@/store';

interface GeneratedCredentials {
  institutionalEmail: string;
  password: string;
  emailSent: boolean;
  emailDevMode?: boolean;
  emailError?: string;
}

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    role: 'all',
    departmentId: 'all',
    contractType: 'all',
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Get conflict resolution context from store
  const { conflictResolutionContext, clearConflictResolutionContext } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle conflict resolution context - open add/edit modal when navigating from conflicts
  useEffect(() => {
    if (!loading && conflictResolutionContext && users.length >= 0) {
      const { addFacultySpecs, addFacultyDept, facultyIdToEdit } = conflictResolutionContext;
      
      if (facultyIdToEdit) {
        // Edit existing faculty
        const user = users.find(u => u.id === facultyIdToEdit);
        if (user) {
          handleEdit(user);
          clearConflictResolutionContext();
        }
      } else if (addFacultySpecs || addFacultyDept) {
        // Open add modal with pre-filled specializations
        setSelectedUser(null);
        setFormData({
          name: '',
          personalEmail: '',
          role: 'faculty',
          departmentId: addFacultyDept || '',
          contractType: 'full-time',
          maxUnits: 24,
          specialization: addFacultySpecs || [],
          isNew: true,
        });
        setFormErrors({});
        setDialogOpen(true);
        clearConflictResolutionContext();
        toast.info(`Adding faculty with specializations: ${(addFacultySpecs || []).join(', ')}`);
      }
    }
  }, [loading, conflictResolutionContext, users]);

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
      ]);
      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();
      // Ensure we always set arrays
      setUsers(Array.isArray(usersData) ? usersData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      personalEmail: '',
      role: 'faculty',
      departmentId: '',
      contractType: 'full-time',
      maxUnits: 24,
      specialization: [],
      isNew: true,
    });
    setFormErrors({});
    setGeneratedCredentials(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      personalEmail: user.personalEmail || '',
      role: user.role,
      departmentId: user.departmentId || '',
      contractType: user.contractType || 'full-time',
      maxUnits: user.maxUnits || 24,
      specialization: user.specialization || [],
      isNew: false,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Name is required';
    if (formData.isNew && formData.role === 'faculty' && !formData.personalEmail) {
      errors.personalEmail = 'Personal email is required for faculty accounts';
    }
    if (formData.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail as string)) {
      errors.personalEmail = 'Invalid email format';
    }
    if (!formData.role) errors.role = 'Role is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (selectedUser) {
        // Update existing user
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('User updated');
          setDialogOpen(false);
          fetchData();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Operation failed');
        }
      } else {
        // Create new user - credentials will be auto-generated
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCredentials(data.generatedCredentials);
          setDialogOpen(false);
          setCredentialsDialogOpen(true);
          fetchData();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Operation failed');
        }
      }
    } catch {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        setDeleteDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      admin: { label: 'Admin', variant: 'default' },
      faculty: { label: 'Faculty', variant: 'outline' },
    };
    const style = styles[role] || styles.faculty;
    return <Badge variant={style.variant}>{style.label}</Badge>;
  };

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.departmentId !== 'all' && user.departmentId !== filters.departmentId) return false;
      if (filters.contractType !== 'all' && user.contractType !== filters.contractType) return false;
      return true;
    });
  }, [users, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== 'all').length;
  }, [filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      role: 'all',
      departmentId: 'all',
      contractType: 'all',
    });
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => getRoleBadge(row.original.role) },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => row.original.department?.name || <span className="text-muted-foreground">-</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.original)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center p-8"><UserCog className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage system users and roles</p>
        </div>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Add Faculty</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{users.length}</div><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div><p className="text-sm text-muted-foreground">Admins</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{users.filter(u => u.role === 'faculty').length}</div><p className="text-sm text-muted-foreground">Faculty</p></CardContent></Card>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Role</label>
                    <Select
                      value={filters.role}
                      onValueChange={(value) => setFilters({ ...filters, role: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Department</label>
                    <Select
                      value={filters.departmentId}
                      onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Contract Type</label>
                    <Select
                      value={filters.contractType}
                      onValueChange={(value) => setFilters({ ...filters, contractType: value })}
                    >
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full">
                        <span className="truncate">
                          <SelectValue placeholder="All" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
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
        Showing {filteredUsers.length} of {users.length} users
      </div>

      <Card><CardContent className="pt-6"><DataTable columns={columns} data={filteredUsers} searchKey="name" /></CardContent></Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New Faculty'}</DialogTitle>
            {!selectedUser && (
              <DialogDescription>
                The institutional email and password will be auto-generated. Credentials will be sent to the personal email.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                placeholder="Enter first and last name (e.g., Juan Dela Cruz)"
                value={formData.name as string || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              {!selectedUser && formData.name && (
                <p className="text-xs text-muted-foreground">
                  Institutional email will be: <span className="font-mono font-medium">
                    {(formData.name as string).toLowerCase().trim().split(/\s+/).pop()}.{(formData.name as string).toLowerCase().trim().split(/\s+/).slice(0, -1).join('') || (formData.name as string).toLowerCase().trim().split(/\s+/)[0]}@ptc.edu.ph
                  </span>
                </p>
              )}
            </div>
            
            {selectedUser && (
              <div className="space-y-2">
                <Label>Institutional Email (Login Email)</Label>
                <Input 
                  type="email" 
                  value={formData.email as string || ''} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
                <p className="text-xs text-muted-foreground">This is the email used for login</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Personal Email {formData.role === 'faculty' && !selectedUser ? '*' : ''}</Label>
              <Input 
                type="email"
                placeholder="Enter personal email address"
                value={formData.personalEmail as string || ''} 
                onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })} 
              />
              {formErrors.personalEmail && <p className="text-xs text-destructive">{formErrors.personalEmail}</p>}
              {!selectedUser && (
                <p className="text-xs text-muted-foreground">Credentials will be sent to this email</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role as string || 'faculty'} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select value={formData.contractType as string || 'full-time'} onValueChange={(v) => setFormData({ ...formData, contractType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.departmentId as string || ''} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Units</Label>
              <Input type="number" value={formData.maxUnits as number || 24} onChange={(e) => setFormData({ ...formData, maxUnits: parseInt(e.target.value) || 24 })} />
              <p className="text-xs text-muted-foreground">Maximum teaching units per semester</p>
            </div>
            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                {SPECIALIZATION_OPTIONS.map((spec) => {
                  const currentSpecs = (formData.specialization as string[]) || [];
                  const isChecked = currentSpecs.includes(spec);
                  return (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-spec-${spec}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newSpecs = checked
                            ? [...currentSpecs, spec]
                            : currentSpecs.filter((s) => s !== spec);
                          setFormData({ ...formData, specialization: newSpecs });
                        }}
                      />
                      <label htmlFor={`user-spec-${spec}`} className="text-sm cursor-pointer">
                        {spec}
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Select subjects this user can teach</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedUser ? 'Update' : 'Create & Send Credentials'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Faculty Account Created
            </DialogTitle>
            <DialogDescription>
              {generatedCredentials?.emailDevMode 
                ? 'The credentials have been generated. Email is in development mode.'
                : 'The credentials have been generated and sent to the personal email.'}
            </DialogDescription>
          </DialogHeader>
          
          {generatedCredentials && (
            <div className="space-y-4 py-4">
              {/* Email Status Banner */}
              {generatedCredentials.emailDevMode ? (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Development Mode</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Email service is not configured. To send real emails:
                  </p>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 mt-2 list-decimal list-inside space-y-1">
                    <li>Get a free API key at <strong>resend.com</strong></li>
                    <li>Add <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">RESEND_API_KEY</code> to .env</li>
                    <li>Restart the server</li>
                  </ol>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                    Credentials are logged to the server console.
                  </p>
                </div>
              ) : generatedCredentials.emailSent ? (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Email sent successfully</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    The faculty member will receive their login credentials at their personal email.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Email failed to send</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    {generatedCredentials.emailError || 'An error occurred while sending the email. Please share credentials manually.'}
                  </p>
                </div>
              )}
              
              {/* Credentials */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Institutional Email (Login)</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                      {generatedCredentials.institutionalEmail}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(generatedCredentials.institutionalEmail, 'email')}
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Generated Password</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono font-bold text-primary">
                      {generatedCredentials.password}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(generatedCredentials.password, 'password')}
                    >
                      {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Important:</strong> Please share these credentials securely with the faculty member. 
                  They should change their password after first login.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setCredentialsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p>Delete {selectedUser?.name}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
