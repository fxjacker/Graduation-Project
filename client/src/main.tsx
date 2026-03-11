import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 디자인 엔진 연결
import App from './App.tsx'
import './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)