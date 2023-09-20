import React from "react";
import {useProtototoMatchesQuery} from "../../api/endpoints/protototo.ts";
import {Loading} from "../Loading.tsx";
import {Match} from "./Match.tsx";

interface ExternalMatchesProps {
  firstName: string;
  lastName: string;
  email: string;
}

export const ExternalMatches: React.FC<ExternalMatchesProps> = ({ firstName, lastName, email }) => {
  const { data, isLoading } = useProtototoMatchesQuery(undefined, {refetchOnMountOrArgChange: true});

  if (isLoading) {
    return <Loading/>
  }

  return (
    <>
      {data?.data.map((match) => (
        <Match home={match.match.homeTeam} away={match.match.awayTeam} date={match.match.playDate} matchId={match.match.id} gender={match.match.gender} previousBet={match.prediction} firstName={firstName} lastName={lastName} email={email}/>
      ))}
    </>
  )
}
