import { NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, students, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { id } = params;
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const username = cookieStore.get('auth_token')?.value;

  if (!role || !username) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!currentUser.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const teacherId = currentUser[0].id;

    // Fetch class details
    const classData = await db.select().from(classes).where(
      role === 'teacher' ? and(eq(classes.id, Number(id)), eq(classes.teacherId, teacherId)) : eq(classes.id, Number(id))
    ).limit(1);

    if (!classData.length) {
      return NextResponse.json({ success: false, error: 'Class not found or unauthorized' }, { status: 404 });
    }

    // Fetch students in this class
    const classStudents = await db.select().from(students).where(eq(students.classId, Number(id)));

    return NextResponse.json({ 
      success: true, 
      data: {
        ...classData[0],
        students: classStudents
      } 
    });
  } catch (error) {
    console.error('Failed to fetch class:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const username = cookieStore.get('auth_token')?.value;

  if (!role || !username || role !== 'teacher') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const teacherId = currentUser[0]?.id;

    // Verify ownership
    const existingClass = await db.select().from(classes).where(and(eq(classes.id, Number(id)), eq(classes.teacherId, teacherId))).limit(1);
    if (!existingClass.length) {
      return NextResponse.json({ success: false, error: 'Class not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { className, subject, schedule, progress, color } = body;

    const updatedClass = await db.update(classes)
      .set({ className, subject, schedule, progress, color })
      .where(eq(classes.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, data: updatedClass[0] });
  } catch (error) {
    console.error('Failed to update class:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const username = cookieStore.get('auth_token')?.value;

  if (!role || !username || role !== 'teacher') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const teacherId = currentUser[0]?.id;

    // Verify ownership
    const existingClass = await db.select().from(classes).where(and(eq(classes.id, Number(id)), eq(classes.teacherId, teacherId))).limit(1);
    if (!existingClass.length) {
      return NextResponse.json({ success: false, error: 'Class not found or unauthorized' }, { status: 404 });
    }

    // Unassign students from this class instead of deleting them
    await db.update(students).set({ classId: null }).where(eq(students.classId, Number(id)));

    // Delete the class
    await db.delete(classes).where(eq(classes.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete class:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
