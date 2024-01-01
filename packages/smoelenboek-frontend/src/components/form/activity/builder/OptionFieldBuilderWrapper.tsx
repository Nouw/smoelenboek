import { Delete, DragIndicator } from "@mui/icons-material";
import { Box, IconButton, Paper, Stack } from "@mui/material";
import React from "react";

interface OptionFieldBuilderWrapperProps {
  onDelete?: () => void;
  children: React.ReactNode;
}

export const OptionFieldBuilderWrapper: React.FC<OptionFieldBuilderWrapperProps> = (
  { children, onDelete },
) => {
  function remove() {
    if (onDelete !== undefined) {
      onDelete();
    }
  }

  return (
    <Paper elevation={2}>
      <Box p={2} my={1}>
        <Stack direction="row" alignItems="center" gap={2}>
          <DragIndicator />
          {children}
          {onDelete != undefined && (
            <IconButton size="small" onClick={remove} sx={{ ml: "auto" }}>
              <Delete />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};
