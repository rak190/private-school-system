import { NextResponse } from 'next/server';
import { db } from '@/db';
import { students, classes } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (!role) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const unassignedOnly = url.searchParams.get('unassigned') === 'true';

    let query = db.select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      gender: students.gender,
      classId: students.classId,
      status: students.status,
      className: classes.className
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id));

    if (unassignedOnly) {
      query = query.where(isNull(students.classId));
    }

    const allStudents = await query;
    return NextResponse.json({ success: true, data: allStudents });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (!role || (role !== 'teacher' && role !== 'principal')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Handle bulk insert
    if (body.students && Array.isArray(body.students)) {
      const studentsToInsert = body.students.map(s => ({
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender || 'ប្រុស',
        classId: s.classId || null,
        status: s.status || 'សកម្ម'
      }));
      
      const newStudents = await db.insert(students).values(studentsToInsert).returning();
      return NextResponse.json({ success: true, data: newStudents });
    }

    // Handle single insert
    const { firstName, lastName, gender, classId, status } = body;

    const newStudent = await db.insert(students).values({
      firstName,
      lastName,
      gender: gender || 'ប្រុស',
      classId: classId || null,
      status: status || 'សកម្ម'
    }).returning();

    return NextResponse.json({ success: true, data: newStudent[0] });
  } catch (error) {
    console.error('Failed to create student:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (!role || (role !== 'teacher' && role !== 'principal')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, firstName, lastName, classId, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    const updatedStudent = await db.update(students)
      .set({
        firstName,
        lastName,
        classId: classId || null,
        status: status || 'សកម្ម'
      })
      .where(eq(students.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedStudent[0] });
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
