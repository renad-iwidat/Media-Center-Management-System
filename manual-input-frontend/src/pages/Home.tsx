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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-2">بوابة الإدخال اليدوي الخاصة بالمراسلين</h1>
          <p className="text-blue-200 text-lg">اختر نوع الإدخال المناسب</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inputTypes.map((type) => {
            return (
              <div
                key={type.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl"
              >
                <button
                  onClick={() => !type.disabled && navigate(type.path)}
                  disabled={type.disabled}
                  className={`w-full ${type.disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                >
                  <div className="p-8">
                    <div className="text-6xl mb-4 text-center filter grayscale-[30%]">{type.icon}</div>
                    <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">{type.title}</h2>
                    <p className="text-center text-gray-600">
                      {type.description}
                    </p>
                    
                    {type.disabled && (
                      <div className="mt-4 text-center">
                        <span className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
                          قريباً
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  {!type.disabled && (
                    <div className="bg-gray-900 p-4 text-center hover:bg-black transition">
                      <span className="text-sm font-semibold text-white">اضغط للبدء</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white py-4 mt-24">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="text-gray-200 text-base font-medium">جميع أنواع الإدخال متاحة الآن: نص، صوت، وفيديو</p>
        </div>
      </div>
    </div>
  );
}
