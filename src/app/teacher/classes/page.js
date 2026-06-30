'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Clock, Users, ChevronRight, MoreVertical, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherClasses() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    grade: '7',
    letter: 'A',
    subject: 'គណិតវិទ្យា',
    customSubject: '',
    academicYear: '2025-2026',
    color: 'bg-brand-blue'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setClasses(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setShowNewClassModal(false);
          fetchClasses(); // Refresh list
          setNewClassForm({ grade: '7', letter: 'A', subject: 'គណិតវិទ្យា', customSubject: '', academicYear: '2025-2026', color: 'bg-brand-blue' });
        }
      }
    } catch (err) {
      console.error('Failed to create class:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ថ្នាក់រៀនរបស់ខ្ញុំ</h1>
          <p className="text-sm font-medium text-brand-muted mt-1">គ្រប់គ្រងថ្នាក់រៀន និងកូនសិស្សរបស់អ្នក</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="ស្វែងរកថ្នាក់រៀន..." className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-700 placeholder:text-slate-400" />
          </div>
          <button onClick={() => setShowNewClassModal(true)} className="bg-brand-blue px-5 py-2.5 rounded-full shadow-sm shadow-blue-200 text-white font-bold hover:bg-blue-600 transition-colors shrink-0 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> ថ្នាក់ថ្មី
          </button>
        </div>
      </header>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton Loading
          [...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm animate-pulse">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200"></div>
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              </div>
              <div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-slate-100 rounded-full w-full"></div>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-32"></div>
                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
              </div>
            </div>
          ))
        ) : classes.length === 0 ? (
          <div className="col-span-full py-10 text-center text-brand-muted bg-white rounded-3xl border border-slate-100">
            អ្នកមិនទាន់មានថ្នាក់រៀននៅឡើយទេ។ សូមចុចប៊ូតុង "ថ្នាក់ថ្មី" ដើម្បីបង្កើតថ្នាក់។
          </div>
        ) : (
          classes.map(cls => (
            <Link href={`/teacher/classes/${cls.id}`} key={cls.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${cls.color || 'bg-brand-blue'} text-white flex items-center justify-center font-bold text-xl shadow-md uppercase`}>
                    {cls.name ? cls.name.replace('ថ្នាក់ទី ', '').substring(0, 2) : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{cls.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{cls.subject || 'មិនទាន់មានមុខវិជ្ជា'}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Clock className="w-4 h-4 text-brand-muted shrink-0" />
                  <span className="line-clamp-1">{cls.schedule || 'មិនទាន់កំណត់ម៉ោង'}</span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Users className="w-4 h-4 text-brand-muted" />
                    <span>សិស្សសរុប <strong className="text-slate-800">{cls.studentsCount || 0}</strong> នាក់</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">វឌ្ឍនភាពមេរៀន</span>
                  <span className={(cls.progress || 0) >= 70 ? 'text-emerald-500' : (cls.progress || 0) >= 40 ? 'text-brand-blue' : 'text-rose-500'}>
                    {cls.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${(cls.progress || 0) >= 70 ? 'bg-emerald-500' : (cls.progress || 0) >= 40 ? 'bg-brand-blue' : 'bg-rose-500'}`} 
                    style={{ width: `${cls.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center group-hover:border-slate-100 transition-colors">
                <span className="text-xs font-bold text-brand-blue">មើលបញ្ជីសិស្ស និងព័ត៌មានលម្អិត</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">បង្កើតថ្នាក់ថ្មី</h2>
              <button onClick={() => setShowNewClassModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const finalClassName = `ថ្នាក់ទី ${newClassForm.grade}${newClassForm.letter}`;
              const finalSubject = newClassForm.subject === 'ផ្សេងៗ' ? newClassForm.customSubject : newClassForm.subject;
              const payload = {
                className: finalClassName,
                academicYear: newClassForm.academicYear,
                subject: finalSubject,
                schedule: '', // Removed from form as requested
                color: newClassForm.color
              };
              handleCreateClass(payload);
            }} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">កម្រិតថ្នាក់</label>
                  <select 
                    required 
                    value={newClassForm.grade || '7'} 
                    onChange={e => setNewClassForm({...newClassForm, grade: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>ថ្នាក់ទី {i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">អក្សរថ្នាក់</label>
                  <select 
                    required 
                    value={newClassForm.letter || 'A'} 
                    onChange={e => setNewClassForm({...newClassForm, letter: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white"
                  >
                    {[...Array(26)].map((_, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return <option key={letter} value={letter}>{letter}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">មុខវិជ្ជា</label>
                <select 
                  required 
                  value={newClassForm.subject || 'គណិតវិទ្យា'} 
                  onChange={e => setNewClassForm({...newClassForm, subject: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white"
                >
                  <option value="គណិតវិទ្យា">គណិតវិទ្យា</option>
                  <option value="ភាសាខ្មែរ">ភាសាខ្មែរ</option>
                  <option value="ភាសាអង់គ្លេស">ភាសាអង់គ្លេស</option>
                  <option value="ផ្សេងៗ">ផ្សេងៗ (បញ្ចូលខ្លួនឯង)</option>
                </select>
                {newClassForm.subject === 'ផ្សេងៗ' && (
                  <input 
                    required 
                    type="text" 
                    value={newClassForm.customSubject || ''} 
                    onChange={e => setNewClassForm({...newClassForm, customSubject: e.target.value})} 
                    placeholder="ឧ. រូបវិទ្យា" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white mt-2" 
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">ពណ៌សម្គាល់</label>
                <div className="flex gap-3">
                  {['bg-brand-blue', 'bg-brand-yellow', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500'].map(color => (
                    <button key={color} type="button" onClick={() => setNewClassForm({...newClassForm, color})} className={`w-8 h-8 rounded-full ${color} ${newClassForm.color === color ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`}></button>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewClassModal(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50">បោះបង់</button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-blue text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 disabled:opacity-50 shadow-sm shadow-blue-200">
                  {isSubmitting ? 'កំពុងបង្កើត...' : 'បង្កើតថ្នាក់'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
