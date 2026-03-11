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
      {/* 반응형 핵심: 
        1. h-screen: 화면 높이를 브라우저에 꽉 맞춥니다.
        2. flex flex-col: 헤더(상단)와 메인(하단)을 수직으로 나눕니다.
        3. overflow-hidden: 브라우저 자체의 이중 스크롤을 막아 앱처럼 보이게 합니다.
      */}
      <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
        
        {/* 모든 페이지에서 상단 바(Header)는 항상 보입니다 */}
        <Header />
        
        {/* 메인 영역 (Routes): 
          flex-1을 주어 헤더를 제외한 나머지 공간을 '무조건' 다 차지하게 합니다.
          w-full로 가로 하얀 공백을 제거합니다.
        */}
        <main className="flex-1 relative w-full overflow-hidden">
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
        </main>
      </div>
    </Router>
  );
}

export default App;