# La Cesoteca

A minimal, editorial-style website built with **Next.js (App Router)**, **TypeScript**, and **TailwindCSS**.  
Always **white background (#ffffff)** and **black text (#000000)**, with lots of whitespace and a handmade / poetic feel.

## Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS

## Project Structure (key folders)

- `app/` → App Router pages, layout, and global styles
- `components/` → UI components (Sidebar, Hero, Animation showcase)
- `public/animations/` → logo/illustration animation assets (mp4 for now)

## Animations

Place your files here:

`public/animations/`

Default filenames used by the UI:

- `writing.mp4`
- `page-turn.mp4`
- `lean-arm.mp4`
- `close-book.mp4`
- `check-devils.mp4`
- `final-placeholder.png` (optional poster/fallback)

If your files have different names, update them in:
`components/AnimationShowcase.tsx`

## Running the project

Install dependencies:

```bash
npm install
```
