import React from 'react'
import Head from 'next/head'

export interface HeaderData {
  title?: string
  desc?: string
  url?: string
  logoUrl?: string
  xHandle?: string
}

export function AppHeader({
  headerData = {}
}: {
  headerData: HeaderData
}) {
  const domain = process.env.SERVER_URL

  let title = headerData.title ?? 'Underware.gg'
  let desc = headerData.desc ?? 'Fully on-chain game made with Dojo'
  let url = domain + (headerData.url ?? 'https://underware.gg')
  let logoUrl = domain + (headerData.logoUrl ?? '/images/logo.png')
  let xHandle = domain + (headerData.xHandle ?? '@underware_gg')

	return (
		<Head>
      <title key='title'>{title}</title>
      <link rel='icon' href='/favicon.ico' />

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <meta key='social_url' property='og:url' content={url} />
			<meta key='social_title' property='og:title' content={title} />
			<meta key='social_desc' property='og:description' content={desc} />
      <meta key='social_image' property='og:image' content={logoUrl} />
			<meta key='social_image_type' property='og:image:type' content={'image/png'} />

			<meta key='twitter_card' name='twitter:card' content='summary' />
      <meta key='twitter_site' name='twitter:site' content={xHandle} />
      <meta key='twitter_image' name="twitter:image" content={logoUrl} />
      <meta key='twitter_creator' name='twitter:creator' content={xHandle} />
			<meta key='twitter_description' name="twitter:description" content={desc} />

		</Head>
	);
}

