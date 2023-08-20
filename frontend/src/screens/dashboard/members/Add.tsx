import React from "react";
import {UserForm} from "../../../components/form/user/UserForm";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const { t } = useTranslation();

  return <UserForm method="post" message={t("message.user.create")}/>
}
