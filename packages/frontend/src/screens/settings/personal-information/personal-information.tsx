import { Card, CardContent } from "@mui/material";
import React from "react";
import { PersonalInformationForm } from "../../../forms/personal-information/personal-information.form";

export const PersonalInformation: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <PersonalInformationForm />
      </CardContent>
    </Card>
  )
}
