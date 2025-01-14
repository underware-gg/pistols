import React, { useMemo } from 'react'
import { useRouteError } from 'react-router';
import { Grid } from 'semantic-ui-react'

//
// REF:
// https://reactrouter.com/6.28.1/route/error-element
//

function ErrorPage() {
  const error = useRouteError()
  const errorStatus = useMemo(() => (error as { status: number }).status, [error]);

  const errorMessage = useMemo(() => (
    errorStatus == 404 ? `404: Page not found`
      : errorStatus ? <div>A <b>{errorStatus}</b> server error occurred</div>
        : <div>A client error occurred</div>
  ), [errorStatus]);

  return (
    <div className='App'>

      <div className='AlignTop'>
        <hr />

        <h3 className='TitleCase'>{errorMessage}</h3>
        {/* <p>If the error persists, please <Link href='/help#connect'>contact us</Link></p> */}

        <hr />
        <Grid columns={1}>
          <Grid.Column className='AlignCenter' align='left'>
            <a href='/' onClick={(e) => {
              e.preventDefault()
              window.location.href = '/'
            }}>Back to the Gate</a>
          </Grid.Column>
        </Grid>
      </div>

    </div>
  );
}

export default ErrorPage
