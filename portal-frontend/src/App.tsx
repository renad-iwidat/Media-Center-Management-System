import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Desks from './pages/Desks';
import Users from './pages/Users';
import Programs from './pages/Programs';
import Guests from './pages/Guests';
import Roles from './pages/Roles';
import ProgramRoles from './pages/ProgramRoles';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/desks" element={<Desks />} />
          <Route path="/users" element={<Users />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/program-roles" element={<ProgramRoles />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
