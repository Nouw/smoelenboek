import { useNavigate, useRouteError } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export const ApplicationError: React.FC<any> = () => {
  const { t } = useTranslation();

  const error = useRouteError();
  const navigate = useNavigate();

  console.error(error);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Card>
        <CardContent>
          <Stack justifyContent="center" gap={2}>
            <Typography variant="h3" gutterBottom textAlign="center">
              Error
            </Typography>
            <Typography gutterBottom>
              {t('message.error.something')}
              <br/>
              {t('message.error.info')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(-1)} 
            >
              {t('dashboard.goBack')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
