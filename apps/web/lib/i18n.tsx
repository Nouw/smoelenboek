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
      playProtototo: 'Meedoen',
      manageProtototo: 'Beheren',
      profile: 'Profiel',
      settings: 'Instellingen',
      logout: 'Uitloggen',
      openAccountMenu: 'Accountmenu openen',
      toggle: 'Inklappen of uitklappen',
    },
    profile: {
      account: 'Account',
      activities: 'Activiteiten',
      activitiesCount: 'activiteiten',
      activitiesDescription: 'Teams en commissies per seizoen.',
      address: 'Adres',
      admin: 'Beheerder',
      bankAccountNumber: 'Rekeningnummer',
      backNumber: 'Rugnummer',
      birthDate: 'Geboortedatum',
      bondNumber: 'Bondsnummer',
      committee: 'Commissie',
      city: 'Plaats',
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
      profileNotFound: 'Profiel niet gevonden',
      profileNotFoundDescription:
        'Deze gebruiker bestaat niet of heeft nog geen profiel.',
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
      editInformation: 'Gegevens bewerken',
      editProfile: 'Profiel bewerken',
      emailDescription:
        'We sturen een verificatielink naar je nieuwe e-mailadres.',
      emailLabel: 'E-mailadres',
      houseNumber: 'Huisnummer',
      imageDescription: 'Upload een JPG, PNG of WebP-afbeelding.',
      imageLabel: 'Profielfoto',
      informationUpdated: 'Profielgegevens bijgewerkt.',
      invalidBackNumber: 'Voer een rugnummer van 0 t/m 32767 in.',
      pictureUpdated: 'Profielfoto bijgewerkt.',
      postcode: 'Postcode',
      removePictureFailed: 'Profielfoto verwijderen mislukt.',
      saveChanges: 'Wijzigingen opslaan',
      saving: 'Opslaan...',
      streetName: 'Straatnaam',
      updateFailed: 'Profiel bijwerken mislukt.',
      updateInformationDescription:
        'Werk de contactgegevens, het rekeningnummer en het rugnummer bij.',
      updateInformationFailed: 'Gegevens bijwerken mislukt.',
      updateProfileDescription:
        'Werk account-, contact- en verenigingsgegevens bij.',
      uploadPicture: 'Profielfoto uploaden',
      uploadingPicture: 'Profielfoto uploaden...',
      uploadPictureFailed: 'Profielfoto uploaden mislukt.',
      verificationEmailSent:
        'Verificatiemail verstuurd. Klik op de link om je nieuwe adres te bevestigen.',
    },
    teams: {
      backToTeams: 'Terug naar teams',
      coaches: 'Coaches',
      currentSeason: 'Huidig seizoen',
      loadError: 'Team kon niet worden geladen',
      loading: 'Teams laden',
      menTitle: 'Heren teams',
      menEmpty: 'Geen heren teams gevonden.',
      noCoaches: 'Geen coaches gevonden voor dit seizoen.',
      noPlayers: 'Geen spelers gevonden voor dit seizoen.',
      noTeamImage: 'Geen teamfoto beschikbaar',
      notFound: 'Team niet gevonden',
      notFoundDescription: 'Dit team bestaat niet of is niet beschikbaar.',
      players: 'Spelers',
      retry: 'Opnieuw proberen',
      womenTitle: 'Dames teams',
      womenEmpty: 'Geen dames teams gevonden.',
    },
    committees: {
      backToCommittees: 'Terug naar commissies',
      currentSeason: 'Huidig seizoen',
      empty: 'Geen commissies gevonden.',
      loadError: 'Commissie kon niet worden geladen',
      loading: 'Commissies laden',
      members: 'Leden',
      noMembers: 'Geen commissieleden gevonden voor dit seizoen.',
      notFound: 'Commissie niet gevonden',
      notFoundDescription:
        'Deze commissie bestaat niet of is niet beschikbaar.',
      retry: 'Opnieuw proberen',
      title: 'Commissies',
    },
    protototo: {
      title: 'Protototo',
      description: 'Voorspel per wedstrijd welk team iedere set wint.',
      loading: 'Protototo laden...',
      loadError: 'Protototo kon niet worden geladen.',
      retry: 'Opnieuw proberen',
      noRound: 'Er staat momenteel geen Protototo-ronde open.',
      noMatches: 'Er zijn nog geen wedstrijden aan deze ronde toegevoegd.',
      openUntil: 'Inzenden tot',
      closedAt: 'Gesloten op',
      bettingClosed: 'De inzending is gesloten',
      bettingClosedMember:
        'Bekijk de eindstand zodra de resultaten beschikbaar zijn.',
      bettingClosedAnonymous: 'Log in als lid om de eindstand te bekijken.',
      viewStandings: 'Bekijk de eindstand',
      history: 'Eerdere rondes',
      yourDetails: 'Jouw gegevens',
      anonymousDescription:
        'Met dezelfde voornaam en hetzelfde e-mailadres kun je je inzending voor de sluitingstijd terugvinden en vervangen.',
      firstName: 'Voornaam',
      email: 'E-mailadres',
      loadEntry: 'Bestaande inzending laden',
      entryNotFound:
        'Geen bestaande inzending gevonden. Je kunt hieronder een nieuwe inzending maken.',
      loadingEntry: 'Je inzending laden...',
      matches: 'Wedstrijden',
      matchInstructions:
        'Kies voor iedere set de winnaar. Extra sets verschijnen automatisch wanneer dat nodig is.',
      set: 'Set',
      formats: {
        best_of_5: 'Best of five: het eerste team met drie gewonnen sets wint.',
        four_sets: 'Voorspel precies vier sets.',
        four_plus_one:
          'Voorspel vier sets en een vijfde set bij een stand van 2-2.',
      },
      payment: 'Betaling',
      paymentDescription:
        'Open de Tikkie en bevestig daarna dat je hebt betaald.',
      openTikkie: 'Open Tikkie',
      paidConfirmation: 'Ik heb de Tikkie betaald.',
      completePredictions:
        'Maak voor iedere wedstrijd een geldige voorspelling.',
      identityRequired: 'Vul je voornaam en een geldig e-mailadres in.',
      paymentRequired: 'Open de Tikkie en bevestig dat je hebt betaald.',
      saved:
        'Je inzending is opgeslagen. Je kunt deze tot de sluitingstijd vervangen.',
      saveEntry: 'Inzending opslaan',
      back: 'Terug naar Protototo',
      standings: 'Eindstand',
      selectRound: 'Selecteer een ronde',
      loadingStandings: 'Eindstand laden...',
      standingsUnavailable: 'De eindstand is nog niet beschikbaar.',
      noStandings: 'Er is nog geen eindstand voor deze ronde.',
      ranking: 'Klassement',
      rankingDescription: 'Deelnemers met de meeste punten staan bovenaan.',
      points: 'punten',
      admin: {
        title: 'Protototo-beheer',
        description: 'Beheer rondes, wedstrijden, uitslagen en inzendingen.',
        loading: 'Beheerdersrechten controleren...',
        forbidden: 'Geen toegang',
        forbiddenDescription: 'Alleen beheerders kunnen Protototo beheren.',
        openParticipantPage: 'Open deelnemerspagina',
        newRound: 'Nieuwe ronde',
        rounds: 'Rondes',
        selectRound: 'Selecteer een ronde om deze te beheren.',
        loadingRounds: 'Rondes laden...',
        noRounds: 'Nog geen rondes.',
        createFirst: 'Maak eerst een ronde aan.',
        loadingRound: 'Ronde laden...',
        roundNotFound: 'Ronde niet gevonden.',
        roundTitle: 'Titel',
        opensAt: 'Open vanaf',
        closesAt: 'Sluit op',
        tikkieUrl: 'Tikkie-link voor gasten',
        create: 'Ronde aanmaken',
        invalidRound: 'Controleer de titel en datums van de ronde.',
        saveRound: 'Ronde opslaan',
        publish: 'Publiceren / heropenen',
        archive: 'Archiveren',
        sync: 'Uitslagen ophalen',
        roundCreated: 'Ronde aangemaakt.',
        roundUpdated: 'Ronde bijgewerkt.',
        roundPublished: 'Ronde gepubliceerd.',
        roundArchived: 'Ronde gearchiveerd.',
        status: {
          draft: 'Concept',
          scheduled: 'Ingepland',
          open: 'Open',
          published: 'Gepubliceerd',
          closed: 'Gesloten',
          archived: 'Gearchiveerd',
        },
        roundMatches: 'Wedstrijden in de ronde',
        roundMatchesDescription:
          'Verwijderde wedstrijden tellen niet mee in de score.',
        noMatches: 'Nog geen wedstrijden toegevoegd.',
        removeMatch: 'Wedstrijd verwijderen',
        nevoboMatches: 'Nevobo-wedstrijden',
        nevoboDescription: 'Kies een Protos-team en voeg wedstrijden toe.',
        team: 'Team',
        chooseTeam: 'Kies een team',
        loadingTeams: 'Teams ophalen...',
        loadingMatches: 'Wedstrijden ophalen...',
        noNevoboMatches: 'Geen wedstrijden gevonden voor dit team.',
        add: 'Toevoegen',
        added: 'Toegevoegd',
        matchAdded: 'Wedstrijd toegevoegd.',
        matchRemoved: 'Wedstrijd verwijderd.',
        syncComplete: 'Synchronisatie voltooid',
        final: 'definitief',
        pending: 'in afwachting',
        cancelled: 'afgelast',
        failed: 'mislukt',
        entries: 'Inzendingen',
        entriesCount: 'inzendingen',
        loadingEntries: 'Inzendingen laden...',
        noEntries: 'Nog geen inzendingen.',
        downloadCsv: 'CSV downloaden',
        csvDescription:
          'De CSV bevat deelnemergegevens, betalingsclaim, volledigheid, punten per wedstrijd en totaalscore.',
        name: 'Naam',
        type: 'Type',
        paid: 'Betaald gemeld',
        updated: 'Bijgewerkt',
        score: 'Score',
        yes: 'Ja',
        no: 'Nee',
        notApplicable: 'Niet van toepassing',
        participantType: {
          member: 'Lid',
          anonymous: 'Gast',
        },
      },
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
      playProtototo: 'Play',
      manageProtototo: 'Manage',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      openAccountMenu: 'Open account menu',
      toggle: 'Toggle',
    },
    profile: {
      account: 'Account',
      activities: 'Activities',
      activitiesCount: 'activities',
      activitiesDescription: 'Teams and committees by season.',
      address: 'Address',
      admin: 'Administrator',
      bankAccountNumber: 'Bank account number',
      backNumber: 'Shirt number',
      birthDate: 'Date of birth',
      bondNumber: 'Association number',
      committee: 'Committee',
      city: 'City',
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
      profileNotFound: 'Profile not found',
      profileNotFoundDescription:
        'This user does not exist or does not have a profile yet.',
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
      editInformation: 'Edit information',
      editProfile: 'Edit profile',
      emailDescription: 'We will send a verification link to your new email.',
      emailLabel: 'Email address',
      houseNumber: 'House number',
      imageDescription: 'Upload a JPG, PNG, or WebP image.',
      imageLabel: 'Profile picture',
      informationUpdated: 'Profile information updated.',
      invalidBackNumber: 'Enter a shirt number from 0 through 32767.',
      pictureUpdated: 'Profile picture updated.',
      postcode: 'Postcode',
      removePictureFailed: 'Failed to remove profile picture.',
      saveChanges: 'Save changes',
      saving: 'Saving...',
      streetName: 'Street name',
      updateFailed: 'Failed to update profile.',
      updateInformationDescription:
        'Update the contact details, bank account number, and shirt number.',
      updateInformationFailed: 'Failed to update information.',
      updateProfileDescription:
        'Update account, contact, and association information.',
      uploadPicture: 'Upload profile picture',
      uploadingPicture: 'Uploading profile picture...',
      uploadPictureFailed: 'Failed to upload profile picture.',
      verificationEmailSent:
        'Verification email sent. Click the link to confirm your new address.',
    },
    teams: {
      backToTeams: 'Back to teams',
      coaches: 'Coaches',
      currentSeason: 'Current season',
      loadError: 'Team could not be loaded',
      loading: 'Loading teams',
      menTitle: 'Men teams',
      menEmpty: 'No men teams found.',
      noCoaches: 'No coaches found for this season.',
      noPlayers: 'No players found for this season.',
      noTeamImage: 'No team photo available',
      notFound: 'Team not found',
      notFoundDescription: 'This team does not exist or is unavailable.',
      players: 'Players',
      retry: 'Try again',
      womenTitle: 'Women teams',
      womenEmpty: 'No women teams found.',
    },
    committees: {
      backToCommittees: 'Back to committees',
      currentSeason: 'Current season',
      empty: 'No committees found.',
      loadError: 'Committee could not be loaded',
      loading: 'Loading committees',
      members: 'Members',
      noMembers: 'No committee members found for this season.',
      notFound: 'Committee not found',
      notFoundDescription: 'This committee does not exist or is unavailable.',
      retry: 'Try again',
      title: 'Committees',
    },
    protototo: {
      title: 'Protototo',
      description: 'Predict which team wins each set for every match.',
      loading: 'Loading Protototo...',
      loadError: 'Protototo could not be loaded.',
      retry: 'Try again',
      noRound: 'There is no open Protototo round right now.',
      noMatches: 'No matches have been added to this round yet.',
      openUntil: 'Submit until',
      closedAt: 'Closed at',
      bettingClosed: 'Entries are closed',
      bettingClosedMember: 'View the standings when the results are available.',
      bettingClosedAnonymous: 'Log in as a member to view the standings.',
      viewStandings: 'View standings',
      history: 'Previous rounds',
      yourDetails: 'Your details',
      anonymousDescription:
        'Use the same first name and email address to find and replace your entry before entries close.',
      firstName: 'First name',
      email: 'Email address',
      loadEntry: 'Load existing entry',
      entryNotFound:
        'No existing entry was found. You can create a new entry below.',
      loadingEntry: 'Loading your entry...',
      matches: 'Matches',
      matchInstructions:
        'Choose the winner of every set. Extra sets appear automatically when needed.',
      set: 'Set',
      formats: {
        best_of_5: 'Best of five: the first team to win three sets wins.',
        four_sets: 'Predict exactly four sets.',
        four_plus_one:
          'Predict four sets and a fifth set when the score is 2-2.',
      },
      payment: 'Payment',
      paymentDescription: 'Open the Tikkie, then confirm that you paid.',
      openTikkie: 'Open Tikkie',
      paidConfirmation: 'I paid the Tikkie.',
      completePredictions: 'Complete a valid prediction for every match.',
      identityRequired: 'Enter your first name and a valid email address.',
      paymentRequired: 'Open the Tikkie and confirm that you paid.',
      saved:
        'Your entry has been saved. You can replace it until entries close.',
      saveEntry: 'Save entry',
      back: 'Back to Protototo',
      standings: 'Standings',
      selectRound: 'Select a round',
      loadingStandings: 'Loading standings...',
      standingsUnavailable: 'The standings are not available yet.',
      noStandings: 'There are no standings for this round yet.',
      ranking: 'Ranking',
      rankingDescription: 'Participants with the most points are ranked first.',
      points: 'points',
      admin: {
        title: 'Protototo management',
        description: 'Manage rounds, matches, results, and entries.',
        loading: 'Checking administrator access...',
        forbidden: 'Access denied',
        forbiddenDescription: 'Only administrators can manage Protototo.',
        openParticipantPage: 'Open participant page',
        newRound: 'New round',
        rounds: 'Rounds',
        selectRound: 'Select a round to manage it.',
        loadingRounds: 'Loading rounds...',
        noRounds: 'No rounds yet.',
        createFirst: 'Create a round first.',
        loadingRound: 'Loading round...',
        roundNotFound: 'Round not found.',
        roundTitle: 'Title',
        opensAt: 'Opens at',
        closesAt: 'Closes at',
        tikkieUrl: 'Tikkie link for guests',
        create: 'Create round',
        invalidRound: 'Check the round title and dates.',
        saveRound: 'Save round',
        publish: 'Publish / reopen',
        archive: 'Archive',
        sync: 'Fetch results',
        roundCreated: 'Round created.',
        roundUpdated: 'Round updated.',
        roundPublished: 'Round published.',
        roundArchived: 'Round archived.',
        status: {
          draft: 'Draft',
          scheduled: 'Scheduled',
          open: 'Open',
          published: 'Published',
          closed: 'Closed',
          archived: 'Archived',
        },
        roundMatches: 'Matches in this round',
        roundMatchesDescription:
          'Removed matches no longer count towards scores.',
        noMatches: 'No matches have been added yet.',
        removeMatch: 'Remove match',
        nevoboMatches: 'Nevobo matches',
        nevoboDescription: 'Choose a Protos team and add matches.',
        team: 'Team',
        chooseTeam: 'Choose a team',
        loadingTeams: 'Loading teams...',
        loadingMatches: 'Loading matches...',
        noNevoboMatches: 'No matches were found for this team.',
        add: 'Add',
        added: 'Added',
        matchAdded: 'Match added.',
        matchRemoved: 'Match removed.',
        syncComplete: 'Sync completed',
        final: 'final',
        pending: 'pending',
        cancelled: 'cancelled',
        failed: 'failed',
        entries: 'Entries',
        entriesCount: 'entries',
        loadingEntries: 'Loading entries...',
        noEntries: 'No entries yet.',
        downloadCsv: 'Download CSV',
        csvDescription:
          'The CSV includes participant data, payment claim, completeness, points per match, and total score.',
        name: 'Name',
        type: 'Type',
        paid: 'Payment claimed',
        updated: 'Updated',
        score: 'Score',
        yes: 'Yes',
        no: 'No',
        notApplicable: 'Not applicable',
        participantType: {
          member: 'Member',
          anonymous: 'Guest',
        },
      },
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
