import React from "react";
import {Card, CardContent} from "@mui/material";
import {ChangePasswordForm} from "../../components/form/settings/ChangePasswordForm";

interface ChangePasswordProps {

}

export const ChangePassword: React.FC<ChangePasswordProps> = () => {
  return (
    <Card>
      <CardContent>
        <ChangePasswordForm/>
      </CardContent>
    </Card>
  )
}
