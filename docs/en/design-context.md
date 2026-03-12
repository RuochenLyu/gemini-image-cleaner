## Design Context

### Users

- The primary users are everyday Gemini image users who need a fast way to remove watermarks.
- They want to complete one specific task quickly without learning a complex workflow or facing a “professional tool” style interface.
- Their main job is simple: upload images, get downloadable results quickly, and clearly understand that everything stays local in the browser.

### Brand Personality

- Brand keywords: simple, easy to use, friendly.
- Emotional goal: light and pleasant, not serious, technical, or intimidating.
- The product voice should stay direct, clear, and warm, while avoiding exaggerated marketing language or “AI wrapper product” tone.

### Aesthetic Direction

- The visual direction is light-mode only, built around `🍌`, banana yellow, and cream, but it should still feel like a lightweight tool rather than a product landing page.
- The component layer should stay on top of a lightweight `shadcn/ui + Radix` design system so colors, radii, focus states, and overlays all come from one token set.
- Small brand details are fine, but avoid decorative overload, long storytelling sections, or anything that makes the page feel like a landing page.
- Interactions should prioritize clarity, low learning cost, and visible progress; motion should only support state changes, hover feedback, upload feedback, and preview switching.

### Design Principles

- Single-task focus: every element should support the core path of upload, process, preview, and download.
- Minimal explanation: keep only one or two necessary lines of guidance by default, and avoid FAQ, walkthrough, or marketing-style sections on the main screen.
- Light but reliable: keep the experience friendly and upbeat while making state feedback and downloads feel trustworthy.
- Product over tool site: reduce noise, feature stacking, and density; keep hierarchy and rhythm comfortable.
- Simple by default: avoid unnecessary decisions, keep important actions obvious, and reveal complexity only when needed.
- Design-system first: prefer shared components, semantic colors, and stable interaction patterns over one-off controls.
- Self-explanatory first screen: upload methods, the local-only promise, and the result flow should all be understandable without extra instruction.
- Light-mode consistency: future visual work should assume a light-only product and keep colors, shadows, and illustration choices aligned with that constraint.
