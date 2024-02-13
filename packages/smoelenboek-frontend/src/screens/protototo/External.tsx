import React from "react";
import {useCookies} from "react-cookie";
import {useGetProtototoExternalSeasonQuery} from "../../api/endpoints/protototo.ts";
import {Loading} from "../../components/Loading.tsx";
import moment from "moment";
import {Alert, AlertTitle, Box, Card, CardContent, Container} from "@mui/material";
import {ExternalInformation, FormValues} from "../../components/form/protototo/ExternalInformation.tsx";
import {ExternalMatches} from "../../components/protototo/ExternalMatches.tsx";
import { useTranslation } from "react-i18next";

interface ExternalProps {

}

enum Screen {
  INFO,
  BET
}

export const External: React.FC<ExternalProps> = () => {
  const { t } = useTranslation(["error"]);

	const [firstName, setFirstname] = React.useState<string>("");
  const [lastName, setLastname] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [screen, setScreen] = React.useState<Screen>(Screen.INFO);
  const [cookies, setCookie, ] = useCookies(['protos-protototo']);
  const { data: season, isLoading} = useGetProtototoExternalSeasonQuery()

  React.useEffect(() => {
    if (!season || !cookies["protos-protototo"]) {
      return;
    }

    const cookie = cookies["protos-protototo"];

    if (!cookie.firstName && !cookie.lastName && !cookie.email) {
      return;
    }

    setFirstname(cookie.firstName);
    setLastname(cookie.lastName);
    setEmail(cookie.email);
    setScreen(Screen.BET);
  }, [cookies, season])

  function postInformation(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    if (!season) {
      return;
    }

    setEmail(values.email);
    setFirstname(values.firstName);
    setLastname(values.lastName);

    setCookie('protos-protototo', {firstName: values.firstName, lastName: values.lastName, email: values.email}, {expires: moment(season.data.end).toDate()});
    setScreen(Screen.BET);
  }

  if (isLoading) {
    return <Loading/>
  }

  if (!season?.data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Container>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
						{t("error:no-protototo-season")}
          </Alert>
        </Container>
      </Box>
    )
  }

  switch (screen) {
    case Screen.INFO:
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Container>
            <Card>
              <CardContent>
                <ExternalInformation tikkie={season.data.tikkie} submit={(values) => postInformation(values)}/>
              </CardContent>
            </Card>
          </Container>
        </Box>
      );
    case Screen.BET:
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Container>
            <ExternalMatches email={email} firstName={firstName} lastName={lastName}/>
          </Container>
        </Box>
      );
    default:
      return null;
  }
}
