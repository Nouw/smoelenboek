import React from "react";
import {UserForm} from "../../../components/form/user/UserForm";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const { t } = useTranslation(["user"]);

  return <UserForm method="post" message={t("user:create-user")}/>
}
