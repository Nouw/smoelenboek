import React from "react";
import {useParams} from "react-router-dom";
import {useProtototoMatchMutation} from "../../../../api/endpoints/protototo.ts";
import {Loading} from "../../../../components/Loading.tsx";
import {Match} from "../../../../components/protototo/Match.tsx";

interface ResultProps {

}

export const Result: React.FC<ResultProps> = () => {
  const params = useParams();

  // TODO: Change this into a query
  const [getMatch, { data: match }] = useProtototoMatchMutation()

  React.useEffect(() => {
    const getData = async () => {
      await getMatch(parseInt(params.matchId as string));
    }

    getData()
  }, [params])

  if (!match) {
    return <Loading/>
  }

  return <Match home={match.data.homeTeam} away={match.data.awayTeam} date={match.data.playDate} matchId={match.data.id} gender={match.data.gender} result/>
}
