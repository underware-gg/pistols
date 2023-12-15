import React from 'react'
import Link from 'next/link'
import { Grid } from 'semantic-ui-react'

//
// Generic error page
// https://nextjs.org/docs/advanced-features/custom-error-page
//

function ErrorPage(
  // {statusCode}
) {
  return (
    <div className='App'>

      <div className='AlignTop'>
        <hr />

        <h3>404: Page not found</h3>
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
