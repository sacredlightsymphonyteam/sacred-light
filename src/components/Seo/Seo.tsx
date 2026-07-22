import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../../lib/site'

type SeoProps = {
  /** The page title — shows as the browser tab and the blue headline in Google. */
  title: string
  /** ~150–160 char summary — the grey blurb under the headline in search results. */
  description: string
  /** Route path of this page, e.g. '/' or '/gratitude'. Builds the canonical URL. */
  path?: string
  /** Image for social-share previews. Root-relative or absolute. */
  image?: string
  /** Open Graph type — 'website' for normal pages, 'article' for posts. */
  type?: string
  /** Structured-data "fact sheet(s)" (JSON-LD) for this page. */
  jsonLd?: object | object[]
  /** Keep this page out of search engines (e.g. unlisted pages). */
  noindex?: boolean
}

/**
 * Per-page SEO. Renders the title, description, canonical link, social-preview
 * (Open Graph + Twitter) tags, and any JSON-LD structured data.
 *
 * React 19 hoists the <title>/<meta>/<link> into <head> automatically, and
 * vite-react-ssg writes them into each page's pre-rendered HTML at build time —
 * so crawlers and link-preview bots read them without running any JavaScript.
 *
 * Reuse on every page: drop <Seo title=… description=… path=… /> at the top.
 */
export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoProps) {
  const url = SITE_URL + path
  const imageUrl = image.startsWith('http') ? image : SITE_URL + image
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph — previews on Facebook, WhatsApp, LinkedIn, iMessage, Slack */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter / X card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured data — the "fact sheet" Google reads to understand the page */}
      {blocks.map((block, i) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}
