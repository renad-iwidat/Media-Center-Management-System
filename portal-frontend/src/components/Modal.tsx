import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitText?: string;
  isLoading?: boolean;
}

export default function Modal({ isOpen, title, children, onClose, onSubmit, submitText = 'حفظ', isLoading = false }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rtl" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <button onClick={onClose} disabled={isLoading} className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50">×</button>
          <h2 className="text-xl font-bold text-right">{title}</h2>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="flex gap-3 p-6 border-t justify-start">
          {onSubmit && (
            <button onClick={onSubmit} disabled={isLoading} className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50">
              {submitText}
            </button>
          )}
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-50 disabled:opacity-50">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
