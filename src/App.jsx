import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Week from './pages/Week.jsx';
import AiInsight from './pages/AiInsight.jsx';
import Teams from './pages/Teams.jsx';
import Team from './pages/Team.jsx';
import Standings from './pages/Standings.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-navy-950">
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/week/:week" element={<Week />} />
          <Route path="/ai-insight/:week" element={<AiInsight />} />
          <Route path="/ai-insight" element={<Navigate to="/ai-insight/1" replace />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/team/:abbr" element={<Team />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
