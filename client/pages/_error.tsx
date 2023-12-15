import React from 'react'
import Link from 'next/link'
import { Grid } from 'semantic-ui-react'

//
// Generic error page
// https://nextjs.org/docs/advanced-features/custom-error-page
//

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

function ErrorPage({ statusCode }) {
  const errorMessage =
    parseInt(statusCode) == 404 ? `404: Page not found`
      : statusCode ? <div>A <b>{statusCode}</b> server error occurred</div>
        : <div>A client error occurred</div>;
  return (
    <div className='App'>

      <div className='AlignTop'>
        <hr />

        <h3>{errorMessage}</h3>
        {/* <p>If the error persists, please <Link href='/help#connect'>contact us</Link></p> */}

        <hr />
        <Grid columns={2}>
          <Grid.Column className='AlignCenter'>
            <Link href='/'>Home</Link>
          </Grid.Column>
        </Grid>
      </div>

    </div>
  );
}

export default ErrorPage
