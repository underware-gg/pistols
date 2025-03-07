import { type NextRequest } from 'next/server'
import { duelist_token as token } from '@underware_gg/pistols-sdk/pistols/tokens'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ duelist_id: string }> }
) {
  // route slug
  const { duelist_id } = await params
  // url params
  const searchParams = request.nextUrl.searchParams
  const props: token.DuelistSvgProps = {
    // base_uri: 'https://assets.underware.gg',
    duelist_id: BigInt(duelist_id),
    owner: searchParams.get('owner') || '0x0',
    username: searchParams.get('username') || '',
    honour: parseInt(searchParams.get('honour') || '0'),
    archetype: searchParams.get('archetype') as constants.Archetype || constants.Archetype.Undefined,
    profile_type: searchParams.get('profile_type') as constants.ProfileType || constants.ProfileType.Undefined,
    profile_id: parseInt(searchParams.get('profile_id') || '0'),
    total_duels: parseInt(searchParams.get('total_duels') || '0'),
    total_wins: parseInt(searchParams.get('total_wins') || '0'),
    total_losses: parseInt(searchParams.get('total_losses') || '0'),
    total_draws: parseInt(searchParams.get('total_draws') || '0'),
    fame: parseInt(searchParams.get('fame') || '0'),
    lives: parseInt(searchParams.get('lives') || '0'),
    is_memorized: searchParams.get('is_memorized') === 'true',
    duel_id: parseInt(searchParams.get('duel_id') || '0'),
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
