import { Card, CardContent } from "@mui/material"
import React from "react"
import { ChangePassword as ChangePasswordForm } from "../../../forms/change-password/change-password.form"

export const ChangePassword: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <ChangePasswordForm/>
      </CardContent>
    </Card>
  ) 
}
