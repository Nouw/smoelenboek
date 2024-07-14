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
  { name: 'Silke Geraats', phone: '+31 6 18984397', email: 'vcp-intern@usvprotos.nl', avatar: 'silke.jpg' },
  { name: 'Stan van Hees', phone: '+31 6 14658332', email: 'vcp-alumnus@usvprotos.nl', avatar: 'stan.jpeg' },
  { name: 'Rosanne Kars', phone: '+31 6 28496457', email: 'vcp-extern@usvprotos.nl', avatar: 'rosanne.jpeg' }
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
