import { type NextRequest } from 'next/server'
import { duel_token as token } from '@underware_gg/pistols-sdk/pistols/tokens'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ duel_id: string }> }
) {
  // route slug
  const { duel_id } = await params
  // url params
  const searchParams = request.nextUrl.searchParams
  const props: token.DuelSvgProps = {
    // base_uri: 'https://assets.underware.gg',
    duel_id: BigInt(duel_id),
    profile_type_a: searchParams.get('profile_type_a') as constants.ProfileType || constants.ProfileType.Undefined,
    profile_id_a: parseInt(searchParams.get('profile_id_a') || '0'),
    profile_type_b: searchParams.get('profile_type_b') as constants.ProfileType || constants.ProfileType.Undefined,
    profile_id_b: parseInt(searchParams.get('profile_id_b') || '0'),
    state: searchParams.get('state') as constants.ChallengeState || constants.ChallengeState.Null,
    winner: parseInt(searchParams.get('winner') || '0'),
  }
  const svg = token.renderSvg(props)

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}