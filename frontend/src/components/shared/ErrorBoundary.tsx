import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 [ERROR-BOUNDARY] خطأ في التطبيق:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [ERROR-BOUNDARY] تفاصيل الخطأ:', error, errorInfo);
  }

  handleReload = () => {
    // مسح localStorage ثم إعادة تحميل
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0b1224] to-[#020617] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20 mx-auto mb-6">
              <AlertTriangle className="text-red-400 w-8 h-8" />
            </div>
            
            <h1 className="text-xl font-bold text-white mb-3">حدث خطأ في التطبيق</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              عذراً، حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة للمتابعة.
            </p>
            
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تحميل
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                  تفاصيل الخطأ (للمطورين)
                </summary>
                <pre className="mt-2 p-3 bg-black/20 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}