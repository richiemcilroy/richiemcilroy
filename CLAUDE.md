# CLAUDE.md

## Project Overview

Personal website built with Next.js 16, React 19, and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with React Compiler
- **Styling**: Tailwind CSS v4
- **Data Fetching**: TanStack Query for complex async operations
- **Schema/Types**: Effect-ts for schema validation and type-safe data structures
- **Linting/Formatting**: Biome

## Design Philosophy

### Minimal, Content-First

- Prioritize content over decoration
- Functional minimalism - every element serves a purpose
- Generous whitespace and breathing room
- Clear visual hierarchy through typography and spacing, not color

### Color Palette

**No accent colors.** Strict greyscale only:

- **Dark mode**: Dark backgrounds (`zinc-950`, `zinc-900`), grey (`zinc-400`, `zinc-500`) and white text
- **Light mode**: Light backgrounds (`white`, `zinc-50`), grey (`zinc-500`, `zinc-600`) and dark text (`zinc-900`)

Use `dark:` variants for all color classes. Example:
```tsx
<p className="text-zinc-600 dark:text-zinc-400">Secondary text</p>
<h1 className="text-zinc-900 dark:text-white">Heading</h1>
```

### Typography

- System font stack for performance and native feel
- Limited font sizes - prefer `text-sm`, `text-base`, `text-lg`
- Use font weight for hierarchy (`font-normal`, `font-medium`)
- Metadata/secondary text in smaller, muted grey

### Spacing

- Consistent vertical rhythm
- Generous margins between sections
- Prefer `space-y-*` and `gap-*` over individual margins
- Standard spacing scale: `4`, `6`, `8`, `12`, `16`, `24`

### Layout

- Flat information architecture
- Max content width (`max-w-2xl` or `max-w-3xl`)
- Centered layouts with horizontal padding
- Mobile-first responsive design

## Code Conventions

### Components

```tsx
// Prefer simple, single-purpose components
// No unnecessary abstractions

export function ArticleItem({ title, date, readTime }: Props) {
  return (
    <article className="space-y-1">
      <h2 className="text-zinc-900 dark:text-white font-medium">{title}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {date} · {readTime}
      </p>
    </article>
  );
}
```

### Data Fetching with TanStack Query

Use for any async operations that benefit from caching, refetching, or loading states:

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";

// Queries
const { data, isLoading } = useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
});

// Mutations
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
});
```

### Schema Validation with Effect-ts

Use Effect Schema for runtime type validation:

```tsx
import { Schema } from "effect";

const Post = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  content: Schema.String,
  createdAt: Schema.Date,
});

type Post = Schema.Schema.Type<typeof Post>;

// Decode unknown data
const decode = Schema.decodeUnknownSync(Post);
```

### File Structure

```
app/
  layout.tsx        # Root layout with theme support
  page.tsx          # Home page
  posts/
    page.tsx        # Posts list
    [slug]/
      page.tsx      # Individual post
  globals.css       # Tailwind imports + minimal custom styles
```

### Styling Guidelines

1. **Use Tailwind utilities directly** - avoid `@apply` unless absolutely necessary
2. **Keep class lists readable** - break into multiple lines if needed
3. **Consistent ordering**: layout → spacing → sizing → typography → colors → states
4. **No custom colors** - use zinc scale only

```tsx
// Class ordering example
<div
  className={cn(
    "flex flex-col",           // layout
    "gap-4 p-6",               // spacing
    "w-full max-w-2xl",        // sizing
    "text-sm font-medium",     // typography
    "text-zinc-600 dark:text-zinc-400",  // colors
    "hover:text-zinc-900 dark:hover:text-white"  // states
  )}
/>
```

### Dark Mode

Use `next-themes` or native CSS with `prefers-color-scheme`:

```tsx
// Tailwind dark mode via class strategy
<html className="dark">
  {/* dark: variants now active */}
</html>
```

Always provide both light and dark variants for colors.

## Commands

```bash
bun dev      # Start development server
bun build    # Production build
bun lint     # Run Biome linting
bun format   # Format with Biome
```

## Principles

1. **Simplicity over cleverness** - readable code wins
2. **Content over chrome** - let the content breathe
3. **Consistency over novelty** - stick to established patterns
4. **Performance by default** - minimal dependencies, efficient rendering
