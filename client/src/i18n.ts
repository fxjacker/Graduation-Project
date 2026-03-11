import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. 위에서 만든 JSON 파일들을 불러옵니다.
import ko from './locales/ko.json';
import en from './locales/en.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en }
};

i18n
  .use(initReactI18next) // react-i18next 라이브러리와 연결
  .init({
    resources,
    lng: "ko", // 초기 실행 언어 (한국어)
    fallbackLng: "en", // 해당 언어에 번역이 없을 때 보여줄 기본 언어
    interpolation: {
      escapeValue: false // 리액트 자체 보안 기능이 있어 false로 설정
    }
  });

export default i18n;