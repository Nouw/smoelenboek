import React from "react";
import {CommitteeForm} from "../../../components/form/committee/CommitteeForm";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const { t } = useTranslation();

  return <CommitteeForm method="post" message={t("message.committee.create")} />
}
