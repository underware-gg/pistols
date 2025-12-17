const DEFAULT_QUIZROOM_META = {
  title: 'Pistols at Dawn - Quiz Party',
  description: 'Test your knowledge in the Quiz Room. Challenge yourself and compete with other players!',
  image: 'https://assets.underware.gg/misc/bg_quizroom_final.png',
}

const SOSIJ_QUIZROOM_META = {
  title: 'Merry Quizmas at the Fools & Flintlock!',
  description: 'Test your knowledge in the Merry Quizmas Party. Challenge yourself and compete with others for prizes!',
  image: 'https://assets.underware.gg/misc/Cumberlord_Christmas_2025.png',
}

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Only process HTML requests for quizroom routes
  const isSosijParty = pathname.startsWith('/quizroom/MerryQuizmas')
  const isQuizRoom = pathname.startsWith('/quizroom')
  const isHtmlRequest = request.headers.get('accept')?.includes('text/html')

  const meta = isSosijParty ? SOSIJ_QUIZROOM_META : isQuizRoom ? DEFAULT_QUIZROOM_META : null
  
  if (meta !== null && isHtmlRequest) {
    // Fetch the index.html - use the root path which will be rewritten to index.html
    const baseUrl = new URL('/', url.origin)
    const indexResponse = await fetch(baseUrl.toString(), {
      headers: {
        'Accept': 'text/html',
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })
    
    if (indexResponse.ok) {
      let html = await indexResponse.text()
      const currentUrl = url.toString()

      // Replace meta tags for quizroom using more flexible regex
      html = html.replace(
        /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:title" content="${meta.title}" />`
      )
      html = html.replace(
        /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:description" content="${meta.description}" />`
      )
      html = html.replace(
        /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:url" content="${currentUrl}" />`
      )
      html = html.replace(
        /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:image" content="${meta.image}" />`
      )
      html = html.replace(
        /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="twitter:image" content="${meta.image}" />`
      )
      html = html.replace(
        /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="twitter:description" content="${meta.description}" />`
      )
      html = html.replace(
        /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="description" content="${meta.description}" />`
      )

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  }

  // For non-quizroom routes or non-HTML requests, pass through
  return new Response(null)
}

export const config = {
  matcher: [
    '/quizroom/:path*',
  ],
}

