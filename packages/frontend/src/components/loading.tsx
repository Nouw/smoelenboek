import { Box, CircularProgress } from "@mui/material"

export const Loading = () => {
  return (
    <Box display="flex" flex={1} justifyContent="center" alignItems="center" width="100vw" height="100vh">
      <CircularProgress />
    </Box>
  )
}
