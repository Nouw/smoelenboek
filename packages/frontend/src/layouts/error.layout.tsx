import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { ErrorResponse, useRouteError } from "react-router-dom";

export const ErrorLayout: React.FC = () => {
  const error = useRouteError() as ErrorResponse;

  return (
    <Card>
      <CardContent>
        <Stack
          flex={1}
          direction="row"
          alignItems="center"
          justifyContent="center"
          height="100vh"
        >
          <Typography variant="h2" fontWeight="bold">
            {error.status}
          </Typography>
          <Divider orientation="vertical" sx={{ height: 40, marginX: 2 }} />
          <Typography variant="h2">{error.statusText}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
