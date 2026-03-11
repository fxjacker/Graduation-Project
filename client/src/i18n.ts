import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from './locales/ko/common.json';
import koMain from './locales/ko/main.json';
import koMap from './locales/ko/map.json';
import koGuide from './locales/ko/guide.json';
import koCuration from './locales/ko/curation.json';

import enCommon from './locales/en/common.json';
import enMain from './locales/en/main.json';
import enMap from './locales/en/map.json';
import enGuide from './locales/en/guide.json';
import enCuration from './locales/en/curation.json';

const resources = {
  ko: {
    common: koCommon,
    main: koMain,
    map: koMap,
    guide: koGuide,
    curation: koCuration
  },
  en: {
    common: enCommon,
    main: enMain,
    map: enMap,
    guide: enGuide,
    curation: enCuration
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'en',
  ns: ['common', 'main', 'map', 'guide', 'curation'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;