import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  generateSchedules, 
  type Faculty, 
  type Room, 
  type Section, 
  type Subject,
  type ScheduleAssignment,
  type CurriculumEntry,
} from '@/lib/scheduling-algorithm';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationToUser } from '@/lib/notification-client';
import { getConflictResolution, type ConflictType } from '@/types';

function parseJSON<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseJSONArray(str: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication and authorization check
    console.log('[GENERATE] Checking session...');
    const session = await getServerSession(authOptions);
    console.log('[GENERATE] Session result:', session ? { id: session.user?.id, role: session.user?.role } : null);
    
    if (!session?.user?.id) {
      console.log('[GENERATE] Unauthorized - no session or user id');
      return NextResponse.json({ error: 'Unauthorized', details: 'No valid session found. Please log in again.' }, { status: 401 });
    }
    
    // Only admin can generate schedules
    if (session.user.role !== 'admin') {
      console.log('[GENERATE] Access denied - role:', session.user.role);
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    console.log('[GENERATE] Auth check passed, parsing request body...');
    const body = await request.json();
    const { departmentId, clearExisting = true, curriculum, detectedConflicts } = body;

    console.log('=== QuackTrack SCHEDULE GENERATION v2.0 ===');
    console.log(`Department: ${departmentId || 'All'}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Detected conflicts passed: ${detectedConflicts?.length || 0}`);
    const startTime = Date.now();

    // =========================================================================
    // FETCH DATA
    // =========================================================================
    
    // Fetch sections
    const sectionsRaw = await db.section.findMany({
      where: departmentId ? { departmentId } : { isActive: true },
      include: { department: true },
    });
    
    // Fetch subjects
    const subjectsRaw = await db.subject.findMany({
      where: departmentId ? { departmentId } : { isActive: true },
    });
    
    // Fetch rooms
    const roomsRaw = await db.room.findMany({
      where: { isActive: true },
    });
    
    // Fetch ALL faculty (regardless of department) with preferences
    const facultyRaw = await db.user.findMany({
      where: { 
        role: 'faculty',
      },
      include: { preferences: true },
    });

    console.log(`\n=== DATA LOADED ===`);
    console.log(`Sections: ${sectionsRaw.length}`);
    console.log(`Subjects: ${subjectsRaw.length}`);
    console.log(`Rooms: ${roomsRaw.length}`);
    console.log(`Faculty: ${facultyRaw.length}`);
    
    // Log faculty details for debugging
    console.log(`\n=== FACULTY ANALYSIS ===`);
    for (const f of facultyRaw) {
      const spec = parseJSONArray(f.specialization);
      const prefs = f.preferences;
      const prefDays = prefs ? parseJSONArray(prefs.preferredDays) : [];
      const unavailDays = prefs?.unavailableDays ? parseJSONArray(prefs.unavailableDays) : [];
      
      console.log(`- ${f.name} (${f.email})`);
      console.log(`  Max Units: ${f.maxUnits || 24}`);
      console.log(`  Specializations: ${spec.length > 0 ? spec.join(', ') : 'None (can teach any)'}`);
      console.log(`  Preferred Days: ${prefDays.length > 0 ? prefDays.join(', ') : 'All'}`);
      console.log(`  Unavailable Days: ${unavailDays.length > 0 ? unavailDays.join(', ') : 'None'}`);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    const errors: string[] = [];
    if (facultyRaw.length === 0) {
      errors.push('No faculty members found. Please add faculty before generating schedules.');
    }
    if (sectionsRaw.length === 0) {
      errors.push('No sections found. Please add sections before generating schedules.');
    }
    if (subjectsRaw.length === 0) {
      errors.push('No subjects found. Please add subjects before generating schedules.');
    }
    if (roomsRaw.length === 0) {
      errors.push('No rooms found. Please add rooms before generating schedules.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: errors,
        canProceed: false,
      }, { status: 400 });
    }

    // =========================================================================
    // PRE-GENERATION CONFLICT CHECK
    // =========================================================================
    
    const preGenerationWarnings: Array<{
      type: string;
      message: string;
      severity: 'warning' | 'info';
      faculty?: string[];
      subject?: string;
      details?: Record<string, unknown>;
    }> = [];

    // 1. Check for multiple faculty preferring the same subject
    const subjectPreferenceMap: Map<string, Array<{ faculty: typeof facultyRaw[0]; timeStart: string; timeEnd: string; days: string[] }>> = new Map();
    
    for (const f of facultyRaw) {
      const prefSubjects = f.preferences ? parseJSONArray(f.preferences.preferredSubjects) : [];
      const prefTimeStart = f.preferences?.preferredTimeStart || '08:00';
      const prefTimeEnd = f.preferences?.preferredTimeEnd || '17:00';
      const prefDays = f.preferences ? parseJSONArray(f.preferences.preferredDays) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (const subjectId of prefSubjects) {
        if (!subjectPreferenceMap.has(subjectId)) {
          subjectPreferenceMap.set(subjectId, []);
        }
        subjectPreferenceMap.get(subjectId)!.push({
          faculty: f,
          timeStart: prefTimeStart,
          timeEnd: prefTimeEnd,
          days: prefDays,
        });
      }
    }

    // Helper function to check time overlap
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    
    const timesOverlap = (s1: string, e1: string, s2: string, e2: string) => {
      const start1 = timeToMinutes(s1);
      const end1 = timeToMinutes(e1);
      const start2 = timeToMinutes(s2);
      const end2 = timeToMinutes(e2);
      return start1 < end2 && end1 > start2;
    };

    // Detect subject preference conflicts - when multiple faculty prefer the same subject
    for (const [subjectId, facultyPrefs] of subjectPreferenceMap) {
      if (facultyPrefs.length >= 2) {
        const subject = subjectsRaw.find(s => s.id === subjectId);
        const facultyNames = facultyPrefs.map(fp => fp.faculty.name);
        
        // Check if there's time AND day overlap between preferences
        let hasOverlapConflict = false;
        const overlappingDetails: string[] = [];
        
        for (let i = 0; i < facultyPrefs.length; i++) {
          for (let j = i + 1; j < facultyPrefs.length; j++) {
            const fp1 = facultyPrefs[i];
            const fp2 = facultyPrefs[j];
            
            // Check time overlap
            const timeOverlaps = timesOverlap(fp1.timeStart, fp1.timeEnd, fp2.timeStart, fp2.timeEnd);
            
            // Check day overlap
            const commonDays = fp1.days.filter(d => fp2.days.includes(d));
            
            if (timeOverlaps && commonDays.length > 0) {
              hasOverlapConflict = true;
              overlappingDetails.push(
                `${fp1.faculty.name} (${fp1.timeStart}-${fp1.timeEnd} on ${fp1.days.join(', ')}) vs ${fp2.faculty.name} (${fp2.timeStart}-${fp2.timeEnd} on ${fp2.days.join(',')})`
              );
            }
          }
        }
        
        preGenerationWarnings.push({
          type: hasOverlapConflict ? 'subject_preference_conflict' : 'subject_preference_duplicate',
          message: hasOverlapConflict
            ? `${facultyPrefs.length} faculty members (${facultyNames.join(', ')}) prefer "${subject?.subjectName || subjectId}" with OVERLAPPING time/day preferences. Algorithm will assign based on load balancing.`
            : `${facultyPrefs.length} faculty members (${facultyNames.join(', ')}) prefer the same subject "${subject?.subjectName || subjectId}" but with different time preferences. Algorithm will assign based on load balancing.`,
          severity: hasOverlapConflict ? 'warning' : 'info',
          faculty: facultyNames,
          subject: subject?.subjectName || subjectId,
          details: hasOverlapConflict ? { overlaps: overlappingDetails } : undefined,
        });
      }
    }

    // 2. Check for specialization gaps - subjects that need specific specializations but no faculty has them
    for (const subject of subjectsRaw) {
      const requiredSpecs = parseJSONArray(subject.requiredSpecialization);
      
      if (requiredSpecs.length > 0) {
        const eligibleFaculty = facultyRaw.filter(f => {
          const fSpecs = parseJSONArray(f.specialization);
          // If faculty has no specializations, they can teach (new faculty)
          if (fSpecs.length === 0) return true;
          return requiredSpecs.some(spec => fSpecs.includes(spec));
        });
        
        if (eligibleFaculty.length === 0) {
          preGenerationWarnings.push({
            type: 'specialization_gap',
            message: `Subject "${subject.subjectName}" (${subject.subjectCode}) requires specialization in [${requiredSpecs.join(' or ')}], but NO faculty has this specialization. Subject may not be assigned.`,
            severity: 'warning',
            subject: subject.subjectName,
          });
        } else if (eligibleFaculty.length === 1) {
          preGenerationWarnings.push({
            type: 'specialization_limited',
            message: `Subject "${subject.subjectName}" (${subject.subjectCode}) requires specialization in [${requiredSpecs.join(' or ')}], but only 1 faculty (${eligibleFaculty[0].name}) is eligible. Limited scheduling flexibility.`,
            severity: 'info',
            subject: subject.subjectName,
            faculty: [eligibleFaculty[0].name],
          });
        }
      }
    }

    // 3. Check for faculty capacity issues
    for (const f of facultyRaw) {
      const prefSubjects = f.preferences ? parseJSONArray(f.preferences.preferredSubjects) : [];
      const prefSubjectsUnits = subjectsRaw
        .filter(s => prefSubjects.includes(s.id))
        .reduce((sum, s) => sum + s.units, 0);
      
      if (prefSubjectsUnits > f.maxUnits) {
        preGenerationWarnings.push({
          type: 'capacity_warning',
          message: `${f.name}'s preferred subjects total ${prefSubjectsUnits} units, exceeding max capacity of ${f.maxUnits} units. Not all preferences can be satisfied.`,
          severity: 'info',
          faculty: [f.name],
        });
      }
    }

    // 4. Check for unavailable days conflicts
    for (const f of facultyRaw) {
      const unavailDays = f.preferences?.unavailableDays ? parseJSONArray(f.preferences.unavailableDays) : [];
      const prefDays = f.preferences ? parseJSONArray(f.preferences.preferredDays) : [];
      
      // Check if faculty is unavailable on all days they prefer
      const conflictDays = unavailDays.filter(d => prefDays.includes(d));
      if (conflictDays.length > 0) {
        preGenerationWarnings.push({
          type: 'day_preference_conflict',
          message: `${f.name} prefers days [${prefDays.join(', ')}] but is unavailable on [${conflictDays.join(', ')}]. These preferences conflict.`,
          severity: 'info',
          faculty: [f.name],
        });
      }
      
      // Check if faculty is unavailable on ALL work days
      const allWorkDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (allWorkDays.every(d => unavailDays.includes(d))) {
        preGenerationWarnings.push({
          type: 'fully_unavailable',
          message: `${f.name} is marked unavailable on ALL work days. No schedules can be assigned to this faculty.`,
          severity: 'warning',
          faculty: [f.name],
        });
      }
    }

    // 5. Check for room capacity issues
    for (const section of sectionsRaw) {
      const suitableRooms = roomsRaw.filter(r => r.capacity >= section.studentCount);
      if (suitableRooms.length === 0) {
        preGenerationWarnings.push({
          type: 'room_capacity_gap',
          message: `Section "${section.sectionName}" has ${section.studentCount} students, but NO room has sufficient capacity. Scheduling may fail.`,
          severity: 'warning',
        });
      }
    }

    console.log(`\n=== PRE-GENERATION WARNINGS ===`);
    console.log(`Found ${preGenerationWarnings.length} potential issues`);
    for (const w of preGenerationWarnings) {
      console.log(`- [${w.severity}] [${w.type}] ${w.message}`);
    }

    // =========================================================================
    // TRANSFORM DATA FOR ALGORITHM
    // =========================================================================

    const faculty: Faculty[] = facultyRaw.map(f => ({
      id: f.id,
      name: f.name,
      specialization: parseJSONArray(f.specialization),
      maxUnits: f.maxUnits || 24,
      departmentId: f.departmentId,
      preferences: f.preferences ? {
        preferredDays: parseJSONArray(f.preferences.preferredDays).length > 0 
          ? parseJSONArray(f.preferences.preferredDays) 
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        preferredTimeStart: f.preferences.preferredTimeStart || '08:00',
        preferredTimeEnd: f.preferences.preferredTimeEnd || '17:00',
        preferredSubjects: parseJSONArray(f.preferences.preferredSubjects),
        unavailableDays: f.preferences.unavailableDays ? parseJSONArray(f.preferences.unavailableDays) : undefined,
        notes: f.preferences.notes || undefined,
      } : {
        // Default preferences if none exist
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        preferredTimeStart: '08:00',
        preferredTimeEnd: '17:00',
        preferredSubjects: [],
      },
    }));

    const rooms: Room[] = roomsRaw.map(r => ({
      id: r.id,
      roomName: r.roomName,
      capacity: r.capacity,
      equipment: parseJSONArray(r.equipment),
      building: r.building,
    }));

    const sections: Section[] = sectionsRaw.map(s => ({
      id: s.id,
      sectionName: s.sectionName,
      yearLevel: s.yearLevel,
      studentCount: s.studentCount,
      departmentId: s.departmentId,
    }));

    const subjects: Subject[] = subjectsRaw.map(s => ({
      id: s.id,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      units: s.units,
      departmentId: s.departmentId,
      requiredSpecialization: parseJSONArray(s.requiredSpecialization),
      requiredEquipment: [],
      defaultDurationHours: s.defaultDurationHours || 3, // Default to 3 hours
    }));

    // Prepare curriculum if provided
    const curriculumEntries: CurriculumEntry[] | undefined = curriculum;

    // =========================================================================
    // CLEAR EXISTING SCHEDULES
    // =========================================================================

    if (clearExisting) {
      console.log('\n=== CLEARING EXISTING SCHEDULES ===');
      
      try {
        // Use a transaction for faster atomic deletion
        await db.$transaction([
          db.scheduleResponse.deleteMany(),
          db.scheduleLog.deleteMany(),
          db.conflict.deleteMany(),
          db.schedule.deleteMany({
            where: departmentId ? { section: { departmentId } } : undefined,
          }),
        ]);
        console.log('✅ All existing schedules and related records cleared successfully');
      } catch (deleteError) {
        console.error('Error clearing existing schedules:', deleteError);
        throw new Error(`Failed to clear existing schedules: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
      }
    }

    // =========================================================================
    // RUN SCHEDULING ALGORITHM
    // =========================================================================

    console.log('\n=== RUNNING SCHEDULING ALGORITHM ===');
    const result = generateSchedules(faculty, rooms, sections, subjects, curriculumEntries);

    console.log(`\n=== ALGORITHM RESULTS ===`);
    console.log(`Generation time: ${result.stats.generationTimeMs}ms`);
    console.log(`Backtracks: ${result.stats.backtrackCount}`);
    console.log(`Skipped (duplicates): ${result.stats.skippedCount}`);
    console.log(`Assigned: ${result.schedules.length}`);
    console.log(`Unassigned: ${result.unassigned.length}`);
    console.log(`Violations detected: ${result.violations.length}`);
    console.log(`Assignment rate: ${(result.stats.assignmentRate * 100).toFixed(1)}%`);
    console.log(`Preference match rate: ${(result.stats.preferenceMatchRate * 100).toFixed(1)}%`);

    // =========================================================================
    // SAVE SCHEDULES TO DATABASE
    // =========================================================================
    
    // Map algorithm IDs to database IDs for conflict recording
    const algorithmIdToDbId = new Map<string, string>();
    let savedSchedules: Array<{ id: string; algorithmId: string; subjectId: string; facultyId: string; sectionId: string; roomId: string; day: string; startTime: string; endTime: string }> = [];

    if (result.schedules.length > 0) {
      console.log('\n=== SAVING TO DATABASE ===');
      
      // Prepare batch data for fast insertion
      const scheduleData = result.schedules.map(s => ({
        subjectId: s.subjectId,
        facultyId: s.facultyId,
        sectionId: s.sectionId,
        roomId: s.roomId,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        status: 'generated' as const,
        semester: '1st Semester',
        academicYear: '2024-2025',
      }));
      
      try {
        // Use createMany for batch insertion (much faster than individual creates)
        await db.schedule.createMany({
          data: scheduleData,
          skipDuplicates: true,
        });
        console.log(`Saved ${scheduleData.length} schedules to database`);
        
        // Only query back if we need IDs for conflicts
        if (result.violations.length > 0 || (detectedConflicts && detectedConflicts.length > 0)) {
          // Query the schedules we just inserted to get their IDs
          const insertedSchedules = await db.schedule.findMany({
            where: { status: 'generated' },
            select: {
              id: true,
              subjectId: true,
              facultyId: true,
              sectionId: true,
              roomId: true,
              day: true,
              startTime: true,
              endTime: true,
            },
          });
          
          savedSchedules = insertedSchedules.map(s => ({
            ...s,
            algorithmId: '', // We don't have the algorithm ID for these
          }));
        }
      } catch (e) {
        console.error('Failed to save schedules batch:', e);
        // Fallback: try individual inserts
        for (const s of result.schedules) {
          try {
            const savedSchedule = await db.schedule.create({
              data: {
                subjectId: s.subjectId,
                facultyId: s.facultyId,
                sectionId: s.sectionId,
                roomId: s.roomId,
                day: s.day,
                startTime: s.startTime,
                endTime: s.endTime,
                status: 'generated',
                semester: '1st Semester',
                academicYear: '2024-2025',
              },
            });
            algorithmIdToDbId.set(s.id, savedSchedule.id);
          } catch (innerE) {
            console.error(`Failed to save schedule: ${s.subjectId} - ${s.day} ${s.startTime}`);
          }
        }
      }
    }

    // =========================================================================
    // RECORD VIOLATIONS AS CONFLICTS
    // =========================================================================

    if (result.violations.length > 0) {
      console.log(`\n=== RECORDING ${result.violations.length} VIOLATIONS ===`);
      
      for (const violation of result.violations) {
        try {
          // Map algorithm IDs to database IDs
          const dbId1 = violation.scheduleIds[0] ? algorithmIdToDbId.get(violation.scheduleIds[0]) : null;
          const dbId2 = violation.scheduleIds[1] ? algorithmIdToDbId.get(violation.scheduleIds[1]) : null;
          
          // Only record if we have at least one valid database ID
          if (!dbId1 && !dbId2) {
            console.log(`Skipping violation with no valid schedule IDs: ${violation.description}`);
            continue;
          }
          
          // Get detailed information for the violation
          const schedule1 = savedSchedules.find(s => s.algorithmId === violation.scheduleIds[0]);
          const schedule2 = savedSchedules.find(s => s.algorithmId === violation.scheduleIds[1]);
          
          // Build enhanced description
          let enhancedDescription = violation.description;
          
          if (schedule1) {
            const subject = subjectsRaw.find(s => s.id === schedule1.subjectId);
            const faculty = facultyRaw.find(f => f.id === schedule1.facultyId);
            const section = sectionsRaw.find(s => s.id === schedule1.sectionId);
            const room = roomsRaw.find(r => r.id === schedule1.roomId);
            
            enhancedDescription += `\n  - Schedule 1: ${subject?.subjectCode || 'Unknown'} (${subject?.subjectName || 'Unknown'})`;
            enhancedDescription += `\n    Faculty: ${faculty?.name || 'Unknown'}`;
            enhancedDescription += `\n    Section: ${section?.sectionName || 'Unknown'}`;
            enhancedDescription += `\n    Room: ${room?.roomName || 'Unknown'}`;
            enhancedDescription += `\n    Time: ${schedule1.day} ${schedule1.startTime}-${schedule1.endTime}`;
          }
          
          if (schedule2) {
            const subject = subjectsRaw.find(s => s.id === schedule2.subjectId);
            const faculty = facultyRaw.find(f => f.id === schedule2.facultyId);
            const section = sectionsRaw.find(s => s.id === schedule2.sectionId);
            const room = roomsRaw.find(r => r.id === schedule2.roomId);
            
            enhancedDescription += `\n  - Schedule 2: ${subject?.subjectCode || 'Unknown'} (${subject?.subjectName || 'Unknown'})`;
            enhancedDescription += `\n    Faculty: ${faculty?.name || 'Unknown'}`;
            enhancedDescription += `\n    Section: ${section?.sectionName || 'Unknown'}`;
            enhancedDescription += `\n    Room: ${room?.roomName || 'Unknown'}`;
            enhancedDescription += `\n    Time: ${schedule2.day} ${schedule2.startTime}-${schedule2.endTime}`;
          }
          
          await db.conflict.create({
            data: {
              type: violation.type,
              scheduleId1: dbId1 || '',
              scheduleId2: dbId2,
              description: enhancedDescription,
              severity: violation.severity,
              resolved: false,
            },
          });
        } catch (e) {
          console.error(`Failed to record violation: ${violation.description}`);
        }
      }
    }

    // =========================================================================
    // SAVE DETECTED CONFLICTS (from pre-generation check)
    // =========================================================================

    let savedConflictsCount = 0;
    const generationId = uuidv4(); // Unique ID to group conflicts from this generation
    
    if (detectedConflicts && detectedConflicts.length > 0) {
      console.log(`\n=== SAVING ${detectedConflicts.length} DETECTED CONFLICTS ===`);
      
      for (const conflict of detectedConflicts) {
        try {
          // Get faculty IDs and names
          const facultyData = conflict.faculty?.map((f: { id?: string; name: string } | string) => 
            typeof f === 'string' ? { id: null, name: f } : { id: f.id || null, name: f.name }
          ) || [];
          
          const facultyNames = facultyData.map((f: { name: string }) => f.name);
          const facultyIds = facultyData
            .map((f: { id: string | null }) => f.id)
            .filter((id: string | null): id is string => id !== null);
          
          // Find affected schedules for this conflict using savedSchedules
          let scheduleId1: string | null = null;
          let scheduleId2: string | null = null;
          
          // If it's a subject conflict, try to find related schedules
          if (conflict.type === 'subject_conflict' || conflict.type === 'subject_preference_conflict') {
            // Find schedules for the affected faculty using savedSchedules and facultyRaw
            const affectedSchedules = savedSchedules.filter(s => {
              const facultyMember = facultyRaw.find(f => f.id === s.facultyId);
              return facultyMember && facultyNames.includes(facultyMember.name);
            });
            
            if (affectedSchedules.length >= 1) {
              scheduleId1 = affectedSchedules[0].id;
            }
            if (affectedSchedules.length >= 2) {
              scheduleId2 = affectedSchedules[1].id;
            }
          }
          
          // Extract subject ID if present in the conflict details
          let subjectId: string | null = null;
          if (conflict.details?.subjectId) {
            subjectId = conflict.details.subjectId;
          }
          
          await db.conflict.create({
            data: {
              type: conflict.type || 'preference_conflict',
              scheduleId1: scheduleId1,
              scheduleId2: scheduleId2,
              description: conflict.message || conflict.description || '',
              severity: conflict.severity || 'warning',
              resolved: false,
              suggestedResolution: getConflictResolution((conflict.type || 'preference_conflict') as ConflictType),
              facultyIds: facultyIds.length > 0 ? JSON.stringify(facultyIds) : null,
              subjectId: subjectId,
              generationId: generationId,
            },
          });
          savedConflictsCount++;
        } catch (e) {
          console.error(`Failed to save detected conflict: ${conflict.message || conflict.type}`);
        }
      }
      console.log(`Saved ${savedConflictsCount} detected conflicts to database`);
    }

    // =========================================================================
    // LOG UNASSIGNED ITEMS
    // =========================================================================

    if (result.unassigned.length > 0) {
      console.log(`\n=== UNASSIGNED SUBJECTS (${result.unassigned.length}) ===`);
      for (const item of result.unassigned.slice(0, 10)) {
        console.log(`- ${item.subjectCode} (${item.subjectName}) for ${item.sectionName}: ${item.reason}`);
      }
      if (result.unassigned.length > 10) {
        console.log(`... and ${result.unassigned.length - 10} more`);
      }
    }

    // =========================================================================
    // SEND NOTIFICATIONS TO FACULTY
    // =========================================================================

    console.log('\n=== SENDING NOTIFICATIONS ===');
    const notifiedFaculty = new Set<string>();
    const notificationData: Array<{ userId: string; title: string; message: string; type: string; actionUrl: string }> = [];
    
    for (const schedule of result.schedules) {
      if (!notifiedFaculty.has(schedule.facultyId)) {
        const facultyMember = faculty.find(f => f.id === schedule.facultyId);
        if (facultyMember) {
          const facultySchedules = result.schedules.filter(s => s.facultyId === schedule.facultyId);
          const totalUnits = facultySchedules.reduce((sum, s) => {
            const subj = subjects.find(sub => sub.id === s.subjectId);
            return sum + (subj?.units || 0);
          }, 0);
          
          const notificationTitle = 'New Schedules Generated';
          const notificationMessage = `You have been assigned ${facultySchedules.length} class(es) totaling ${totalUnits} units for 1st Semester 2024-2025. Please review your schedule in the calendar view.`;
          
          // Add to batch
          notificationData.push({
            userId: schedule.facultyId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'info',
            actionUrl: 'calendar',
          });
          
          // Send real-time notification
          sendNotificationToUser({
            userId: schedule.facultyId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'info',
          });
          
          notifiedFaculty.add(schedule.facultyId);
        }
      }
    }
    
    // Batch insert notifications
    if (notificationData.length > 0) {
      await db.notification.createMany({ data: notificationData });
    }
    console.log(`Sent ${notificationData.length} notifications to faculty`);

    // =========================================================================
    // CREATE AUDIT LOG
    // =========================================================================

    await db.auditLog.create({
      data: {
        action: 'generate_schedules',
        entity: 'schedule',
        details: JSON.stringify({
          version: '2.0',
          generated: result.schedules.length,
          unassigned: result.unassigned.length,
          violations: result.violations.length,
          savedConflicts: savedConflictsCount,
          departmentId,
          generationTimeMs: result.stats.generationTimeMs,
          backtrackCount: result.stats.backtrackCount,
          skippedCount: result.stats.skippedCount,
          preferenceMatchRate: result.stats.preferenceMatchRate,
          assignmentRate: result.stats.assignmentRate,
        }),
      },
    });

    // =========================================================================
    // PREPARE RESPONSE
    // =========================================================================

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`\n=== GENERATION COMPLETE ===`);
    console.log(`Total API time: ${totalTime}ms`);
    console.log(`Schedules generated: ${result.schedules.length}`);
    console.log(`Sections covered: ${new Set(result.schedules.map(s => s.sectionId)).size}/${sections.length}`);
    console.log(`Faculty utilized: ${new Set(result.schedules.map(s => s.facultyId)).size}/${faculty.length}`);

    // Calculate detailed faculty utilization summary
    const facultyUtilization = faculty.map(f => {
      const assigned = result.schedules
        .filter(s => s.facultyId === f.id)
        .reduce((sum, s) => {
          const subj = subjects.find(sub => sub.id === s.subjectId);
          return sum + (subj?.units || 0);
        }, 0);
      
      const scheduleCount = result.schedules.filter(s => s.facultyId === f.id).length;
      
      return {
        id: f.id,
        name: f.name,
        schedules: scheduleCount,
        assignedUnits: assigned,
        maxUnits: f.maxUnits,
        percent: f.maxUnits > 0 ? Math.round((assigned / f.maxUnits) * 100) : 0,
      };
    }).sort((a, b) => b.percent - a.percent);

    // Calculate day distribution
    const dayDistribution: Record<string, number> = {};
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      dayDistribution[day] = result.schedules.filter(s => s.day === day).length;
    }

    // Calculate time distribution
    const timeSlots: Record<string, number> = {};
    for (const schedule of result.schedules) {
      const hour = schedule.startTime.split(':')[0];
      const timeKey = `${hour}:00`;
      timeSlots[timeKey] = (timeSlots[timeKey] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      generated: result.schedules.length,
      unassigned: result.unassigned,
      violations: result.violations.length,
      savedConflicts: savedConflictsCount,
      generationId: generationId,
      preGenerationWarnings,
      stats: {
        ...result.stats,
        totalTimeMs: totalTime,
        sections: {
          total: sections.length,
          withSchedules: new Set(result.schedules.map(s => s.sectionId)).size,
        },
        faculty: {
          total: faculty.length,
          withLoad: facultyUtilization.filter(f => f.assignedUnits > 0).length,
          utilization: facultyUtilization,
        },
        rooms: {
          total: rooms.length,
          used: new Set(result.schedules.map(s => s.roomId)).size,
        },
        distribution: {
          byDay: dayDistribution,
          byTime: timeSlots,
        },
      },
      message: result.violations.length === 0 
        ? `Successfully generated ${result.schedules.length} conflict-free schedules!`
        : `Generated ${result.schedules.length} schedules with ${result.violations.length} conflicts that need review.`,
      algorithm: {
        type: 'Constraint Satisfaction Problem (CSP) with Backtracking v2.0',
        features: [
          'Most Constrained Variable (MCV) heuristic',
          'Least Constraining Value (LCV) heuristic',
          'Forward checking constraint propagation',
          'Faculty preference optimization',
          'Load balancing',
          'Day distribution scoring',
          'Time quality scoring',
          'Room efficiency scoring',
          'Duplicate subject-section prevention',
          'Flexible time slot generation (30-min granularity)',
          'Pre-generation conflict detection',
          'Conflict persistence and tracking',
        ],
      },
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate schedules',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
