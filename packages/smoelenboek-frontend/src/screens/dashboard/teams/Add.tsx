import React from "react";
import {TeamForm} from "../../../components/form/team/TeamForm";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const { t } = useTranslation();

  return <TeamForm method="post" message={t("message.teams.create")}/>
}
