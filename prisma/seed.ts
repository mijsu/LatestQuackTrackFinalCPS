import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Computer Science' },
      update: {},
      create: {
        name: 'Computer Science',
        code: 'CS',
        college: 'College of Engineering',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Electronics Engineering' },
      update: {},
      create: {
        name: 'Electronics Engineering',
        code: 'EE',
        college: 'College of Engineering',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Mechanical Engineering' },
      update: {},
      create: {
        name: 'Mechanical Engineering',
        code: 'ME',
        college: 'College of Engineering',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Civil Engineering' },
      update: {},
      create: {
        name: 'Civil Engineering',
        code: 'CE',
        college: 'College of Engineering',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Business Administration' },
      update: {},
      create: {
        name: 'Business Administration',
        code: 'BA',
        college: 'College of Business',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Accountancy' },
      update: {},
      create: {
        name: 'Accountancy',
        code: 'ACC',
        college: 'College of Business',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Hospitality Management' },
      update: {},
      create: {
        name: 'Hospitality Management',
        code: 'HM',
        college: 'College of Hospitality',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Tourism Management' },
      update: {},
      create: {
        name: 'Tourism Management',
        code: 'TM',
        college: 'College of Hospitality',
      },
    }),
  ]);

  const csDept = departments.find(d => d.code === 'CS')!;
  const eeDept = departments.find(d => d.code === 'EE')!;
  const meDept = departments.find(d => d.code === 'ME')!;
  const ceDept = departments.find(d => d.code === 'CE')!;
  const baDept = departments.find(d => d.code === 'BA')!;
  const accDept = departments.find(d => d.code === 'ACC')!;
  const hmDept = departments.find(d => d.code === 'HM')!;
  const tmDept = departments.find(d => d.code === 'TM')!;
  
  console.log(`✅ Created ${departments.length} departments`);

  // Hash password for all demo accounts
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ptc.edu.ph' },
    update: {},
    create: {
      uid: 'admin-001',
      name: 'System Administrator',
      email: 'admin@ptc.edu.ph',
      password: hashedPassword,
      role: 'admin',
      maxUnits: 24,
      specialization: '[]',
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create faculty members - 5+ for each department
  // Philippine names with variety
  const csFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'jsantos@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-001',
        name: 'Dr. Jose Santos',
        email: 'jsantos@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 24,
        specialization: '["Computer Science", "Software Engineering"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mreyes@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-002',
        name: 'Prof. Maria Reyes',
        email: 'mreyes@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 21,
        specialization: '["Web Development", "Mobile Apps"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'rcruz@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-003',
        name: 'Prof. Rodrigo Cruz',
        email: 'rcruz@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 24,
        specialization: '["Networking", "Security"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'agarcia@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-004',
        name: 'Dr. Antonio Garcia',
        email: 'agarcia@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 18,
        specialization: '["Database Systems", "Data Science"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'cmendoza@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-005',
        name: 'Prof. Cristina Mendoza',
        email: 'cmendoza@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 21,
        specialization: '["Programming", "Algorithms"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'fvillanueva@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-cs-006',
        name: 'Prof. Fernando Villanueva',
        email: 'fvillanueva@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: csDept.id,
        maxUnits: 15,
        specialization: '["Computer Graphics", "Game Development"]',
      },
    }),
  ]);
  
  const eceFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'eaguilar@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ece-001',
        name: 'Engr. Eduardo Aguilar',
        email: 'eaguilar@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: eeDept.id,
        maxUnits: 24,
        specialization: '["Electronics", "Embedded Systems"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ldelrosario@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ece-002',
        name: 'Prof. Lourdes Del Rosario',
        email: 'ldelrosario@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: eeDept.id,
        maxUnits: 21,
        specialization: '["Communications", "Signal Processing"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'rbautista@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ece-003',
        name: 'Engr. Ricardo Bautista',
        email: 'rbautista@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: eeDept.id,
        maxUnits: 24,
        specialization: '["Digital Systems", "Microprocessors"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'nnavarro@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ece-004',
        name: 'Prof. Nancy Navarro',
        email: 'nnavarro@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: eeDept.id,
        maxUnits: 18,
        specialization: '["Control Systems", "Automation"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jsalvador@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ece-005',
        name: 'Engr. Jonathan Salvador',
        email: 'jsalvador@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: eeDept.id,
        maxUnits: 21,
        specialization: '["PCB Design", "Hardware Design"]',
      },
    }),
  ]);
  
  const meFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ahernandez@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-me-001',
        name: 'Engr. Alfredo Hernandez',
        email: 'ahernandez@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: meDept.id,
        maxUnits: 24,
        specialization: '["Thermodynamics", "Heat Transfer"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'gtorres@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-me-002',
        name: 'Prof. Gloria Torres',
        email: 'gtorres@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: meDept.id,
        maxUnits: 21,
        specialization: '["Machine Design", "Mechanics"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'csumulong@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-me-003',
        name: 'Engr. Carlos Sumulong',
        email: 'csumulong@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: meDept.id,
        maxUnits: 24,
        specialization: '["Manufacturing", "Production"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mangulo@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-me-004',
        name: 'Prof. Milagros Angulo',
        email: 'mangulo@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: meDept.id,
        maxUnits: 18,
        specialization: '["Fluid Mechanics", "Hydraulics"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dpanganiban@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-me-005',
        name: 'Engr. Diosdado Panganiban',
        email: 'dpanganiban@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: meDept.id,
        maxUnits: 21,
        specialization: '["CAD/CAM", "Automotive"]',
      },
    }),
  ]);
  
  const ceFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'rramos@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ce-001',
        name: 'Engr. Reynaldo Ramos',
        email: 'rramos@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: ceDept.id,
        maxUnits: 24,
        specialization: '["Structural Engineering", "Concrete Design"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'cdeleon@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ce-002',
        name: 'Prof. Carmelita De Leon',
        email: 'cdeleon@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: ceDept.id,
        maxUnits: 21,
        specialization: '["Geotechnical", "Foundation Design"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bcastillo@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ce-003',
        name: 'Engr. Benjamin Castillo',
        email: 'bcastillo@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: ceDept.id,
        maxUnits: 24,
        specialization: '["Transportation", "Highway Design"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'esison@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ce-004',
        name: 'Prof. Evelyn Sison',
        email: 'esison@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: ceDept.id,
        maxUnits: 18,
        specialization: '["Environmental", "Water Resources"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'gsantos@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ce-005',
        name: 'Engr. Gerardo Santos',
        email: 'gsantos@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: ceDept.id,
        maxUnits: 21,
        specialization: '["Construction Management", "Project Management"]',
      },
    }),
  ]);
  
  const baFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'mlim@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ba-001',
        name: 'Dr. Magdalena Lim',
        email: 'mlim@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: baDept.id,
        maxUnits: 24,
        specialization: '["Marketing", "Brand Management"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jtan@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ba-002',
        name: 'Prof. Johnny Tan',
        email: 'jtan@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: baDept.id,
        maxUnits: 21,
        specialization: '["Finance", "Investment"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'rgo@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ba-003',
        name: 'Prof. Rosita Go',
        email: 'rgo@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: baDept.id,
        maxUnits: 24,
        specialization: '["Human Resources", "Organizational Behavior"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dyap@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ba-004',
        name: 'Dr. Domingo Yap',
        email: 'dyap@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: baDept.id,
        maxUnits: 18,
        specialization: '["Entrepreneurship", "Business Planning"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lchua@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-ba-005',
        name: 'Prof. Lilia Chua',
        email: 'lchua@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: baDept.id,
        maxUnits: 21,
        specialization: '["Operations", "Supply Chain"]',
      },
    }),
  ]);
  
  const accFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'cperez@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-acc-001',
        name: 'CPA. Consuelo Perez',
        email: 'cperez@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: accDept.id,
        maxUnits: 24,
        specialization: '["Financial Accounting", "Reporting"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'osy@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-acc-002',
        name: 'CPA. Oscar Sy',
        email: 'osy@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: accDept.id,
        maxUnits: 21,
        specialization: '["Taxation", "Tax Planning"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ruy@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-acc-003',
        name: 'CPA. Regina Uy',
        email: 'ruy@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: accDept.id,
        maxUnits: 24,
        specialization: '["Auditing", "Internal Control"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bdizon@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-acc-004',
        name: 'CPA. Benjamin Dizon',
        email: 'bdizon@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: accDept.id,
        maxUnits: 18,
        specialization: '["Cost Accounting", "Managerial Accounting"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ngonzales@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-acc-005',
        name: 'CPA. Norma Gonzales',
        email: 'ngonzales@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: accDept.id,
        maxUnits: 21,
        specialization: '["Forensic Accounting", "Fraud Examination"]',
      },
    }),
  ]);
  
  const hmFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'vco@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-hm-001',
        name: 'Chef. Victor Co',
        email: 'vco@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: hmDept.id,
        maxUnits: 24,
        specialization: '["Culinary", "Asian Cuisine"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dyu@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-hm-002',
        name: 'Prof. Diana Yu',
        email: 'dyu@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: hmDept.id,
        maxUnits: 21,
        specialization: '["Hotel Management", "Front Office"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'olee@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-hm-003',
        name: 'Chef. Orlando Lee',
        email: 'olee@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: hmDept.id,
        maxUnits: 24,
        specialization: '["Baking", "Pastry Arts"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'rtan@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-hm-004',
        name: 'Prof. Ruby Tan',
        email: 'rtan@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: hmDept.id,
        maxUnits: 18,
        specialization: '["Events", "Banquet Management"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ewong@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-hm-005',
        name: 'Chef. Eleanor Wong',
        email: 'ewong@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: hmDept.id,
        maxUnits: 21,
        specialization: '["Food and Beverage", "Bar Management"]',
      },
    }),
  ]);
  
  const tmFaculty = await Promise.all([
    prisma.user.upsert({
      where: { email: 'hlo@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-tm-001',
        name: 'Prof. Hector Lo',
        email: 'hlo@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: tmDept.id,
        maxUnits: 24,
        specialization: '["Tour Operations", "Tour Guiding"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mbautista@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-tm-002',
        name: 'Prof. Myrna Bautista',
        email: 'mbautista@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: tmDept.id,
        maxUnits: 21,
        specialization: '["Tourism Marketing", "Destination Management"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ngomez@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-tm-003',
        name: 'Engr. Nicolas Gomez',
        email: 'ngomez@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: tmDept.id,
        maxUnits: 24,
        specialization: '["Airline Operations", "Aviation"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'cpadilla@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-tm-004',
        name: 'Prof. Carmelita Padilla',
        email: 'cpadilla@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: tmDept.id,
        maxUnits: 18,
        specialization: '["Ecotourism", "Sustainable Tourism"]',
      },
    }),
    prisma.user.upsert({
      where: { email: 'rvaldez@ptc.edu.ph' },
      update: {},
      create: {
        uid: 'faculty-tm-005',
        name: 'Prof. Ricardo Valdez',
        email: 'rvaldez@ptc.edu.ph',
        password: hashedPassword,
        role: 'faculty',
        departmentId: tmDept.id,
        maxUnits: 21,
        specialization: '["Travel Agency", "Cruise Management"]',
      },
    }),
  ]);
  
  const allFaculty = [...csFaculty, ...eceFaculty, ...meFaculty, ...ceFaculty, ...baFaculty, ...accFaculty, ...hmFaculty, ...tmFaculty];
  console.log(`✅ Created ${allFaculty.length} faculty members across all departments`);

  // Create faculty preferences for all faculty with varied time preferences
  // Distribute preferences to cover BOTH early morning (7AM) AND late evening (9PM)
  // This ensures schedules can be generated from 7:00 AM to 9:00 PM
  for (let i = 0; i < allFaculty.length; i++) {
    const faculty = allFaculty[i];
    
    // Vary time preferences for balanced coverage across the entire day
    let timePrefs: { start: string; end: string };
    if (i % 5 === 0) {
      // Early morning focus: 7AM - 3PM
      timePrefs = { start: '07:00', end: '15:00' };
    } else if (i % 5 === 1) {
      // Full day: 7AM - 9PM (can cover both extremes)
      timePrefs = { start: '07:00', end: '21:00' };
    } else if (i % 5 === 2) {
      // Late morning to evening: 9AM - 9PM
      timePrefs = { start: '09:00', end: '21:00' };
    } else if (i % 5 === 3) {
      // Afternoon to night: 1PM - 9PM (for evening classes)
      timePrefs = { start: '13:00', end: '21:00' };
    } else {
      // Full day: 7AM - 9PM
      timePrefs = { start: '07:00', end: '21:00' };
    }
    
    await prisma.facultyPreference.upsert({
      where: { facultyId: faculty.id },
      update: {},
      create: {
        facultyId: faculty.id,
        preferredDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
        preferredTimeStart: timePrefs.start,
        preferredTimeEnd: timePrefs.end,
        preferredSubjects: '[]',
      },
    });
  }
  console.log(`✅ Created faculty preferences for ${allFaculty.length} faculty with balanced 7AM-9PM coverage`);

  // Create sample rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { roomName: 'Room 101' },
      update: {},
      create: {
        roomName: 'Room 101',
        roomCode: 'R101',
        capacity: 40,
        equipment: '["Projector", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 102' },
      update: {},
      create: {
        roomName: 'Room 102',
        roomCode: 'R102',
        capacity: 35,
        equipment: '["Projector", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 103' },
      update: {},
      create: {
        roomName: 'Room 103',
        roomCode: 'R103',
        capacity: 40,
        equipment: '["Projector", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 104' },
      update: {},
      create: {
        roomName: 'Room 104',
        roomCode: 'R104',
        capacity: 35,
        equipment: '["Projector", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 201' },
      update: {},
      create: {
        roomName: 'Room 201',
        roomCode: 'R201',
        capacity: 45,
        equipment: '["Projector", "Whiteboard", "Audio System"]',
        building: 'Main Building',
        floor: 2,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 202' },
      update: {},
      create: {
        roomName: 'Room 202',
        roomCode: 'R202',
        capacity: 45,
        equipment: '["Projector", "Whiteboard", "Audio System"]',
        building: 'Main Building',
        floor: 2,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 203' },
      update: {},
      create: {
        roomName: 'Room 203',
        roomCode: 'R203',
        capacity: 40,
        equipment: '["Projector", "Whiteboard"]',
        building: 'Main Building',
        floor: 2,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 301' },
      update: {},
      create: {
        roomName: 'Room 301',
        roomCode: 'R301',
        capacity: 50,
        equipment: '["Projector", "Whiteboard", "Audio System"]',
        building: 'Main Building',
        floor: 3,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Room 302' },
      update: {},
      create: {
        roomName: 'Room 302',
        roomCode: 'R302',
        capacity: 50,
        equipment: '["Projector", "Whiteboard", "Audio System"]',
        building: 'Main Building',
        floor: 3,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Computer Lab A' },
      update: {},
      create: {
        roomName: 'Computer Lab A',
        roomCode: 'LAB-A',
        capacity: 30,
        equipment: '["Computers", "Projector", "Air Conditioning"]',
        building: 'IT Building',
        floor: 2,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Computer Lab B' },
      update: {},
      create: {
        roomName: 'Computer Lab B',
        roomCode: 'LAB-B',
        capacity: 30,
        equipment: '["Computers", "Projector", "Air Conditioning"]',
        building: 'IT Building',
        floor: 2,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Electronics Lab' },
      update: {},
      create: {
        roomName: 'Electronics Lab',
        roomCode: 'ECE-LAB',
        capacity: 25,
        equipment: '["Oscilloscopes", "Signal Generators", "Power Supplies", "Soldering Stations"]',
        building: 'Engineering Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Mechanical Workshop' },
      update: {},
      create: {
        roomName: 'Mechanical Workshop',
        roomCode: 'ME-WS',
        capacity: 30,
        equipment: '["Lathe Machines", "Milling Machines", "Welding Equipment", "Hand Tools"]',
        building: 'Engineering Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Civil Engineering Lab' },
      update: {},
      create: {
        roomName: 'Civil Engineering Lab',
        roomCode: 'CE-LAB',
        capacity: 25,
        equipment: '["Testing Machines", "Surveying Equipment", "Concrete Testing"]',
        building: 'Engineering Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Kitchen Laboratory' },
      update: {},
      create: {
        roomName: 'Kitchen Laboratory',
        roomCode: 'KIT-LAB',
        capacity: 20,
        equipment: '["Commercial Stoves", "Ovens", "Refrigerators", "Kitchen Utensils"]',
        building: 'Hospitality Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Demo Kitchen' },
      update: {},
      create: {
        roomName: 'Demo Kitchen',
        roomCode: 'DEMO-KIT',
        capacity: 30,
        equipment: '["Demo Stove", "Video Display", "Mirrors", "Refrigerator"]',
        building: 'Hospitality Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Computer Lab C' },
      update: {},
      create: {
        roomName: 'Computer Lab C',
        roomCode: 'LAB-C',
        capacity: 35,
        equipment: '["Computers", "Projector", "Air Conditioning", "Accounting Software"]',
        building: 'Business Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Lecture Hall A' },
      update: {},
      create: {
        roomName: 'Lecture Hall A',
        roomCode: 'LH-A',
        capacity: 100,
        equipment: '["Projector", "Audio System", "Microphone", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
    prisma.room.upsert({
      where: { roomName: 'Lecture Hall B' },
      update: {},
      create: {
        roomName: 'Lecture Hall B',
        roomCode: 'LH-B',
        capacity: 100,
        equipment: '["Projector", "Audio System", "Microphone", "Whiteboard"]',
        building: 'Main Building',
        floor: 1,
      },
    }),
  ]);

  console.log(`✅ Created ${rooms.length} rooms`);

  // ============================================
  // SUBJECTS FOR ALL DEPARTMENTS
  // ============================================
  
  // Computer Science Subjects
  const csSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'CS101' },
      update: {},
      create: {
        subjectCode: 'CS101',
        subjectName: 'Introduction to Programming',
        description: 'Fundamentals of programming using Python',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS102' },
      update: {},
      create: {
        subjectCode: 'CS102',
        subjectName: 'Data Structures and Algorithms',
        description: 'Study of data structures and algorithm design',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Computer Science"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS103' },
      update: {},
      create: {
        subjectCode: 'CS103',
        subjectName: 'Database Management Systems',
        description: 'Relational database design and SQL',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Database Systems"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS104' },
      update: {},
      create: {
        subjectCode: 'CS104',
        subjectName: 'Web Development',
        description: 'HTML, CSS, JavaScript and modern frameworks',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Web Development"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS105' },
      update: {},
      create: {
        subjectCode: 'CS105',
        subjectName: 'Object-Oriented Programming',
        description: 'OOP concepts using Java',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Programming"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS106' },
      update: {},
      create: {
        subjectCode: 'CS106',
        subjectName: 'Operating Systems',
        description: 'Operating system concepts and principles',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Computer Science"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS107' },
      update: {},
      create: {
        subjectCode: 'CS107',
        subjectName: 'Computer Networks',
        description: 'Network protocols, architecture, and administration',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Networking"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS108' },
      update: {},
      create: {
        subjectCode: 'CS108',
        subjectName: 'Software Engineering',
        description: 'Software development methodologies and practices',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Software Engineering"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS109' },
      update: {},
      create: {
        subjectCode: 'CS109',
        subjectName: 'Mobile App Development',
        description: 'Building mobile applications for Android and iOS',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Mobile Apps"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CS110' },
      update: {},
      create: {
        subjectCode: 'CS110',
        subjectName: 'Computer Graphics',
        description: 'Graphics programming and visualization',
        units: 3,
        departmentId: csDept.id,
        requiredSpecialization: '["Computer Graphics"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Electronics Engineering Subjects
  const eceSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'ECE101' },
      update: {},
      create: {
        subjectCode: 'ECE101',
        subjectName: 'Basic Electrical Engineering',
        description: 'Fundamentals of electrical circuits and components',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE102' },
      update: {},
      create: {
        subjectCode: 'ECE102',
        subjectName: 'Electronic Devices and Circuits',
        description: 'Study of semiconductor devices and circuit analysis',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Electronics"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE103' },
      update: {},
      create: {
        subjectCode: 'ECE103',
        subjectName: 'Digital Electronics',
        description: 'Logic gates, flip-flops, and digital circuit design',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Digital Systems"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE104' },
      update: {},
      create: {
        subjectCode: 'ECE104',
        subjectName: 'Signals and Systems',
        description: 'Signal processing and system analysis',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Signal Processing"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE105' },
      update: {},
      create: {
        subjectCode: 'ECE105',
        subjectName: 'Microprocessors and Microcontrollers',
        description: 'Architecture and programming of microprocessors',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Embedded Systems"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE106' },
      update: {},
      create: {
        subjectCode: 'ECE106',
        subjectName: 'Communication Systems',
        description: 'Analog and digital communication principles',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Communications"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE107' },
      update: {},
      create: {
        subjectCode: 'ECE107',
        subjectName: 'Control Systems',
        description: 'Feedback control systems and automation',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Control Systems"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE108' },
      update: {},
      create: {
        subjectCode: 'ECE108',
        subjectName: 'PCB Design',
        description: 'Printed circuit board design and fabrication',
        units: 2,
        departmentId: eeDept.id,
        requiredSpecialization: '["PCB Design"]',
        defaultDurationHours: 2,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE109' },
      update: {},
      create: {
        subjectCode: 'ECE109',
        subjectName: 'Antenna Theory and Design',
        description: 'Antenna principles and wireless communication',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Communications"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ECE110' },
      update: {},
      create: {
        subjectCode: 'ECE110',
        subjectName: 'Embedded Systems Design',
        description: 'Design and programming of embedded systems',
        units: 3,
        departmentId: eeDept.id,
        requiredSpecialization: '["Embedded Systems"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Mechanical Engineering Subjects
  const meSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'ME101' },
      update: {},
      create: {
        subjectCode: 'ME101',
        subjectName: 'Engineering Mechanics',
        description: 'Statics and dynamics of rigid bodies',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME102' },
      update: {},
      create: {
        subjectCode: 'ME102',
        subjectName: 'Thermodynamics',
        description: 'Principles of heat and energy transfer',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Thermodynamics"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME103' },
      update: {},
      create: {
        subjectCode: 'ME103',
        subjectName: 'Fluid Mechanics',
        description: 'Study of fluids at rest and in motion',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Fluid Mechanics"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME104' },
      update: {},
      create: {
        subjectCode: 'ME104',
        subjectName: 'Strength of Materials',
        description: 'Stress, strain, and material properties',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Materials"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME105' },
      update: {},
      create: {
        subjectCode: 'ME105',
        subjectName: 'Machine Design',
        description: 'Design of machine elements and systems',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Machine Design"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME106' },
      update: {},
      create: {
        subjectCode: 'ME106',
        subjectName: 'Manufacturing Processes',
        description: 'Various manufacturing techniques and processes',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Manufacturing"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME107' },
      update: {},
      create: {
        subjectCode: 'ME107',
        subjectName: 'Heat Transfer',
        description: 'Conduction, convection, and radiation',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Thermodynamics"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME108' },
      update: {},
      create: {
        subjectCode: 'ME108',
        subjectName: 'CAD/CAM',
        description: 'Computer-aided design and manufacturing',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["CAD/CAM"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME109' },
      update: {},
      create: {
        subjectCode: 'ME109',
        subjectName: 'Refrigeration and Air Conditioning',
        description: 'HVAC systems and principles',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["HVAC"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ME110' },
      update: {},
      create: {
        subjectCode: 'ME110',
        subjectName: 'Automotive Engineering',
        description: 'Vehicle systems and design',
        units: 3,
        departmentId: meDept.id,
        requiredSpecialization: '["Automotive"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Civil Engineering Subjects
  const ceSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'CE101' },
      update: {},
      create: {
        subjectCode: 'CE101',
        subjectName: 'Surveying',
        description: 'Land surveying and measurement techniques',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE102' },
      update: {},
      create: {
        subjectCode: 'CE102',
        subjectName: 'Structural Analysis',
        description: 'Analysis of structures and load calculations',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Structural Engineering"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE103' },
      update: {},
      create: {
        subjectCode: 'CE103',
        subjectName: 'Reinforced Concrete Design',
        description: 'Design of RC structural elements',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Structural Engineering"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE104' },
      update: {},
      create: {
        subjectCode: 'CE104',
        subjectName: 'Geotechnical Engineering',
        description: 'Soil mechanics and foundation design',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Geotechnical"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE105' },
      update: {},
      create: {
        subjectCode: 'CE105',
        subjectName: 'Hydraulics',
        description: 'Water flow and hydraulic structures',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Hydraulics"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE106' },
      update: {},
      create: {
        subjectCode: 'CE106',
        subjectName: 'Construction Materials',
        description: 'Properties and testing of construction materials',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Materials"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE107' },
      update: {},
      create: {
        subjectCode: 'CE107',
        subjectName: 'Transportation Engineering',
        description: 'Highway design and transportation systems',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Transportation"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE108' },
      update: {},
      create: {
        subjectCode: 'CE108',
        subjectName: 'Environmental Engineering',
        description: 'Water treatment and environmental systems',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Environmental"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE109' },
      update: {},
      create: {
        subjectCode: 'CE109',
        subjectName: 'Construction Management',
        description: 'Project management in construction',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Construction Management"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'CE110' },
      update: {},
      create: {
        subjectCode: 'CE110',
        subjectName: 'Steel Design',
        description: 'Design of steel structures',
        units: 3,
        departmentId: ceDept.id,
        requiredSpecialization: '["Structural Engineering"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Business Administration Subjects
  const baSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'BA101' },
      update: {},
      create: {
        subjectCode: 'BA101',
        subjectName: 'Principles of Management',
        description: 'Fundamentals of business management',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA102' },
      update: {},
      create: {
        subjectCode: 'BA102',
        subjectName: 'Marketing Management',
        description: 'Marketing principles and strategies',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Marketing"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA103' },
      update: {},
      create: {
        subjectCode: 'BA103',
        subjectName: 'Human Resource Management',
        description: 'HR practices and organizational behavior',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Human Resources"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA104' },
      update: {},
      create: {
        subjectCode: 'BA104',
        subjectName: 'Business Finance',
        description: 'Financial management and analysis',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Finance"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA105' },
      update: {},
      create: {
        subjectCode: 'BA105',
        subjectName: 'Operations Management',
        description: 'Production and operations strategies',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Operations"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA106' },
      update: {},
      create: {
        subjectCode: 'BA106',
        subjectName: 'Business Ethics',
        description: 'Ethical principles in business',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA107' },
      update: {},
      create: {
        subjectCode: 'BA107',
        subjectName: 'Entrepreneurship',
        description: 'Starting and managing a business',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Entrepreneurship"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA108' },
      update: {},
      create: {
        subjectCode: 'BA108',
        subjectName: 'Business Research',
        description: 'Research methods in business',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Research"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA109' },
      update: {},
      create: {
        subjectCode: 'BA109',
        subjectName: 'International Business',
        description: 'Global business strategies',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["International Business"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'BA110' },
      update: {},
      create: {
        subjectCode: 'BA110',
        subjectName: 'Strategic Management',
        description: 'Business strategy formulation and implementation',
        units: 3,
        departmentId: baDept.id,
        requiredSpecialization: '["Strategy"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Accountancy Subjects
  const accSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'ACC101' },
      update: {},
      create: {
        subjectCode: 'ACC101',
        subjectName: 'Fundamentals of Accounting',
        description: 'Basic accounting principles and practices',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC102' },
      update: {},
      create: {
        subjectCode: 'ACC102',
        subjectName: 'Financial Accounting',
        description: 'Preparation and analysis of financial statements',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Financial Accounting"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC103' },
      update: {},
      create: {
        subjectCode: 'ACC103',
        subjectName: 'Managerial Accounting',
        description: 'Accounting for management decision-making',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Managerial Accounting"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC104' },
      update: {},
      create: {
        subjectCode: 'ACC104',
        subjectName: 'Cost Accounting',
        description: 'Cost analysis and control',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Cost Accounting"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC105' },
      update: {},
      create: {
        subjectCode: 'ACC105',
        subjectName: 'Taxation',
        description: 'Tax laws and compliance',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Taxation"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC106' },
      update: {},
      create: {
        subjectCode: 'ACC106',
        subjectName: 'Auditing',
        description: 'Auditing principles and procedures',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Auditing"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC107' },
      update: {},
      create: {
        subjectCode: 'ACC107',
        subjectName: 'Accounting Information Systems',
        description: 'Information systems in accounting',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Accounting Systems"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC108' },
      update: {},
      create: {
        subjectCode: 'ACC108',
        subjectName: 'Advanced Financial Accounting',
        description: 'Complex accounting transactions',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Financial Accounting"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC109' },
      update: {},
      create: {
        subjectCode: 'ACC109',
        subjectName: 'Government Accounting',
        description: 'Accounting for government entities',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Government Accounting"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'ACC110' },
      update: {},
      create: {
        subjectCode: 'ACC110',
        subjectName: 'Forensic Accounting',
        description: 'Fraud examination and forensic analysis',
        units: 3,
        departmentId: accDept.id,
        requiredSpecialization: '["Forensic Accounting"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Hospitality Management Subjects
  const hmSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'HM101' },
      update: {},
      create: {
        subjectCode: 'HM101',
        subjectName: 'Introduction to Hospitality Industry',
        description: 'Overview of hospitality and tourism industry',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM102' },
      update: {},
      create: {
        subjectCode: 'HM102',
        subjectName: 'Food and Beverage Service',
        description: 'Restaurant operations and service',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Food and Beverage"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM103' },
      update: {},
      create: {
        subjectCode: 'HM103',
        subjectName: 'Culinary Arts',
        description: 'Cooking techniques and food preparation',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Culinary"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM104' },
      update: {},
      create: {
        subjectCode: 'HM104',
        subjectName: 'Housekeeping Management',
        description: 'Housekeeping operations and management',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Housekeeping"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM105' },
      update: {},
      create: {
        subjectCode: 'HM105',
        subjectName: 'Front Office Operations',
        description: 'Front desk and guest services',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Front Office"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM106' },
      update: {},
      create: {
        subjectCode: 'HM106',
        subjectName: 'Hotel Management',
        description: 'Hotel operations and administration',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Hotel Management"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM107' },
      update: {},
      create: {
        subjectCode: 'HM107',
        subjectName: 'Event Management',
        description: 'Planning and managing events',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Events"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM108' },
      update: {},
      create: {
        subjectCode: 'HM108',
        subjectName: 'Baking and Pastry Arts',
        description: 'Baking techniques and pastry production',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Baking"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM109' },
      update: {},
      create: {
        subjectCode: 'HM109',
        subjectName: 'Food Safety and Sanitation',
        description: 'Food safety standards and practices',
        units: 2,
        departmentId: hmDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 2,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'HM110' },
      update: {},
      create: {
        subjectCode: 'HM110',
        subjectName: 'Bar Management',
        description: 'Bar operations and beverage management',
        units: 3,
        departmentId: hmDept.id,
        requiredSpecialization: '["Bar Management"]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  // Tourism Management Subjects
  const tmSubjects = await Promise.all([
    prisma.subject.upsert({
      where: { subjectCode: 'TM101' },
      update: {},
      create: {
        subjectCode: 'TM101',
        subjectName: 'Introduction to Tourism',
        description: 'Fundamentals of tourism industry',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM102' },
      update: {},
      create: {
        subjectCode: 'TM102',
        subjectName: 'Tourism Marketing',
        description: 'Marketing strategies for tourism',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Tourism Marketing"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM103' },
      update: {},
      create: {
        subjectCode: 'TM103',
        subjectName: 'Tour Operations',
        description: 'Tour planning and operations',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Tour Operations"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM104' },
      update: {},
      create: {
        subjectCode: 'TM104',
        subjectName: 'Travel Agency Management',
        description: 'Travel agency operations and management',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Travel Agency"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM105' },
      update: {},
      create: {
        subjectCode: 'TM105',
        subjectName: 'Tourism Planning and Development',
        description: 'Tourism destination development',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Tourism Planning"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM106' },
      update: {},
      create: {
        subjectCode: 'TM106',
        subjectName: 'Airline Operations',
        description: 'Airline industry operations',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Airline"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM107' },
      update: {},
      create: {
        subjectCode: 'TM107',
        subjectName: 'Cruise Ship Management',
        description: 'Cruise industry operations',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Cruise"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM108' },
      update: {},
      create: {
        subjectCode: 'TM108',
        subjectName: 'Ecotourism',
        description: 'Sustainable tourism practices',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Ecotourism"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM109' },
      update: {},
      create: {
        subjectCode: 'TM109',
        subjectName: 'Cultural Tourism',
        description: 'Cultural heritage and tourism',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '["Cultural Tourism"]',
        defaultDurationHours: 3,
      },
    }),
    prisma.subject.upsert({
      where: { subjectCode: 'TM110' },
      update: {},
      create: {
        subjectCode: 'TM110',
        subjectName: 'Tourism Laws and Regulations',
        description: 'Legal aspects of tourism industry',
        units: 3,
        departmentId: tmDept.id,
        requiredSpecialization: '[]',
        defaultDurationHours: 3,
      },
    }),
  ]);

  const totalSubjects = [...csSubjects, ...eceSubjects, ...meSubjects, ...ceSubjects, ...baSubjects, ...accSubjects, ...hmSubjects, ...tmSubjects];
  console.log(`✅ Created ${totalSubjects.length} subjects across all departments`);

  // ============================================
  // SECTIONS FOR ALL DEPARTMENTS
  // ============================================
  
  // Computer Science Sections
  const csSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1CS-A' },
      update: {},
      create: {
        sectionName: '1CS-A',
        sectionCode: '1CS-A',
        yearLevel: 1,
        departmentId: csDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1CS-B' },
      update: {},
      create: {
        sectionName: '1CS-B',
        sectionCode: '1CS-B',
        yearLevel: 1,
        departmentId: csDept.id,
        studentCount: 32,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2CS-A' },
      update: {},
      create: {
        sectionName: '2CS-A',
        sectionCode: '2CS-A',
        yearLevel: 2,
        departmentId: csDept.id,
        studentCount: 30,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2CS-B' },
      update: {},
      create: {
        sectionName: '2CS-B',
        sectionCode: '2CS-B',
        yearLevel: 2,
        departmentId: csDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3CS-A' },
      update: {},
      create: {
        sectionName: '3CS-A',
        sectionCode: '3CS-A',
        yearLevel: 3,
        departmentId: csDept.id,
        studentCount: 25,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3CS-B' },
      update: {},
      create: {
        sectionName: '3CS-B',
        sectionCode: '3CS-B',
        yearLevel: 3,
        departmentId: csDept.id,
        studentCount: 23,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4CS-A' },
      update: {},
      create: {
        sectionName: '4CS-A',
        sectionCode: '4CS-A',
        yearLevel: 4,
        departmentId: csDept.id,
        studentCount: 20,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4CS-B' },
      update: {},
      create: {
        sectionName: '4CS-B',
        sectionCode: '4CS-B',
        yearLevel: 4,
        departmentId: csDept.id,
        studentCount: 18,
      },
    }),
  ]);

  // Electronics Engineering Sections
  const eceSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1ECE-A' },
      update: {},
      create: {
        sectionName: '1ECE-A',
        sectionCode: '1ECE-A',
        yearLevel: 1,
        departmentId: eeDept.id,
        studentCount: 30,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1ECE-B' },
      update: {},
      create: {
        sectionName: '1ECE-B',
        sectionCode: '1ECE-B',
        yearLevel: 1,
        departmentId: eeDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ECE-A' },
      update: {},
      create: {
        sectionName: '2ECE-A',
        sectionCode: '2ECE-A',
        yearLevel: 2,
        departmentId: eeDept.id,
        studentCount: 25,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ECE-B' },
      update: {},
      create: {
        sectionName: '2ECE-B',
        sectionCode: '2ECE-B',
        yearLevel: 2,
        departmentId: eeDept.id,
        studentCount: 23,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3ECE-A' },
      update: {},
      create: {
        sectionName: '3ECE-A',
        sectionCode: '3ECE-A',
        yearLevel: 3,
        departmentId: eeDept.id,
        studentCount: 22,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4ECE-A' },
      update: {},
      create: {
        sectionName: '4ECE-A',
        sectionCode: '4ECE-A',
        yearLevel: 4,
        departmentId: eeDept.id,
        studentCount: 18,
      },
    }),
  ]);

  // Mechanical Engineering Sections
  const meSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1ME-A' },
      update: {},
      create: {
        sectionName: '1ME-A',
        sectionCode: '1ME-A',
        yearLevel: 1,
        departmentId: meDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1ME-B' },
      update: {},
      create: {
        sectionName: '1ME-B',
        sectionCode: '1ME-B',
        yearLevel: 1,
        departmentId: meDept.id,
        studentCount: 32,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ME-A' },
      update: {},
      create: {
        sectionName: '2ME-A',
        sectionCode: '2ME-A',
        yearLevel: 2,
        departmentId: meDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ME-B' },
      update: {},
      create: {
        sectionName: '2ME-B',
        sectionCode: '2ME-B',
        yearLevel: 2,
        departmentId: meDept.id,
        studentCount: 26,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3ME-A' },
      update: {},
      create: {
        sectionName: '3ME-A',
        sectionCode: '3ME-A',
        yearLevel: 3,
        departmentId: meDept.id,
        studentCount: 24,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4ME-A' },
      update: {},
      create: {
        sectionName: '4ME-A',
        sectionCode: '4ME-A',
        yearLevel: 4,
        departmentId: meDept.id,
        studentCount: 20,
      },
    }),
  ]);

  // Civil Engineering Sections
  const ceSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1CE-A' },
      update: {},
      create: {
        sectionName: '1CE-A',
        sectionCode: '1CE-A',
        yearLevel: 1,
        departmentId: ceDept.id,
        studentCount: 38,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1CE-B' },
      update: {},
      create: {
        sectionName: '1CE-B',
        sectionCode: '1CE-B',
        yearLevel: 1,
        departmentId: ceDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2CE-A' },
      update: {},
      create: {
        sectionName: '2CE-A',
        sectionCode: '2CE-A',
        yearLevel: 2,
        departmentId: ceDept.id,
        studentCount: 30,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2CE-B' },
      update: {},
      create: {
        sectionName: '2CE-B',
        sectionCode: '2CE-B',
        yearLevel: 2,
        departmentId: ceDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3CE-A' },
      update: {},
      create: {
        sectionName: '3CE-A',
        sectionCode: '3CE-A',
        yearLevel: 3,
        departmentId: ceDept.id,
        studentCount: 25,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4CE-A' },
      update: {},
      create: {
        sectionName: '4CE-A',
        sectionCode: '4CE-A',
        yearLevel: 4,
        departmentId: ceDept.id,
        studentCount: 22,
      },
    }),
  ]);

  // Business Administration Sections
  const baSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1BA-A' },
      update: {},
      create: {
        sectionName: '1BA-A',
        sectionCode: '1BA-A',
        yearLevel: 1,
        departmentId: baDept.id,
        studentCount: 40,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1BA-B' },
      update: {},
      create: {
        sectionName: '1BA-B',
        sectionCode: '1BA-B',
        yearLevel: 1,
        departmentId: baDept.id,
        studentCount: 38,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2BA-A' },
      update: {},
      create: {
        sectionName: '2BA-A',
        sectionCode: '2BA-A',
        yearLevel: 2,
        departmentId: baDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2BA-B' },
      update: {},
      create: {
        sectionName: '2BA-B',
        sectionCode: '2BA-B',
        yearLevel: 2,
        departmentId: baDept.id,
        studentCount: 33,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3BA-A' },
      update: {},
      create: {
        sectionName: '3BA-A',
        sectionCode: '3BA-A',
        yearLevel: 3,
        departmentId: baDept.id,
        studentCount: 30,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4BA-A' },
      update: {},
      create: {
        sectionName: '4BA-A',
        sectionCode: '4BA-A',
        yearLevel: 4,
        departmentId: baDept.id,
        studentCount: 28,
      },
    }),
  ]);

  // Accountancy Sections
  const accSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1ACC-A' },
      update: {},
      create: {
        sectionName: '1ACC-A',
        sectionCode: '1ACC-A',
        yearLevel: 1,
        departmentId: accDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1ACC-B' },
      update: {},
      create: {
        sectionName: '1ACC-B',
        sectionCode: '1ACC-B',
        yearLevel: 1,
        departmentId: accDept.id,
        studentCount: 33,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ACC-A' },
      update: {},
      create: {
        sectionName: '2ACC-A',
        sectionCode: '2ACC-A',
        yearLevel: 2,
        departmentId: accDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2ACC-B' },
      update: {},
      create: {
        sectionName: '2ACC-B',
        sectionCode: '2ACC-B',
        yearLevel: 2,
        departmentId: accDept.id,
        studentCount: 25,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3ACC-A' },
      update: {},
      create: {
        sectionName: '3ACC-A',
        sectionCode: '3ACC-A',
        yearLevel: 3,
        departmentId: accDept.id,
        studentCount: 22,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4ACC-A' },
      update: {},
      create: {
        sectionName: '4ACC-A',
        sectionCode: '4ACC-A',
        yearLevel: 4,
        departmentId: accDept.id,
        studentCount: 18,
      },
    }),
  ]);

  // Hospitality Management Sections
  const hmSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1HM-A' },
      update: {},
      create: {
        sectionName: '1HM-A',
        sectionCode: '1HM-A',
        yearLevel: 1,
        departmentId: hmDept.id,
        studentCount: 35,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1HM-B' },
      update: {},
      create: {
        sectionName: '1HM-B',
        sectionCode: '1HM-B',
        yearLevel: 1,
        departmentId: hmDept.id,
        studentCount: 32,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2HM-A' },
      update: {},
      create: {
        sectionName: '2HM-A',
        sectionCode: '2HM-A',
        yearLevel: 2,
        departmentId: hmDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2HM-B' },
      update: {},
      create: {
        sectionName: '2HM-B',
        sectionCode: '2HM-B',
        yearLevel: 2,
        departmentId: hmDept.id,
        studentCount: 26,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3HM-A' },
      update: {},
      create: {
        sectionName: '3HM-A',
        sectionCode: '3HM-A',
        yearLevel: 3,
        departmentId: hmDept.id,
        studentCount: 24,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4HM-A' },
      update: {},
      create: {
        sectionName: '4HM-A',
        sectionCode: '4HM-A',
        yearLevel: 4,
        departmentId: hmDept.id,
        studentCount: 20,
      },
    }),
  ]);

  // Tourism Management Sections
  const tmSections = await Promise.all([
    prisma.section.upsert({
      where: { sectionName: '1TM-A' },
      update: {},
      create: {
        sectionName: '1TM-A',
        sectionCode: '1TM-A',
        yearLevel: 1,
        departmentId: tmDept.id,
        studentCount: 30,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '1TM-B' },
      update: {},
      create: {
        sectionName: '1TM-B',
        sectionCode: '1TM-B',
        yearLevel: 1,
        departmentId: tmDept.id,
        studentCount: 28,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2TM-A' },
      update: {},
      create: {
        sectionName: '2TM-A',
        sectionCode: '2TM-A',
        yearLevel: 2,
        departmentId: tmDept.id,
        studentCount: 25,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '2TM-B' },
      update: {},
      create: {
        sectionName: '2TM-B',
        sectionCode: '2TM-B',
        yearLevel: 2,
        departmentId: tmDept.id,
        studentCount: 23,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '3TM-A' },
      update: {},
      create: {
        sectionName: '3TM-A',
        sectionCode: '3TM-A',
        yearLevel: 3,
        departmentId: tmDept.id,
        studentCount: 20,
      },
    }),
    prisma.section.upsert({
      where: { sectionName: '4TM-A' },
      update: {},
      create: {
        sectionName: '4TM-A',
        sectionCode: '4TM-A',
        yearLevel: 4,
        departmentId: tmDept.id,
        studentCount: 18,
      },
    }),
  ]);

  const totalSections = [...csSections, ...eceSections, ...meSections, ...ceSections, ...baSections, ...accSections, ...hmSections, ...tmSections];
  console.log(`✅ Created ${totalSections.length} sections across all departments`);

  console.log('🎉 Database seed completed!');
  console.log('');
  console.log('📝 Demo Login Credentials (all use password: password123):');
  console.log('   Admin:      admin@ptc.edu.ph');
  console.log('   Dept Head:  head.cs@ptc.edu.ph');
  console.log('   Faculty:    faculty1@ptc.edu.ph');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Subjects:    ${totalSubjects.length}`);
  console.log(`   Sections:    ${totalSections.length}`);
  console.log(`   Rooms:       ${rooms.length}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
