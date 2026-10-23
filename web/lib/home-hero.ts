/**
 * Optional hero photograph. The landing page uses it only when the file exists under public/,
 * so the hero falls back to the guilloché seal until a licensed photo is added.
 * Record its source and licence in public/hero/CREDITS.md.
 */
export const HERO_PHOTO: { src: string; credit: string; href: string } | null =
  {
    src: "hero/hero.jpg",
    credit: "Shalom Mwenesi on Unsplash",
    href: "https://unsplash.com/photos/9QFSXyF2Ipo",
  }
