// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
export async function GET(request: Request) {
  return new Response('Hello, Underworld!', {
    status: 200,
    // headers: {},
  })
}