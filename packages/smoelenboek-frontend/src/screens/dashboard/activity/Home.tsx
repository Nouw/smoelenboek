import React from "react";
import {Box, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {useGetActivitiesQuery} from "../../../api/endpoints/activity.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Options} from "../../../components/dashboard/Options.tsx";
import {useNavigate} from "react-router-dom";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const { isLoading, data } = useGetActivitiesQuery(undefined);

  if (isLoading) {
    return <Loading />
  }

  return <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Date</TableCell>
          <TableCell align="right">Options</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data && data.data.map((activity) => (
          <TableRow key={activity.id}>
            <TableCell>{activity.title}</TableCell>
            <TableCell>{activity.date.toString()}</TableCell>
            <TableCell align="right">
              <Options>
                  <MenuItem onClick={() => navigate(`edit/${activity.id}`)}>
                    Details
                  </MenuItem>
              </Options>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
}
