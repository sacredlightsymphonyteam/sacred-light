/**
 * Site-wide constants used to build SEO metadata.
 *
 * IMPORTANT: SITE_URL must be the final production domain, with no trailing slash.
 * Canonical links and social-preview (Open Graph) URLs are built from it and MUST
 * be absolute, so this needs to be correct before the public launch.
 */
export const SITE_URL = 'https://sacredlightsymphony.org' // TODO: confirm the real production domain
export const SITE_NAME = 'Sacred Light Symphony'

// Default image shown when a link is shared. Ideally a dedicated 1200×630 image;
// the hero poster stands in until that artwork exists.
export const DEFAULT_OG_IMAGE = '/hero-poster.jpg' // TODO: replace with a 1200×630 share image
