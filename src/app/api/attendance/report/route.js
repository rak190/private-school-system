import { NextResponse } from 'next/server';
import { db } from '@/db';
import { students, attendance, classes, users } from '@/db/schema';
import { eq, and, inArray, gte, lte } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const username = cookieStore.get('auth_token')?.value;

  if (!role || !username || role !== 'teacher') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const month = url.searchParams.get('month'); // YYYY-MM
    
    if (!classId || !month) {
      return NextResponse.json({ success: false, error: 'Missing classId or month' }, { status: 400 });
    }

    // Security check
    const currentUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const teacherId = currentUser[0]?.id;
    const existingClass = await db.select().from(classes).where(and(eq(classes.id, Number(classId)), eq(classes.teacherId, teacherId))).limit(1);
    
    if (!existingClass.length) {
      return NextResponse.json({ success: false, error: 'Unauthorized to view this class' }, { status: 403 });
    }

    // 1. Fetch all students in the class
    const classStudents = await db.select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      gender: students.gender
    }).from(students).where(eq(students.classId, Number(classId)));

    if (classStudents.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const studentIds = classStudents.map(s => s.id);

    // 2. Fetch attendance for this month
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Simplified, works for string comparison

    const attendanceRecords = await db.select().from(attendance)
      .where(
        and(
          inArray(attendance.studentId, studentIds),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );

    // 3. Aggregate totals
    const reportMap = {};
    classStudents.forEach(student => {
      reportMap[student.id] = {
        ...student,
        totalPresent: 0,
        totalAbsent: 0,
        totalLeave: 0,
      };
    });

    attendanceRecords.forEach(record => {
      if (reportMap[record.studentId]) {
        if (record.status === 'វត្តមាន') reportMap[record.studentId].totalPresent++;
        else if (record.status === 'អវត្តមាន') reportMap[record.studentId].totalAbsent++;
        else if (record.status === 'ច្បាប់') reportMap[record.studentId].totalLeave++;
      }
    });

    return NextResponse.json({ success: true, data: Object.values(reportMap) });
  } catch (error) {
    console.error('Failed to fetch attendance report:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
