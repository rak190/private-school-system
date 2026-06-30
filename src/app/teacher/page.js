'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Mic, ArrowUpRight, 
  MoreHorizontal, Globe, MessageCircle, Camera, Link2, BookOpen, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [attendanceRange, setAttendanceRange] = useState('5');

  useEffect(() => {
    // Fetch classes for global filter
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const json = await res.json();
        if (json.success) setClasses(json.data);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/teacher?classId=${selectedClassId}&semester=${selectedSemester}&attendanceRange=${attendanceRange}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedClassId, selectedSemester, attendanceRange]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
         <div className="text-center text-slate-500 animate-pulse">កំពុងទាញយកទិន្នន័យ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
         <div className="text-center text-rose-500 font-bold">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-slate-200 rounded-full py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">គ្រប់ថ្នាក់ទាំងអស់</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="relative hidden md:block w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="ស្វែងរក..." className="w-full bg-white border-none rounded-full py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-700 placeholder:text-slate-400" />
          </div>
          <button className="bg-brand-yellow p-3 rounded-full shadow-sm text-yellow-900 hover:bg-yellow-400 transition-colors shrink-0">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className="bg-brand-yellow rounded-[20px] p-6 relative">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-yellow-800 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-yellow-900" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">{data.totalStudents}</h2>
          <p className="text-sm font-semibold text-yellow-900">សិស្សសរុប</p>
        </div>
        <div className="bg-brand-yellow rounded-[20px] p-6 relative">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-yellow-800 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-yellow-900" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">{data.totalClasses}</h2>
          <p className="text-sm font-semibold text-yellow-900">ថ្នាក់កំពុងបង្រៀន</p>
        </div>
        <div className="bg-brand-yellow rounded-[20px] p-6 relative">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-yellow-800 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-yellow-900" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">{data.attendanceRate}%</h2>
          <p className="text-sm font-semibold text-yellow-900">អត្រាវត្តមានសរុប</p>
        </div>
        <div className="bg-brand-blue rounded-[20px] p-6 relative text-white">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-blue-300 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-blue-100" />
          </div>
          <h2 className="text-3xl font-bold mb-1">0</h2>
          <p className="text-sm font-medium text-blue-100">ការងាររង់ចាំ</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6">
        {/* Students Donut */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">សិស្ស</h3>
            <span className="text-xs font-semibold text-brand-muted bg-slate-50 px-2 py-1 rounded">
              {selectedClassId === 'all' ? 'សរុបទាំងអស់' : classes.find(c => c.id.toString() === selectedClassId)?.name}
            </span>
          </div>
          <div className="flex justify-center mb-6 flex-1 items-center">
            <div className="donut-chart scale-90 sm:scale-100 relative w-48 h-48 rounded-full" 
              style={{
                background: data.totalStudents > 0 ? `conic-gradient(#FFCF59 ${(data.genderDistribution.female / data.totalStudents) * 100}%, #155EEF 0)` : '#f1f5f9'
              }}>
              <div className="donut-inner absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-xs text-brand-muted font-medium">សរុប</span>
                <span className="text-2xl font-bold text-slate-800">{data.totalStudents}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between px-4 mt-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-yellow"></div><span className="text-xs text-brand-muted">ស្រី</span></div>
              <span className="font-bold text-slate-800">{data.genderDistribution.female}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-blue"></div><span className="text-xs text-brand-muted">ប្រុស</span></div>
              <span className="font-bold text-slate-800">{data.genderDistribution.male}</span>
            </div>
          </div>
        </div>

        {/* Class Line Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[24px] shadow-sm flex flex-col min-h-[300px] overflow-x-auto">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-bold text-slate-800">លទ្ធផលសិក្សា</h3>
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="text-xs font-bold text-brand-blue bg-blue-50 border-none px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
            >
              <option value="all">គ្រប់ឆមាស</option>
              <option value="ឆមាសទី១">ឆមាសទី១</option>
              <option value="ឆមាសទី២">ឆមាសទី២</option>
            </select>
          </div>
          {data.scoresChart && data.scoresChart.length > 0 ? (
            <>
              <div className="flex gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-brand-yellow"></div><span className="text-xs text-brand-muted">ពិន្ទុមធ្យម</span></div>
              </div>
              <div className="flex-1 w-full min-w-[500px] relative pt-4 flex items-end border-b border-slate-100">
                {data.scoresChart.map((monthData, idx) => (
                   <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group cursor-pointer">
                     <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6">{monthData.averageScore}</span>
                     <div className="w-4 bg-brand-yellow rounded-t-full transition-all group-hover:opacity-80" style={{ height: `${monthData.averageScore}%`, minHeight: '10px' }}></div>
                     <span className="text-[10px] text-slate-400 mt-2 whitespace-nowrap">{monthData.month}</span>
                   </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
               <p className="text-sm font-medium">មិនទាន់មានទិន្នន័យពិន្ទុនៅឡើយទេ</p>
               <Link href="/teacher/classes" className="text-xs text-brand-blue mt-2 hover:underline">បញ្ចូលពិន្ទុឥឡូវនេះ</Link>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6">
        {/* Attendance Bar Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[24px] shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">វត្តមាន {attendanceRange === '5' ? '(៥ ថ្ងៃ)' : attendanceRange === '10' ? '(១០ ថ្ងៃ)' : '(៣០ ថ្ងៃ)'}</h3>
            <select 
              value={attendanceRange}
              onChange={(e) => setAttendanceRange(e.target.value)}
              className="text-xs font-bold text-amber-700 bg-amber-50 border-none px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="5">៥ ថ្ងៃចុងក្រោយ</option>
              <option value="10">១០ ថ្ងៃចុងក្រោយ</option>
              <option value="30">៣០ ថ្ងៃចុងក្រោយ</option>
            </select>
          </div>
          
          {data.attendanceChart && data.attendanceChart.length > 0 ? (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-brand-yellow"></div><span className="text-[10px] text-brand-muted">វត្តមាន</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-brand-blue"></div><span className="text-[10px] text-brand-muted">អវត្តមាន</span></div>
              </div>
              <div className="flex-1 flex pt-2 overflow-x-auto">
                <div className="min-w-[200px] w-full flex">
                 <div className="flex flex-col justify-between text-[10px] font-medium text-brand-muted pb-5 pr-2">
                  <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                </div>
                <div className="flex-1 flex justify-around items-end pb-5 relative px-2 gap-2">
                  {data.attendanceChart.map((day, idx) => {
                     const presentPercent = day.total > 0 ? (day.present / day.total) * 100 : 0;
                     const absentPercent = day.total > 0 ? (day.absent / day.total) * 100 : 0;
                     // Format date like '12 កញ្ញា' or just simple short string
                     const d = new Date(day.date);
                     const dateStr = `${d.getDate()}/${d.getMonth()+1}`;
                     return (
                      <div key={idx} className="w-[15%] max-w-10 h-full flex flex-col justify-end relative group cursor-pointer">
                        <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white shadow-lg rounded p-1.5 text-[10px] whitespace-nowrap z-10 font-medium">វត្តមាន: {Math.round(presentPercent)}%<br/>អវត្តមាន: {Math.round(absentPercent)}%</div>
                        <div className="w-full bg-brand-blue rounded-t-sm transition-all" style={{ height: `${absentPercent}%` }}></div>
                        <div className="w-full bg-brand-yellow rounded-b-sm transition-all" style={{ height: `${presentPercent}%` }}></div>
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-brand-muted whitespace-nowrap">
                          {dateStr}
                        </div>
                      </div>
                     );
                  })}
                </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
               <p className="text-sm font-medium">មិនទាន់មានទិន្នន័យវត្តមាននៅឡើយទេ</p>
               <Link href="/teacher/attendance" className="text-xs text-brand-blue mt-2 hover:underline">ស្រង់វត្តមានឥឡូវនេះ</Link>
            </div>
          )}
        </div>

        {/* Student Activities -> Recent Scores */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[24px] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">ពិន្ទុថ្មីៗបំផុត</h3>
            <Link href="/teacher/classes" className="text-xs font-semibold text-brand-blue hover:underline">មើលទាំងអស់</Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {data.recentScores && data.recentScores.length > 0 ? (
              data.recentScores.map((score, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="bg-brand-blue text-white w-10 h-10 rounded-full shrink-0 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{score.studentLastName} {score.studentFirstName}</h4>
                    <p className="text-xs text-brand-muted mt-0.5">{score.subjectName || 'មិនបញ្ជាក់មុខវិជ្ជា'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">ប្រឡង: <span className="text-brand-blue">{score.examScore || 0}</span></div>
                    <div className="text-xs font-semibold text-brand-muted">កិច្ចការ: {score.homeworkScore || 0}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                 <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                 <p className="text-sm font-medium">អ្នកមិនទាន់បានបញ្ចូលពិន្ទុណាមួយទេ</p>
                 <Link href="/teacher/classes" className="text-xs font-bold text-brand-blue bg-blue-50 px-4 py-2 rounded-full mt-4 hover:bg-blue-100 transition-colors">បញ្ចូលពិន្ទុឥឡូវនេះ</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs font-semibold text-brand-muted mt-6 justify-between items-center text-center sm:text-left">
        <div>រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026 អនាគតល្អ Good Future <span className="hidden sm:inline mx-4">គោលការណ៍ឯកជនភាព</span> <span className="hidden sm:inline mx-4">លក្ខខណ្ឌប្រើប្រាស់</span> <span className="hidden sm:inline">ទំនាក់ទំនង</span></div>
        <div className="flex gap-3">
          <Globe className="w-4 h-4" />
          <MessageCircle className="w-4 h-4" />
          <Camera className="w-4 h-4" />
          <Link2 className="w-4 h-4" />
        </div>
      </div>
    </>
  );
}
