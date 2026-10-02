import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IndexPage } from './pages/IndexPage';
import { LevelsPage } from './pages/LevelsPage';
import { PlayPage } from './pages/PlayPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/levels/:id" element={<PlayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
