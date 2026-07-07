# CoverSlide Representation and Rendering Rules

The `CoverSlide` is a premium 3:4 landscape ratio card designed to showcase interactive previews of files and folder structures inside the simulation workspace.

## 1. Dimensional Ratio & Layout
- **Dimensions**: Aspect-ratio of 3:4 landscape (represented as a fluid Tailwind `aspect-[4/3]` rectangular container).
- **Styling**: `bg-white rounded-3xl border border-[#E9EEF6] shadow-2xs hover:shadow-md hover:border-blue-400/70 p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none`.
- **Spacing / Padding**: Strict 16px padding (`p-4`) on the card itself, with generous spacing between inner components; title block at the top, preview window at the lower section of the container.

## 2. Icon & Typography Pairings
- **Leader Icon**: Displays either a standard folder icon or a specific Google Drive file type icon representing the underlying resource type at `24px` height (`h-6 w-6`).
- **Heading Title**: Rendered in regular display weight (400) at 18px-23px (`text-lg sm:text-[23px] font-sans font-normal text-slate-800`), truncated elegantly with `truncate` if long.

## 3. Preview Container Rules (Lower Window)
Each slide renders a context-specific preview depending on either the folder name or the file's mimeType:

### A. Real Google Drive Previews & Document Artifacts
- **File Preview Artifact Requirement**: Real file previews (Google Docs, Slides, Sheets) render through the underlying preview viewer.
- **Filling the Frame**: The preview artifact MUST totally fill its container box (`w-full h-full`) to ensure readability without being scaled down to a tiny box.
- **Chrome Removal Requirement**: For Google Slides or Sheets with multiple tabs/worksheets, all player controls, grey/black bottom navigation toolbars, and sheets tab bars MUST be stripped out. Show only the pure, distraction-free first slide or first sheet canvas in the preview.
- **Clipped and Outlineless**: The preview container must use `overflow-hidden` and have NO surrounding black borders or stroke outlines (`border-none`, no stroke). The iframe/artifact is automatically oversized slightly and offset (e.g. nested scale or margin offsets like `w-[114%] h-[114%] -top-[7%] -left-[7%]`) inside the container to clip out any native outer borders, chrome margins, or scrollbar artifacts of the external Google Drive preview viewer interface.

### B. Segmented Previews & Mock Layouts
- **Marketing/Branding**: Display a row/gallery of multiple adjacent, vertical, rounded mock-cover panels with colourful, modern, paper-like borders.
- **Analytical & Financial Sheets (Sales)**: Display prominent single KPI headers (e.g., `$32,550`, `+24.08% Growth`) aligned with a subtle flowing SVG area gradient stroke.
- **Financial Operations**: Render horizontal visual status bar graphs showing resource allocation.
- **System Performance / Metrics (Support)**: Render a vertical queue of colored status items representing incoming tickets or return requests with light backgrounds.
