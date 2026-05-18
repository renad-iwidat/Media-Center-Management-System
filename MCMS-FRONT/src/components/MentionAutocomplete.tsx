import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../services/api';

interface User {
  id: number;
  name: string;
  email?: string;
}

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MentionAutocomplete({ value, onChange }: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // جلب المستخدمين عند تحميل المكون
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/portal/users`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json();
        console.log('Users fetched:', data);
        
        if (data && data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // البحث عن المنشنات
  useEffect(() => {
    if (!textareaRef.current) {
      setShowSuggestions(false);
      return;
    }

    const cursorPosition = textareaRef.current.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    
    // إذا كان هناك مسافة بعد @، لا نعرض الاقتراحات
    if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
      setShowSuggestions(false);
      return;
    }

    // فلترة المستخدمين بناءً على النص
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(textAfterAt.toLowerCase())
    );

    if (filtered.length > 0) {
      setSuggestions(filtered.slice(0, 5)); // عرض أول 5 نتائج فقط
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, users]);

  // معالجة اختيار المستخدم
  const handleSelectUser = (user: User) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;

    const beforeAt = value.substring(0, lastAtIndex);
    // استبدال الكلمة بعد @ بالاسم الكامل + مسافة
    const newValue = beforeAt + '@' + user.name + ' ' + textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // إعادة التركيز على الـ textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + 1 + user.name.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // معالجة لوحة المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelectUser(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="أضف تعليقاً... (استخدم @ لمنشن المستخدمين - اختياري)"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
        rows={3}
      />

      {/* قائمة الاقتراحات */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute right-0 left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          style={{ top: '100%' }}
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs text-gray-600 font-semibold">اختر مستخدماً للمنشن:</span>
          </div>
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-right px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.name.substring(0, 1)}
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold text-gray-900">@{user.name}</div>
                  {user.email && (
                    <div className="text-xs text-gray-500">{user.email}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
