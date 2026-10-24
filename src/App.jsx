import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Week from './pages/Week.jsx';
import AiInsight from './pages/AiInsight.jsx';
import Teams from './pages/Teams.jsx';
import Team from './pages/Team.jsx';
import Standings from './pages/Standings.jsx';
import About from './pages/About.jsx';

function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        const header = document.querySelector('header');
        const offset = header ? header.offsetHeight + 12 : 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, left: 0, behavior: 'auto' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollRestoration />
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
    </>
  );
}
