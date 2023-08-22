import React from "react";
import {useProtototoMatchesQuery} from "../../api/endpoints/protototo";
import {CircularProgress, Stack} from "@mui/material";
import {Match} from "../../components/protototo/Match";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const { data: matches, isLoading } = useProtototoMatchesQuery();

  if (isLoading) return <CircularProgress/>

  return <>
    <Stack direction="column" gap={5}>
      {matches?.data.map((item) => (
        <Match home={item.match.homeTeam} away={item.match.awayTeam} date={item.match.playDate} gender={item.match.gender} matchId={item.match.id} previousBet={item.prediction}/>
      ))}
    </Stack>
  </>;
}
