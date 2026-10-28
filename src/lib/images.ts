import type { ImageMetadata } from 'astro'

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
)

/** Resolves a content path relative to src/assets; content:check guarantees it exists. */
export function resolveImage(path: string): ImageMetadata {
  const image = images[`/src/assets/${path}`]
  if (!image) throw new Error(`Image not found in src/assets: ${path}`)
  return image.default
}
