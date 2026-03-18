import { Mail, Phone } from "@mui/icons-material";
import { Avatar, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import React from "react";

type VCPT = {
  name: string,
  phone: string,
  email: string,
  avatar: string,
}

const people: VCPT[] = [
  { name: 'Annebel Schouwenaar', phone: '+31 6 19819974', email: 'vcp-intern@usvprotos.nl', avatar: 'annebel.jpeg' },
  { name: 'Jasper Wolfs', phone: '+31 6 30477445', email: 'vcp-intern2@usvprotos.nl', avatar: 'jasper.jpeg' },
  { name: 'Silke Geraats', phone: 'Telefoonnummer op aanvraag bij het bestuur', email: 'vcp-alumnus@usvprotos.nl', avatar: 'silke.jpg' }
  ]

export const VCP: React.FC = () => {
  return (
    <Stack direction="row" justifyContent="space-evenly">
      {people.map((person) => (
        <Card>
          <CardContent>
            <Avatar alt={person.name} src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/user/${person.avatar}`} sx={{ width: 200, height: 200, marginLeft: 'auto', marginRight: 'auto' }} />
            <Typography variant="h4" align="center">{person.name}</Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Mail color="primary" />
                </ListItemIcon>
                <ListItemText primary={person.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Phone color="primary" />
                </ListItemIcon>
                <ListItemText primary={person.phone} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
