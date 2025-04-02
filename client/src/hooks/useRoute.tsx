import { useLocation, useParams } from 'react-router'

export const useRoute = () => {
  // URL slugs (/path/slug)
  // https://api.reactrouter.com/v7/functions/react_router.useParams.html
  const params = useParams()

  const location = useLocation()

  return {
    pathname: location.pathname,
    slugs: {
      duel_id: params['duel_id'],
    },
  }
}

export const useRouteSlugs = () => {
  const { slugs } = useRoute()
  return slugs
}
