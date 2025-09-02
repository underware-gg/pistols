

//
// usage example:
//
// type ChallengeOpponentResponseRaw = Array<{
//   duel_id: string;
//   state: constants.ChallengeState;
//   address_a: string;
//   address_b: string;
// }>;
// // format we need
// type ChallengeOpponentResponse = {
//   duelId: bigint;
//   state: constants.ChallengeState;
//   addressA: bigint;
//   addressB: bigint;
// };
// function formatFn(rows: ChallengeOpponentResponseRaw): ChallengeOpponentResponse | null {
//   return rows.length > 0 ? {
//     duelId: BigInt(rows[0].duel_id),
//     state: parseEnumVariant<constants.ChallengeState>(rows[0].state) as constants.ChallengeState,
//     addressA: BigInt(rows[0].address_a),
//     addressB: BigInt(rows[0].address_b),
//   } : null;
// }
// const query = `select duel_id, state, address_a, address_b, from "pistols-Challenge" where duel_id = "${bigintToAddress(duelId)}"`;
// const response = await queryTorii(slqlUrl, query, formatFn);
//

export async function queryToriiSql<ResponseRaw, Response>(
  slqlUrl: string,
  query: string,
  formatFn: (rows: ResponseRaw) => Response
): Promise<Response> {
  const _query = query.split('\n').join(' ').trim(); // remove newlines
  try {
    const response = await fetch(slqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: _query,
    });
    if (!response.ok) {
      console.error(`queryToriiSql() response not ok:`, response, query);
      throw new Error(`queryToriiSql() response not ok`);
    }
    return formatFn(await response.json() as ResponseRaw);
  } catch (error) {
    console.error(`queryToriiSql() Error fetching data:`, error, query);
    throw error;
  }
}
