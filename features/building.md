# Building State

The building state UI has been enhanced with the following features when `isLoading` is active:

- **Undulating Glow & Animated Step Cards**: Replaced static progress indicators with undulating background accents and expandable step execution cards in the chat sidebar.
- **Single Loading State UX**: Eliminates competing duplicate loading animations. While code generation proceeds, the main canvas viewport remains cleanly on the user's Space Dashboard or Home view, while the Left Chat sidebar renders the single active step card.
- **Resilient Universal Stream Delta Extraction**: Real-time SSE streaming (`/api/vibe-code`) dynamically inspects root `.text`, `.code`, `.content`, and `.delta` properties across event payloads. As soon as live HTML content (>30 chars) is parsed or generation finishes, `viewState` transitions to `'app'` mode with `srcDoc` fully populated, mounting the interactive web application iframe directly without blank or hanging states.
- **Mandated Environment Sanitation**: Guarantees `environment: "remote"` (or persistent `env_id`) is always supplied in `server.ts` during backend `ai.interactions.create` calls, preventing API 400 rejections.

