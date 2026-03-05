// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import MainLanding from './pages/MainLanding';
import MarinaMap from './pages/MarinaMap';
import EntryGuide from './pages/EntryGuide';
import Curation from './pages/Curation';
import './i18n'; // 다국어 설정을 앱 전체에 적용합니다.

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* 모든 페이지에서 상단 바(Header)는 항상 보입니다 */}
        <Header />
        
        {/* 주소(URL)에 따라 아래 컴포넌트들이 갈아끼워집니다 */}
        <Routes>
          {/* 메인 랜딩 페이지 (marinas.com 스타일) */}
          <Route path="/" element={<MainLanding />} />
          
          {/* 지도 서비스 페이지 (디자인하신 그 화면) */}
          <Route path="/map" element={<MarinaMap />} />
          
          {/* 사법 리스크 해결을 위한 가이드 페이지 */}
          <Route path="/guide" element={<EntryGuide />} />
          
          {/* 추천 마리나 큐레이션 페이지 */}
          <Route path="/curation" element={<Curation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;