import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const inputTypes = [
    {
      id: 'text',
      title: 'إدخال نص',
      description: 'أدخل خبراً نصياً',
      icon: '📝',
      path: '/text',
      disabled: false
    },
    {
      id: 'audio',
      title: 'إدخال صوت',
      description: 'سجل تقريراً صوتياً',
      icon: '🎤',
      path: '/audio',
      disabled: false
    },
    {
      id: 'video',
      title: 'إدخال فيديو',
      description: 'ارفع مقطع فيديو',
      icon: '🎥',
      path: '/video',
      disabled: false
    }
  ];

  return (
    <div className="min-h-screen gradient-page" dir="rtl">
      {/* Header */}
      <div className="gradient-header text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-2">بوابة الإدخال اليدوي الخاصة بالمراسلين</h1>
          <p className="text-brand-orange-pale text-lg">اختر نوع الإدخال المناسب</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        {/* الصف العلوي: البطاقة الوسطى (إدخال صوت) */}
        <div className="flex justify-center mb-12">
          {inputTypes.filter(t => t.id === 'audio').map((type) => (
            <div
              key={type.id}
              className="card-top card-bg w-96 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2"
            >
              <button
                onClick={() => !type.disabled && navigate(type.path)}
                disabled={type.disabled}
                className={`w-full ${type.disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <div className="p-10">
                  <div className="text-7xl mb-5 text-center"><span className="card-icon">{type.icon}</span></div>
                  <h2 className="text-2xl font-bold text-center mb-3 text-white">{type.title}</h2>
                  <p className="text-center text-gray-800 font-semibold text-base">{type.description}</p>
                </div>
                {!type.disabled && (
                  <div className="bg-brand-orange hover:bg-brand-orange-light p-4 text-center transition-colors duration-200">
                    <span className="text-base font-bold text-white">اضغط للبدء</span>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* الصف السفلي: نص وفيديو */}
        <div className="flex justify-center gap-28">
          {inputTypes.filter(t => t.id !== 'audio').map((type, i) => (
            <div
              key={type.id}
              className={`${i === 0 ? 'card-right' : 'card-left'} card-bg w-96 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2`}
            >
              <button
                onClick={() => !type.disabled && navigate(type.path)}
                disabled={type.disabled}
                className={`w-full ${type.disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <div className="p-10">
                  <div className="text-7xl mb-5 text-center"><span className="card-icon" style={{ animationDelay: `${i * 0.4}s` }}>{type.icon}</span></div>
                  <h2 className="text-2xl font-bold text-center mb-3 text-white">{type.title}</h2>
                  <p className="text-center text-gray-800 font-semibold text-base">{type.description}</p>
                  {type.disabled && (
                    <div className="mt-4 text-center">
                      <span className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
                        قريباً
                      </span>
                    </div>
                  )}
                </div>
                {!type.disabled && (
                  <div className="bg-brand-orange hover:bg-brand-orange-light p-4 text-center transition-colors duration-200">
                    <span className="text-base font-bold text-white">اضغط للبدء</span>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
