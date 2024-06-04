import React from "react";
import { useCommitteesQuery } from "../../../api/endpoints/committees";
import { FormControl, InputLabel, MenuItem, Select, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";

type CommitteeSelectorProps = {
  value: number;
  onChange: (value: number) => void;
}

export const CommitteeSelector: React.FC<CommitteeSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation(["committee"]);

  const { data, isLoading } = useCommitteesQuery(null);

  if (isLoading) {
    return <Skeleton variant="text" />
  }

  const committees = data?.data.map((committee) => ({ id: committee.id, name: committee.name }))

  return (
    <FormControl fullWidth>
      <InputLabel id="committee-selector-label">{t("committees")}</InputLabel>
      <Select label={t("committees")} labelId="committee-selector-label" value={value} onChange={(e) => onChange(e.target.value as number)}>
        {committees?.map((committee) => (
          <MenuItem value={committee.id}>{committee.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
