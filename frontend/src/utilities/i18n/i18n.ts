import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from "../translations.json";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    lng: 'en',
    resources,
  });

export default i18n;
