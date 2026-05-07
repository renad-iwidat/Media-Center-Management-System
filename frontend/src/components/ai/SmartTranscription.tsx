import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Loader2,
  Download,
  FileText,
  Check,
  X,
  Eye,
  AlertCircle,
  Clock,
  Share2,
  Zap,
  Search,
  FileAudio,
  FileVideo,
  Music,
  Pause,
  Play,
  Volume2,
} from 'lucide-react';
import { api } from '../../services/api';

type OutputType = 'executive_summary' | 'news_article' | 'detailed_report' | 'social_media' | 'video_clips' | 'policy_alerts';
type FileTypeFilter = 'all' | 'audio' | 'video';

interface UploadedFile {
  id: number;
  original_filename: string;
  display_name: string;
  file_type: string;
  file_size: number;
  s3_url: string;
  processing_status: string;
  uploaded_at: string;
  mime_type: string;
}

interface OutputConfig {
  type: OutputType;
  enabled: boolean;
  count?: number; // للمخرجات المتعددة
  customSettings?: Record<string, any>;
}

interface TranscriptionResult {
  id: string;
  transcript: string;
  segments: Array<{
    speaker?: string;
    text: string;
    startTime: number;
    endTime: number;
  }>;
  duration: number;
}

interface GeneratedOutput {
  type: OutputType;
  content: string;
  metadata?: Record<string, any>;
}

interface SmartTranscriptionProps {
  mediaUnitId: number | null;
}

const OUTPUT_TYPES: Record<OutputType, { label: string; icon: any; description: string }> = {
  executive_summary: {
    label: 'ملخص تنفيذي',
    icon: FileText,
    description: '4-6 أسطر تبرز أهم ما ورد في المادة',
  },
  news_article: {
    label: 'خبر صحفي',
    icon: FileText,
    description: 'خبر مكتمل وفق بنية الهرم المقلوب',
  },
  detailed_report: {
    label: 'تقرير صحفي',
    icon: FileText,
    description: 'تقرير معمّق باحترافية صحفية',
  },
  social_media: {
    label: 'منشورات سوشيال ميديا',
    icon: Share2,
    description: 'منشورات مع تصريحات منسوبة',
  },
  video_clips: {
    label: 'مقاطع فيديو',
    icon: Clock,
    description: 'مقاطع مع تايم كود وعناوين',
  },
  policy_alerts: {
    label: 'تنبيهات سياسة التحرير',
    icon: AlertCircle,
    description: 'تقرير بمخالفات السياسة التحريرية',
  },
};

