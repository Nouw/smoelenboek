'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const locales = ['nl', 'en'] as const;
export type Locale = (typeof locales)[number];

const defaultLocale: Locale = 'nl';
const localeStorageKey = 'smoelenboek-locale';

const dictionaries = {
  nl: {
    common: {
      account: 'Account',
      archived: 'Archief',
      cancel: 'Annuleren',
      loading: 'Laden',
      navigation: 'Navigatie',
      search: 'Zoeken',
      smoelenboek: 'Smoelenboek',
      user: 'Gebruiker',
    },
    auth: {
      checkingSession: 'Je sessie wordt gecontroleerd.',
      email: 'E-mail',
      login: 'Inloggen',
      loginFailed: 'Inloggen mislukt.',
      loginSubtitle: 'Log in met je bestaande account om verder te gaan.',
      loggingIn: 'Bezig met inloggen...',
      password: 'Wachtwoord',
    },
    home: {
      title: 'Teams',
      description: 'Overzicht van leden, teams, commissies en documenten.',
      teamsDescription: 'Teamlidmaatschappen, rollen en contactgegevens.',
      committeesDescription: 'Werkgroepen en commissieverantwoordelijkheden.',
      documentsDescription: 'Gedeelde documenten en interne referenties.',
      protototoDescription: 'Overzicht van Protototo-deelname.',
    },
    language: {
      label: 'Taal',
      dutch: 'Nederlands',
      english: 'Engels',
      switchToDutch: 'Schakel naar Nederlands',
      switchToEnglish: 'Schakel naar Engels',
    },
    nav: {
      teams: 'Teams',
      men: 'Heren',
      women: 'Dames',
      committees: 'Commissies',
      documents: 'Documenten',
      protototo: 'Protototo',
      profile: 'Profiel',
      settings: 'Instellingen',
      logout: 'Uitloggen',
      openAccountMenu: 'Accountmenu openen',
      toggle: 'Inklappen of uitklappen',
    },
    profile: {
      activities: 'Activiteiten',
      activitiesCount: 'activiteiten',
      activitiesDescription: 'Teams en commissies per seizoen.',
      address: 'Adres',
      admin: 'Beheerder',
      backNumber: 'Rugnummer',
      birthDate: 'Geboortedatum',
      bondNumber: 'Bondsnummer',
      committee: 'Commissie',
      contact: 'Contact',
      contactDescription: 'Directe contactgegevens en woonplaats.',
      description: 'Contactgegevens, verenigingsinformatie en activiteiten.',
      details: 'Verenigingsgegevens',
      detailsDescription: 'Persoonlijke gegevens binnen de vereniging.',
      email: 'E-mail',
      loadError: 'Profiel kon niet worden geladen',
      member: 'Lid',
      noActivities: 'Nog geen activiteiten',
      noActivitiesDescription:
        'Er zijn geen team- of commissielidmaatschappen gevonden.',
      noAddress: 'Geen adres opgegeven',
      none: 'Geen',
      notProvided: 'Niet opgegeven',
      openAddress: 'Adres openen in Google Maps',
      phoneNumber: 'Telefoonnummer',
      pictureAlt: 'Profielfoto',
      profileUnavailable: 'Profiel nog niet beschikbaar',
      profileUnavailableDescription:
        'Synchroniseer je account om je profiel aan te maken.',
      refereeLicense: 'Scheidsrechterslicentie',
      registrationDate: 'Inschrijfdatum',
      retry: 'Opnieuw proberen',
      season: 'Seizoen',
      syncProfile: 'Profiel synchroniseren',
      syncingProfile: 'Profiel synchroniseren...',
      team: 'Team',
      title: 'Mijn profiel',
      roles: {
        chair: 'Voorzitter',
        coachTrainer: 'Coach / trainer',
        committeeMember: 'Commissielid',
        externalAffairs: 'Commissaris externe zaken',
        libero: 'Libero',
        matchSecretary: 'Wedstrijdsecretaris',
        middle: 'Middenaanvaller',
        oppositeHitter: 'Diagonaal',
        outsideHitter: 'Hoekaanvaller',
        refereeingOfficer: 'Commissaris zaalwacht en arbitrage',
        secretary: 'Secretaris',
        setter: 'Spelverdeler',
        treasurer: 'Penningmeester',
      },
      deletePicture: 'Profielfoto verwijderen',
      deletingPicture: 'Profielfoto verwijderen...',
      editProfile: 'Profiel bewerken',
      emailDescription:
        'We sturen een verificatielink naar je nieuwe e-mailadres.',
      emailLabel: 'E-mailadres',
      imageDescription: 'Upload een JPG, PNG of WebP-afbeelding.',
      imageLabel: 'Profielfoto',
      pictureUpdated: 'Profielfoto bijgewerkt.',
      removePictureFailed: 'Profielfoto verwijderen mislukt.',
      saveChanges: 'Wijzigingen opslaan',
      saving: 'Opslaan...',
      updateFailed: 'Profiel bijwerken mislukt.',
      updateProfileDescription: 'Werk je profielfoto of e-mailadres bij.',
      uploadPicture: 'Profielfoto uploaden',
      uploadingPicture: 'Profielfoto uploaden...',
      uploadPictureFailed: 'Profielfoto uploaden mislukt.',
      verificationEmailSent:
        'Verificatiemail verstuurd. Klik op de link om je nieuwe adres te bevestigen.',
    },
    teams: {
      loading: 'Teams laden',
      menTitle: 'Heren teams',
      menEmpty: 'Geen heren teams gevonden.',
      womenTitle: 'Dames teams',
      womenEmpty: 'Geen dames teams gevonden.',
    },
    userPanel: {
      currentUser: 'Huidige gebruiker',
      currentUserDescription:
        'Deze gegevens komen uit de Better Auth-sessie en de lokale gebruikersprojectie.',
      email: 'E-mail',
      name: 'Naam',
      noSyncedProfile: 'Nog geen gesynchroniseerd profiel.',
      profile: 'Profiel',
      role: 'Rol',
      signIn: 'Inloggen',
      signInDescription:
        'Gebruik het hoofdformulier om je profiel te synchroniseren en bekijken.',
      sync: 'Profiel synchroniseren',
      syncing: 'Synchroniseren...',
      synced: 'Profiel gesynchroniseerd.',
    },
  },
  en: {
    common: {
      account: 'Account',
      archived: 'Archived',
      cancel: 'Cancel',
      loading: 'Loading',
      navigation: 'Navigation',
      search: 'Search',
      smoelenboek: 'Smoelenboek',
      user: 'User',
    },
    auth: {
      checkingSession: 'Checking your session.',
      email: 'Email',
      login: 'Log in',
      loginFailed: 'Login failed.',
      loginSubtitle: 'Log in with your existing account to continue.',
      loggingIn: 'Logging in...',
      password: 'Password',
    },
    home: {
      title: 'Teams',
      description: 'Overview of members, teams, committees, and documents.',
      teamsDescription: 'Team memberships, roles, and contact details.',
      committeesDescription: 'Working groups and committee responsibilities.',
      documentsDescription: 'Shared documents and internal references.',
      protototoDescription: 'Overview of Protototo participation.',
    },
    language: {
      label: 'Language',
      dutch: 'Dutch',
      english: 'English',
      switchToDutch: 'Switch to Dutch',
      switchToEnglish: 'Switch to English',
    },
    nav: {
      teams: 'Teams',
      men: 'Men',
      women: 'Women',
      committees: 'Committees',
      documents: 'Documents',
      protototo: 'Protototo',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      openAccountMenu: 'Open account menu',
      toggle: 'Toggle',
    },
    profile: {
      activities: 'Activities',
      activitiesCount: 'activities',
      activitiesDescription: 'Teams and committees by season.',
      address: 'Address',
      admin: 'Administrator',
      backNumber: 'Shirt number',
      birthDate: 'Date of birth',
      bondNumber: 'Association number',
      committee: 'Committee',
      contact: 'Contact',
      contactDescription: 'Direct contact details and home address.',
      description: 'Contact details, association information, and activities.',
      details: 'Association details',
      detailsDescription: 'Personal information within the association.',
      email: 'Email',
      loadError: 'Profile could not be loaded',
      member: 'Member',
      noActivities: 'No activities yet',
      noActivitiesDescription: 'No team or committee memberships were found.',
      noAddress: 'No address provided',
      none: 'None',
      notProvided: 'Not provided',
      openAddress: 'Open address in Google Maps',
      phoneNumber: 'Phone number',
      pictureAlt: 'Profile picture',
      profileUnavailable: 'Profile not available yet',
      profileUnavailableDescription:
        'Sync your account to create your profile.',
      refereeLicense: 'Referee licence',
      registrationDate: 'Registration date',
      retry: 'Try again',
      season: 'Season',
      syncProfile: 'Sync profile',
      syncingProfile: 'Syncing profile...',
      team: 'Team',
      title: 'My profile',
      roles: {
        chair: 'Chair',
        coachTrainer: 'Coach / trainer',
        committeeMember: 'Committee member',
        externalAffairs: 'External affairs officer',
        libero: 'Libero',
        matchSecretary: 'Match secretary',
        middle: 'Middle blocker',
        oppositeHitter: 'Opposite hitter',
        outsideHitter: 'Outside hitter',
        refereeingOfficer: 'Venue and refereeing officer',
        secretary: 'Secretary',
        setter: 'Setter',
        treasurer: 'Treasurer',
      },
      deletePicture: 'Remove profile picture',
      deletingPicture: 'Removing profile picture...',
      editProfile: 'Edit profile',
      emailDescription: 'We will send a verification link to your new email.',
      emailLabel: 'Email address',
      imageDescription: 'Upload a JPG, PNG, or WebP image.',
      imageLabel: 'Profile picture',
      pictureUpdated: 'Profile picture updated.',
      removePictureFailed: 'Failed to remove profile picture.',
      saveChanges: 'Save changes',
      saving: 'Saving...',
      updateFailed: 'Failed to update profile.',
      updateProfileDescription: 'Update your profile picture or email address.',
      uploadPicture: 'Upload profile picture',
      uploadingPicture: 'Uploading profile picture...',
      uploadPictureFailed: 'Failed to upload profile picture.',
      verificationEmailSent:
        'Verification email sent. Click the link to confirm your new address.',
    },
    teams: {
      loading: 'Loading teams',
      menTitle: 'Men teams',
      menEmpty: 'No men teams found.',
      womenTitle: 'Women teams',
      womenEmpty: 'No women teams found.',
    },
    userPanel: {
      currentUser: 'Current user',
      currentUserDescription:
        'This data comes from the Better Auth session and the local user projection.',
      email: 'Email',
      name: 'Name',
      noSyncedProfile: 'No synced profile yet.',
      profile: 'Profile',
      role: 'Role',
      signIn: 'Sign in',
      signInDescription:
        'Use the main login form to sync and inspect your profile.',
      sync: 'Sync profile',
      syncing: 'Syncing...',
      synced: 'Profile synced.',
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
export type TranslationKey = LeafKey<Dictionary>;

type LeafKey<TValue> = TValue extends string
  ? never
  : {
      [K in keyof TValue & string]: TValue[K] extends string
        ? K
        : `${K}.${LeafKey<TValue[K]>}`;
    }[keyof TValue & string];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(localeStorageKey);

    if (isLocale(storedLocale)) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    document.documentElement.lang = defaultLocale;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        window.localStorage.setItem(localeStorageKey, nextLocale);
        document.documentElement.lang = nextLocale;
      },
      t(key) {
        return readTranslation(dictionaries[locale], key);
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider.');
  }

  return context;
}

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}

function readTranslation(dictionary: Dictionary, key: TranslationKey): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (current, part) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[part]
          : undefined,
      dictionary,
    );

  if (typeof value !== 'string') {
    throw new Error(`Missing translation for key: ${key}`);
  }

  return value;
}
