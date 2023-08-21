import React from "react";
import {Avatar, Card, CardContent, Stack, Typography} from "@mui/material";

interface VCPProps {

}

interface VCP {
  name: string,
  phone: string,
  email: string,
  avatar: string,
}

const people: VCP[] = [
  {name: 'Brian Groenewege', phone: '+31 6 31949300', email: 'vcp-intern@usvprotos.nl', avatar: 'brian.jpg'},
  {name: 'Stan van Hees', phone: '+31 6 14658332', email: 'vcp-alumnus@usvprotos.nl', avatar: 'stan.jpeg'},
  {name: 'Rosanne Kars', phone: '+31 6 28496457', email: 'vcp-extern@usvprotos.nl', avatar: 'rosanne.jpeg'}
]

export const VCP: React.FC<VCPProps> = () => {
  return (
    <Stack direction="horizontal" justifyContent="space-evenly">
      {people.map((person) => (
        <Card>
          <CardContent>
            <Avatar alt={person.name} src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/user/${person.avatar}`} sx={{ width: 200, height: 200, marginLeft: 'auto', marginRight: 'auto'}} />
            <Typography variant="h4" align="center">{person.name}</Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
    )

}
