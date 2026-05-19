import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.trueke.app', changeFrequency: 'daily', priority: 1 },
    { url: 'https://www.trueke.app/buscar', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://www.trueke.app/cadenas', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://www.trueke.app/terminos', changeFrequency: 'monthly', priority: 0.3 },
  ]
}
