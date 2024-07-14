import i18n from "i18next";
import { initReactI18next } from "react-i18next";

//#region NL translations
import nl_common from "./locales/nl/common.json";
import nl_activity from "./locales/nl/activity.json";
import nl_auth from "./locales/nl/auth.json";
import nl_committee from "./locales/nl/committee.json";
import nl_documents from "./locales/nl/documents.json";
import nl_error from "./locales/nl/error.json";
import nl_form from "./locales/nl/form.json";
import nl_functions from "./locales/nl/functions.json";
import nl_menu from "./locales/nl/menu.json";
import nl_messages from "./locales/nl/messages.json";
import nl_navigation from "./locales/nl/navigation.json";
import nl_options from "./locales/nl/options.json";
import nl_protototo from "./locales/nl/protototo.json";
import nl_season from "./locales/nl/season.json";
import nl_settings from "./locales/nl/settings.json";
import nl_team from "./locales/nl/team.json";
import nl_user from "./locales/nl/user.json";
import nl_api from "./locales/nl/api.json";
//#endregion

//#region EN translations
import en_common from "./locales/en/common.json";
import en_activity from "./locales/en/activity.json";
import en_auth from "./locales/en/auth.json";
import en_committee from "./locales/en/committee.json";
import en_documents from "./locales/en/documents.json";
import en_error from "./locales/en/error.json";
import en_form from "./locales/en/form.json";
import en_functions from "./locales/en/functions.json";
import en_menu from "./locales/en/menu.json";
import en_messages from "./locales/en/messages.json";
import en_navigation from "./locales/en/navigation.json";
import en_options from "./locales/en/options.json";
import en_protototo from "./locales/en/protototo.json";
import en_season from "./locales/en/season.json";
import en_settings from "./locales/en/settings.json";
import en_team from "./locales/en/team.json";
import en_user from "./locales/en/user.json";
import en_api from "./locales/en/api.json";
//#endregion

export const i18nDefaultNS = "common";
export const i18nResources = {
  en: {
		activity: en_activity,
		auth: en_auth,
		committee: en_committee,
    common: en_common,
		documents: en_documents,
		error: en_error,
		form: en_form,
		functions: en_functions,
		menu: en_menu,
		messages: en_messages,
		navigation: en_navigation,
		options: en_options,
		protototo: en_protototo,
		season: en_season,
		settings: en_settings,
		team: en_team,
		user: en_user,
		api: en_api,
  },
  nl: {
    activity: nl_activity,
		auth: nl_auth,
		committee: nl_committee,
    common: nl_common,
		documents: nl_documents,
		error: nl_error,
		form: nl_form,
		functions: nl_functions,
		menu: nl_menu,
		messages: nl_messages,
		navigation: nl_navigation,
		options: nl_options,
		protototo: nl_protototo,
		season: nl_season,
		settings: nl_settings,
		team: nl_team,
		user: nl_user,
		api: nl_api,
  },
} as const;

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: "nl",
    defaultNS: i18nDefaultNS,
    resources: i18nResources,
  });

export default i18n;
