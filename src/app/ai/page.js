'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Bot, ArrowLeft, Loader2, BookOpen, FileText, CheckSquare, Sparkles, Copy, Printer, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState('មេរៀនសង្ខេប');
  const [formData, setFormData] = useState({ gradeLevel: 'ថ្នាក់ទី១០', subject: '', topic: '', tone: 'ផ្លូវការ' });
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setMimeType(file.type);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      
      // Read as Base64 for the API
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiOutput('');
    try {
      const payload = { ...formData, materialType: activeTab };
      if (imageBase64) {
        payload.imageBase64 = imageBase64;
        payload.mimeType = mimeType;
      }
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setAiOutput(data.text || data.error);
      } else {
        setAiOutput('ការបង្កើតបរាជ័យ។ សូមព្យាយាមម្តងទៀត។');
      }
    } catch (e) {
      console.error(e);
      setAiOutput('មានបញ្ហាក្នុងពេលបង្កើត។');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-blue/30 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl relative">
        <Link href="/" className="absolute -left-16 top-2 bg-white p-3 rounded-full shadow hover:shadow-md text-brand-muted hover:text-brand-blue transition-all hidden lg:flex">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <header className="text-center mb-10 relative">
          <Link href="/" className="lg:hidden absolute left-0 top-0 bg-white p-3 rounded-full shadow text-brand-muted">
             <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-blue to-purple-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">ជំនួយការ KruAI</h1>
          <p className="text-brand-muted font-medium">ជ្រើសរើសឧបករណ៍ខាងក្រោមដើម្បីបង្កើតឯកសារអប់រំប្រកបដោយគុណភាពខ្ពស់ភ្លាមៗ។</p>
        </header>

        {/* Tools Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('មេរៀនសង្ខេប')}
            className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${
              activeTab === 'មេរៀនសង្ខេប' 
                ? 'bg-white border-brand-blue shadow-md text-brand-blue' 
                : 'bg-white/50 border-transparent hover:bg-white hover:shadow text-brand-muted'
            }`}
          >
            <BookOpen className={`w-8 h-8 ${activeTab === 'មេរៀនសង្ខេប' ? 'text-brand-blue' : 'text-slate-400'}`} />
            <span className="font-bold">មេរៀនសង្ខេប</span>
            <span className="text-xs font-medium opacity-70">បង្កើតគម្រោងមេរៀនលម្អិត</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('វិញ្ញាសា និងចម្លើយ')}
            className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${
              activeTab === 'វិញ្ញាសា និងចម្លើយ' 
                ? 'bg-white border-brand-blue shadow-md text-brand-blue' 
                : 'bg-white/50 border-transparent hover:bg-white hover:shadow text-brand-muted'
            }`}
          >
            <CheckSquare className={`w-8 h-8 ${activeTab === 'វិញ្ញាសា និងចម្លើយ' ? 'text-brand-blue' : 'text-slate-400'}`} />
            <span className="font-bold">វិញ្ញាសា និងចម្លើយ</span>
            <span className="text-xs font-medium opacity-70">កម្រងសំណួរ និងអត្រាកំណែ</span>
          </button>

          <button 
            onClick={() => setActiveTab('សំណួរពិភាក្សា')}
            className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${
              activeTab === 'សំណួរពិភាក្សា' 
                ? 'bg-white border-brand-blue shadow-md text-brand-blue' 
                : 'bg-white/50 border-transparent hover:bg-white hover:shadow text-brand-muted'
            }`}
          >
            <FileText className={`w-8 h-8 ${activeTab === 'សំណួរពិភាក្សា' ? 'text-brand-blue' : 'text-slate-400'}`} />
            <span className="font-bold">សំណួរពិភាក្សា</span>
            <span className="text-xs font-medium opacity-70">សំណួរត្រិះរិះពិចារណា</span>
          </button>
        </div>

        {/* Generator Form */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 print:hidden">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Sparkles className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
            <h2 className="text-xl font-bold text-slate-800">បង្កើត {activeTab}</h2>
          </div>
          
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">កម្រិតថ្នាក់</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                >
                  <option value="ថ្នាក់ទី១">ថ្នាក់ទី១ (Grade 1)</option>
                  <option value="ថ្នាក់ទី២">ថ្នាក់ទី២ (Grade 2)</option>
                  <option value="ថ្នាក់ទី៣">ថ្នាក់ទី៣ (Grade 3)</option>
                  <option value="ថ្នាក់ទី៤">ថ្នាក់ទី៤ (Grade 4)</option>
                  <option value="ថ្នាក់ទី៥">ថ្នាក់ទី៥ (Grade 5)</option>
                  <option value="ថ្នាក់ទី៦">ថ្នាក់ទី៦ (Grade 6)</option>
                  <option value="ថ្នាក់ទី៧">ថ្នាក់ទី៧ (Grade 7)</option>
                  <option value="ថ្នាក់ទី៨">ថ្នាក់ទី៨ (Grade 8)</option>
                  <option value="ថ្នាក់ទី៩">ថ្នាក់ទី៩ (Grade 9)</option>
                  <option value="ថ្នាក់ទី១០">ថ្នាក់ទី១០ (Grade 10)</option>
                  <option value="ថ្នាក់ទី១១">ថ្នាក់ទី១១ (Grade 11)</option>
                  <option value="ថ្នាក់ទី១២">ថ្នាក់ទី១២ (Grade 12)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">មុខវិជ្ជា</label>
                <input 
                  type="text" 
                  placeholder="ឧ. ជីវវិទ្យា" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">ទម្រង់/សម្លេង</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium"
                  value={formData.tone}
                  onChange={(e) => setFormData({...formData, tone: e.target.value})}
                >
                  <option value="ផ្លូវការ">ផ្លូវការ (Formal)</option>
                  <option value="រីករាយ">រីករាយ (Fun & Engaging)</option>
                  <option value="តឹងរ៉ឹង">តឹងរ៉ឹង (Strict & Academic)</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">ប្រធានបទលម្អិត ឬ រូបភាពមេរៀន</label>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="ឧ. រស្មីសំយោគ, សង្គ្រាមត្រជាក់..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                />
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                    id="image-upload"
                  />
                  {!imagePreview ? (
                    <label 
                      htmlFor="image-upload"
                      className="h-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-brand-blue/30 rounded-xl text-brand-blue font-bold cursor-pointer hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      <ImageIcon className="w-5 h-5" /> ភ្ជាប់រូបភាព
                    </label>
                  ) : (
                    <div className="h-[60px] w-[140px] relative border-2 border-brand-blue rounded-xl overflow-hidden group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={removeImage} className="text-white hover:text-red-400 p-1">
                           <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">អ្នកអាចវាយបញ្ចូលប្រធានបទ ឬភ្ជាប់រូបភាពសៀវភៅមេរៀន (ឬទាំងពីរ)។</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-blue/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> កំពុងដំណើរការ...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> បង្កើតឥឡូវនេះ</>
              )}
            </button>
          </form>
        </div>

        {/* AI Output Render */}
        {aiOutput && (
          <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-xl shadow-brand-blue/5 border border-brand-blue/10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 print:hidden gap-4">
              <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> លទ្ធផលពី KruAI
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
                >
                  {copied ? <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> បានចម្លង</> : <><Copy className="w-4 h-4" /> ចម្លង</>}
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" /> បោះពុម្ព
                </button>
              </div>
            </div>
            
            <div ref={contentRef} className="prose prose-slate max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-brand-blue prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8">
              <ReactMarkdown>{aiOutput}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
