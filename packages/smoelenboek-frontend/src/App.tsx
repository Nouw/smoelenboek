import React from "react";
import "./App.css";
import { createTheme, ThemeProvider, useMediaQuery } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "./auth/Login";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { ScreenWrapper } from "./components/navigation/ScreenWrapper";
import { Home } from "./screens/Home";
import { Teams } from "./screens/teams/Teams";
import { Info as TeamsInfo } from "./screens/teams/Info";
import { Profile } from "./screens/Profile";
import { AdminRoute } from "./components/auth/AdminRoute";
import { Home as ActivityHome } from "./screens/dashboard/activity/Home";
import { Home as Categories } from "./screens/documents/Home";
import { Home as Seasons } from "./screens/dashboard/season/Home";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Add as SeasonsAdd } from "./screens/dashboard/season/Add";
import "moment/locale/nl";
import { SnackbarProvider } from "./providers/SnackbarProvider";
import { Edit as SeasonsEdit } from "./screens/dashboard/season/Edit";
import { Home as Users } from "./screens/dashboard/members/Home";
import { Add as UsersAdd } from "./screens/dashboard/members/Add";
import { Edit as UsersEdit } from "./screens/dashboard/members/Edit";
import { Home as TeamsDashboard } from "./screens/dashboard/teams/Home";
import { Add as TeamsAdd } from "./screens/dashboard/teams/Add";
import { Edit as TeamsEdit } from "./screens/dashboard/teams/Edit";
import { Home as CommitteesDashboard } from "./screens/dashboard/committee/Home";
import { Add as CommitteesAdd } from "./screens/dashboard/committee/Add";
import { Edit as CommitteesEdit } from "./screens/dashboard/committee/Edit";
import { Home as ProtototoDashboard } from "./screens/dashboard/protototo/Home";
import { Add as ProtototoSeasonAdd } from "./screens/dashboard/protototo/Add";
import { Edit as ProtototoSeasonEdit } from "./screens/dashboard/protototo/Edit";
import { Home as ProtototoSeasonMatches } from "./screens/dashboard/protototo/match/Home";
import { Add as ProtototoSeasonAddMatch } from "./screens/dashboard/protototo/match/Add";
import { Edit as ProtototoSeasonEditMatch } from "./screens/dashboard/protototo/match/Edit";
import { LoginDebug } from "./screens/debug/LoginDebug";
import { Home as DocumentsDashboard } from "./screens/dashboard/documents/Home";
import { Add as DocumentsAddCategory } from "./screens/dashboard/documents/Add";
import { Edit as DocumentsEditCategory } from "./screens/dashboard/documents/Edit";
import { Files } from "./screens/documents/Files";
import { Home as Protototo } from "./screens/protototo/Home";
import { Home as Settings } from "./screens/settings/Home";
import { ChangePassword } from "./screens/settings/ChangePassword";
import { PersonalInformation } from "./screens/settings/PersonalInformation";
import { ChangeProfilePicture } from "./screens/settings/ChangeProfilePicture";
import { SponsorHengel } from "./screens/SponsorHengel";
import { VCP } from "./screens/VCP.tsx";
import { Home as Committees } from "./screens/committees/Home";
import { Info as CommitteeInfo } from "./screens/committees/Info";
import { External } from "./screens/protototo/External.tsx";
import { Result as ProtototoMatchResult } from "./screens/dashboard/protototo/match/Result";
import { ResetPassword } from "./auth/ResetPassword.tsx";
import { ApplicationError } from "./screens/errors/ApplicationError.tsx";
import { Guard } from "./components/auth/Guard.tsx";
import { AUTHENTICATED } from "./components/auth/RolesConstants.ts";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Create as ActivityCreate } from "./screens/dashboard/activity/Create";
import { Info as ActivityInfoDashboard } from "./screens/dashboard/activity/Info";
import { Info as ActivityInfo } from "./screens/activities/Info";
import { wrapCreateBrowserRouter } from "@sentry/react";
import { Dashboard as ActivityDashboard } from "./screens/activities/Dashboard";

const sentryWrappedBrowserRouter = wrapCreateBrowserRouter(createBrowserRouter);

