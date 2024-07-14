import { i18nDefaultNS, i18nResources  } from "../utilities/i18n/i18n.ts";

declare module 'react-i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof i18nDefaultNS;
		resources: (typeof i18nResources)['en'];
	}
}
