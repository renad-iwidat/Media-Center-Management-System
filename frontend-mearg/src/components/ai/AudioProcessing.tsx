import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2, Play, Pause, Download, Music, FileText, Search, Check, FileAudio, FileVideo, Newspaper, X, Eye, Copy, Trash2 } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { api } from '../../services/api';

type AudioMode = 'STT' | 'TTS';
type FileTypeFilter = 'all' | 'audio' | 'video';
type TTSSource = 'paste' | 'published';

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

export default function AudioProcessing({ mediaUnitId }: { mediaUnitId: number | null }) {
  const [activeMode, setActiveMode] = useState<AudioMode>('STT');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState('nova');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [ttsSource, setTtsSource] = useState<TTSSource>('paste');
  const [pastedText, setPastedText] = useState('');
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // جلب الملفات المرفوعة عند تحميل المكون
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  // جلب المقالات المنشورة عند تحويل الوضع إلى TTS
  useEffect(() => {
    if (activeMode === 'TTS' && ttsSource === 'published') {
      fetchPublishedArticles();
    }
  }, [activeMode, ttsSource, mediaUnitId]);

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
      
      // If it's a video file, extract audio first
      if (file.file_type === 'video') {
        console.log('🎬 Video detected - extracting audio first...');
        const extractRes = await api.extractAudioFromS3(file.id, file.s3_url, 'mp3', '128k');
        
        if (!extractRes.success || !extractRes.data?.audioBase64) {
          throw new Error(extractRes.error || 'Failed to extract audio from video');
        }

        console.log('✅ Audio extracted successfully');
        
        // Convert base64 to blob and create a temporary URL
        const binaryString = atob(extractRes.data.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Now transcribe the extracted audio
        console.log('🎙️  Transcribing extracted audio...');
        const transcribeRes = await api.transcribeAudioFromUrl(audioUrl, 'ar');
        
        if (transcribeRes.success && transcribeRes.data?.transcript) {
          setResult(transcribeRes.data.transcript);
          console.log('✅ STT completed successfully');
        } else {
          throw new Error(transcribeRes.error || 'Failed to transcribe audio');
        }
      } else {
        // For audio files, transcribe directly
        const res = await api.transcribeAudioFromFile(file.id, file.s3_url, 'ar');
        
        if (res.success && res.data?.transcript) {
          setResult(res.data.transcript);
          console.log('✅ STT completed successfully');
        } else {
          throw new Error(res.error || 'Failed to transcribe audio');
        }
      }
    } catch (error) {
      console.error('Error in STT:', error);
      setResult('حدث خطأ أثناء التفريغ الصوتي: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        <h2 className="text-xl font-bold">المختبر الصوتي</h2>
        <p className="text-gray-400 text-xs">حوّل الملفات الصوتية إلى نصوص مكتوبة.</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        <button
          onClick={() => { setActiveMode('STT'); setResult(null); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'STT' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Mic size={14} /> صوت لنص (STT)
        </button>
        <button
          onClick={() => { setActiveMode('TTS'); setAudioUrl(null); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'TTS' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Volume2 size={14} /> نص لصوت (TTS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Selector */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-4 space-y-3 h-[460px] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold border-b border-white/5 pb-2 flex items-center gap-2 flex-1">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>

            {/* Filter Buttons */}
            {activeMode === 'STT' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${fileTypeFilter === 'all' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFileTypeFilter('audio')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'audio' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                >
                  <FileAudio size={12} /> صوت
                </button>
                <button
                  onClick={() => setFileTypeFilter('video')}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${fileTypeFilter === 'video' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
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
                                <FileVideo className="text-purple-400 shrink-0" size={14} />
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
                      onClick={() => { setTtsSource('paste'); setPastedText(''); setSelectedArticleId(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${ttsSource === 'paste' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      <Copy size={12} /> نص مباشر
                    </button>
                    <button
                      onClick={() => { setTtsSource('published'); setPastedText(''); setSelectedArticleId(null); }}
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
                disabled={isLoading || (activeMode === 'STT' ? !selectedFileId : (ttsSource === 'paste' ? !pastedText.trim() : !selectedArticleId))}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <span>{activeMode === 'STT' ? 'بدء التفريغ' : 'تحويل لصوت'}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-4 h-[460px] flex flex-col items-center justify-center text-center bg-[#0b1224] border-dashed border-white/10 relative overflow-hidden">
            {activeMode === 'STT' ? (
              result ? (
                <div className="w-full h-full flex flex-col text-right">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-[#2563eb]" />
                    <h4 className="text-sm font-bold">التفريغ النهائي</h4>
                    {selectedFile && (
                      <span className="text-xs text-gray-500 mr-auto">
                        {selectedFile.display_name}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 bg-white/[0.02] rounded-xl p-4 border border-white/5 overflow-y-auto custom-scrollbar font-arabic leading-loose text-gray-200 text-sm">
                    {result}
                  </div>
                </div>
              ) : (
                <div className="opacity-10 flex flex-col items-center gap-3">
                  <Mic size={48} />
                  <p className="text-sm">اختر ملفاً للتفريغ</p>
                </div>
              )
            ) : (
              audioUrl ? (
                <div className="space-y-5 w-full max-w-xs">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-[#2563eb]/10 rounded-full flex items-center justify-center text-[#2563eb] relative">
                      <div className="absolute inset-0 rounded-full border-2 border-[#2563eb]/20 animate-ping" />
                      <Volume2 size={28} className="relative z-10" />
                    </div>
                    <p className="text-sm font-bold">النشرة الصوتية جاهزة</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlayback} className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                      </button>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-[#2563eb] ${isPlaying ? 'w-full' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                  <a href={audioUrl} download="audio.mp3" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                    <Download size={14} /> تحميل التسجيل
                  </a>
                </div>
              ) : (
                <div className="opacity-10 flex flex-col items-center gap-3">
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
          <div className="bg-[#0b1224] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] flex flex-col">
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
