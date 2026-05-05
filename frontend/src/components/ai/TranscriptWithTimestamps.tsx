import React, { useState, useRef } from 'react';
import { Play, Pause, Copy, Download } from 'lucide-react';

interface Segment {
  start: number;
  end: number;
  text: string;
  startFormatted: string;
  endFormatted: string;
}

interface TranscriptWithTimestampsProps {
  transcript: string;
  segments?: Segment[];
  audioUrl?: string;
  onSegmentClick?: (startTime: number) => void;
}

export default function TranscriptWithTimestamps({
  transcript,
  segments = [],
  audioUrl,
  onSegmentClick,
}: TranscriptWithTimestampsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [viewMode, setViewMode] = useState<'full' | 'segments'>('segments');

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSegmentClick = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setIsPlaying(true);
    }
    onSegmentClick?.(startTime);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
  };

  const downloadTranscript = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcript.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const highlightCurrentSegment = (segment: Segment) => {
    return currentTime >= segment.start && currentTime < segment.end;
  };

  return (
    <div className="w-full space-y-4">
      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: audioRef.current
                      ? `${(currentTime / (audioRef.current.duration || 1)) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                <span>
                  {audioRef.current?.duration
                    ? `${Math.floor(audioRef.current.duration / 60)}:${String(Math.floor(audioRef.current.duration % 60)).padStart(2, '0')}`
                    : '0:00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('segments')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'segments'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          عرض مع التايم كود
        </button>
        <button
          onClick={() => setViewMode('full')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'full'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          النص الكامل
        </button>
      </div>

      {/* Content */}
      {viewMode === 'full' ? (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-6 border border-gray-200 min-h-64 max-h-96 overflow-y-auto">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap font-arabic text-right">
              {transcript}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Copy size={16} /> نسخ
            </button>
            <button
              onClick={downloadTranscript}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={16} /> تحميل
            </button>
          </div>
        </div>
      ) : segments.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {segments.map((segment, index) => (
            <div
              key={index}
              onClick={() => handleSegmentClick(segment.start)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                highlightCurrentSegment(segment)
                  ? 'bg-blue-50 border-blue-500 shadow-md'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSegmentClick(segment.start);
                    }}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Play size={14} className="translate-x-0.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {segment.startFormatted}
                    </span>
                    <span className="text-xs text-gray-500">→</span>
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {segment.endFormatted}
                    </span>
                  </div>
                  <p className="text-gray-900 leading-relaxed font-arabic text-right text-sm">
                    {segment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <p className="text-sm">لا توجد بيانات تايم كود متاحة</p>
        </div>
      )}
    </div>
  );
}
