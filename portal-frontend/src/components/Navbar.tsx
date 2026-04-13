import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            بوابة إدارة مركز الإعلام
          </Link>
          <div className="flex gap-6">
            <Link to="/desks" className="hover:text-blue-200 transition">الأقسام</Link>
            <Link to="/users" className="hover:text-blue-200 transition">الموظفون</Link>
            <Link to="/programs" className="hover:text-blue-200 transition">البرامج</Link>
            <Link to="/episodes" className="hover:text-blue-200 transition">الحلقات</Link>
            <Link to="/guests" className="hover:text-blue-200 transition">الضيوف</Link>
            <Link to="/policies" className="hover:text-blue-200 transition">السياسات</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
