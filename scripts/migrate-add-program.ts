/**
 * Migration script: Add Program model between Department and Subject
 * 
 * This script:
 * 1. Creates a default "General" program for each department
 * 2. Updates all subjects to link to the default program
 * 3. Updates all sections to optionally link to programs
 * 
 * Run with: bun run scripts/migrate-add-program.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load DATABASE_URL from .env
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key === 'DATABASE_URL') {
        const value = valueParts.join('=').trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env.DATABASE_URL = cleanValue;
        console.log('✅ DATABASE_URL loaded from .env:', cleanValue.substring(0, 50) + '...');
        break;
      }
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Add Program model...\n');

  try {
    // Step 1: Get all departments
    console.log('Step 1: Fetching departments...');
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { subjects: true, sections: true } },
      },
    });
    console.log(`Found ${departments.length} departments\n`);

    // Step 2: Create default program for each department
    console.log('Step 2: Creating default programs...');
    const programMap: Record<string, string> = {};
    
    for (const dept of departments) {
      // Check if program already exists
      const existingProgram = await prisma.program.findFirst({
        where: {
          name: `General ${dept.name}`,
          departmentId: dept.id,
        },
      });

      if (existingProgram) {
        console.log(`  - Program already exists for ${dept.name}: ${existingProgram.id}`);
        programMap[dept.id] = existingProgram.id;
      } else {
        const program = await prisma.program.create({
          data: {
            name: `General ${dept.name}`,
            code: `${dept.code || dept.name.substring(0, 3).toUpperCase()}-GEN`,
            description: `Default program for ${dept.name}`,
            departmentId: dept.id,
          },
        });
        console.log(`  ✓ Created program for ${dept.name}: ${program.id}`);
        programMap[dept.id] = program.id;
      }
    }
    console.log('');

    // Step 3: Update subjects to have programId
    console.log('Step 3: Updating subjects...');
    const subjects = await prisma.subject.findMany({
      select: { id: true, departmentId: true, programId: true },
    });

    let updatedSubjects = 0;
    for (const subject of subjects) {
      if (!subject.programId && programMap[subject.departmentId]) {
        await prisma.subject.update({
          where: { id: subject.id },
          data: { programId: programMap[subject.departmentId] },
        });
        updatedSubjects++;
      }
    }
    console.log(`  ✓ Updated ${updatedSubjects} subjects with programId\n`);

    // Step 4: Update sections to optionally have programId
    console.log('Step 4: Updating sections (optional)...');
    const sections = await prisma.section.findMany({
      select: { id: true, departmentId: true, programId: true },
    });

    let updatedSections = 0;
    for (const section of sections) {
      if (!section.programId && programMap[section.departmentId]) {
        await prisma.section.update({
          where: { id: section.id },
          data: { programId: programMap[section.departmentId] },
        });
        updatedSections++;
      }
    }
    console.log(`  ✓ Updated ${updatedSections} sections with programId\n`);

    // Summary
    console.log('Migration completed successfully!');
    console.log('Summary:');
    console.log(`  - Departments processed: ${departments.length}`);
    console.log(`  - Programs created: ${Object.keys(programMap).length}`);
    console.log(`  - Subjects updated: ${updatedSubjects}`);
    console.log(`  - Sections updated: ${updatedSections}`);
    console.log('\nYou can now safely use the new Program model in your application.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
