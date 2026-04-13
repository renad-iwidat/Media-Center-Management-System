import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 rtl" dir="rtl">
      {/* Header */}
      <div className="bg-blue-950 text-white p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-center">بوابة إدارة مركز الإعلام</h1>
        <p className="text-blue-200 mt-2 text-center">نظام متكامل لإدارة عمليات مركز الإعلام</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* الموظفون */}
          <button
            onClick={() => navigate('/users')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">إدارة الموظفين</h2>
            <p className="text-gray-600 mb-4">إضافة وتعديل وحذف الموظفين مع جداول العمل والبيانات الشخصية</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>

          {/* الأقسام والفرق */}
          <button
            onClick={() => navigate('/desks')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">الأقسام والفرق</h2>
            <p className="text-gray-600 mb-4">تنظيم الأقسام والفرق وإدارة الهيكل التنظيمي للمركز</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>

          {/* البرامج والحلقات */}
          <button
            onClick={() => navigate('/programs')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">البرامج والحلقات</h2>
            <p className="text-gray-600 mb-4">إدارة البرامج والحلقات وجداول البث والمعلومات التفصيلية</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>

          {/* الضيوف */}
          <button
            onClick={() => navigate('/guests')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">إدارة الضيوف</h2>
            <p className="text-gray-600 mb-4">إضافة وتعديل بيانات الضيوف والاتصال بهم ومعلوماتهم الشخصية</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>

          {/* الأدوار */}
          <button
            onClick={() => navigate('/roles')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">إدارة الأدوار</h2>
            <p className="text-gray-600 mb-4">إضافة وتعديل وحذف أدوار الموظفين والصلاحيات المختلفة</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>

          {/* أدوار البرامج */}
          <button
            onClick={() => navigate('/program-roles')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">أدوار البرامج</h2>
            <p className="text-gray-600 mb-4">ربط الموظفين بالبرامج وتحديد أدوارهم (مقدم، منتج، مساعد)</p>
            <div className="text-blue-900 font-semibold">الدخول</div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-950 text-white text-center p-4 mt-12">
        <p>نظام إدارة مركز الإعلام - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