export default function SmartTranscription({ mediaUnitId }: SmartTranscriptionProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [outputs, setOutputs] = useState<OutputConfig[]>([
    { type: 'executive_summary', enabled: true },
    { type: 'news_article', enabled: true },
    { type: 'detailed_report', enabled: false },
    { type: 'social_media', enabled: true, count: 10 },
    { type: 'video_clips', enabled: true, count: 10 },
    { type: 'policy_alerts', enabled: true },
  ]);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorialPolicy, setEditorialPolicy] = useState('');
  const [customInfo, setCustomInfo] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<GeneratedOutput | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // حالات لعرض الملفات المرفوعة
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPreviewAudio, setShowPreviewAudio] = useState(false);

  // جلب الملفات المرفوعة عند تحميل المكون
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchUploadedFiles();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      const audioRes = await api.getAudioFiles();
      const videoRes = await api.getVideoFiles();
      const allFiles = [...(audioRes.data || []), ...(videoRes.data || [])];
      setUploadedFiles(allFiles);
      console.log('Uploaded files:', allFiles);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // معالجة رفع الملف
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    await processFile(file);
  };

  // معالجة الملف المختار من القائمة
  const handleSelectFile = async (file: UploadedFile) => {
    setSelectedFileId(file.id);
    await processFileFromUpload(file);
  };

  // معالجة الملف المرفوع من S3
  const processFileFromUpload = async (file: UploadedFile) => {
    setIsProcessing(true);
    try {
      const fileType = file.file_type === 'video' ? 'video' : 'audio';

      console.log('🎬 [Smart Transcription] Processing file:', file.display_name);
      console.log(' [Smart Transcription] Custom Info:', customInfo ? 'Yes' : 'No');

      // التحقق من التوكن
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('لم يتم العثور على توكن المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      // استدعاء API للتفريغ
      const result = await api.smartTranscriptionProcess({
        fileUrl: file.s3_url,
        fileType,
        language: 'ar',
        outputs: outputs.filter(o => o.enabled),
        editorialPolicy: '', // فارغة
        customInfo, // المعلومات الإضافية فقط
      });

      console.log('✅ [Smart Transcription] Processing completed');

      setTranscriptionResult({
        id: result.data.transcript.substring(0, 10),
        transcript: result.data.transcript,
        segments: result.data.segments || [],
        duration: result.data.metadata?.duration || 0,
      });

      // تعيين المخرجات المولدة
      setGeneratedOutputs(result.data.outputs);
    } catch (error: any) {
      console.error('خطأ في معالجة الملف:', error);
      alert('حدث خطأ في معالجة الملف: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // معالجة الملف المرفوع محلياً
  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // تحديد نوع الملف
      const fileType = file.type.startsWith('video/') ? 'video' : 'audio';
      
      // في التطبيق الفعلي، سيتم رفع الملف إلى S3 أولاً
      // للآن: نستخدم URL محاكاة
      const fileUrl = URL.createObjectURL(file);

      // استدعاء API للتفريغ
      const result = await api.smartTranscriptionProcess({
        fileUrl,
        fileType,
        language: 'ar',
        outputs: outputs.filter(o => o.enabled),
        editorialPolicy,
        customInfo,
      });

      setTranscriptionResult({
        id: result.data.transcript.substring(0, 10),
        transcript: result.data.transcript,
        segments: result.data.segments || [],
        duration: result.data.metadata?.duration || 0,
      });

      // تعيين المخرجات المولدة
      setGeneratedOutputs(result.data.outputs);
    } catch (error: any) {
      console.error('خطأ في معالجة الملف:', error);
      alert('حدث خطأ في معالجة الملف: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // تطبيق الفلتر والبحث
  const filteredFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = fileTypeFilter === 'all' || file.file_type === fileTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const togglePreviewPlayback = () => {
    if (previewAudioRef.current) {
      if (showPreviewAudio) previewAudioRef.current.pause();
      else previewAudioRef.current.play();
      setShowPreviewAudio(!showPreviewAudio);
    }
  };

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId);
  const previewFile = uploadedFiles.find(f => f.id === previewFileId);

  // تحديث إعدادات المخرجات
  const updateOutput = (type: OutputType, updates: Partial<OutputConfig>) => {
    setOutputs(outputs.map(o => (o.type === type ? { ...o, ...updates } : o)));
  };

  // توليد المخرجات
  const generateOutputs = async () => {
    if (!transcriptionResult) {
      alert('يرجى تفريغ الملف أولاً');
      return;
    }

    setIsGenerating(true);
    try {
      // إرسال طلب توليد المخرجات
      const enabledOutputs = outputs.filter(o => o.enabled);
      
      const result = await api.smartTranscriptionGenerateOutputs({
        transcript: transcriptionResult.transcript,
        outputs: enabledOutputs,
        editorialPolicy,
        customInfo,
      });

      setGeneratedOutputs(result.data.outputs);
    } catch (error: any) {
      console.error('خطأ في توليد المخرجات:', error);
      alert('حدث خطأ في توليد المخرجات: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // تصدير الملف الموحد
  const exportUnifiedFile = async () => {
    if (generatedOutputs.length === 0) {
      alert('لا توجد مخرجات لتصديرها');
      return;
    }

    try {
      // استدعاء API للتصدير
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://automation-and-ai-hub-backend.onrender.com'}/api/ai-hub/smart-transcription/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
          body: JSON.stringify({
            outputs: generatedOutputs,
            editorialPolicy,
            customInfo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('فشل التصدير');
      }

      // تحميل الملف
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-transcription-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('خطأ في التصدير:', error);
      alert('حدث خطأ في التصدير: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">التفريغ الذكي</h1>
          <p className="text-slate-400">
            نظام متكامل لتفريغ الصوت والفيديو وتوليد مخرجات تحريرية احترافية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Selector - Left Panel */}
          <div className="lg:col-span-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4 h-[600px] flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Music size={18} />
                  اختر ملفاً
                </h3>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-white"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`flex-1 py-2 rounded-lg text-xs border transition-all ${fileTypeFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFileTypeFilter('audio')}
                  className={`flex-1 py-2 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'audio' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  <FileAudio size={12} /> صوت
                </button>
                <button
                  onClick={() => setFileTypeFilter('video')}
                  className={`flex-1 py-2 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'video' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  <FileVideo size={12} /> فيديو
                </button>
              </div>

              {/* Files List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {loadingFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-500" size={20} />
                  </div>
                ) : filteredFiles.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFiles.map(file => (
                      <div
                        key={file.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedFileId === file.id ? 'bg-blue-600/20 border-blue-600' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                      >
                        <div
                          onClick={() => handleSelectFile(file)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {file.file_type === 'audio' ? (
                              <FileAudio className="text-blue-400 shrink-0" size={16} />
                            ) : (
                              <FileVideo className="text-sky-400 shrink-0" size={16} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{file.display_name}</p>
                              <p className="text-slate-500 text-xs">{formatFileSize(file.file_size)}</p>
                            </div>
                          </div>
                          {selectedFileId === file.id && <Check size={16} className="text-blue-400 shrink-0" />}
                        </div>

                        {/* File Info and Preview */}
                        <div className="flex items-center justify-between px-1 mt-2">
                          <span className="text-slate-500 text-xs">{formatDate(file.uploaded_at)}</span>
                          <div className="flex gap-1">
                            {file.file_type === 'audio' && (
                              <button
                                onClick={() => setPreviewFileId(previewFileId === file.id ? null : file.id)}
                                className="p-1 rounded-lg hover:bg-slate-700 transition-all text-slate-400 hover:text-white"
                                title="استمع للملف"
                              >
                                <Volume2 size={14} />
                              </button>
                            )}
                            {file.file_type === 'video' && (
                              <button
                                onClick={() => {
                                  setPreviewFileId(file.id);
                                  setShowVideoModal(true);
                                }}
                                className="p-1 rounded-lg hover:bg-slate-700 transition-all text-slate-400 hover:text-white"
                                title="شاهد الفيديو"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Audio Preview Player */}
                        {previewFileId === file.id && file.file_type === 'audio' && (
                          <div className="bg-slate-900 rounded-lg p-2 border border-slate-700 mt-2">
                            <audio ref={previewAudioRef} src={file.s3_url} onEnded={() => setShowPreviewAudio(false)} className="hidden" />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={togglePreviewPlayback}
                                className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shrink-0"
                              >
                                {showPreviewAudio ? <Pause size={12} /> : <Play size={12} className="translate-x-0.5" />}
                              </button>
                              <div className="flex-1 h-0.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-600 ${showPreviewAudio ? 'w-full' : 'w-0'}`} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    لا توجد ملفات مرفوعة
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                  استخدم قسم Upload Files لرفع ملفات جديدة
                </p>
              </div>
            </div>
          </div>

          {/* Main Content - Right Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Processing Status */}
            {isProcessing && (
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-400" size={20} />
                <div>
                  <p className="text-white font-semibold">جاري معالجة الملف...</p>
                  <p className="text-blue-200 text-sm">يرجى الانتظار</p>
                </div>
              </div>
            )}

            {/* Transcript Preview */}
            {transcriptionResult && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  التفريغ النهائي
                </h2>
                <div className="bg-slate-900 rounded p-4 max-h-64 overflow-y-auto text-slate-300 text-sm leading-relaxed">
                  {transcriptionResult.transcript}
                </div>
              </div>
            )}

            {/* Generated Outputs Preview */}
            {generatedOutputs.length > 0 && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">المخرجات المولدة</h2>
                <div className="space-y-3">
                  {generatedOutputs.map((output, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition cursor-pointer"
                      onClick={() => {
                        setPreviewOutput(output);
                        setShowPreview(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(OUTPUT_TYPES[output.type].icon, {
                          className: 'w-5 h-5 text-blue-400',
                        })}
                        <span className="text-white">{OUTPUT_TYPES[output.type].label}</span>
                      </div>
                      <Eye className="w-5 h-5 text-slate-400" />
                    </div>
                  ))}
                </div>

                <button
                  onClick={exportUnifiedFile}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  تحميل الملف الموحد
                </button>
              </div>
            )}

            {/* Output Configuration */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">المخرجات المطلوبة</h3>
              <div className="space-y-3">
                {outputs.map(output => (
                  <div key={output.type} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={output.enabled}
                        onChange={e =>
                          updateOutput(output.type, { enabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                      />
                      <span className="text-white text-sm font-medium">
                        {OUTPUT_TYPES[output.type].label}
                      </span>
                    </label>

                    {output.enabled && output.count !== undefined && (
                      <div className="mr-7 flex items-center gap-2">
                        <label className="text-xs text-slate-400">العدد:</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={output.count}
                          onChange={e =>
                            updateOutput(output.type, {
                              count: parseInt(e.target.value),
                            })
                          }
                          className="w-16 bg-slate-900 text-white rounded px-2 py-1 text-xs border border-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* شرح تنبيهات سياسة التحرير */}
                    {output.type === 'policy_alerts' && (
                      <div className="mt-2 p-3 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs text-slate-400 mb-2">
                          <span className="text-yellow-400 font-semibold">ℹ️ ما هي التنبيهات؟</span>
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          هذا المخرج يقوم بمراجعة المحتوى وتحديد الملاحظات التي تستوجب المراجعة قبل النشر، مثل:
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-1 mr-4">
                          <li>• <span className="text-blue-400">الأرقام والإحصائيات</span> - التي تحتاج تحققاً مستقلاً</li>
                          <li>• <span className="text-orange-400">التصريحات الحساسة</span> - السياسية أو الدبلوماسية</li>
                          <li>• <span className="text-red-400">المصادر الموثقة</span> - التأكد من موثوقية الادعاءات</li>
                          <li>• <span className="text-purple-400">المراجعة القانونية</span> - المحتويات الحساسة قانونياً</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={generateOutputs}
                disabled={!transcriptionResult || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    توليد المخرجات
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar - Custom Information */}
          <div className="lg:col-span-4 space-y-6">
            {/* Custom Information */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">معلومات إضافية</h3>
              <textarea
                value={customInfo}
                onChange={e => setCustomInfo(e.target.value)}
                placeholder="أرقام، إحصائيات، أو معلومات محددة..."
                className="w-full h-24 bg-slate-900 text-white rounded p-3 text-sm border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewOutput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {OUTPUT_TYPES[previewOutput.type].label}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-slate-300 whitespace-pre-wrap">
              {previewOutput.content}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && previewFile && previewFile.file_type === 'video' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full">
            <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {previewFile.display_name}
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <video
                ref={videoRef}
                src={previewFile.s3_url}
                controls
                className="w-full rounded-lg bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
