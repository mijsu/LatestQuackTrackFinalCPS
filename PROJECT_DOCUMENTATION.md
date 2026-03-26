# QuackTrack Scheduling System - Complete Technical Documentation

> **A comprehensive guide for students to understand and present this project to professors**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technologies Used](#technologies-used)
4. [How It Works](#how-it-works)
5. [Key Features](#key-features)
6. [Database Design](#database-design)
7. [APIs / Integrations](#apis--integrations)
8. [Security](#security)
9. [Challenges & Solutions](#challenges--solutions)
10. [How to Explain It Simply](#how-to-explain-it-simply)
11. [Possible Professor Questions & Answers](#possible-professor-questions--answers)

---

## Overview

### What is QuackTrack?

**QuackTrack** is an intelligent class scheduling system designed for **Pateros Technological College (PTC)**. The name "QuackTrack" is a playful combination of "Quack" (referencing the school's duck mascot) and "Track" (for tracking schedules).

### Main Purpose

The system solves the complex problem of creating class schedules for a college by:

- **Automatically generating conflict-free schedules** for all classes
- **Matching faculty members** to subjects based on their specializations
- **Assigning rooms** based on capacity and equipment requirements
- **Respecting faculty preferences** for days, times, and subjects
- **Detecting and resolving conflicts** such as double-bookings

### Problem Statement

Imagine a college with:
- 50+ faculty members
- 100+ subjects
- 30+ rooms
- 50+ sections (classes of students)

Each subject needs:
- A qualified faculty member
- An appropriate room
- A specific time slot
- No overlaps with other classes

**Manually creating schedules would take weeks and is error-prone.** QuackTrack automates this process in seconds.

### Real-World Analogy

Think of QuackTrack like a **smart puzzle solver**:
- The puzzle pieces are classes (subject + section + faculty + room + time)
- The puzzle board is the weekly schedule grid
- Some pieces can only go in certain spots (specializations, room capacity)
- No two pieces can occupy the same space (conflicts)

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Web Browser                            │    │
│  │  (React Components, Tailwind CSS, Framer Motion)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Next.js API Routes (REST)                     │    │
│  │  /api/schedules, /api/users, /api/generate, etc.        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Scheduling     │  │  Conflict       │  │  Authentication │  │
│  │  Algorithm      │  │  Detection      │  │  (NextAuth)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Prisma ORM                                     │    │
│  │   (Type-safe database queries)                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           PostgreSQL Database                            │    │
│  │   (Hosted on Render.com)                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

The frontend uses a **component-based architecture**:

```
src/
├── components/
│   ├── layout/          # App shell, sidebar, header, footer
│   ├── tables/          # Data tables for CRUD operations
│   ├── dashboard/       # Dashboard cards and charts
│   ├── auth/            # Login page
│   └── ui/              # Reusable UI components (buttons, inputs, etc.)
├── lib/                 # Business logic and utilities
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

### Backend Architecture

The backend follows a **Route Handler pattern** (Next.js App Router):

```
src/app/api/
├── auth/                # Authentication endpoints
├── users/               # User CRUD operations
├── schedules/           # Schedule management
├── generate/            # Schedule generation
├── conflicts/           # Conflict detection and resolution
├── departments/         # Department management
├── subjects/            # Subject management
├── rooms/               # Room management
└── sections/            # Section management
```

---

## Technologies Used

### Core Technologies

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Next.js 16** | Full-stack framework | Server-side rendering, API routes, excellent developer experience |
| **TypeScript** | Programming language | Type safety, better IDE support, fewer runtime errors |
| **React 19** | UI library | Component-based architecture, virtual DOM, large ecosystem |
| **Tailwind CSS 4** | Styling | Utility-first CSS, rapid prototyping, consistent design |
| **Prisma ORM** | Database toolkit | Type-safe queries, migrations, excellent PostgreSQL support |
| **PostgreSQL** | Database | Relational data, ACID compliance, scalable, free tier on Render |

### UI/UX Libraries

| Library | Purpose |
|---------|---------|
| **shadcn/ui** | Pre-built accessible UI components |
| **Radix UI** | Unstyled, accessible UI primitives |
| **Framer Motion** | Animations and transitions |
| **Lucide Icons** | Consistent icon library |
| **Recharts** | Data visualization (charts) |

### Authentication & Security

| Library | Purpose |
|---------|---------|
| **NextAuth.js v4** | Authentication system |
| **bcryptjs** | Password hashing |
| **JWT** | Session tokens |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Bun** | JavaScript runtime and package manager |
| **ESLint** | Code linting |
| **Electron** | Desktop app wrapper |

### Why These Choices?

1. **Next.js** over plain React:
   - Built-in API routes (no separate backend needed)
   - Server-side rendering for better performance
   - SEO-friendly

2. **PostgreSQL** over MongoDB:
   - Relational data (schedules relate to faculty, rooms, etc.)
   - ACID compliance (critical for scheduling data)
   - Better for complex queries with joins

3. **Prisma** over raw SQL:
   - Type-safe database access
   - Auto-generated types
   - Easier migrations

4. **Tailwind CSS** over traditional CSS:
   - Faster development
   - Consistent design system
   - No CSS file bloat

---

## How It Works

### User Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    LOGIN     │────▶│  DASHBOARD   │────▶│   MANAGE     │
│  (Faculty/   │     │  (View stats │     │   DATA       │
│   Admin)     │     │  & alerts)   │     │ (CRUD ops)   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  GENERATE    │     │  RESOLVE     │
                     │  SCHEDULES   │     │  CONFLICTS   │
                     └──────────────┘     └──────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐     ┌──────────────┐
                     │    VIEW &    │     │  EXPORT &    │
                     │    EDIT      │     │   REPORT     │
                     └──────────────┘     └──────────────┘
```

### Step-by-Step User Journey

#### 1. **Login**
- User enters institutional email and password
- System validates credentials using NextAuth.js
- Password is verified using bcrypt comparison
- JWT token is created for session management

#### 2. **Dashboard View**
- System displays:
  - Total faculty, schedules, conflicts count
  - Faculty utilization rates
  - Room occupancy rates
  - Recent activity and notifications

#### 3. **Data Management (Admin)**
- **Departments**: Add/edit academic departments (e.g., Computer Science)
- **Subjects**: Define courses with unit counts and specializations
- **Rooms**: Configure rooms with capacity and equipment
- **Sections**: Create student groups (e.g., BSIT-1A)
- **Faculty**: Add teachers with specializations and preferences

#### 4. **Schedule Generation**
1. Admin clicks "Generate Schedules"
2. System collects all required data:
   - Subjects that need scheduling
   - Available faculty with specializations
   - Available rooms with capacities
   - Faculty preferences
3. Algorithm runs to find optimal assignments
4. Results displayed with statistics

#### 5. **Conflict Resolution**
- System detects conflicts automatically:
  - Faculty double-booking
  - Room double-booking
  - Section overlap
- Provides resolution suggestions
- Admin can apply fixes manually or use suggestions

#### 6. **Export & Reports**
- Export schedules to various formats
- Generate analytics reports
- Track historical schedule versions

---

## Key Features

### 1. Intelligent Schedule Generation

**How it works:**

```
Input:
- Subjects (with required specializations)
- Faculty (with their specializations and preferences)
- Rooms (with capacities and equipment)
- Sections (student groups)

Algorithm Steps:
1. For each subject-section pair:
   a. Find faculty with matching specialization
   b. Find rooms with sufficient capacity
   c. Generate candidate time slots
   d. Score each combination based on:
      - Specialization match (35%)
      - Faculty preference (25%)
      - Department match (12%)
      - Load balance (10%)
      - Time quality (5%)
      - Day distribution (5%)
   e. Select best valid assignment
   f. Repeat for next pair

Output:
- List of schedule assignments
- List of conflicts (if any)
- Statistics and recommendations
```

**Code Example - Scoring Logic:**

```typescript
// Calculate score for a potential schedule assignment
function calculateScore(faculty, subject, room, timeSlot) {
  const score = {
    specializationMatch: checkSpecialization(faculty, subject) * 0.35,
    preferenceMatch: checkPreference(faculty, timeSlot) * 0.25,
    loadBalance: checkLoadBalance(faculty) * 0.10,
    roomEfficiency: checkRoomFit(room, section) * 0.03,
    timeQuality: checkTimeQuality(timeSlot) * 0.05,
    dayDistribution: checkDayBalance(timeSlot.day) * 0.05,
  };
  
  return Object.values(score).reduce((a, b) => a + b, 0);
}
```

### 2. Conflict Detection & Resolution

**Types of Conflicts:**

| Conflict Type | Severity | Description | Resolution |
|---------------|----------|-------------|------------|
| Faculty Double Booking | Critical | Same faculty, same time, different rooms | Reassign time or faculty |
| Room Double Booking | Critical | Same room, same time, different classes | Reassign time or room |
| Section Overlap | Critical | Same students, two classes at once | Reassign time |
| Specialization Gap | Warning | No faculty has required specialization | Add faculty or update subject |
| Room Capacity Gap | Warning | Room too small for section | Assign larger room |

**Conflict Detection Code:**

```typescript
function detectConflicts(schedules: Schedule[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i];
      const s2 = schedules[j];
      
      // Check if same day and overlapping time
      if (s1.day === s2.day && timesOverlap(s1, s2)) {
        // Faculty double booking
        if (s1.facultyId === s2.facultyId) {
          conflicts.push({
            type: 'faculty_double_booking',
            scheduleId1: s1.id,
            scheduleId2: s2.id,
            severity: 'critical',
          });
        }
        
        // Room double booking
        if (s1.roomId === s2.roomId) {
          conflicts.push({
            type: 'room_double_booking',
            scheduleId1: s1.id,
            scheduleId2: s2.id,
            severity: 'critical',
          });
        }
        
        // Section overlap
        if (s1.sectionId === s2.sectionId) {
          conflicts.push({
            type: 'section_overlap',
            scheduleId1: s1.id,
            scheduleId2: s2.id,
            severity: 'critical',
          });
        }
      }
    }
  }
  
  return conflicts;
}
```

### 3. Faculty Preference System

Faculty can set preferences for:
- **Preferred Days**: Which days they want to teach
- **Preferred Time Range**: Start and end times
- **Preferred Subjects**: Subjects they want to teach
- **Unavailable Days**: Days they cannot teach

**Preference Data Model:**

```typescript
interface FacultyPreference {
  facultyId: string;
  preferredDays: DayOfWeek[];      // ['Monday', 'Wednesday', 'Friday']
  preferredTimeStart: string;      // '08:00'
  preferredTimeEnd: string;        // '17:00'
  preferredSubjects: string[];     // ['CS101', 'CS102']
  unavailableDays: string[];       // ['Saturday']
  notes: string;                   // Additional notes
}
```

### 4. Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage all data, generate schedules, resolve conflicts, view analytics |
| **Faculty** | View own schedules, update preferences, accept/reject schedule assignments |

### 5. Schedule Versioning

The system maintains a history of schedule versions:
- Track changes over time
- Restore previous versions
- Compare different versions

### 6. Real-time Notifications

- Faculty receive notifications when assigned new classes
- Admin receive alerts for conflicts
- System tracks read/unread status

---

## Database Design

### Entity-Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Department  │       │   Subject   │       │    Room     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ name        │◄──────│ deptId      │       │ roomName    │
│ code        │       │ code        │       │ capacity    │
│ college     │       │ name        │       │ equipment   │
└─────────────┘       │ units       │       │ building    │
      │               │ specRequired│       └─────────────┘
      │               └─────────────┘             │
      │                     │                     │
      ▼                     │                     │
┌─────────────┐             │                     │
│    User     │             │                     │
├─────────────┤             │                     │
│ id          │             │                     │
│ uid         │             │                     │
│ name        │             │                     │
│ email       │             │                     │
│ password    │             │                     │
│ role        │             │                     │
│ deptId      │◄────────────┘                     │
│ maxUnits    │                                   │
│ specialize  │                                   │
└─────────────┘                                   │
      │                                           │
      │         ┌─────────────────────────────────┘
      │         │
      ▼         ▼
┌─────────────────────────────────────────────────────┐
│                    Schedule                          │
├─────────────────────────────────────────────────────┤
│ id                                                   │
│ subjectId  ────────► Subject                        │
│ facultyId  ────────► User (Faculty)                 │
│ sectionId  ────────► Section                        │
│ roomId     ────────► Room                           │
│ day                                                  │
│ startTime                                            │
│ endTime                                              │
│ status (generated/approved/conflict)                │
└─────────────────────────────────────────────────────┘
```

### Main Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Faculty and admin accounts | id, email, password, role, specialization, maxUnits |
| **Department** | Academic departments | id, name, code, college |
| **Subject** | Courses/subjects | id, subjectCode, subjectName, units, requiredSpecialization |
| **Room** | Classrooms and labs | id, roomName, capacity, equipment, building |
| **Section** | Student groups | id, sectionName, yearLevel, studentCount |
| **Schedule** | Generated schedules | id, subjectId, facultyId, sectionId, roomId, day, time |
| **FacultyPreference** | Faculty teaching preferences | facultyId, preferredDays, preferredTime |
| **Conflict** | Detected conflicts | id, type, scheduleId1, scheduleId2, severity |
| **AuditLog** | System activity tracking | id, userId, action, entity, timestamp |
| **Notification** | User notifications | id, userId, title, message, read |

### Key Relationships

```sql
-- One Department has many Users (Faculty)
User.departmentId → Department.id

-- One Department has many Subjects
Subject.departmentId → Department.id

-- One Schedule connects:
Schedule.subjectId → Subject.id
Schedule.facultyId → User.id
Schedule.roomId → Room.id
Schedule.sectionId → Section.id

-- One User has one FacultyPreference
FacultyPreference.facultyId → User.id
```

### Prisma Schema Example

```prisma
model User {
  id            String    @id @default(cuid())
  uid           String    @unique
  name          String
  email         String    @unique
  password      String
  role          String    @default("faculty")
  departmentId  String?
  contractType  String    @default("full-time")
  maxUnits      Int       @default(24)
  specialization String[]  @default([])
  
  department    Department?     @relation(fields: [departmentId], references: [id])
  preferences   FacultyPreference?
  schedules     Schedule[]
}

model Schedule {
  id          String   @id @default(cuid())
  subjectId   String
  facultyId   String
  sectionId   String
  roomId      String
  day         String
  startTime   String
  endTime     String
  status      String   @default("generated")
  
  subject     Subject  @relation(fields: [subjectId], references: [id])
  faculty     User     @relation(fields: [facultyId], references: [id])
  section     Section  @relation(fields: [sectionId], references: [id])
  room        Room     @relation(fields: [roomId], references: [id])
}
```

---

## APIs / Integrations

### REST API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | POST | Authentication |
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | GET, PUT, DELETE | CRUD single user |
| `/api/schedules` | GET, POST | List/create schedules |
| `/api/generate` | POST | Generate schedules |
| `/api/conflicts` | GET | List conflicts |
| `/api/conflicts/resolve` | POST | Resolve a conflict |
| `/api/departments` | GET, POST | Department management |
| `/api/subjects` | GET, POST | Subject management |
| `/api/rooms` | GET, POST | Room management |
| `/api/sections` | GET, POST | Section management |
| `/api/stats` | GET | Dashboard statistics |
| `/api/analytics` | GET | Schedule analytics |

### API Example: Generate Schedules

```typescript
// POST /api/generate
// Request body:
{
  "semester": "1st Semester",
  "academicYear": "2024-2025",
  "options": {
    "weights": {
      "specializationMatch": 0.35,
      "facultyPreference": 0.25
    }
  }
}

// Response:
{
  "success": true,
  "schedules": [...],
  "conflicts": [...],
  "stats": {
    "totalSlots": 100,
    "assignedSlots": 95,
    "assignmentRate": 0.95
  }
}
```

### External Integrations

| Service | Purpose |
|---------|---------|
| **Render.com** | Cloud hosting for PostgreSQL database |
| **Resend** | Email service for sending notifications |
| **Electron** | Desktop application wrapper |

### Email Integration

The system uses Resend for:
- Sending welcome emails to new faculty
- Password reset emails
- Schedule assignment notifications

---

## Security

### Authentication Security

1. **Password Hashing**
   ```typescript
   // Using bcrypt with salt rounds
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Session Management**
   - JWT-based sessions (24-hour expiry)
   - Secure HTTP-only cookies
   - CSRF protection built into NextAuth.js

3. **Role-Based Access Control**
   ```typescript
   // Middleware to check admin role
   export async function requireAdmin(session) {
     if (!session || session.user.role !== 'admin') {
       throw new Error('Unauthorized');
     }
   }
   ```

### Data Security

1. **Input Validation**
   - Zod schemas for all API inputs
   - Type checking with TypeScript

2. **SQL Injection Prevention**
   - Prisma ORM uses parameterized queries
   - No raw SQL queries

3. **XSS Prevention**
   - React automatically escapes content
   - DOMPurify for any user-generated HTML

### Security Headers

Next.js automatically sets:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Challenges & Solutions

### Challenge 1: Schedule Generation Complexity

**Problem**: Finding conflict-free schedules is an NP-complete problem. With many subjects, faculty, and rooms, the number of possible combinations explodes.

**Solution**: Implemented a **greedy algorithm with scoring**:
- Process subjects from most constrained to least constrained
- Score each potential assignment
- Backtrack when stuck (with limits to prevent infinite loops)
- Use weight-based scoring to prioritize important constraints

```typescript
// Sort by difficulty (most constrained first)
const sortedTasks = tasks.sort((a, b) => {
  const aScore = getDifficultyScore(a);
  const bScore = getDifficultyScore(b);
  return bScore - aScore; // Hardest first
});
```

### Challenge 2: Real-time Conflict Detection

**Problem**: Need to detect conflicts instantly when users make changes.

**Solution**: Implemented **incremental conflict detection**:
- Check only affected schedules when changes occur
- Use indexed database queries for fast lookups
- Display conflicts with visual indicators

### Challenge 3: Desktop Application Packaging

**Problem**: Users wanted a desktop application without needing technical knowledge.

**Solution**: Used **Electron** to package the web app:
- Bundles the web app as a standalone executable
- Includes embedded Node.js runtime
- Creates Windows installer (.exe) with electron-builder

**Key Configuration:**
```json
{
  "build": {
    "appId": "com.ptc.quacktrack",
    "productName": "QuackTrack",
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

### Challenge 4: Database Connection in Packaged App

**Problem**: The desktop app couldn't connect to the cloud database initially.

**Solution**: 
- Used Prisma's library engine format
- Configured SSL connection (`?sslmode=require`)
- Packaged database engines with the app

### Challenge 5: Mobile Responsiveness

**Problem**: Faculty needed to access the system on mobile devices.

**Solution**: Implemented **responsive design**:
- Mobile-first CSS approach with Tailwind
- Collapsible sidebar on mobile
- Touch-friendly UI elements
- Bottom navigation for mobile

---

## How to Explain It Simply

### 30-Second Summary

> "QuackTrack is an intelligent scheduling system for Pateros Technological College. It automatically creates conflict-free class schedules by matching qualified faculty to subjects, assigning appropriate rooms, and respecting teacher preferences—all in seconds instead of the weeks manual scheduling used to take. Built with Next.js, PostgreSQL, and a smart constraint-based algorithm."

### 1-Minute Summary

> "QuackTrack is a web-based scheduling system designed for Pateros Technological College. It solves the complex problem of creating class schedules by:
>
> 1. **Automatic Generation**: Using a scoring-based algorithm to match faculty with subjects based on specialization
> 2. **Conflict Detection**: Identifying and helping resolve scheduling conflicts like double-bookings
> 3. **Preference Support**: Allowing faculty to indicate their preferred teaching times and subjects
> 4. **Role-Based Access**: Giving admins full control and faculty limited access to their own schedules
>
> The system is built with modern technologies: Next.js for the full-stack framework, PostgreSQL for the database, and Prisma for type-safe database access. It can also be packaged as a desktop application using Electron."

### Key Points to Emphasize

1. **Solves a Real Problem**: Manual scheduling takes weeks; QuackTrack does it in seconds
2. **Intelligent Algorithm**: Uses weighted scoring to find optimal schedules
3. **Modern Tech Stack**: Industry-standard technologies (Next.js, PostgreSQL)
4. **User-Friendly**: Both web and desktop versions available
5. **Production-Ready**: Hosted database, proper authentication, error handling

---

## Possible Professor Questions & Answers

### Q1: Why did you choose PostgreSQL over MongoDB?

**Answer**: "We chose PostgreSQL because our data is highly relational. Schedules connect to subjects, faculty, rooms, and sections—all with defined relationships. PostgreSQL's ACID compliance ensures data integrity, which is critical for scheduling where double-bookings would cause real problems. MongoDB would be better for unstructured data, but for a scheduling system with clear entity relationships, a relational database is the correct choice."

### Q2: How does the scheduling algorithm handle conflicts?

**Answer**: "The algorithm uses a constraint-satisfaction approach. Before assigning a schedule, it checks multiple constraints:
1. Is the faculty member available at this time?
2. Is the room available at this time?
3. Does the section have another class at this time?
4. Does the faculty have the required specialization?
5. Does the room have enough capacity?

If any constraint fails, the algorithm tries the next best option. If it gets stuck, it can backtrack and try alternative assignments. After generation, we also run a separate conflict detection pass that reports any remaining conflicts with suggested resolutions."

### Q3: What is the time complexity of your algorithm?

**Answer**: "The worst-case time complexity is exponential, O(n!), because scheduling is an NP-complete problem—we're essentially solving a constraint satisfaction problem. However, in practice, we achieve near-linear performance through several optimizations:
1. **Greedy selection**: We process the most constrained items first
2. **Early termination**: We stop exploring paths that violate hard constraints
3. **Backtracking limit**: We limit backtracks to prevent infinite loops
4. **Scoring and pruning**: We prioritize high-scoring combinations and prune low-scoring branches

For our typical use case (50 faculty, 100 subjects, 30 rooms), generation completes in under 30 seconds."

### Q4: How do you ensure the system is secure?

**Answer**: "We implement security at multiple levels:

1. **Authentication**: NextAuth.js handles secure login with bcrypt password hashing
2. **Authorization**: Role-based access control distinguishes admin and faculty permissions
3. **Input Validation**: All API inputs are validated using Zod schemas
4. **SQL Injection Prevention**: Prisma ORM uses parameterized queries
5. **XSS Prevention**: React automatically escapes content, and we sanitize any HTML
6. **Session Security**: JWT tokens with 24-hour expiry, stored in HTTP-only cookies

We also follow the principle of least privilege—users can only access what they need for their role."

### Q5: Can this system scale to larger institutions?

**Answer**: "Yes, with some considerations:

**Current Scaling Capacity**:
- The algorithm handles hundreds of schedules efficiently
- PostgreSQL can scale vertically or be migrated to larger instances
- The frontend is already optimized with lazy loading and pagination

**For Larger Scale**:
- Add caching (Redis) for frequently accessed data
- Implement horizontal scaling with load balancers
- Use database read replicas for heavy read operations
- Consider microservices for the generation algorithm
- Add background job processing for schedule generation

The architecture follows best practices that allow scaling without major rewrites."

### Q6: How does the faculty preference system affect schedule quality?

**Answer**: "Faculty preferences are incorporated as soft constraints in our scoring algorithm. The preference score contributes 25% to the total assignment score.

For example:
- A faculty prefers Monday mornings: +25% to Monday 8AM slots
- A faculty lists preferred subjects: +20% when assigned those subjects
- A faculty marks Saturday unavailable: -80% penalty for Saturday assignments

The algorithm balances preferences against hard constraints like specialization match (35% weight). This means we won't assign an unqualified teacher just because they prefer the time slot, but among qualified teachers, we prefer those who want the slot."

### Q7: What happens if the algorithm can't assign all subjects?

**Answer**: "When the algorithm can't assign a subject, it records the reason and provides recommendations:

**Common reasons**:
- No faculty with required specialization
- No room with sufficient capacity
- Faculty fully loaded (max units reached)

**Recommendations provided**:
- 'Add a faculty member with [specialization]'
- 'Add a larger room'
- 'Increase faculty max units'

Administrators can then address these issues and regenerate. The system is transparent about what couldn't be assigned and why."

### Q8: Why use Next.js instead of separate frontend and backend?

**Answer**: "Next.js provides several advantages:

1. **Single Codebase**: Frontend and backend share TypeScript types, reducing bugs from mismatched interfaces
2. **API Routes**: Built-in backend functionality without setting up a separate Express server
3. **Server-Side Rendering**: Better initial load performance and SEO
4. **Development Speed**: Hot reloading for both frontend and backend
5. **Deployment Simplicity**: Single deployment instead of coordinating two separate services
6. **Cost Efficiency**: One hosting bill instead of two

For a college project with limited resources, this approach maximizes development efficiency without sacrificing capability."

### Q9: How does the desktop app version work?

**Answer**: "We use Electron to package the web application as a desktop app:

1. **Electron Shell**: Wraps the web app in a native window
2. **Embedded Node.js**: Runs the Next.js server internally
3. **Prisma Engines**: Database query engines are packaged with the app
4. **SSL Connection**: Connects securely to our cloud PostgreSQL database

The build process:
1. Build the Next.js app in standalone mode
2. Compile TypeScript for Electron's main process
3. Package with electron-builder
4. Create Windows installer (.exe) and portable version

Users get a double-click installation experience without needing to install Node.js or any dependencies."

### Q10: What would you improve if you had more time?

**Answer**: "Several enhancements I'd prioritize:

1. **Machine Learning**: Learn from past schedules to predict better assignments
2. **Drag-and-Drop Calendar**: Visual schedule editing interface
3. **Mobile App**: Native iOS/Android apps with offline support
4. **Real-time Collaboration**: Multiple admins editing simultaneously
5. **Advanced Analytics**: Predictive insights on workload distribution
6. **Import/Export**: Support for Excel, CSV, and standard formats
7. **Notification System**: Push notifications and email reminders
8. **Audit Trail**: Complete history of all changes with undo capability

The current foundation is solid, so these would be feature additions rather than architectural changes."

---

## Conclusion

QuackTrack demonstrates a complete full-stack application that solves a real-world problem. It combines:

- **Intelligent Algorithms**: Constraint-satisfaction scheduling
- **Modern Architecture**: Next.js full-stack with PostgreSQL
- **User Experience**: Responsive design with desktop packaging
- **Security**: Authentication, authorization, and data protection
- **Maintainability**: TypeScript, Prisma, and clean architecture

This project showcases skills applicable to professional software development while solving an actual institutional need.

---

*Document prepared for academic presentation purposes.*
*QuackTrack - Pateros Technological College Scheduling System*
