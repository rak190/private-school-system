import { pgTable, serial, text, varchar, integer, timestamp, date } from "drizzle-orm/pg-core";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  className: varchar("class_name", { length: 255 }).notNull(),
  academicYear: varchar("academic_year", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  schedule: varchar("schedule", { length: 255 }),
  progress: integer("progress").default(0),
  color: varchar("color", { length: 50 }).default('bg-brand-blue'),
  teacherId: integer("teacher_id").references(() => users.id),
  gradeSubjects: text("grade_subjects").default('គណិតវិទ្យា'), // Comma-separated list of subjects
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 20 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  address: text("address"),
  parentName: varchar("parent_name", { length: 255 }),
  classId: integer("class_id").references(() => classes.id),
  status: varchar("status", { length: 50 }).notNull().default('សកម្ម'), // សកម្ម, ឈប់ឈប់
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  date: date("date").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // Present, Absent, Late
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  homeworkScore: integer("homework_score").default(0),
  examScore: integer("exam_score").default(0),
  examMonth: varchar("exam_month", { length: 50 }),
  semester: varchar("semester", { length: 50 }),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).default(''),
  email: varchar("email", { length: 255 }).default(''),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'admin', 'principal', 'teacher'
});

export const timetables = pgTable("timetables", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  classId: integer("class_id").references(() => classes.id),
  dayOfWeek: varchar("day_of_week", { length: 50 }).notNull(), // ច័ន្ទ, អង្គារ...
  shift: varchar("shift", { length: 50 }).notNull(), // ព្រឹក, រសៀល
  startTime: varchar("start_time", { length: 10 }).notNull(), // 08:00
  endTime: varchar("end_time", { length: 10 }).notNull(), // 09:30
  room: varchar("room", { length: 100 }),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'income' or 'expense'
  category: varchar("category", { length: 100 }).notNull(), // 'Tuition', 'Salaries', etc.
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default('ជោគជ័យ'),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('announcement'), // 'announcement', 'event'
  audience: varchar("audience", { length: 50 }).notNull().default('everyone'), // 'everyone', 'teachers', 'students'
  eventDate: date("event_date"),
  imageUrl: varchar("image_url", { length: 500 }),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  attachmentName: varchar("attachment_name", { length: 255 }),
  attachmentType: varchar("attachment_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
