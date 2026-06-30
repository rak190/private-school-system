'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, GraduationCap, Calendar, FileEdit, 
  Bell, Settings, MessageSquare, LogOut, Bot, Menu, X, ChevronLeft, ChevronRight, MoreHorizontal, ClipboardCheck
} from 'lucide-react';

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setCurrentUser(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const now = new Date();
            now.setHours(0,0,0,0);
            
            const upcoming = json.data
              .filter(a => a.type === 'event' && new Date(a.eventDate) >= now)
              .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
              .slice(0, 4);
            setEvents(upcoming);
          }
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  const navLinks = [
    { href: '/teacher', icon: LayoutDashboard, label: 'ផ្ទាំងគ្រប់គ្រង' },
    { href: '/teacher/classes', icon: GraduationCap, label: 'ថ្នាក់រៀនរបស់ខ្ញុំ' },
    { href: '/teacher/attendance', icon: ClipboardCheck, label: 'ចុះអវត្តមាន' },
    { href: '/teacher/schedule', icon: Calendar, label: 'កាលវិភាគ' },
    { href: '/teacher/grades', icon: FileEdit, label: 'ពិន្ទុ និងប្រឡង' },
    { href: '/teacher/news', icon: Bell, label: 'ដំណឹងសាលា' },
  ];

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth); // 0 (Sun) to 6 (Sat)
  
  // Adjust so Monday is 0, Sunday is 6
  let startingDay = firstDay === 0 ? 6 : firstDay - 1; 

  const days = [];
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  
  // Previous month padding
  for (let i = 0; i < startingDay; i++) {
    days.push({ day: daysInPrevMonth - startingDay + i + 1, type: 'prev' });
  }
  
  // Current month
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    days.push({ day: i, type: 'current', isToday });
  }

  // Next month padding (to complete 42 days grid for consistent height)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, type: 'next' });
  }

  const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  
  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

  return (
    <div className="bg-white h-screen w-full flex flex-col lg:flex-row overflow-hidden font-sans text-brand-text selection:bg-brand-blue/30 relative">

      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-50 shrink-0 relative">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="School Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Good Future</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setRightMenuOpen(!rightMenuOpen); setLeftMenuOpen(false); }} className="relative text-slate-600">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button onClick={() => { setLeftMenuOpen(!leftMenuOpen); setRightMenuOpen(false); }} className="text-slate-600">
            {leftMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`${leftMenuOpen ? 'flex' : 'hidden'} lg:flex absolute lg:relative top-[73px] lg:top-0 left-0 w-64 h-[calc(100vh-73px)] lg:h-full bg-white flex-col justify-between py-6 px-6 z-40 flex-shrink-0 shadow-2xl lg:shadow-none overflow-y-auto`}>
        <div>
          {/* Logo (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-2 mb-10 pl-2">
            <img src="/logo.png" alt="School Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">អនាគតល្អ Good Future</span>
          </div>
          
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isActive 
                      ? 'text-brand-blue bg-blue-50' 
                      : 'text-brand-muted hover:text-slate-900 font-medium'
                  }`}
                  onClick={() => setLeftMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" /> {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 mt-8 lg:mt-0">
          <Link href="/teacher/settings" onClick={() => setLeftMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/teacher/settings' ? 'text-brand-blue bg-blue-50' : 'text-brand-muted hover:text-slate-900'}`}>
            <Settings className="w-5 h-5" /> ការកំណត់
          </Link>
          <Link href="/teacher/help" onClick={() => setLeftMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/teacher/help' ? 'text-brand-blue bg-blue-50' : 'text-brand-muted hover:text-slate-900'}`}>
            <MessageSquare className="w-5 h-5" /> ជំនួយ
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 text-brand-muted hover:text-red-600 px-4 py-3 rounded-xl font-medium transition-colors mt-4">
            <LogOut className="w-5 h-5" /> ចាកចេញ
          </button>
        </div>
      </aside>

      {/* ================= OVERLAY FOR MOBILE SIDEBARS ================= */}
      {(leftMenuOpen || rightMenuOpen) && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30" onClick={() => { setLeftMenuOpen(false); setRightMenuOpen(false); }} />
      )}

      {/* ================= CENTER MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col py-0 lg:py-4 px-0 lg:px-2 overflow-hidden h-[calc(100vh-73px)] lg:h-screen">
        <main className="flex-1 bg-brand-bg rounded-none lg:rounded-[36px] flex flex-col overflow-y-auto p-5 md:p-8 lg:p-10 shadow-sm border-0 lg:border border-slate-100 relative">
          {children}
        </main>
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <aside className={`${rightMenuOpen ? 'flex' : 'hidden'} lg:flex absolute lg:relative top-[73px] lg:top-0 right-0 w-80 h-[calc(100vh-73px)] lg:h-full bg-white flex-col py-6 px-6 z-40 flex-shrink-0 shadow-2xl lg:shadow-none overflow-y-auto`}>
        
        {/* User Info */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-yellow-900 font-bold border-2 border-white shadow-sm shrink-0 uppercase">
              {currentUser ? currentUser.firstName?.[0] : 'U'}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm truncate max-w-[120px]">
                {currentUser ? `${currentUser.lastName} ${currentUser.firstName}` : 'កំពុងដំណើរការ...'}
              </h4>
              <p className="text-xs text-brand-muted">គ្រូបង្រៀន</p>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </div>
        </div>

        <div className="mb-8 select-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">{khmerMonths[currentMonth]} {currentYear}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="hover:bg-slate-100 p-1 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
              <button onClick={nextMonth} className="hover:bg-slate-100 p-1 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-slate-800" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-semibold text-brand-muted">
            <div>ច</div><div>អ</div><div>ព</div><div>ព្រ</div><div>សុ</div><div>ស</div><div>អា</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
            {days.map((d, i) => (
              <div 
                key={i} 
                className={`py-1.5 rounded-full ${
                  d.type !== 'current' ? 'text-slate-300' : 
                  d.isToday ? 'bg-brand-blue text-white shadow-md shadow-blue-200 font-bold' : 
                  'text-slate-700 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">ព្រឹត្តិការណ៍បន្ទាប់</h3>
          </div>
          <div className="space-y-3">
            {loadingEvents ? (
              // Skeleton loading
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-[16px] p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-20 mb-3"></div>
                  <div className="h-5 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-16"></div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-6 text-center">
                 <p className="text-sm font-medium text-slate-400">មិនមានព្រឹត្តិការណ៍បន្ទាប់ទេ</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white border border-slate-100 rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all hover:border-brand-blue/30 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-brand-yellow/20 text-yellow-900 group-hover:bg-brand-yellow text-[10px] font-bold px-2 py-0.5 rounded transition-colors">{formatEventDate(event.eventDate)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug line-clamp-2">{event.title}</h4>
                  <span className="text-xs text-brand-blue font-semibold">{event.audience === 'everyone' ? 'សម្រាប់ទាំងអស់គ្នា' : event.audience === 'teachers' ? 'សម្រាប់គ្រូបង្រៀន' : 'សម្រាប់សិស្ស'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ================= AI ASSISTANT FLOATING BUTTON (ULTRA FUTURISTIC) ================= */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 group">
        
        {/* Holographic Tooltip */}
        <div className="hidden lg:block absolute bottom-full right-0 mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none origin-bottom-right scale-95 group-hover:scale-100">
          <div className="bg-black/40 backdrop-blur-md text-cyan-300 text-xs font-mono font-bold rounded border border-cyan-500/50 py-2 px-4 shadow-[0_0_15px_rgba(6,182,212,0.4)] whitespace-nowrap relative overflow-hidden uppercase tracking-widest">
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-[200%] animate-[spin_3s_linear_infinite] opacity-50"></div>
            INITIALIZING KruAI...
            <div className="absolute -bottom-1 right-8 w-2 h-2 bg-cyan-500 rotate-45"></div>
          </div>
        </div>
        
        {/* Futuristic Button Core */}
        <Link href="/ai" className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center cursor-pointer group/btn">
          
          {/* Outer Rotating Radar Ring */}
          <div className="absolute inset-[-10%] rounded-full border border-dashed border-cyan-500/40 animate-[spin_10s_linear_infinite] group-hover/btn:border-cyan-400 group-hover/btn:animate-[spin_4s_linear_infinite]"></div>
          
          {/* Inner Reverse Rotating Ring */}
          <div className="absolute inset-[5%] rounded-full border-[2px] border-t-cyan-400 border-r-purple-500 border-b-transparent border-l-transparent animate-[spin_6s_linear_infinite_reverse] group-hover/btn:border-t-cyan-300 group-hover/btn:border-r-purple-400"></div>

          {/* Core Glass Sphere */}
          <div className="absolute inset-[15%] rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.6)] group-hover/btn:shadow-[0_0_50px_rgba(168,85,247,0.8)] group-hover/btn:border-purple-500/80 transition-all duration-500 overflow-hidden">
             {/* Tech Grid Background inside sphere */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
             {/* Core Glow */}
             <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 animate-pulse"></div>
          </div>
          
          {/* AI Icon */}
          <Bot className="w-7 h-7 lg:w-9 lg:h-9 text-cyan-400 relative z-10 drop-shadow-[0_0_10px_rgba(6,182,212,1)] group-hover/btn:text-purple-300 group-hover/btn:drop-shadow-[0_0_15px_rgba(168,85,247,1)] transition-colors duration-500 group-hover/btn:scale-110" />
          
        </Link>
      </div>

      {/* ================= EVENT DETAILS MODAL ================= */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">ព័ត៌មានព្រឹត្តិការណ៍</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="inline-block bg-brand-yellow text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                {formatEventDate(selectedEvent.eventDate)}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">{selectedEvent.title}</h3>
              
              {selectedEvent.imageUrl && (
                <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full rounded-2xl mb-6 object-cover border border-slate-100" />
              )}
              
              <div className="prose prose-slate prose-sm max-w-none text-slate-600 mb-6 whitespace-pre-wrap">
                {selectedEvent.content}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-sm">
                <span className="font-bold text-slate-500">អ្នកចូលរួម:</span>
                <span className="font-semibold text-brand-blue">
                  {selectedEvent.audience === 'everyone' ? 'សិស្ស និងគ្រូទាំងអស់' : 
                   selectedEvent.audience === 'teachers' ? 'សម្រាប់តែគ្រូ' : 'សម្រាប់តែសិស្ស'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
