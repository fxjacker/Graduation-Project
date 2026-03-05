// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    ko: {
      translation: {
        nav_map: "글로벌 지도",
        nav_guide: "입항 가이드",
        nav_curation: "추천 마리나",
        search_placeholder: "마리나 검색...",
        main_welcome: "어디로 가고 싶으세요?",
        header_title: "마리나 항해 정보"
      }
    },
    en: {
      translation: {
        nav_map: "Global Map",
        nav_guide: "Entry Guide",
        nav_curation: "Curation",
        search_placeholder: "Search marinas...",
        main_welcome: "Where do you want to go?",
        header_title: "Marina Navigation"
      }
    }
  },
  lng: "ko", // 기본 언어
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;