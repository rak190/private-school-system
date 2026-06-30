'use client';
import { useState, useEffect } from 'react';
import { Award, Save, Download, FileSpreadsheet, Search, Filter, Plus, X, Trash2 } from 'lucide-react';

const MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const SEMESTERS = ['ឆមាសទី១', 'ឆមាសទី២'];

export default function TeacherGrades() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('មករា');
  const [selectedSemester, setSelectedSemester] = useState('ឆមាសទី១');
  
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); // Array of string subject names
  const [scores, setScores] = useState({}); // { 'studentId-subjectName': { homework: 0, exam: 0 } }
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  
  const [sortBy, setSortBy] = useState('rank'); // 'name', 'total', 'rank'

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id.toString() === selectedClassId);
      if (cls) {
        const parsedSubjects = cls.gradeSubjects ? cls.gradeSubjects.split(',').map(s => s.trim()).filter(Boolean) : ['អង់គ្លេស'];
        setSubjects(parsedSubjects);
      }
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (selectedClassId) {
      fetchDataForClass();
    }
  }, [selectedClassId, selectedMonth, selectedSemester]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setClasses(json.data);
          if (json.data.length > 0 && !selectedClassId) {
            setSelectedClassId(json.data[0].id.toString());
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForClass = async () => {
    setLoading(true);
    try {
      // Fetch students
      const stuRes = await fetch(`/api/students?classId=${selectedClassId}`);
      if (stuRes.ok) {
        const stuJson = await stuRes.json();
        if (stuJson.success) setStudents(stuJson.data);
      }

      // Fetch grades
      const gradeRes = await fetch(`/api/grades?classId=${selectedClassId}&month=${selectedMonth}&semester=${selectedSemester}`);
      if (gradeRes.ok) {
        const gradeJson = await gradeRes.json();
        if (gradeJson.success) {
          const scoresMap = {};
          gradeJson.data.forEach(score => {
            const key = `${score.studentId}-${score.subjectName}`;
            scoresMap[key] = {
              homework: score.homeworkScore || 0,
              exam: score.examScore || 0
            };
          });
          setScores(scoresMap);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, subjectName, type, value) => {
    const val = value === '' ? '' : Number(value);
    setScores(prev => {
      const key = `${studentId}-${subjectName}`;
      const existing = prev[key] || { homework: 0, exam: 0 };
      return {
        ...prev,
        [key]: { ...existing, [type]: val }
      };
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const newScoresArray = [];
      Object.entries(scores).forEach(([key, val]) => {
        const [studentIdStr, ...subjectParts] = key.split('-');
        const subjectName = subjectParts.join('-'); // in case subject has hyphens
        newScoresArray.push({
          studentId: studentIdStr,
          subjectName,
          homeworkScore: val.homework === '' ? 0 : val.homework,
          examScore: val.exam === '' ? 0 : val.exam
        });
      });

      const res = await fetch('/api/grades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          examMonth: selectedMonth,
          semester: selectedSemester,
          newScores: newScoresArray
        })
      });
      
      if (res.ok) {
        alert('រក្សាទុកពិន្ទុបានជោគជ័យ!');
      } else {
        alert('មានបញ្ហាក្នុងការរក្សាទុក។');
      }
    } catch (err) {
      console.error('Failed to save grades:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុក។');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const updatedSubjects = [...subjects, newSubject.trim()];
    const gradeSubjectsStr = updatedSubjects.join(',');

    try {
      const res = await fetch(`/api/classes/${selectedClassId}/subjects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeSubjects: gradeSubjectsStr })
      });
      if (res.ok) {
        setSubjects(updatedSubjects);
        // Also update the class in state so it doesn't revert on re-render
        setClasses(classes.map(c => c.id.toString() === selectedClassId ? { ...c, gradeSubjects: gradeSubjectsStr } : c));
        setShowAddSubjectModal(false);
        setNewSubject('');
      }
    } catch (err) {
      console.error('Failed to add subject:', err);
    }
  };

  const handleDeleteSubject = async (subjectToDelete) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបមុខវិជ្ជា "${subjectToDelete}" មែនទេ? ពិន្ទុសម្រាប់មុខវិជ្ជានេះនឹងត្រូវបាត់បង់ប្រសិនបើអ្នករក្សាទុក។`)) return;

    const updatedSubjects = subjects.filter(s => s !== subjectToDelete);
    const gradeSubjectsStr = updatedSubjects.join(',');

    try {
      const res = await fetch(`/api/classes/${selectedClassId}/subjects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeSubjects: gradeSubjectsStr })
      });
      if (res.ok) {
        setSubjects(updatedSubjects);
        setClasses(classes.map(c => c.id.toString() === selectedClassId ? { ...c, gradeSubjects: gradeSubjectsStr } : c));
        
        setScores(prev => {
           const newScores = { ...prev };
           Object.keys(newScores).forEach(key => {
             if (key.endsWith(`-${subjectToDelete}`)) {
               delete newScores[key];
             }
           });
           return newScores;
        });
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  // Compute Totals, Average, and Rank
  const computedStudents = students.map(student => {
    let totalScore = 0;
    subjects.forEach(sub => {
      const key = `${student.id}-${sub}`;
      totalScore += Number(scores[key]?.homework || 0) + Number(scores[key]?.exam || 0);
    });
    const average = subjects.length > 0 ? (totalScore / subjects.length).toFixed(2) : 0;
    return { ...student, totalScore, average: Number(average) };
  });

  // Calculate Rank based on Total Score (descending)
  const sortedForRank = [...computedStudents].sort((a, b) => b.totalScore - a.totalScore);
  sortedForRank.forEach((s, index) => {
    const match = computedStudents.find(c => c.id === s.id);
    if (match) {
      // Handle ties by checking if previous student has same score
      if (index > 0 && s.totalScore === sortedForRank[index - 1].totalScore) {
        match.rank = sortedForRank[index - 1].rank; // Same rank as previous
      } else {
        match.rank = index + 1;
      }
    }
  });

  // Sort based on selected 'sortBy' option
  if (sortBy === 'name') {
    computedStudents.sort((a, b) => a.firstName.localeCompare(b.firstName)); // Sort by First Name
  } else if (sortBy === 'total') {
    computedStudents.sort((a, b) => b.totalScore - a.totalScore); // Highest total first
  } else if (sortBy === 'rank') {
    computedStudents.sort((a, b) => a.rank - b.rank); // Rank 1 first
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            បញ្ជីពិន្ទុ
          </h1>
          <p className="text-sm font-medium text-brand-muted mt-1">បញ្ចូលពិន្ទុកិច្ចការផ្ទះ និងប្រឡងសម្រាប់គ្រប់មុខវិជ្ជា</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto print:hidden">
          <button onClick={handlePrint} className="bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shrink-0">
            <Download className="w-4 h-4" /> ទាញយក PDF
          </button>
          <button onClick={handleSaveAll} disabled={isSaving || students.length === 0} className="bg-brand-blue px-6 py-2.5 rounded-full shadow-sm shadow-blue-200 text-white font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកទាំងអស់'}
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">ថ្នាក់រៀន</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none">
              <option value="" disabled>-- ជ្រើសរើសថ្នាក់ --</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">ខែប្រឡង</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">ឆមាស</label>
            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none">
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">តម្រៀបតាម</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-400 focus:bg-amber-100 outline-none">
              <option value="rank">ចំណាត់ថ្នាក់ (Rank)</option>
              <option value="total">ពិន្ទុសរុប (Total)</option>
              <option value="name">ឈ្មោះសិស្ស (Name)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col relative print:border-none print:shadow-none print:rounded-none">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-brand-blue font-bold">កំពុងផ្ទុកទិន្នន័យ...</div>
          </div>
        )}

        <div className="overflow-x-auto hide-scrollbar">
          {students.length === 0 ? (
            <div className="p-12 text-center text-brand-muted">
              មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ។ សូមបញ្ចូលសិស្សជាមុនសិន។
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr>
                  <th rowSpan={2} className="p-4 bg-slate-50 border-r border-b border-slate-200 text-center font-bold text-slate-600 text-sm sticky left-0 z-20 w-16 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">ល.រ</th>
                  <th rowSpan={2} className="p-4 bg-slate-50 border-r border-b border-slate-200 font-bold text-slate-600 text-sm sticky left-16 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px]">ឈ្មោះសិស្ស</th>
                  
                  {subjects.map((sub, idx) => (
                    <th key={idx} colSpan={1} className="p-3 bg-slate-50 border-r border-b border-slate-200 text-center font-bold text-brand-blue text-sm relative group">
                      {sub}
                      <button 
                        onClick={() => handleDeleteSubject(sub)} 
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-all print:hidden"
                        title="លុបមុខវិជ្ជា"
                      >
                         <Trash2 className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                  
                  <th rowSpan={2} className="p-3 bg-emerald-50 border-r border-b border-emerald-200 text-center font-bold text-emerald-700 text-sm w-24">
                    សរុប
                  </th>
                  <th rowSpan={2} className="p-3 bg-blue-50 border-r border-b border-blue-200 text-center font-bold text-blue-700 text-sm w-24">
                    មធ្យមភាគ
                  </th>
                  <th rowSpan={2} className="p-3 bg-amber-50 border-r border-b border-amber-200 text-center font-bold text-amber-700 text-sm w-24">
                    ចំណាត់ថ្នាក់
                  </th>

                  <th rowSpan={2} className="p-3 bg-slate-50 border-b border-slate-200 text-center font-bold text-slate-600 text-sm min-w-[150px] print:hidden">
                    <button onClick={() => setShowAddSubjectModal(true)} className="flex items-center gap-1.5 mx-auto text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" /> មុខវិជ្ជា
                    </button>
                  </th>
                </tr>
                <tr>
                  {subjects.map((sub, idx) => (
                    <td key={`${idx}-headers`} className="p-0 border-b border-slate-200 bg-slate-50/50">
                      <div className="flex h-full w-[160px]">
                        <div className="flex-1 p-2 text-center text-xs font-semibold text-slate-500 border-r border-slate-200">កិច្ចការផ្ទះ</div>
                        <div className="flex-1 p-2 text-center text-xs font-bold text-amber-600 border-r border-slate-200">ប្រឡង</div>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computedStudents.map((student, i) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-400 text-sm bg-white group-hover:bg-slate-50/50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{i + 1}</td>
                    <td className="p-3 border-r border-slate-100 font-bold text-slate-700 text-sm bg-white group-hover:bg-slate-50/50 sticky left-16 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                      {student.lastName} {student.firstName}
                    </td>
                    
                    {subjects.map((sub, idx) => {
                      const key = `${student.id}-${sub}`;
                      const hwScore = scores[key]?.homework ?? '';
                      const exScore = scores[key]?.exam ?? '';
                      
                      const hwFailing = hwScore !== '' && hwScore < 25; // Assuming max is 50? Wait, let's just say exam < 50 is failing
                      const exFailing = exScore !== '' && exScore < 25; 
                      const totalSubScore = (hwScore || 0) + (exScore || 0);
                      const isFailing = totalSubScore < 50 && (hwScore !== '' || exScore !== '');
                      
                      return (
                        <td key={`${idx}-inputs`} className="p-0 border-r border-slate-100">
                          <div className={`flex h-full w-[160px] ${isFailing ? 'bg-rose-50' : ''}`}>
                            <div className="flex-1 border-r border-slate-100">
                              <input 
                                type="number" 
                                min="0" max="100"
                                value={hwScore}
                                onChange={(e) => handleScoreChange(student.id, sub, 'homework', e.target.value)}
                                className={`w-full h-full min-h-[48px] p-2 text-center text-sm font-semibold bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-brand-blue ${hwFailing ? 'text-rose-600' : 'text-slate-600'}`}
                                placeholder="-"
                              />
                            </div>
                            <div className="flex-1 border-r border-slate-100 bg-amber-50/30">
                              <input 
                                type="number" 
                                min="0" max="100"
                                value={exScore}
                                onChange={(e) => handleScoreChange(student.id, sub, 'exam', e.target.value)}
                                className={`w-full h-full min-h-[48px] p-2 text-center text-sm font-bold bg-transparent focus:bg-amber-100 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-amber-500 ${exFailing ? 'text-rose-600' : 'text-amber-700'}`}
                                placeholder="-"
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    
                    {/* Computed Columns */}
                    <td className="p-3 border-r border-slate-100 text-center font-bold text-emerald-600 bg-emerald-50/30 text-sm">
                      {student.totalScore}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center font-bold text-blue-600 bg-blue-50/30 text-sm">
                      {student.average}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center font-bold text-amber-600 bg-amber-50/30 text-sm text-lg">
                      {student.rank}
                    </td>

                    <td className="p-3 print:hidden"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">បន្ថែមមុខវិជ្ជាថ្មី</h2>
              <button onClick={() => setShowAddSubjectModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ឈ្មោះមុខវិជ្ជា</label>
              <input 
                required 
                type="text" 
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="ឧ. រូបវិទ្យា"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none mb-6"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50">បោះបង់</button>
                <button type="submit" disabled={!newSubject.trim()} className="bg-brand-blue text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 disabled:opacity-50 shadow-sm shadow-blue-200">
                  បន្ថែម
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
