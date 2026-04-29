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
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center shadow-md shadow-rose-200 mx-auto mb-6">
              <AlertTriangle className="text-rose-600 w-8 h-8" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-3">حدث خطأ في التطبيق</h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              عذراً، حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة للمتابعة.
            </p>
            
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تحميل
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-600 text-xs cursor-pointer hover:text-gray-700">
                  تفاصيل الخطأ (للمطورين)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-rose-700 overflow-auto max-h-32 border border-gray-200">
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