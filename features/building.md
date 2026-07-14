# Building State

The building state UI has been enhanced with the following features when `isLoading` is active:

- **Undulating Glow & Animated Step Cards**: Replaced static progress indicators with undulating background accents and expandable step execution cards in the chat sidebar.
- **Dynamic Task Title**: The canvas displays a centered title using the text `Building your [task]...`, where `[task]` is dynamically populated from the last user message.
- **Single Unified Loading State**: Eliminates duplicate competing loading animations. While the AI model generates code, `<AppView/>` displays a single clean centered indicator ("Assembling application code..."). As soon as output arrives, `srcDoc` evaluates to true and mounts the interactive web application iframe directly.
- **Resilient Stream Delta Extraction**: Real-time SSE streaming (`/api/vibe-code`) continuously appends text deltas and parses complete HTML output across all interaction steps, seamlessly updating the running iframe when code generation completes.

