# Building State

The building state UI has been enhanced with the following features when `isLoading` is active:

- **Undulating Glow**: Replaced the static loading bar with an undulating, glowing gradient background.
- **Dynamic Task Title**: The canvas now displays a centered title using the text `Building your [task]...`, where `[task]` is dynamically populated from the last user message.
- **Clean Canvas**: During the build phase, the standard canvas contents and top header controls (Segmented controls, Back, Expand) are hidden to maintain a distraction-free, immersive loading state.
