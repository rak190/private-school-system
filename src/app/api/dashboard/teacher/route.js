import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, classes, students, attendance, scores } from '@/db/schema';
import { eq, inArray, sql, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const username = cookieStore.get('auth_token')?.value;

  if (!role || !username || role !== 'teacher') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const filterClassId = url.searchParams.get('classId');
    const filterSemester = url.searchParams.get('semester'); // 'ឆមាសទី១' or 'ឆមាសទី២'
    const attendanceRange = url.searchParams.get('attendanceRange'); // '5', '10', '30'

    // 1. Get current teacher
    const currentUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!currentUser.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const teacherId = currentUser[0].id;

    // 2. Get Teacher's Classes
    let teacherClassesQuery = db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, teacherId));
    
    if (filterClassId && filterClassId !== 'all') {
      teacherClassesQuery = db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, Number(filterClassId)), eq(classes.teacherId, teacherId)));
    }
    
    const teacherClasses = await teacherClassesQuery;
    const classIds = teacherClasses.map(c => c.id);
    const totalClasses = classIds.length;

    if (totalClasses === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalStudents: 0,
          totalClasses: 0,
          attendanceRate: 0,
          genderDistribution: { male: 0, female: 0 },
          recentScores: [],
          attendanceChart: [],
          scoresChart: []
        }
      });
    }

    // 3. Get Teacher's Students
    const teacherStudents = await db.select({ 
      id: students.id, 
      gender: students.gender 
    }).from(students).where(inArray(students.classId, classIds));
    
    const studentIds = teacherStudents.map(s => s.id);
    const totalStudents = studentIds.length;

    // 4. Gender Distribution
    let male = 0;
    let female = 0;
    teacherStudents.forEach(s => {
      if (s.gender === 'ប្រុស') male++;
      else if (s.gender === 'ស្រី') female++;
      else male++; // default
    });

    if (totalStudents === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalStudents,
          totalClasses,
          attendanceRate: 0,
          genderDistribution: { male, female },
          recentScores: [],
          attendanceChart: [],
          scoresChart: []
        }
      });
    }

    // 5. Attendance Rate
    const allAttendance = await db.select({
      status: attendance.status
    }).from(attendance).where(inArray(attendance.studentId, studentIds));

    let totalAttendanceRecords = allAttendance.length;
    let presentCount = allAttendance.filter(a => a.status === 'វត្តមាន' || a.status === 'សុំច្បាប់').length; // Treating excused as present for rate, or just 'វត្តមាន'
    let attendanceRate = totalAttendanceRecords > 0 
      ? Math.round((presentCount / totalAttendanceRecords) * 100) 
      : 0;

    // 6. Recent Scores (last 5)
    // We join with students to get the student's name
    const recentScoresData = await db.select({
      id: scores.id,
      subjectName: scores.subjectName,
      homeworkScore: scores.homeworkScore,
      examScore: scores.examScore,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
    })
    .from(scores)
    .innerJoin(students, eq(scores.studentId, students.id))
    .where(inArray(scores.studentId, studentIds))
    .orderBy(desc(scores.id))
    .limit(5);

    // 7. Attendance Chart (last 5 days)
    // Grouping by date in PostgreSQL using raw SQL or grouping in JS
    const attendanceByDateData = await db.select({
      date: attendance.date,
      status: attendance.status
    }).from(attendance)
    .where(inArray(attendance.studentId, studentIds))
    .orderBy(desc(attendance.date));

    // Process attendance chart in JS to group by date
    const dateMap = {};
    attendanceByDateData.forEach(record => {
      // safely handle date object or string
      const dateStr = record.date instanceof Date 
        ? record.date.toISOString().split('T')[0] 
        : record.date.toString().split('T')[0];

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, present: 0, absent: 0, total: 0 };
      }
      dateMap[dateStr].total++;
      if (record.status === 'វត្តមាន' || record.status === 'សុំច្បាប់') {
        dateMap[dateStr].present++;
      } else {
        dateMap[dateStr].absent++;
      }
    });
    
    // Sort and take requested range
    const rangeLimit = attendanceRange ? Number(attendanceRange) : 5;
    const attendanceChart = Object.values(dateMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-rangeLimit);

    // 8. Scores Chart (Average by Month)
    let scoresQuery = db.select({
      month: scores.examMonth,
      score: scores.examScore
    }).from(scores)
    .where(inArray(scores.studentId, studentIds));

    if (filterSemester && filterSemester !== 'all') {
      scoresQuery = db.select({
        month: scores.examMonth,
        score: scores.examScore
      }).from(scores)
      .where(and(inArray(scores.studentId, studentIds), eq(scores.semester, filterSemester)));
    }

    const scoresByMonthData = await scoresQuery;

    const monthMap = {};
    scoresByMonthData.forEach(record => {
      const month = record.month || 'ផ្សេងៗ';
      if (!monthMap[month]) {
        monthMap[month] = { month, totalScore: 0, count: 0 };
      }
      monthMap[month].totalScore += (record.score || 0);
      monthMap[month].count++;
    });

    const scoresChart = Object.values(monthMap).map(m => ({
      month: m.month,
      averageScore: Math.round(m.totalScore / m.count)
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        attendanceRate,
        genderDistribution: { male, female },
        recentScores: recentScoresData,
        attendanceChart,
        scoresChart
      }
    });

  } catch (error) {
    console.error('Failed to fetch teacher dashboard data:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
