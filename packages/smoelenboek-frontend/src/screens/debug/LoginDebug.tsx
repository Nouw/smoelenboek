import React from "react";
import {useLoginMutation} from "../../api/endpoints/auth";
import {Button, Card, CardContent, CircularProgress, TextField} from "@mui/material";

interface LoginDebugProps {

}

export const LoginDebug: React.FC<LoginDebugProps> = () => {
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const submit = async () => {
    try {
      console.log({ email, password });
      const user = await login({email, password}).unwrap();
      console.log(user);
    } catch (e) {
      console.error(e);
    }
  }

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Card>
      <CardContent>
        <TextField label="email" onChange={(e) => setEmail(e.target.value)} />
        <TextField label="password" onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={() => submit()}>Submit</Button>
      </CardContent>
    </Card>
  )
}
