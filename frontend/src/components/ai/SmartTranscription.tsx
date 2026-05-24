import React, { useState, useRef, useEffect } from 'react';
import {
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
  ChevronRight,
  CheckCircle2,
  Plus,
  Hash,
} from 'lucide-react';
import { api } from '../../services/api';
import { parseNumberedList } from '../../lib/markdown-parser';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

type OutputType = 'executive_summary' | 'detailed_report' | 'news_article' | 'video_clips' | 'social_media' | 'policy_alerts';
type OutletOutputType = 'comprehensive_report' | 'short_news' | 'full_transcript' | 'social_posts' | 'video_clips';
type FileTypeFilter = 'all' | 'audio' | 'video';
type ProcessingStep = 'select' | 'transcribing' | 'outputs' | 'complete';

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

interface GeneratedOutput {
  type: OutputType;
  content: string;
  metadata?: Record<string, any>;
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

interface SmartTranscriptionProps {
  mediaUnitId?: number | null;
}

interface OutletProfile {
  id: number;
  name: string;
  slug: string;
  identity: string;
  angle_approach: string;
  tone_language: string;
  is_active: boolean;
  sort_order: number;
}

const OUTLET_OUTPUT_TYPES: Record<OutletOutputType, { label: string; icon: any; description: string }> = {
  comprehensive_report: {
    label: 'تقرير صحفي شامل',
    icon: FileText,
    description: 'مادة صحفية مكتملة تعيد ترتيب المادة حسب الأهمية',
  },
  short_news: {
    label: 'خبر قصير',
    icon: FileText,
    description: 'خبر موجز يختار الزاوية الأقوى (80-150 كلمة)',
  },
  full_transcript: {
    label: 'التفريغ الكامل المنقح',
    icon: FileText,
    description: 'كل ما ورد في الصوت بعد التنقيح دون حذف أي فكرة',
  },
  social_posts: {
    label: 'بوستات السوشال ميديا',
    icon: Share2,
    description: 'حزمة منشورات مخصصة لكل منصة بصياغة مختلفة',
  },
  video_clips: {
    label: 'أهم المقاطع للتقطيع',
    icon: Clock,
    description: 'مقاطع مقترحة مع سبب الاختيار والمدة والمنصة المناسبة',
  },
};

const OUTPUT_TYPES: Record<OutputType, { label: string; icon: any; description: string }> = {
  executive_summary: {
    label: 'ملخص تنفيذي',
    icon: FileText,
    description: 'ملخص مهني من 4-6 أسطر يوضح أصل القصة والعقدة الأساسية',
  },
  detailed_report: {
    label: 'تقرير صحفي',
    icon: FileText,
    description: 'تقرير جاهز للنشر بعناوين صحفية احترافية',
  },
  news_article: {
    label: 'خبر صحفي',
    icon: FileText,
    description: 'خبر مختصر ومباشر بأسلوب الهرم المقلوب',
  },
  video_clips: {
    label: 'مقاطع مقترحة للنشر',
    icon: Clock,
    description: 'مقاطع مع توقيت وعنوان ونص كامل للمونتير',
  },
  social_media: {
    label: 'منشورات سوشيال ميديا',
    icon: Share2,
    description: 'منشورات منسوبة إلى مصادرها',
  },
  policy_alerts: {
    label: 'تنبيهات سياسة التحرير',
    icon: AlertCircle,
    description: 'رصد العبارات المخالفة لسياسة التحرير',
  },
};

export default function SmartTranscription({ }: SmartTranscriptionProps) {
  // حالات المعالجة الرئيسية
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('select');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [transcriptWithTimestamps, setTranscriptWithTimestamps] = useState<string | null>(null);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<Set<OutputType>>(new Set());

  // بوب أب تأكيد التفرغ
  const [confirmFile, setConfirmFile] = useState<UploadedFile | null>(null);

  // أعداد المخرجات
  const [socialCount, setSocialCount] = useState(5);
  const [videoClipsCount, setVideoClipsCount] = useState(5);

  // حالات الجهات الإعلامية (Outlet-based)
  const [outletProfiles, setOutletProfiles] = useState<OutletProfile[]>([]);
  const [selectedOutlets, setSelectedOutlets] = useState<OutletProfile[]>([]);
  const [selectedOutletOutputs, setSelectedOutletOutputs] = useState<Set<OutletOutputType>>(
    new Set(['comprehensive_report', 'short_news', 'full_transcript', 'social_posts', 'video_clips'])
  );
  const [outletResults, setOutletResults] = useState<any[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<number>(0);
  
  // حالات الملفات المرفوعة
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPreviewAudio, setShowPreviewAudio] = useState(false);
  
  // حالات المعاينة
  const [showPreview, setShowPreview] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<GeneratedOutput | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // معلومات إضافية
  const [customInfo, setCustomInfo] = useState('');

  // جلب الملفات المرفوعة عند تحميل المكون
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchUploadedFiles();
      fetchOutletProfiles();
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
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchOutletProfiles = async () => {
    try {
      const res = await api.getOutletProfiles();
      setOutletProfiles(res.data || []);
    } catch (error) {
      console.error('Error fetching outlet profiles:', error);
    }
  };

  // فتح بوب أب التأكيد
  const handleSelectFile = (file: UploadedFile) => {
    setConfirmFile(file);
  };

  // تأكيد البدء بالتفرغ
  const handleConfirmTranscription = async () => {
    if (!confirmFile) return;
    setSelectedFile(confirmFile);
    setConfirmFile(null);
    setProcessingStep('transcribing');
    await processFile(confirmFile);
  };

  // معالجة الملف المرفوع من S3
  const processFile = async (file: UploadedFile) => {
    setIsProcessing(true);
    try {
      const fileType = file.file_type === 'video' ? 'video' : 'audio';

      console.log('🎬 [Smart Transcription] Processing file:', file.display_name);
      console.log('📝 [Smart Transcription] Custom Info:', customInfo ? 'Yes' : 'No');

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('لم يتم العثور على توكن المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      // استدعاء API للتفريغ - نطلب video_clips لضمان الحصول على timestamps
      const result = await api.smartTranscriptionProcess({
        fileUrl: file.s3_url,
        fileType,
        language: 'ar',
        outputs: [{ type: 'video_clips', enabled: true, count: 5 }], // نطلب timestamps
        editorialPolicy: '',
        customInfo,
      });

      console.log('✅ [Smart Transcription] Processing completed');

      setTranscriptionResult({
        id: result.data.transcript.substring(0, 10),
        transcript: result.data.transcript,
        segments: result.data.segments || [],
        duration: result.data.metadata?.duration || 0,
      });

      // حفظ النص مع التوقيتات إن وجد
      if (result.data.transcriptWithTimestamps) {
        setTranscriptWithTimestamps(result.data.transcriptWithTimestamps);
      } else {
        setTranscriptWithTimestamps(null);
      }

      // الانتقال إلى خطوة اختيار المخرجات
      setProcessingStep('outputs');
      setGeneratedOutputs(result.data.outputs || []);
    } catch (error: any) {
      console.error('خطأ في معالجة الملف:', error);
      alert('حدث خطأ في معالجة الملف: ' + error.message);
      setProcessingStep('select');
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

  const previewFile = uploadedFiles.find(f => f.id === previewFileId);

  // تبديل اختيار المخرج
  const toggleOutputSelection = (type: OutputType) => {
    const newSelected = new Set(selectedOutputs);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedOutputs(newSelected);
  };

  // تبديل اختيار مخرج الجهة
  const toggleOutletOutputSelection = (type: OutletOutputType) => {
    const newSelected = new Set(selectedOutletOutputs);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedOutletOutputs(newSelected);
  };

  // تبديل اختيار جهة (multi-select)
  const toggleOutletSelection = (outlet: OutletProfile) => {
    setSelectedOutlets(prev => {
      const exists = prev.find(o => o.id === outlet.id);
      if (exists) {
        return prev.filter(o => o.id !== outlet.id);
      } else {
        return [...prev, outlet];
      }
    });
  };

  // توليد المخرجات لكل الجهات المختارة
  const generateByOutlet = async () => {
    if (!transcriptionResult || selectedOutlets.length === 0) {
      alert('يرجى اختيار جهة إعلامية واحدة على الأقل');
      return;
    }

    setIsProcessing(true);
    try {
      const results: any[] = [];

      for (let i = 0; i < selectedOutlets.length; i++) {
        const outlet = selectedOutlets[i];
        console.log(`📰 [${i + 1}/${selectedOutlets.length}] توليد حزمة: ${outlet.name}`);

        const result = await api.smartTranscriptionGenerateByOutlet({
          transcript: transcriptionResult.transcript,
          transcriptWithTimestamps: transcriptWithTimestamps || undefined,
          outletSlug: outlet.slug,
          customInfo,
          clipCount: videoClipsCount,
          socialCount,
        });

        results.push(result.data);
      }

      setOutletResults(results);
      setActiveResultTab(0);

      // عرض مخرجات أول جهة بالـ generatedOutputs
      const firstResult = results[0];
      const outputs: GeneratedOutput[] = (firstResult.outputs || []).map((o: any) => ({
        type: o.type as OutputType,
        content: o.content,
        metadata: { type_name_ar: o.type_name_ar },
      }));
      setGeneratedOutputs(outputs);
      setProcessingStep('complete');
    } catch (error: any) {
      console.error('خطأ في توليد المخرجات:', error);
      alert('حدث خطأ في توليد المخرجات: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // توليد المخرجات المختارة
  const generateSelectedOutputs = async () => {
    if (!transcriptionResult || selectedOutputs.size === 0) {
      alert('يرجى اختيار مخرج واحد على الأقل');
      return;
    }

    setIsProcessing(true);
    try {
      const enabledOutputs = Array.from(selectedOutputs).map(type => ({
        type,
        enabled: true,
        count: type === 'social_media' ? socialCount : type === 'video_clips' ? videoClipsCount : undefined,
      }));
      
      const result = await api.smartTranscriptionGenerateOutputs({
        transcript: transcriptionResult.transcript,
        outputs: enabledOutputs,
        editorialPolicy: '',
        customInfo,
      });

      setGeneratedOutputs(result.data.outputs);
      setProcessingStep('complete');
    } catch (error: any) {
      console.error('خطأ في توليد المخرجات:', error);
      alert('حدث خطأ في توليد المخرجات: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // تصدير الملف الموحد (txt)
  const exportUnifiedFile = async () => {
    if (generatedOutputs.length === 0) {
      alert('لا توجد مخرجات لتصديرها');
      return;
    }

    try {
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
            editorialPolicy: '',
            customInfo,
          }),
        }
      );

      if (!response.ok) throw new Error('فشل التصدير');

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

  // تصدير DOCX - RTL عربي (محسّن للحزمة التحريرية)
  const exportDOCX = async () => {
    if (generatedOutputs.length === 0) return;

    const outputLabels: Record<string, string> = {
      executive_summary: 'ملخص تنفيذي',
      detailed_report: 'تقرير صحفي',
      news_article: 'خبر صحفي',
      video_clips: 'مقاطع مقترحة للنشر',
      social_media: 'منشورات سوشيال ميديا',
      policy_alerts: 'تنبيهات سياسة التحرير',
      comprehensive_report: 'تقرير صحفي شامل',
      short_news: 'خبر قصير',
      full_transcript: 'التفريغ الكامل المنقح',
      social_posts: 'بوستات السوشال ميديا',
    };

    // خصائص RTL مشتركة لكل paragraph
    const rtlProps = {
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    };

    const children: Paragraph[] = [];

    // ═══ عنوان الوثيقة ═══
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'الحزمة التحريرية — التفريغ الذكي', bold: true, size: 40, rightToLeft: true })],
        ...rtlProps,
        spacing: { after: 120 },
      })
    );

    // اسم الجهة إن وجد
    if (selectedOutlets.length > 0) {
      const activeOutlet = outletResults[activeResultTab]?.outlet;
      if (activeOutlet) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `الجهة: ${activeOutlet.name}`, bold: true, size: 26, rightToLeft: true, color: '3B82F6' })],
            ...rtlProps,
            spacing: { after: 80 },
          })
        );
      }
    }

    // التاريخ
    children.push(
      new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }), size: 22, rightToLeft: true, color: '6B7280' })],
        ...rtlProps,
        spacing: { after: 300 },
      })
    );

    // ═══ تقييم الجودة + الأفكار + الاقتباسات ═══
    const activeResult = outletResults[activeResultTab];
    if (activeResult?.quality_assessment) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'تقييم جودة التفريغ', bold: true, size: 30, rightToLeft: true })],
          ...rtlProps,
          spacing: { before: 300, after: 200 },
          border: { bottom: { color: '10B981', size: 6, space: 4, style: 'single' } },
        })
      );
      addContentLines(children, activeResult.quality_assessment, rtlProps);
    }

    if (activeResult?.top_ideas) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'أبرز الأفكار', bold: true, size: 30, rightToLeft: true })],
          ...rtlProps,
          spacing: { before: 300, after: 200 },
          border: { bottom: { color: '8B5CF6', size: 6, space: 4, style: 'single' } },
        })
      );
      addContentLines(children, activeResult.top_ideas, rtlProps);
    }

    if (activeResult?.top_quotes) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'أفضل الاقتباسات', bold: true, size: 30, rightToLeft: true })],
          ...rtlProps,
          spacing: { before: 300, after: 200 },
          border: { bottom: { color: 'F59E0B', size: 6, space: 4, style: 'single' } },
        })
      );
      addContentLines(children, activeResult.top_quotes, rtlProps);
    }

    // ═══ المخرجات الرئيسية ═══
    generatedOutputs.forEach((output) => {
      const label = output.metadata?.type_name_ar || outputLabels[output.type] || output.type;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: label, bold: true, size: 30, rightToLeft: true })],
          ...rtlProps,
          spacing: { before: 400, after: 200 },
          border: { bottom: { color: '3B82F6', size: 6, space: 4, style: 'single' } },
        })
      );

      addContentLines(children, output.content, rtlProps);
    });

    // ═══ التنبيهات التحريرية ═══
    if (activeResult?.editorial_alerts) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'تنبيهات تحريرية', bold: true, size: 30, rightToLeft: true, color: 'EF4444' })],
          ...rtlProps,
          spacing: { before: 400, after: 200 },
          border: { bottom: { color: 'EF4444', size: 6, space: 4, style: 'single' } },
        })
      );
      addContentLines(children, activeResult.editorial_alerts, rtlProps);
    }

    // ═══ إنشاء الملف ═══
    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const activeOutletName = outletResults[activeResultTab]?.outlet?.name;
    const filename = activeOutletName
      ? `حزمة-تحريرية-${activeOutletName}-${Date.now()}.docx`
      : `تفريغ-ذكي-${Date.now()}.docx`;
    saveAs(blob, filename);
  };

  /** Helper: تحويل نص إلى paragraphs مع دعم markdown */
  function addContentLines(children: Paragraph[], content: string, rtlProps: any) {
    const lines = content.split('\n');
    lines.forEach((line) => {
      if (!line.trim()) {
        children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
        return;
      }

      // عناوين # ## ###
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes: Record<number, number> = { 1: 28, 2: 26, 3: 24 };
        children.push(
          new Paragraph({
            children: [new TextRun({ text: headingMatch[2], bold: true, size: sizes[level] || 24, rightToLeft: true })],
            ...rtlProps,
            spacing: { before: 240, after: 120 },
          })
        );
        return;
      }

      // نقاط (bullet points)
      const bulletMatch = line.match(/^[-•]\s+(.+)$/);
      if (bulletMatch) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${bulletMatch[1]}`, size: 22, rightToLeft: true })],
            ...rtlProps,
            spacing: { after: 80 },
          })
        );
        return;
      }

      // بناء الـ runs مع دعم **bold**
      const runs: TextRun[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          runs.push(new TextRun({ text: line.slice(lastIndex, match.index), size: 22, rightToLeft: true }));
        }
        runs.push(new TextRun({ text: match[1], bold: true, size: 22, rightToLeft: true }));
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        runs.push(new TextRun({ text: line.slice(lastIndex), size: 22, rightToLeft: true }));
      }

      children.push(
        new Paragraph({
          children: runs.length > 0 ? runs : [new TextRun({ text: line, size: 22, rightToLeft: true })],
          ...rtlProps,
          spacing: { after: 120 },
        })
      );
    });
  }

  // تصدير كل الجهات — ملف DOCX لكل جهة
  const exportAllOutletsDOCX = async () => {
    if (outletResults.length === 0) return;

    for (let i = 0; i < outletResults.length; i++) {
      const result = outletResults[i];
      const outletName = result.outlet?.name || `جهة-${i + 1}`;

      // تبديل الـ tab مؤقتاً لبناء الملف
      const prevTab = activeResultTab;
      setActiveResultTab(i);

      // بناء المخرجات لهذه الجهة
      const outputs: GeneratedOutput[] = (result.outputs || []).map((o: any) => ({
        type: o.type as OutputType,
        content: o.content,
        metadata: { type_name_ar: o.type_name_ar },
      }));

      // بناء الملف
      const doc = buildDOCXForResult(result, outputs, outletName);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `حزمة-تحريرية-${outletName}-${Date.now()}.docx`);

      // انتظار قصير بين الملفات لتجنب مشاكل المتصفح
      if (i < outletResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setActiveResultTab(prevTab);
    }
  };

  // بناء ملف DOCX لنتيجة جهة واحدة
  function buildDOCXForResult(result: any, outputs: GeneratedOutput[], outletName: string): Document {
    const outputLabels: Record<string, string> = {
      executive_summary: 'ملخص تنفيذي', detailed_report: 'تقرير صحفي', news_article: 'خبر صحفي',
      video_clips: 'مقاطع مقترحة للنشر', social_media: 'منشورات سوشيال ميديا', policy_alerts: 'تنبيهات سياسة التحرير',
      comprehensive_report: 'تقرير صحفي شامل', short_news: 'خبر قصير',
      full_transcript: 'التفريغ الكامل المنقح', social_posts: 'بوستات السوشال ميديا',
    };

    const rtlProps = { alignment: AlignmentType.RIGHT, bidirectional: true };
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({ children: [new TextRun({ text: 'الحزمة التحريرية — التفريغ الذكي', bold: true, size: 40, rightToLeft: true })], ...rtlProps, spacing: { after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: `الجهة: ${outletName}`, bold: true, size: 26, rightToLeft: true, color: '3B82F6' })], ...rtlProps, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }), size: 22, rightToLeft: true, color: '6B7280' })], ...rtlProps, spacing: { after: 300 } })
    );

    if (result.quality_assessment) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'تقييم جودة التفريغ', bold: true, size: 30, rightToLeft: true })], ...rtlProps, spacing: { before: 300, after: 200 }, border: { bottom: { color: '10B981', size: 6, space: 4, style: 'single' } } }));
      addContentLines(children, result.quality_assessment, rtlProps);
    }
    if (result.top_ideas) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'أبرز الأفكار', bold: true, size: 30, rightToLeft: true })], ...rtlProps, spacing: { before: 300, after: 200 }, border: { bottom: { color: '8B5CF6', size: 6, space: 4, style: 'single' } } }));
      addContentLines(children, result.top_ideas, rtlProps);
    }
    if (result.top_quotes) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'أفضل الاقتباسات', bold: true, size: 30, rightToLeft: true })], ...rtlProps, spacing: { before: 300, after: 200 }, border: { bottom: { color: 'F59E0B', size: 6, space: 4, style: 'single' } } }));
      addContentLines(children, result.top_quotes, rtlProps);
    }

    outputs.forEach((output) => {
      const label = output.metadata?.type_name_ar || outputLabels[output.type] || output.type;
      children.push(new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 30, rightToLeft: true })], ...rtlProps, spacing: { before: 400, after: 200 }, border: { bottom: { color: '3B82F6', size: 6, space: 4, style: 'single' } } }));
      addContentLines(children, output.content, rtlProps);
    });

    if (result.editorial_alerts) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'تنبيهات تحريرية', bold: true, size: 30, rightToLeft: true, color: 'EF4444' })], ...rtlProps, spacing: { before: 400, after: 200 }, border: { bottom: { color: 'EF4444', size: 6, space: 4, style: 'single' } } }));
      addContentLines(children, result.editorial_alerts, rtlProps);
    }

    return new Document({
      sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }],
    });
  }

  // الترتيب المطلوب لعرض المخرجات حسب سياسة التحرير
  const REQUIRED_OUTPUT_ORDER: OutputType[] = [
    'executive_summary',
    'detailed_report',
    'news_article',
    'video_clips',
    'social_media',
    'policy_alerts',
  ];

  // ترتيب المخرجات المولدة حسب الترتيب المطلوب
  const orderedGeneratedOutputs = [...generatedOutputs].sort((a, b) => {
    const indexA = REQUIRED_OUTPUT_ORDER.indexOf(a.type as OutputType);
    const indexB = REQUIRED_OUTPUT_ORDER.indexOf(b.type as OutputType);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">التفريغ الذكي</h1>
          <p className="text-slate-400">
            نظام متكامل لتفريغ الصوت والفيديو وتوليد مخرجات تحريرية احترافية
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[
            { step: 'select' as ProcessingStep, label: 'اختر ملفاً' },
            { step: 'transcribing' as ProcessingStep, label: 'جاري التفرغ' },
            { step: 'outputs' as ProcessingStep, label: 'اختر المخرجات' },
            { step: 'complete' as ProcessingStep, label: 'اكتمل' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    processingStep === item.step
                      ? 'bg-blue-600 text-white'
                      : ['select', 'transcribing', 'outputs', 'complete'].indexOf(processingStep) >
                        ['select', 'transcribing', 'outputs', 'complete'].indexOf(item.step)
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {['select', 'transcribing', 'outputs', 'complete'].indexOf(processingStep) >
                  ['select', 'transcribing', 'outputs', 'complete'].indexOf(item.step) ? (
                    <Check size={20} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">{item.label}</p>
              </div>
              {idx < arr.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all ${
                    ['select', 'transcribing', 'outputs', 'complete'].indexOf(processingStep) >
                    ['select', 'transcribing', 'outputs', 'complete'].indexOf(item.step)
                      ? 'bg-green-600'
                      : 'bg-slate-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select File */}
        {processingStep === 'select' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">اختر ملفاً للتفرغ</h2>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="ابحث عن ملف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-white"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'audio', 'video'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFileTypeFilter(filter)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                      fileTypeFilter === filter
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'الكل' : filter === 'audio' ? '🎵 صوت' : '🎬 فيديو'}
                  </button>
                ))}
              </div>

              {/* أزرار رفع ملفات جديدة */}
              <div className="flex gap-3">
                <a
                  href="https://manual-reporter-input-frontend.onrender.com/audio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-400 text-blue-400 hover:text-blue-300 transition-all text-sm font-semibold"
                >
                  <FileAudio size={18} />
                  رفع ملف صوتي
                </a>
                <a
                  href="https://manual-reporter-input-frontend.onrender.com/video"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-400 text-sky-400 hover:text-sky-300 transition-all text-sm font-semibold"
                >
                  <FileVideo size={18} />
                  رفع ملف فيديو
                </a>
              </div>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingFiles ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-500" size={32} />
                </div>
              ) : filteredFiles.length > 0 ? (
                filteredFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-blue-600 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {file.file_type === 'audio' ? (
                        <FileAudio className="text-blue-400 shrink-0 mt-1" size={24} />
                      ) : (
                        <FileVideo className="text-sky-400 shrink-0 mt-1" size={24} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-blue-400 transition">
                          {file.display_name}
                        </p>
                        <p className="text-slate-500 text-sm">{formatFileSize(file.file_size)}</p>
                        <p className="text-slate-600 text-xs mt-1">{formatDate(file.uploaded_at)}</p>
                      </div>
                    </div>

                    {/* Preview Controls */}
                    <div className="flex gap-2">
                      {file.file_type === 'audio' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFileId(previewFileId === file.id ? null : file.id);
                          }}
                          className="flex-1 py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition flex items-center justify-center gap-1"
                        >
                          <Volume2 size={14} /> استمع
                        </button>
                      )}
                      {file.file_type === 'video' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFileId(file.id);
                            setShowVideoModal(true);
                          }}
                          className="flex-1 py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition flex items-center justify-center gap-1"
                        >
                          <Eye size={14} /> شاهد
                        </button>
                      )}
                      <button
                        onClick={() => handleSelectFile(file)}
                        className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition flex items-center justify-center gap-1"
                      >
                        <ChevronRight size={14} /> اختر
                      </button>
                    </div>

                    {/* Audio Preview */}
                    {previewFileId === file.id && file.file_type === 'audio' && (
                      <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 mt-3">
                        <audio
                          ref={previewAudioRef}
                          src={file.s3_url}
                          onEnded={() => setShowPreviewAudio(false)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePreviewPlayback();
                            }}
                            className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shrink-0"
                          >
                            {showPreviewAudio ? <Pause size={12} /> : <Play size={12} className="translate-x-0.5" />}
                          </button>
                          <div className="flex-1 h-0.5 bg-slate-700 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <Music size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا توجد ملفات مرفوعة</p>
                  <p className="text-sm mt-2">استخدم قسم Upload Files لرفع ملفات جديدة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Transcribing */}
        {processingStep === 'transcribing' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-white mb-2">جاري تفرغ الملف</h2>
              <p className="text-slate-400 mb-6">يرجى الانتظار...</p>
              {selectedFile && (
                <div className="bg-slate-900 rounded-lg p-4 w-full max-w-md">
                  <p className="text-slate-300 text-sm">
                    <span className="text-slate-500">الملف:</span> {selectedFile.display_name}
                  </p>
                  <p className="text-slate-300 text-sm mt-2">
                    <span className="text-slate-500">الحجم:</span> {formatFileSize(selectedFile.file_size)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Select Outputs */}
        {processingStep === 'outputs' && transcriptionResult && (
          <div className="space-y-6">
            {/* Transcript Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                التفريغ النهائي
              </h2>
              <div className="bg-slate-900 rounded p-4 max-h-48 overflow-y-auto text-slate-300 text-sm leading-relaxed">
                {transcriptionResult.transcript}
              </div>
            </div>

            {/* Outlet Selection */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">اختر الجهات الإعلامية</h2>
              <p className="text-slate-400 text-sm mb-4">
                اختر جهة واحدة أو أكثر — سيتم توليد حزمة تحريرية منفصلة لكل جهة
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {outletProfiles.map(outlet => {
                  const isSelected = selectedOutlets.some(o => o.id === outlet.id);
                  return (
                    <button
                      key={outlet.id}
                      onClick={() => toggleOutletSelection(outlet)}
                      className={`p-3 rounded-lg border-2 text-right transition-all relative ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <p className={`font-semibold text-sm ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                        {outlet.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedOutlets.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-blue-400 font-semibold mb-2">
                    تم اختيار {selectedOutlets.length} {selectedOutlets.length === 1 ? 'جهة' : 'جهات'}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutlets.map(o => (
                      <span key={o.id} className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm">
                        {o.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Type Selection */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">اختر المخرجات المطلوبة</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {(Object.entries(OUTLET_OUTPUT_TYPES) as [OutletOutputType, any][]).map(([type, config]) => {
                  const isSelected = selectedOutletOutputs.has(type);
                  const needsCount = type === 'social_posts' || type === 'video_clips';
                  return (
                    <div
                      key={type}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected ? 'bg-blue-600/20 border-blue-600' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <button
                        onClick={() => toggleOutletOutputSelection(type)}
                        className="w-full text-right"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white">{config.label}</p>
                            <p className="text-slate-400 text-sm mt-1">{config.description}</p>
                          </div>
                        </div>
                      </button>
                      {needsCount && isSelected && (
                        <div className="mt-3 flex items-center gap-3 pr-8" onClick={e => e.stopPropagation()}>
                          <Hash size={14} className="text-slate-400 shrink-0" />
                          <label className="text-slate-400 text-xs shrink-0">
                            {type === 'social_posts' ? 'عدد المنشورات' : 'عدد المقاطع'}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={type === 'social_posts' ? socialCount : videoClipsCount}
                            onChange={e => {
                              const val = Math.max(1, Math.min(20, Number(e.target.value)));
                              if (type === 'social_posts') setSocialCount(val);
                              else setVideoClipsCount(val);
                            }}
                            className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Info */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">معلومات إضافية (اختياري)</label>
                <textarea
                  value={customInfo}
                  onChange={(e) => setCustomInfo(e.target.value)}
                  placeholder="أرقام، إحصائيات، سياق إضافي..."
                  className="w-full h-20 bg-slate-900 text-white rounded p-3 text-sm border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setProcessingStep('select')}
                  className="flex-1 py-3 px-4 rounded-lg border border-slate-700 text-white hover:bg-slate-700 transition"
                >
                  رجوع
                </button>
                <button
                  onClick={generateByOutlet}
                  disabled={selectedOutlets.length === 0 || selectedOutletOutputs.size === 0 || isProcessing}
                  className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      توليد الحزمة التحريرية ({selectedOutlets.length} {selectedOutlets.length === 1 ? 'جهة' : 'جهات'})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {processingStep === 'complete' && generatedOutputs.length > 0 && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-600/20 border border-green-600 rounded-lg p-6 flex items-center gap-3">
              <CheckCircle2 className="text-green-400" size={24} />
              <div>
                <p className="text-white font-semibold">تم توليد المخرجات بنجاح!</p>
                <p className="text-green-200 text-sm">
                  تم توليد حزم تحريرية لـ {outletResults.length} {outletResults.length === 1 ? 'جهة' : 'جهات'}
                </p>
              </div>
            </div>

            {/* Outlet Tabs (if multiple) */}
            {outletResults.length > 1 && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div className="flex flex-wrap gap-2">
                  {outletResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveResultTab(idx);
                        const outputs: GeneratedOutput[] = (result.outputs || []).map((o: any) => ({
                          type: o.type as OutputType,
                          content: o.content,
                          metadata: { type_name_ar: o.type_name_ar },
                        }));
                        setGeneratedOutputs(outputs);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeResultTab === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {result.outlet?.name || `جهة ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Assessment & Alerts (from active outlet result) */}
            {outletResults[activeResultTab] && (
              <>
                {outletResults[activeResultTab].quality_assessment && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">تقييم الجودة والأفكار الرئيسية</h3>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {outletResults[activeResultTab].quality_assessment}
                      {outletResults[activeResultTab].top_ideas && (
                        <>
                          {'\n\n'}
                          <span className="text-blue-400 font-semibold">أبرز الأفكار:</span>
                          {'\n'}{outletResults[activeResultTab].top_ideas}
                        </>
                      )}
                      {outletResults[activeResultTab].top_quotes && (
                        <>
                          {'\n\n'}
                          <span className="text-blue-400 font-semibold">أفضل الاقتباسات:</span>
                          {'\n'}{outletResults[activeResultTab].top_quotes}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Generated Outputs */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">المخرجات المولدة</h2>
              <div className="space-y-3">
                {orderedGeneratedOutputs.map((output, idx) => {
                  const outputConfig = OUTPUT_TYPES[output.type] || OUTLET_OUTPUT_TYPES[output.type as OutletOutputType];
                  const label = output.metadata?.type_name_ar || outputConfig?.label || output.type;
                  const IconComp = outputConfig?.icon || FileText;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition cursor-pointer group"
                      onClick={() => {
                        setPreviewOutput(output);
                        setShowPreview(true);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <IconComp className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-white font-semibold">{label}</p>
                          <p className="text-slate-400 text-sm">
                            {output.content.length} حرف
                          </p>
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
                    </div>
                  );
                })}
              </div>

              {/* Export Buttons */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportUnifiedFile}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    تحميل TXT
                  </button>
                  <button
                    onClick={exportDOCX}
                    className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4" />
                    تحميل DOCX
                  </button>
                </div>

                {/* Export All Outlets */}
                {outletResults.length > 1 && (
                  <button
                    onClick={exportAllOutletsDOCX}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    تحميل كل الجهات ({outletResults.length} ملفات DOCX)
                  </button>
                )}
              </div>

              {/* New Process Button */}
              <button
                onClick={() => {
                  setProcessingStep('select');
                  setSelectedFile(null);
                  setTranscriptionResult(null);
                  setTranscriptWithTimestamps(null);
                  setGeneratedOutputs([]);
                  setSelectedOutputs(new Set());
                  setSelectedOutlets([]);
                  setOutletResults([]);
                  setActiveResultTab(0);
                  setCustomInfo('');
                }}
                className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                معالجة ملف جديد
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Preview Modal */}
      {showPreview && previewOutput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {previewOutput.metadata?.type_name_ar || OUTPUT_TYPES[previewOutput.type]?.label || OUTLET_OUTPUT_TYPES[previewOutput.type as OutletOutputType]?.label || previewOutput.type}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-sm leading-relaxed [&_p]:text-slate-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_em]:text-slate-300 [&_li]:text-slate-200 [&_span]:text-slate-200 [&_div]:text-slate-200">
              {parseNumberedList(previewOutput.content)}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmFile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              {confirmFile.file_type === 'audio' ? (
                <FileAudio className="text-blue-400 shrink-0" size={28} />
              ) : (
                <FileVideo className="text-sky-400 shrink-0" size={28} />
              )}
              <div>
                <h3 className="text-lg font-bold text-white">تأكيد بدء التفرغ</h3>
                <p className="text-slate-400 text-sm">هل أنت متأكد أنك تريد تفرغ هذا الملف؟</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <p className="text-white font-semibold truncate">{confirmFile.display_name}</p>
              <div className="flex gap-4 mt-2 text-sm text-slate-400">
                <span>{formatFileSize(confirmFile.file_size)}</span>
                <span>{confirmFile.file_type === 'audio' ? '🎵 صوت' : '🎬 فيديو'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFile(null)}
                className="flex-1 py-3 px-4 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition font-semibold"
              >
                لا، إلغاء
              </button>
              <button
                onClick={handleConfirmTranscription}
                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition"
              >
                <Zap size={16} />
                نعم، ابدأ التفرغ
              </button>
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
