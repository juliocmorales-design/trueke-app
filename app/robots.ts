import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/perfil/edit', '/crear', '/offer/'],
    },
    sitemap: 'https://www.trueke.app/sitemap.xml',
  }
}