const router = sentryWrappedBrowserRouter([
  {
    path: "/",
    errorElement: <ApplicationError />,
    element: <ScreenWrapper />,
    children: [
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "teams/:type",
        element: (
          <Guard roles={AUTHENTICATED}>
            <Teams />
          </Guard>
        ),
      },
      {
        path: "teams/info/:id",
        element: (
          <Guard roles={AUTHENTICATED}>
            <TeamsInfo />
          </Guard>
        ),
      },
      {
        path: "profile/:id",
        element: (
          <Guard roles={AUTHENTICATED}>
            <Profile />
          </Guard>
        ),
      },
      {
        path: "protototo/",
        element: <Protototo />,
      },
      {
        path: "documents/",
        element: (
          <Guard roles={AUTHENTICATED}>
            <Categories />
          </Guard>
        ),
      },
      {
        path: `documents/files/:id`,
        element: (
          <Guard roles={AUTHENTICATED}>
            <Files />
          </Guard>
        ),
      },
      {
        path: "settings",
        element: (
          <Guard roles={AUTHENTICATED}>
            <Settings />
          </Guard>
        ),
      },
      {
        path: "settings/password",
        element: (
          <Guard roles={AUTHENTICATED}>
            <ChangePassword />
          </Guard>
        ),
      },
      {
        path: "settings/information",
        element: (
          <Guard roles={AUTHENTICATED}>
            <PersonalInformation />
          </Guard>
        ),
      },
      {
        path: "settings/picture",
        element: (
          <Guard roles={AUTHENTICATED}>
            <ChangeProfilePicture />
          </Guard>
        ),
      },
      {
        path: "sponsorhengel",
        element: (
          <Guard roles={AUTHENTICATED}>
            <SponsorHengel />
          </Guard>
        ),
      },
      {
        path: "vcp",
        element: (
          <Guard roles={AUTHENTICATED}>
            <VCP />
          </Guard>
        ),
      },
      {
        path: "committees/",
        element: (
          <Guard roles={AUTHENTICATED}>
            <Committees />
          </Guard>
        ),
      },
      {
        path: "committees/info/:id",
        element: (
          <Guard roles={AUTHENTICATED}>
            <CommitteeInfo />
          </Guard>
        ),
      },
      {
        path: "activity/:id",
        element: (
          <Guard roles={[]}>
            <ActivityInfo />
          </Guard>
        )
      },
      {
        path: "activity/info/:id",
        element: (
          <Guard roles={AUTHENTICATED}>
            <ActivityDashboard />
          </Guard>
        )
      }
    ],
  },
  {
    path: "dashboard/",
    element: (
      <AdminRoute>
        <ScreenWrapper />
      </AdminRoute>
    ),
    children: [
      {
        path: "activity/",
        element: <ActivityHome/>
      },
      {
        path: "activity/edit/:id",
        element: <ActivityInfoDashboard/>
      },
      {
        path: "activity/create",
        element: <ActivityCreate />,
      },
      {
        path: "seasons/",
        element: <Seasons />,
      },
      {
        path: "seasons/add",
        element: <SeasonsAdd />,
      },
      {
        path: "seasons/edit/:id",
        element: <SeasonsEdit />,
      },
      {
        path: "users/",
        element: <Users />,
      },
      {
        path: "users/add",
        element: <UsersAdd />,
      },
      {
        path: "users/edit/:id",
        element: <UsersEdit />,
      },
      {
        path: "teams/",
        element: <TeamsDashboard />,
      },
      {
        path: "teams/add",
        element: <TeamsAdd />,
      },
      {
        path: "teams/edit/:id",
        element: <TeamsEdit />,
      },
      {
        path: "committees/",
        element: <CommitteesDashboard />,
      },
      {
        path: "committees/add",
        element: <CommitteesAdd />,
      },
      {
        path: "committees/edit/:id",
        element: <CommitteesEdit />,
      },
      {
        path: "protototo/",
        element: <ProtototoDashboard />,
      },
      {
        path: "protototo/season",
        element: <ProtototoSeasonAdd />,
      },
      {
        path: "protototo/season/:id",
        element: <ProtototoSeasonEdit />,
      },
      {
        path: "protototo/season/:id/matches",
        element: <ProtototoSeasonMatches />,
      },
      {
        path: "protototo/season/:id/matches/add",
        element: <ProtototoSeasonAddMatch />,
      },
      {
        path: "protototo/season/:id/matches/edit/:matchId",
        element: <ProtototoSeasonEditMatch />,
      },
      {
        path: "protototo/season/:id/matches/result/:matchId",
        element: <ProtototoMatchResult />,
      },
      {
        path: "documents/",
        element: <DocumentsDashboard />,
      },
      {
        path: "documents/category",
        element: <DocumentsAddCategory />,
      },
      {
        path: "documents/edit/:id",
        element: <DocumentsEditCategory />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/password/reset",
    element: <ResetPassword />,
  },
  {
    path: "/debug",
    element: <LoginDebug />,
  },
  {
    path: "/externe/protototo",
    element: <External />,
  },
]);

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const persistor = persistStore(store);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: "#d0211c",
          },
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode],
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="nl">
            <SnackbarProvider>
              <DndProvider backend={HTML5Backend}>
                <RouterProvider router={router} />
              </DndProvider>
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
