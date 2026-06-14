# Design System

## Brand Direction

One Way Solutions should feel like a refined industrial catalog, not a generic online shop. The visual system uses real product imagery, disciplined spacing, precise typography, and a restrained technical palette based on the existing navy and orange logo.

Physical scene: a procurement engineer reviews equipment options on a laptop in a bright office before calling suppliers for a project quote. This calls for a light, high-contrast interface with dense but orderly catalog surfaces.

## Color Strategy

Use a restrained product palette with brand accents. Navy carries authority, orange marks decisive actions, and steel neutrals keep catalog imagery readable.

Use OKLCH/CSS tokens in implementation.

- Background: tinted off-white, not pure white
- Surface: cool white with subtle blue-gray tint
- Primary text: deep navy
- Secondary text: steel gray
- Accent: controlled industrial orange
- Info/action blue: restrained deep blue
- Success: muted green
- Warning: amber
- Error: accessible red
- Border: low-chroma blue-gray

Avoid saturated blue/orange dominance across the whole page. Orange should be reserved for quote actions, active states, and small emphasis.

## Typography

English-first interface:

- Primary UI font: system sans stack for speed and reliability
- Arabic-ready font: Noto Sans Arabic loaded with font-display swap when Arabic mode is introduced
- Numbers and tables: tabular figures

Type hierarchy should be strong but not theatrical. Landing headings can be large and confident. Product/admin labels should stay compact and predictable.

Rules:

- Body text minimum 16px on mobile
- Long prose capped at 65-75ch
- Buttons and labels use clear sentence/title case, not all caps
- No negative letter spacing

## Layout

Public website:

- Landing page first, with visible product/category signal in the first viewport
- Open catalog browsing without login
- Category navigation designed for scanning
- Product grids with stable image aspect ratios
- Quote tray/cart always easy to reach, but never blocking catalog browsing

Admin:

- Separate private subdomain
- Dense but calm app shell
- Sidebar or top navigation on desktop, compact navigation on mobile
- Tables convert to responsive cards or horizontally scroll inside constrained wrappers on small screens

Breakpoints to verify:

- 375px
- 768px
- 1024px
- 1440px

## Components

Use consistent components for:

- Header and navigation
- Category filters
- Product cards
- Product image galleries
- Quote tray
- Quote form
- Status badges
- Empty states
- Loading skeletons
- Admin tables
- Admin forms
- Confirmation and error messages

Cards should be functional containers for individual products or admin records, not decorative page sections. Do not nest cards.

## Imagery

Use the provided catalog images as primary visual evidence. Every meaningful image needs descriptive alt text. Product cards must reserve stable image space to avoid layout shift.

Hero imagery should show real industrial product context or a curated product montage, not generic office photos or abstract gradients.

## Motion

Use limited motion:

- 150-250ms hover/focus/active transitions
- Transform/opacity only
- Reduced-motion support
- No decorative page-load choreography in admin
- Public landing can use subtle reveal motion only if it does not delay interaction

## Forms

Quote request form appears only after the customer has selected items or intentionally opens quote request.

Required fields:

- Name
- Phone
- Email or company email
- Company or organization

Optional fields:

- Message
- Project location
- Item-specific notes

Rules:

- Visible labels, never placeholder-only labels
- Inline field errors
- Loading state on submit
- Clear success confirmation
- Public users cannot read submitted quote requests

## RTL And Localization

The first release is English-first. The structure must remain Arabic-ready:

- Avoid hardcoded left/right in layout
- Use logical spacing where practical
- Icons that imply direction must be reviewed for RTL
- Text should wrap instead of truncating critical content
- Arabic copy may expand significantly compared with English

## Implementation Guardrails

- No customer login
- Admin login only on `admin.onewaysolutions-eg.com`
- No prices in public UI
- No payment or checkout flow
- Public can browse all published catalog content
- Customer details collected only at quote submission
- Service/secret Supabase keys never exposed to browser code
