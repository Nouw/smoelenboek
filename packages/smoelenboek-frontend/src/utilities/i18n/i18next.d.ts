import { i18nDefaultNS, i18nResources  } from "./i18n";

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof i18nDefaultNS;
		resources: (typeof i18nResources)['en'];
	}
}
