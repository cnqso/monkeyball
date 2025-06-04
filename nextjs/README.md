# Monkey Distribution System (MDS)

A Next.js application for managing Bloons TD tournaments with monkey distribution and congress management.

## Features

- **Congress Management**: Create and manage tournament congresses
- **Live Rounds**: Create live rounds that can be finished later with scores
- **Player Management**: Add players with custom monkey assignments
- **Round Tracking**: Track round results, rankings, and statistics
- **Custom Loaders**: Animated loading indicators with randomized GIFs

## Custom Loading System

The application uses a custom `LoadingSpinner` component that randomly selects from 4 different animated GIFs to provide visual variety during loading states.

### Setup

Place your custom loader GIFs in the `public/loaders/` directory:
- `public/loaders/1.gif`
- `public/loaders/2.gif`
- `public/loaders/3.gif`
- `public/loaders/4.gif`

### Usage

```tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With custom size
<LoadingSpinner size="lg" />

// With custom styling
<LoadingSpinner size="md" className="my-8" />
```

### Sizes Available
- `sm`: 128x128px container (w-32 h-32) - for ~60px visible content
- `md`: 192x192px container (w-48 h-48) - for ~90px visible content - default
- `lg`: 256x256px container (w-64 h-64) - for ~120px visible content

**Note**: These sizes are optimized for GIFs with ~30x30px central content surrounded by transparent/empty space.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Workflow

1. **Create Congress**: Set up a new tournament with selected players
2. **Create Live Rounds**: Generate rounds with monkey distribution
3. **Monitor Progress**: Live rounds display animated "LIVE" badges
4. **Finish Rounds**: Add scores and complete rounds when ready
5. **View Results**: See final rankings and statistics

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
