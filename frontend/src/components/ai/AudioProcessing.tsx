import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2, Play, Pause, Download, Music, FileText, Search, Check, FileAudio, FileVideo, Newspaper, X, Eye, Copy, Trash2 } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { api } from '../../services/api';
import { useLocalStorageBatch } from '../../lib/useLocalStorageBatch';
import TranscriptWithTimestamps from './TranscriptWithTimestamps';

type AudioMode = 'STT' | 'TTS';
type FileTypeFilter = 'all' | 'audio' | 'video';
type TTSSource = 'paste' | 'published' | 'bulletin';

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

interface PublishedArticle {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  published_at?: string;
}

interface SavedBulletin {
  id: number;
  title: string;
  type: 'summary' | 'bulletin';
  time_of_day: 'morning' | 'evening';
  original_content: string;
  edited_content: string | null;
  created_at: string;
  media_unit_name?: string;
}

export default function AudioProcessing({ mediaUnitId }: { mediaUnitId: number | null }) {
  // Load from localStorage
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`audioProc_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [activeMode, setActiveMode] = useState<AudioMode>(() => loadFromStorage('activeMode', 'STT'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<number | null>(() => loadFromStorage('selectedFileId', null));
  const [result, setResult] = useState<string | null>(() => loadFromStorage('result', null));
  const [resultSegments, setResultSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState(() => loadFromStorage('voice', 'nova'));
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>(() => loadFromStorage('fileTypeFilter', 'all'));
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [ttsSource, setTtsSource] = useState<TTSSource>(() => loadFromStorage('ttsSource', 'paste'));
  const [pastedText, setPastedText] = useState(() => loadFromStorage('pastedText', ''));
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(() => loadFromStorage('selectedArticleId', null));
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [savedBulletins, setSavedBulletins] = useState<SavedBulletin[]>([]);
  const [selectedBulletinId, setSelectedBulletinId] = useState<number | null>(() => loadFromStorage('selectedBulletinId', null));
  const [loadingBulletins, setLoadingBulletins] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // جلب الملفات المرفوعة عند تحميل المكون - مع حماية من unmount
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchUploadedFiles();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // جلب المقالات المنشورة عند تحويل الوضع إلى TTS - مع حماية من unmount
  useEffect(() => {
    let isMounted = true;
    
    if (activeMode === 'TTS' && ttsSource === 'published' && isMounted) {
      fetchPublishedArticles();
    }

    if (activeMode === 'TTS' && ttsSource === 'bulletin' && isMounted) {
      fetchSavedBulletins();
    }
    
    return () => {
      isMounted = false;
    };
  }, [activeMode, ttsSource, mediaUnitId]);

  // Save to localStorage (batched to prevent infinite loops)
  useLocalStorageBatch([
    { key: 'audioProc_activeMode', value: activeMode },
    { key: 'audioProc_selectedFileId', value: selectedFileId },
    { key: 'audioProc_result', value: result },
    { key: 'audioProc_voice', value: voice },
    { key: 'audioProc_fileTypeFilter', value: fileTypeFilter },
    { key: 'audioProc_ttsSource', value: ttsSource },
    { key: 'audioProc_pastedText', value: pastedText },
    { key: 'audioProc_selectedArticleId', value: selectedArticleId },
    { key: 'audioProc_selectedBulletinId', value: selectedBulletinId },
  ], 200);

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

  const fetchPublishedArticles = async () => {
    try {
      setLoadingArticles(true);
      const res = await api.getPublished(mediaUnitId);
      const articles = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        image_url: item.image_url,
        published_at: item.published_at,
      }));
      setPublishedArticles(articles);
      console.log('Published articles:', articles);
    } catch (error) {
      console.error('Error fetching published articles:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchSavedBulletins = async () => {
    try {
      setLoadingBulletins(true);
      const res = await api.getBulletins(mediaUnitId);
      const bulletins = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        time_of_day: item.time_of_day,
        original_content: item.original_content,
        edited_content: item.edited_content,
        created_at: item.created_at,
        media_unit_name: item.media_unit_name,
      }));
      setSavedBulletins(bulletins);
      console.log('Saved bulletins:', bulletins);
    } catch (error) {
      console.error('Error fetching saved bulletins:', error);
    } finally {
      setLoadingBulletins(false);
    }
  };

  // تطبيق الفلتر والبحث
  const filteredFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = fileTypeFilter === 'all' || file.file_type === fileTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSTT = async () => {
    if (!selectedFileId) return;

    const file = uploadedFiles.find(f => f.id === selectedFileId);
    if (!file) return;

    const mediaTitle = file.display_name || file.original_filename || 'ملف صوتي';

    setIsLoading(true);
    setResult(null);
    try {
      console.log(`🎙️  Starting STT for file: ${mediaTitle}`);
      
      // If it's a video file, use production streaming extraction + transcription
      if (file.file_type === 'video') {
        console.log('🎬 Video detected - using production streaming extraction...');
        
        try {
          // Use the new production API
          const extractRes = await api.extractAndTranscribeProduction(file.s3_url, {
            language: 'ar',
            outputFormat: 'mp3',
            bitrate: '128k',
            enableChunking: true,
            chunkDurationSeconds: 180, // 3 minutes per chunk
            maxConcurrentChunks: 3     // Process 3 chunks in parallel
          });
          
          if (!extractRes.success || !extractRes.data?.transcript) {
            throw new Error(extractRes.error || 'Failed to extract and transcribe');
          }

          console.log(`✅ Production processing completed (${extractRes.data.processingMethod})`);
          console.log(`📊 Audio size: ${extractRes.data.audioSize} bytes`);
          
          setResult(extractRes.data.transcript);
          setResultSegments(extractRes.data.segments || []);
          console.log('✅ Video-to-text completed successfully');
          
        } catch (productionError) {
          console.warn('⚠️ Production streaming failed, trying download-first method...');
          console.warn('Production error:', productionError);
          
          try {
            // Try download-first method
            const downloadFirstRes = await api.extractWithDownloadFirst(file.s3_url, {
              language: 'ar',
              outputFormat: 'mp3',
              bitrate: '128k',
              enableChunking: true,
              chunkDurationSeconds: 180,
              maxConcurrentChunks: 3,
              maxFileSize: 1024 * 1024 * 1024 // 1GB
            });
            
            if (!downloadFirstRes.success || !downloadFirstRes.data?.transcript) {
              throw new Error(downloadFirstRes.error || 'Failed to extract with download-first method');
            }

            console.log(`✅ Download-first processing completed`);
            console.log(`📊 Video size: ${downloadFirstRes.data.videoSize} bytes`);
            console.log(`📊 Audio size: ${downloadFirstRes.data.audioSize} bytes`);
            console.log(`⏱️  Processing time: ${Math.round(downloadFirstRes.data.processingTime / 1000)}s`);
            
            setResult(downloadFirstRes.data.transcript);
            setResultSegments(downloadFirstRes.data.segments || []);
            console.log('✅ Download-first method succeeded');
            
          } catch (downloadFirstError) {
            console.warn('⚠️ Download-first method also failed, falling back to legacy method...');
            console.warn('Download-first error:', downloadFirstError);
            
            // Final fallback to legacy method
            try {
              const extractRes = await api.extractAudioAndTranscribe(file.id, file.s3_url, {
                outputFormat: 'mp3',
                bitrate: '128k',
                language: 'ar',
                enableChunking: true,
                chunkDurationSeconds: 180,
                maxConcurrentChunks: 3
              });
              
              if (!extractRes.success || !extractRes.data?.transcript) {
                throw new Error(extractRes.error || 'Failed to extract and transcribe with legacy method');
              }

              console.log('✅ Legacy method succeeded');
              setResult(extractRes.data.transcript);
              setResultSegments(extractRes.data.segments || []);
              
            } catch (legacyError) {
              console.error('❌ All methods failed (streaming, download-first, legacy)');
              throw legacyError;
            }
          }
        }
      } else {
        // For audio files, transcribe directly
        const res = await api.transcribeAudioFromFile(file.id, file.s3_url, 'ar');
        
        if (res.success && res.data?.transcript) {
          setResult(res.data.transcript);
          setResultSegments(res.data.segments || []);
          console.log('✅ STT completed successfully');
        } else {
          throw new Error(res.error || 'Failed to transcribe audio');
        }
      }
    } catch (error) {
      console.error('Error in STT:', error);
      setResult('حدث خطأ أثناء التفريغ الصوتي: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setResultSegments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async () => {
    let textToConvert = '';

    if (ttsSource === 'paste') {
      textToConvert = pastedText.trim();
      if (!textToConvert) {
        alert('يرجى إدراج نص قبل التحويل');
        return;
      }
    } else if (ttsSource === 'bulletin') {
      const bulletin = savedBulletins.find(b => b.id === selectedBulletinId);
      if (!bulletin) {
        alert('يرجى اختيار موجز/نشرة قبل التحويل');
        return;
      }
      textToConvert = bulletin.edited_content || bulletin.original_content;
    } else {
      const article = publishedArticles.find(a => a.id === selectedArticleId);
      if (!article) {
        alert('يرجى اختيار مقالة قبل التحويل');
        return;
      }
      textToConvert = article.content;
    }

    setIsLoading(true);
    setAudioUrl(null);
    try {
      console.log('🔄 Generating TTS...');
      const res = await api.generateTTS(textToConvert, voice);
      
      if (res.success && res.audioBase64) {
        // Convert base64 to blob and create URL
        const binaryString = atob(res.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('✅ Audio generated successfully');

        // Mark bulletin as audio generated
        if (ttsSource === 'bulletin' && selectedBulletinId) {
          try {
            await api.markBulletinAudioGenerated(selectedBulletinId);
          } catch (e) {
            console.warn('Could not mark bulletin audio status:', e);
          }
        }
      } else {
        throw new Error(res.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error in TTS:', error);
      alert('حدث خطأ أثناء تحويل النص إلى صوت: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const togglePreviewPlayback = () => {
    if (previewAudioRef.current) {
      if (showPreview) previewAudioRef.current.pause();
      else previewAudioRef.current.play();
      setShowPreview(!showPreview);
    }
  };

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

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId);
  const previewFile = uploadedFiles.find(f => f.id === previewFileId);

  return (
    <div className="space-y-4 text-right">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-gray-900">المختبر الصوتي</h2>
        <p className="text-gray-600 text-xs">حوّل الملفات الصوتية إلى نصوص مكتوبة.</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        <button
          onClick={() => { setActiveMode('STT'); setResult(null); setResultSegments([]); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'STT' ? 'bg-[#FF9F43] text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
        >
          <Mic size={14} /> صوت لنص (STT)
        </button>
        <button
          onClick={() => { setActiveMode('TTS'); setAudioUrl(null); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'TTS' ? 'bg-[#FF9F43] text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
        >
          <Volume2 size={14} /> نص لصوت (TTS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Selector */}
        <div className="lg:col-span-5">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 space-y-3 h-[460px] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold border-b border-gray-200 pb-2 flex items-center gap-2 flex-1 text-gray-900">
                {activeMode === 'STT' ? <Music size={14} /> : <Newspaper size={14} />}
                <span>{activeMode === 'STT' ? 'اختر ملفاً صوتياً' : 'اختر خبراً للتسجيل'}</span>
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-2 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#FF9F43]/20 text-gray-900"
              />
            </div>

            {/* Filter Buttons */}
            {activeMode === 'STT' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${fileTypeFilter === 'all' ? 'bg-[#FF9F43] border-[#FF9F43] text-white' : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFileTypeFilter('audio')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'audio' ? 'bg-[#FF9F43] border-[#FF9F43] text-white' : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900'}`}
                >
                  <FileAudio size={12} /> صوت
                </button>
                <button
                  onClick={() => setFileTypeFilter('video')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'video' ? 'bg-[#FF9F43] border-[#FF9F43] text-white' : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900'}`}
                >
                  <FileVideo size={12} /> فيديو
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
              {activeMode === 'STT' ? (
                // عرض الملفات الصوتية والفيديو
                <div className="space-y-2">
                  {loadingFiles ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-gray-400" size={20} />
                    </div>
                  ) : filteredFiles.length > 0 ? (
                    <div className="space-y-1.5">
                      {filteredFiles.map(file => (
                        <div
                          key={file.id}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 text-xs ${selectedFileId === file.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                        >
                          <div
                            onClick={() => setSelectedFileId(file.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {file.file_type === 'audio' ? (
                                <FileAudio className="text-blue-400 shrink-0" size={14} />
                              ) : (
                                <FileVideo className="text-sky-400 shrink-0" size={14} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{file.display_name}</p>
                                <p className="text-gray-500 text-xs">{formatFileSize(file.file_size)}</p>
                              </div>
                            </div>
                            {selectedFileId === file.id && <Check size={13} className="text-[#2563eb] shrink-0" />}
                          </div>

                          {/* File Info and Preview */}
                          <div className="flex items-center justify-between px-1">
                            <span className="text-gray-500 text-xs">{formatDate(file.uploaded_at)}</span>
                            <div className="flex gap-1">
                              {file.file_type === 'audio' && (
                                <button
                                  onClick={() => setPreviewFileId(previewFileId === file.id ? null : file.id)}
                                  className="p-1 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                                  title="استمع للملف"
                                >
                                  <Volume2 size={12} />
                                </button>
                              )}
                              {file.file_type === 'video' && (
                                <button
                                  onClick={() => {
                                    setPreviewFileId(file.id);
                                    setShowVideoModal(true);
                                  }}
                                  className="p-1 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                                  title="شاهد الفيديو"
                                >
                                  <Eye size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Preview Player */}
                          {previewFileId === file.id && file.file_type === 'audio' && (
                            <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                              <audio ref={previewAudioRef} src={file.s3_url} onEnded={() => setShowPreview(false)} className="hidden" />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={togglePreviewPlayback}
                                  className="w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shrink-0"
                                >
                                  {showPreview ? <Pause size={12} /> : <Play size={12} className="translate-x-0.5" />}
                                </button>
                                <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className={`h-full bg-[#2563eb] ${showPreview ? 'w-full' : 'w-0'}`} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      لا توجد ملفات مرفوعة
                    </div>
                  )}
                </div>
              ) : (
                // TTS mode - اختيار المصدر والمحتوى
                <div className="space-y-3">
                  {/* Source Selection */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setTtsSource('paste'); setPastedText(''); setSelectedArticleId(null); setSelectedBulletinId(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${ttsSource === 'paste' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      <Copy size={12} /> نص مباشر
                    </button>
                    <button
                      onClick={() => { setTtsSource('bulletin'); setPastedText(''); setSelectedArticleId(null); setSelectedBulletinId(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${ttsSource === 'bulletin' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      <FileText size={12} /> موجز/نشرة
                    </button>
                    <button
                      onClick={() => { setTtsSource('published'); setPastedText(''); setSelectedArticleId(null); setSelectedBulletinId(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${ttsSource === 'published' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      <Newspaper size={12} /> أخبار منشورة
                    </button>
                  </div>

                  {/* Content Input */}
                  {ttsSource === 'paste' ? (
                    <div className="space-y-2">
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="الصق النص هنا أو اكتبه مباشرة..."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none text-right"
                      />
                      <div className="text-xs text-gray-500">
                        {pastedText.length} حرف
                      </div>
                    </div>
                  ) : ttsSource === 'bulletin' ? (
                    <div className="space-y-2">
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 max-h-40">
                        {loadingBulletins ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="animate-spin text-gray-400" size={16} />
                          </div>
                        ) : savedBulletins.length > 0 ? (
                          savedBulletins.map(bulletin => (
                            <div
                              key={bulletin.id}
                              onClick={() => setSelectedBulletinId(bulletin.id)}
                              className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${selectedBulletinId === bulletin.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{bulletin.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${bulletin.type === 'bulletin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {bulletin.type === 'bulletin' ? 'نشرة' : 'موجز'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {bulletin.time_of_day === 'morning' ? '☀️ صباحي' : '🌙 مسائي'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(bulletin.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-gray-500 text-xs line-clamp-1 mt-1">
                                    {(bulletin.edited_content || bulletin.original_content).substring(0, 80)}...
                                  </p>
                                </div>
                                {selectedBulletinId === bulletin.id && <Check size={12} className="text-[#2563eb] shrink-0 mt-0.5" />}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-xs">
                            لا توجد موجزات/نشرات محفوظة
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                          type="text"
                          placeholder="ابحث عن مقالة..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 max-h-32">
                        {loadingArticles ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="animate-spin text-gray-400" size={16} />
                          </div>
                        ) : publishedArticles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                          publishedArticles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map(article => (
                            <div
                              key={article.id}
                              onClick={() => setSelectedArticleId(article.id)}
                              className={`p-2 rounded-lg border cursor-pointer transition-all text-xs ${selectedArticleId === article.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{article.title}</p>
                                  <p className="text-gray-500 text-xs line-clamp-2">{article.content.substring(0, 60)}...</p>
                                </div>
                                {selectedArticleId === article.id && <Check size={12} className="text-[#2563eb] shrink-0 mt-0.5" />}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-xs">
                            لا توجد مقالات منشورة
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              {activeMode === 'TTS' && (
                <div className="flex gap-1.5">
                  {[
                    { id: 'nova', label: 'Nova (أنثى)' },
                    { id: 'shimmer', label: 'Shimmer (أنثى)' },
                    { id: 'onyx', label: 'Onyx (ذكر)' },
                    { id: 'echo', label: 'Echo (ذكر)' },
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${voice === v.id ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                      title={v.label}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={activeMode === 'STT' ? handleSTT : handleTTS}
                disabled={isLoading || (activeMode === 'STT' ? !selectedFileId : (ttsSource === 'paste' ? !pastedText.trim() : ttsSource === 'bulletin' ? !selectedBulletinId : !selectedArticleId))}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <span>{activeMode === 'STT' ? 'بدء التفريغ' : 'تحويل لصوت'}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-4 h-[460px] flex flex-col items-center justify-center text-center bg-gray-50 border border-gray-300 relative overflow-hidden">
            {activeMode === 'STT' ? (
              result ? (
                <div className="w-full h-full flex flex-col text-right">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-blue-600" />
                    <h4 className="text-sm font-bold text-gray-900">التفريغ النهائي</h4>
                    {selectedFile && (
                      <span className="text-xs text-gray-600 mr-auto">
                        {selectedFile.display_name}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <TranscriptWithTimestamps
                      transcript={result}
                      segments={resultSegments}
                      onSegmentClick={(startTime) => {
                        console.log('Segment clicked at:', startTime);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="opacity-30 flex flex-col items-center gap-3 text-gray-600">
                  <Mic size={48} />
                  <p className="text-sm">اختر ملفاً للتفريغ</p>
                </div>
              )
            ) : (
              audioUrl ? (
                <div className="space-y-5 w-full max-w-xs">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" />
                      <Volume2 size={28} className="relative z-10" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">النشرة الصوتية جاهزة</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-300">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlayback} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                      </button>
                      <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
                        <div className={`h-full bg-blue-600 ${isPlaying ? 'w-full' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                  <a href={audioUrl} download="audio.mp3" className="flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors">
                    <Download size={14} /> تحميل التسجيل
                  </a>
                </div>
              ) : (
                <div className="opacity-30 flex flex-col items-center gap-3 text-gray-600">
                  <Volume2 size={48} />
                  <p className="text-sm">اختر خبراً لتحويله لصوت</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && previewFile && previewFile.file_type === 'video' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2c5f7f] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">{previewFile.display_name}</h3>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setPreviewFileId(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden">
              <video
                ref={videoRef}
                src={previewFile.s3_url}
                controls
                className="w-full h-full max-w-full max-h-full rounded-lg"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-xs text-gray-400 space-y-1">
              <p>الحجم: {formatFileSize(previewFile.file_size)}</p>
              <p>تاريخ الرفع: {formatDate(previewFile.uploaded_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
