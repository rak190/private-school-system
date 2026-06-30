'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Users, Edit, Trash2, Plus, X, BookOpen, Clock, UserPlus, Loader2, CheckCircle, AlertCircle, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClassDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [classForm, setClassForm] = useState({});
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Student Management
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState('add'); // 'add' or 'edit'
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', gender: 'ប្រុស' });
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState('');
  const [addMethod, setAddMethod] = useState('new'); // 'new', 'existing', 'bulk', or 'csv'
  const [bulkInput, setBulkInput] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [showClassInfo, setShowClassInfo] = useState(false);

  const handleExportTemplate = () => {
    const headers = "នាមត្រកូល,នាមខ្លួន,ភេទ,ថ្ងៃខែឆ្នាំកំណើត,លេខទូរស័ព្ទ,អាសយដ្ឋាន,ឈ្មោះអាណាព្យាបាល\n";
    const sampleRows = "សុខ,តារា,ប្រុស,01/01/2010,012345678,ភ្នំពេញ,សុខ សាន\nចាន់,ធីតា,ស្រី,02/02/2011,098765432,កណ្តាល,ចាន់ រតនា\n";
    // Prefix with BOM for Excel UTF-8 support
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + sampleRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchClassDetails();
    fetchUnassignedStudents();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const res = await fetch(`/api/classes/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setClassData(json.data);
          setClassForm(json.data);
        } else {
          router.push('/teacher/classes'); // redirect if not found
        }
      }
    } catch (err) {
      console.error('Failed to fetch class:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedStudents = async () => {
    try {
      const res = await fetch('/api/students?unassigned=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setUnassignedStudents(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch unassigned students:', err);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setIsSavingClass(true);
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setClassData({ ...classData, ...json.data });
          setIsEditingClass(false);
          showToast('រក្សាទុកព័ត៌មានថ្នាក់រៀនជោគជ័យ');
        }
      } else {
        showToast('មានបញ្ហាក្នុងការរក្សាទុក', 'error');
      }
    } catch (err) {
      console.error('Failed to update class:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុក', 'error');
    } finally {
      setIsSavingClass(false);
    }
  };

  const parseBulkInput = (input) => {
    const lines = input.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      // Basic parsing: split by space. E.g., "សុខ តារា ប្រុស"
      const parts = line.trim().split(/\s+/);
      const genderRaw = parts[parts.length - 1];
      let gender = 'ប្រុស'; // default
      let nameParts = parts;

      if (['ប្រុស', 'ស្រី', 'M', 'F', 'm', 'f'].includes(genderRaw)) {
        gender = ['ស្រី', 'F', 'f'].includes(genderRaw) ? 'ស្រី' : 'ប្រុស';
        nameParts = parts.slice(0, -1);
      }
      
      const lastName = nameParts[0] || 'មិនស្គាល់';
      const firstName = nameParts.slice(1).join(' ') || 'មិនស្គាល់';

      return { firstName, lastName, gender, classId: Number(id) };
    });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setIsSavingStudent(true);
    try {
      if (studentModalMode === 'add') {
        if (addMethod === 'new') {
          // Create brand new student
          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...studentForm, classId: Number(id) })
          });
          if (res.ok) {
            fetchClassDetails();
            setShowStudentModal(false);
            showToast('បន្ថែមសិស្សថ្មីជោគជ័យ');
          } else {
            showToast('មិនអាចបន្ថែមសិស្សបានទេ', 'error');
          }
        } else if (addMethod === 'bulk') {
           const studentsArray = parseBulkInput(bulkInput);
           if (studentsArray.length === 0) {
             showToast('សូមបញ្ចូលទិន្នន័យសិស្ស', 'error');
             setIsSavingStudent(false);
             return;
           }
           const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: studentsArray })
          });
          if (res.ok) {
            fetchClassDetails();
            setShowStudentModal(false);
            showToast(`បន្ថែមសិស្សចំនួន ${studentsArray.length} នាក់ជោគជ័យ`);
            setBulkInput('');
          } else {
            showToast('មិនអាចបន្ថែមសិស្សបានទេ', 'error');
          }
        } else if (addMethod === 'csv') {
           if (!csvFile) {
             showToast('សូមជ្រើសរើសឯកសារ CSV', 'error');
             setIsSavingStudent(false);
             return;
           }
           try {
             const text = await parseCSVFile(csvFile);
             const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
             const studentsArray = [];
             
             let startIdx = 0;
             if (lines.length > 0 && (lines[0].includes('នាម') || lines[0].includes('Name') || lines[0].includes('ភេទ'))) {
               startIdx = 1;
             }

             for (let i = startIdx; i < lines.length; i++) {
               const parts = lines[i].split(',').map(p => p.trim());
               if (parts.length >= 3) {
                 const lastName = parts[0];
                 const firstName = parts[1];
                 let genderRaw = parts[2];
                 let gender = 'ប្រុស';
                 if (['ស្រី', 'F', 'f', 'female', 'Female'].includes(genderRaw)) gender = 'ស្រី';
                 
                 const dateOfBirth = parts[3] || null;
                 const phoneNumber = parts[4] || null;
                 const address = parts[5] || null;
                 const parentName = parts[6] || null;

                 if (lastName && firstName) {
                   studentsArray.push({ lastName, firstName, gender, dateOfBirth, phoneNumber, address, parentName, classId: Number(id) });
                 }
               }
             }

             if (studentsArray.length === 0) {
               showToast('មិនមានទិន្នន័យត្រឹមត្រូវក្នុងឯកសារនេះទេ', 'error');
               setIsSavingStudent(false);
               return; 
             }

             const res = await fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ students: studentsArray })
             });
             
             if (res.ok) {
               fetchClassDetails();
               setShowStudentModal(false);
               showToast(`បញ្ជូលសិស្សចំនួន ${studentsArray.length} នាក់ជោគជ័យ`);
               setCsvFile(null);
             } else {
               showToast('មិនអាចបញ្ជូលសិស្សបានទេ', 'error');
             }
           } catch (err) {
             console.error('File reading failed', err);
             showToast('មានបញ្ហាក្នុងការអានឯកសារ', 'error');
           }
        } else if (addMethod === 'existing' && selectedUnassignedId) {
          // Assign existing student to this class
          const res = await fetch(`/api/students/${selectedUnassignedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId: Number(id) })
          });
          if (res.ok) {
            fetchClassDetails();
            fetchUnassignedStudents();
            setShowStudentModal(false);
            showToast('បញ្ចូលសិស្សទៅថ្នាក់ជោគជ័យ');
          } else {
             showToast('មិនអាចបញ្ចូលសិស្សបានទេ', 'error');
          }
        }
      } else if (studentModalMode === 'edit') {
        // Edit existing student
        const res = await fetch(`/api/students/${studentForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentForm)
        });
        if (res.ok) {
          fetchClassDetails();
          setShowStudentModal(false);
          showToast('កែប្រែព័ត៌មានសិស្សជោគជ័យ');
        } else {
           showToast('មិនអាចកែប្រែព័ត៌មានសិស្សបានទេ', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to save student:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុក', 'error');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (confirm(`តើអ្នកពិតជាចង់ដកសិស្ស ${studentName} ចេញពីថ្នាក់មែនទេ?`)) {
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId: null })
        });
        if (res.ok) {
          fetchClassDetails();
          fetchUnassignedStudents();
          showToast('ដកសិស្សចេញពីថ្នាក់ជោគជ័យ');
        } else {
          showToast('មិនអាចដកសិស្សចេញពីថ្នាក់បានទេ', 'error');
        }
      } catch (err) {
        console.error('Failed to remove student:', err);
        showToast('មិនអាចដកសិស្សចេញពីថ្នាក់បានទេ', 'error');
      }
    }
  };

  if (loading) {
    return (
       <div className="flex justify-center items-center h-full">
         <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
       </div>
    );
  }

  if (!classData) return null;

  return (
    <>
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <Link href="/teacher/classes" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:text-brand-blue hover:bg-blue-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">ព័ត៌មានលម្អិតថ្នាក់រៀន</h1>
      </div>

      {/* Top Collapsible Header for Class Details */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6 transition-all">
        <div className="flex justify-between items-center cursor-pointer group" onClick={() => setShowClassInfo(!showClassInfo)}>
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl ${classData.color || 'bg-brand-blue'} text-white flex items-center justify-center font-bold text-xl shadow-md uppercase`}>
               {classData.className.replace('ថ្នាក់ទី ', '').substring(0, 2)}
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">{classData.className}</h2>
               <p className="text-xs font-semibold text-brand-muted">សិស្សសរុប {classData.students?.length || 0} នាក់</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); setIsEditingClass(true); setShowClassInfo(true); }} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:text-brand-blue hover:bg-blue-50 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <div className="p-2 bg-slate-50 text-slate-500 rounded-full group-hover:bg-slate-100 transition-colors">
              {showClassInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {showClassInfo && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            {!isEditingClass ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-brand-muted">ឆ្នាំសិក្សា {classData.academicYear}</p>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <BookOpen className="w-5 h-5 text-brand-blue shrink-0" />
                    <span>{classData.subject || 'មិនទាន់មានមុខវិជ្ជា'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{classData.schedule || 'មិនទាន់កំណត់ម៉ោង'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500">វឌ្ឍនភាពមេរៀន</span>
                    <span className="text-brand-blue">{classData.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
                    <div className={`h-2.5 rounded-full ${classData.color || 'bg-brand-blue'}`} style={{ width: `${classData.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateClass} className="space-y-4">
                <h3 className="font-bold text-slate-800 mb-4">កែប្រែព័ត៌មានថ្នាក់</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">ឈ្មោះថ្នាក់</label>
                    <input required type="text" value={classForm.className} onChange={e => setClassForm({...classForm, className: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">មុខវិជ្ជា</label>
                    <input type="text" value={classForm.subject || ''} onChange={e => setClassForm({...classForm, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">កាលវិភាគ</label>
                    <input type="text" value={classForm.schedule || ''} onChange={e => setClassForm({...classForm, schedule: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">វឌ្ឍនភាពមេរៀន (%)</label>
                    <input type="number" min="0" max="100" value={classForm.progress || 0} onChange={e => setClassForm({...classForm, progress: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">ពណ៌</label>
                  <div className="flex gap-2">
                    {['bg-brand-blue', 'bg-brand-yellow', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500'].map(c => (
                      <button key={c} type="button" onClick={() => setClassForm({...classForm, color: c})} className={`w-8 h-8 rounded-full ${c} ${classForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}></button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsEditingClass(false)} className="px-6 py-2.5 rounded-full text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">បោះបង់</button>
                  <button type="submit" disabled={isSavingClass} className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 shadow-sm shadow-blue-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSavingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} រក្សាទុក
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Full Width Students List */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">បញ្ជីសិស្ស ({classData.students?.length || 0})</h3>
              <div className="flex gap-2">
                <button onClick={handleExportTemplate} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> ទាញយកគំរូ CSV
                </button>
                <button onClick={() => {
                  setStudentModalMode('add');
                  setAddMethod('new');
                  setStudentForm({ firstName: '', lastName: '', gender: 'ប្រុស' });
                  setShowStudentModal(true);
                }} className="bg-brand-yellow text-yellow-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> បន្ថែមសិស្ស
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-4 whitespace-nowrap">នាមត្រកូល និងនាមខ្លួន</th>
                    <th className="pb-3 whitespace-nowrap">ភេទ</th>
                    <th className="pb-3 whitespace-nowrap">ថ្ងៃខែឆ្នាំកំណើត</th>
                    <th className="pb-3 whitespace-nowrap">លេខទូរស័ព្ទ</th>
                    <th className="pb-3 whitespace-nowrap">អាសយដ្ឋាន</th>
                    <th className="pb-3 whitespace-nowrap">ឈ្មោះអាណាព្យាបាល</th>
                    <th className="pb-3 text-right pr-4 whitespace-nowrap">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-700">
                  {classData.students?.length === 0 ? (
                    <tr><td colSpan="3" className="py-12 text-center text-slate-400 font-medium">មិនទាន់មានសិស្សនៅក្នុងថ្នាក់នេះទេ</td></tr>
                  ) : (
                    classData.students?.map((student, idx) => (
                      <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-4 flex items-center gap-3 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          {student.lastName} {student.firstName}
                        </td>
                        <td className="py-3 whitespace-nowrap">{student.gender}</td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">{student.dateOfBirth || '-'}</td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">{student.phoneNumber || '-'}</td>
                        <td className="py-3 text-slate-500 whitespace-nowrap max-w-[150px] truncate" title={student.address}>{student.address || '-'}</td>
                        <td className="py-3 text-slate-500 whitespace-nowrap max-w-[150px] truncate" title={student.parentName}>{student.parentName || '-'}</td>
                        <td className="py-3 text-right pr-4 flex justify-end gap-1">
                          <button onClick={() => {
                            setStudentModalMode('edit');
                            setStudentForm(student);
                            setShowStudentModal(true);
                          }} className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleRemoveStudent(student.id, `${student.lastName} ${student.firstName}`)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{studentModalMode === 'add' ? 'បន្ថែមសិស្សមកក្នុងថ្នាក់' : 'កែប្រែព័ត៌មានសិស្ស'}</h2>
              <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              
              {studentModalMode === 'add' && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
                  <button type="button" onClick={() => setAddMethod('new')} className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-bold rounded-lg transition-colors ${addMethod === 'new' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>សិស្សថ្មី</button>
                  <button type="button" onClick={() => setAddMethod('bulk')} className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-bold rounded-lg transition-colors ${addMethod === 'bulk' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>បញ្ជូលជាជួរ</button>
                  <button type="button" onClick={() => setAddMethod('csv')} className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-bold rounded-lg transition-colors ${addMethod === 'csv' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>ឯកសារ CSV</button>
                  <button type="button" onClick={() => setAddMethod('existing')} className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-bold rounded-lg transition-colors ${addMethod === 'existing' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>ជ្រើសរើស</button>
                </div>
              )}

              {studentModalMode === 'add' && addMethod === 'existing' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">ជ្រើសរើសសិស្ស</label>
                  <select required value={selectedUnassignedId} onChange={e => setSelectedUnassignedId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white">
                    <option value="">-- សូមជ្រើសរើសសិស្ស --</option>
                    {unassignedStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.gender})</option>
                    ))}
                  </select>
                  {unassignedStudents.length === 0 && <p className="text-xs text-rose-500 mt-1">គ្មានសិស្សដែលមិនទាន់មានថ្នាក់ទេ</p>}
                </div>
              ) : studentModalMode === 'add' && addMethod === 'bulk' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">បញ្ជូលឈ្មោះសិស្សជាជួរ</label>
                  <p className="text-xs text-slate-400 mb-2">ទម្រង់: &quot;នាមត្រកូល នាមខ្លួន ភេទ&quot; ឧទាហរណ៍:</p>
                  <pre className="text-xs bg-slate-50 text-slate-600 p-2 rounded-lg border border-slate-100">សុខ តារា ប្រុស<br/>ចាន់ ធីតា ស្រី</pre>
                  <textarea 
                    rows={6}
                    required
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="សុខ តារា ប្រុស&#10;ចាន់ ធីតា ស្រី"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white resize-none"
                  ></textarea>
                </div>
              ) : studentModalMode === 'add' && addMethod === 'csv' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      សូមជ្រើសរើសឯកសារ <strong className="font-bold">.csv</strong> ។ ប្រព័ន្ធនឹងរំលងជួរដែលមានទិន្នន័យមិនពេញលេញដោយស្វ័យប្រវត្តិ។
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">ជ្រើសរើសឯកសារ CSV</label>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">នាមត្រកូល</label>
                      <input required type="text" value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">នាមខ្លួន</label>
                      <input required type="text" value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">ភេទ</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="gender" value="ប្រុស" checked={studentForm.gender === 'ប្រុស'} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-4 h-4 text-brand-blue focus:ring-brand-blue" />
                          <span className="text-sm font-semibold text-slate-700">ប្រុស</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="gender" value="ស្រី" checked={studentForm.gender === 'ស្រី'} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-4 h-4 text-brand-blue focus:ring-brand-blue" />
                          <span className="text-sm font-semibold text-slate-700">ស្រី</span>
                        </label>
                      </div>
                    </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">ព័ត៌មានបន្ថែម (ជាជម្រើស)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">ថ្ងៃខែឆ្នាំកំណើត</label>
                        <input type="text" placeholder="ឧ. 01/01/2010" value={studentForm.dateOfBirth || ''} onChange={e => setStudentForm({...studentForm, dateOfBirth: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">លេខទូរស័ព្ទ</label>
                        <input type="text" placeholder="ឧ. 012345678" value={studentForm.phoneNumber || ''} onChange={e => setStudentForm({...studentForm, phoneNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">អាសយដ្ឋាន</label>
                        <input type="text" placeholder="ឧ. ភ្នំពេញ" value={studentForm.address || ''} onChange={e => setStudentForm({...studentForm, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">ឈ្មោះអាណាព្យាបាល</label>
                        <input type="text" placeholder="ឧ. សុខ សាន" value={studentForm.parentName || ''} onChange={e => setStudentForm({...studentForm, parentName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue focus:bg-white" />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowStudentModal(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50">បោះបង់</button>
                <button type="submit" disabled={isSavingStudent || (studentModalMode === 'add' && addMethod === 'existing' && !selectedUnassignedId)} className="bg-brand-blue text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 shadow-sm shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {studentModalMode === 'add' ? 'បន្ថែមសិស្ស' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
