import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./layouts/app.layout";
import { Login } from "./screens/auth/login/login";
import { ProtectedLayout } from "./layouts/protected.layout";
import { TeamsList } from "./screens/teams/teams.list";
import { teamsInfoLoader, teamsLoader } from "./screens/teams/teams.loader";
import { TeamsInfo } from "./screens/teams/teams.info";
import { CommitteesList } from "./screens/committees/committees.list";
import {
  committeeInfoLoader,
  committeesLoader,
} from "./screens/committees/committees.loader";
import { CommitteesInfo } from "./screens/committees/committees.info";
import { DocumentsList } from "./screens/documents/documents.list";
import { categoriesLoader } from "./screens/categories/categories.loader";
import { CategoriesList } from "./screens/categories/categories.list";
import { documentsLoader } from "./screens/documents/documents.loader";
import { VCP } from "./screens/vcp/vcp";
import { SponsorHengel } from "./screens/sponsorhengel/sponsorhengel";
import { ErrorLayout } from "./layouts/error.layout";
import { Profile } from "./screens/profiles/profile";
import { profileLoader } from "./screens/profiles/profile.loader";
import { Settings } from "./screens/settings/settings";
import { ChangePassword } from "./screens/settings/change-password/change-password";
import { PersonalInformation } from "./screens/settings/personal-information/personal-information";
import { personalInformationLoader } from "./screens/settings/personal-information/personal-information.loader";
import { Picture } from "./screens/settings/picture/picture";
import { pictureLoader } from "./screens/settings/picture/picture.loader";
import { AdminLayout } from "./layouts/admin.layout";
import { Dashboard } from "./screens/dashboard/dashboard";
import { SeasonsList } from "./screens/dashboard/seasons/seasons.list";
import {
  seasonLoader,
  seasonsLoader,
} from "./screens/dashboard/seasons/seasons.loader";
import { SeasonsInfo } from "./screens/dashboard/seasons/seasons.info";
import { SeasonsAdd } from "./screens/dashboard/seasons/seasons.add";
import { UsersList } from "./screens/dashboard/users/users.list";
import {
  userLoader,
  usersLoader,
} from "./screens/dashboard/users/users.loader";
import { UsersInfo } from "./screens/dashboard/users/users.info";
import { UsersCreate } from "./screens/dashboard/users/users.create";
import { TeamsList as TeamsDashboardList } from "./screens/dashboard/teams/teams.list";
import { TeamsAdd } from "./screens/dashboard/teams/teams.add";
import { TeamsInfo as TeamsDashboardInfo } from "./screens/dashboard/teams/teams.info";
import { CommitteesList as CommitteesDashboardList } from "./screens/dashboard/committees/committees.list";
import { CommitteesAdd } from "./screens/dashboard/committees/committees.add";
import { CommitteesInfo as CommitteesDashboardInfo } from "./screens/dashboard/committees/committees.info";
import { CategoriesList as CategoriesDashboardList } from "./screens/dashboard/categories/categories.list";
import { CategoriesAdd } from "./screens/dashboard/categories/categories.add";
import { DocumentsList as DocumentsDashboardList } from "./screens/dashboard/documents/documents.list";
import { ActivitiesList } from "./screens/activities/activities.list";
import { ResetPasswordRequest } from "./screens/auth/reset-password/request/reset-password-request.tsx";
import { ResetPassword } from "./screens/auth/reset-password/reset-password.tsx";
import { wrapCreateBrowserRouter } from "@sentry/react";

const sentryWrappedBrowserRouter = wrapCreateBrowserRouter(createBrowserRouter);
export const router = sentryWrappedBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        path: "",
        element: null,
      },
      {
        path: "auth",
        children: [
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "password/request-reset",
            element: <ResetPasswordRequest />,
          },
          {
            path: "password/reset",
            element: <ResetPassword />,
          },
        ],
      },
      {
        path: "activities",
        children: [
          {
            path: "",
            element: <ActivitiesList />,
          },
        ],
      },
      {
        path: "",
        element: <ProtectedLayout />,
        children: [
          {
            path: "teams",
            children: [
              {
                path: ":type",
                element: <TeamsList />,
                loader: teamsLoader,
              },
              {
                path: "info/:id",
                element: <TeamsInfo />,
                loader: teamsInfoLoader,
              },
            ],
          },
          {
            path: "committees",
            children: [
              {
                path: "",
                element: <CommitteesList />,
                loader: committeesLoader,
              },
              {
                path: "info/:id",
                element: <CommitteesInfo />,
                loader: committeeInfoLoader,
              },
            ],
          },
          {
            path: "documents",
            children: [
              {
                path: "",
                element: <CategoriesList />,
                loader: categoriesLoader,
              },
              {
                path: ":id",
                element: <DocumentsList />,
                loader: documentsLoader,
              },
            ],
          },
          {
            path: "vcp",
            element: <VCP />,
          },
          {
            path: "sponsorhengel",
            element: <SponsorHengel />,
          },
          {
            path: "profile/:id",
            element: <Profile />,
            loader: profileLoader,
          },
          {
            path: "settings",
            children: [
              {
                path: "",
                element: <Settings />,
              },
              {
                path: "change-password",
                element: <ChangePassword />,
              },
              {
                path: "personal-information",
                element: <PersonalInformation />,
                loader: personalInformationLoader,
              },
              {
                path: "picture",
                element: <Picture />,
                loader: pictureLoader,
              },
            ],
          },
          {
            path: "dashboard",
            element: <AdminLayout />,
            children: [
              {
                path: "",
                element: <Dashboard />,
              },
              {
                path: "seasons",
                children: [
                  {
                    path: "",
                    element: <SeasonsList />,
                    loader: seasonsLoader,
                  },
                  {
                    path: "edit/:id",
                    element: <SeasonsInfo />,
                    loader: seasonLoader,
                  },
                  {
                    path: "add",
                    element: <SeasonsAdd />,
                  },
                ],
              },
              {
                path: "users",
                children: [
                  {
                    path: "",
                    element: <UsersList />,
                    loader: usersLoader,
                  },
                  {
                    path: "edit/:id",
                    element: <UsersInfo />,
                    loader: userLoader,
                  },
                  {
                    path: "add",
                    element: <UsersCreate />,
                  },
                ],
              },
              {
                path: "teams",
                children: [
                  {
                    path: "",
                    element: <TeamsDashboardList />,
                    loader: teamsLoader,
                  },
                  {
                    path: "add",
                    element: <TeamsAdd />,
                  },
                  {
                    path: "edit/:id",
                    element: <TeamsDashboardInfo />,
                    loader: teamsInfoLoader,
                  },
                ],
              },
              {
                path: "committees",
                children: [
                  {
                    path: "",
                    element: <CommitteesDashboardList />,
                    loader: committeesLoader,
                  },
                  {
                    path: "add",
                    element: <CommitteesAdd />,
                  },
                  {
                    path: "edit/:id",
                    element: <CommitteesDashboardInfo />,
                    loader: committeeInfoLoader,
                  },
                ],
              },
              {
                path: "documents",
                children: [
                  {
                    path: "category",
                    children: [
                      {
                        path: "",
                        element: <CategoriesDashboardList />,
                        loader: categoriesLoader,
                      },
                      {
                        path: "add",
                        element: <CategoriesAdd />,
                      },
                      {
                        path: ":id",
                        element: <DocumentsDashboardList />,
                        loader: documentsLoader,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
