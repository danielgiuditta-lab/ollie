# Feature Specification — Projector Mode

Projector Mode is an interactive, full-screen viewport designed to showcase generated applications in their purest form. It strips away all surrounding workspace editing tools (chat sidebars, file list controllers, and navigation bars) to provide a clear, focused, and responsive presentation canvas for sharing prototypes with collaborators and stakeholders.

---

## 1. Product Vision & Layout
When Projector Mode is active, the viewport undergoes a dramatic, minimalist layout transformation:
- **Cinematic Backdrop**: The canvas expands to cover $100\%$ of the screen. Standard system navigation panels (Left Panel, Top Bar, Chat Panel) are completely hidden.
- **Embedded Sandbox**: The generated app is rendered inside a centered, securely bounded iframe.
- **Background Auto-Matched**: An ambient style scanner detects if the running application is dark or light under-the-hood and instantly transitions the outer cinematic container background to blend seamlessly with the app's native palette (e.g., dark slate vs. clean white).

---

## 2. Interactive Utility Bar (The Bottom Dock)
To preserve high usability, Projector Mode presents a floating, semi-transparent utility bar docked elegantly at the bottom center of the viewport:
* **App Context Badge**: Displays the descriptive name of the active prototype or workspace.
* **Reload Trigger**: A quick Refresh button that resets the underlying sandbox iframe immediately without reloading the entire parent browser session.
* **Viewport Resizer (Device Simulation Sandbox)**:
  * Allows presenters to quickly preview responsiveness through instant preset switches:
    * 📱 **Mobile**: Shrunk frame mimicking standard dimensions (e.g., `430px × 932px` - comparable to modern mobile viewports).
    * 📟 **Tablet**: Mid-scale frame mimicking classic portrait viewports (e.g., `768px × 1024px`).
    * 🖥️ **Full**: Fills the entire cinematic space (`100% × 100%`).
  * When device previews are active, the centered iframe is elegantly framed by subtle container drop shadows mimicking physical hardware borders.
* **Exit Controller**: A clearly labeled "Edit App" or "Back to Workspace" action, safely returning authenticated users carrying write permissions to the interactive developer workspace.

---

## 3. Deep Integration & Computed Theme Polling
To guarantee professional-grade immersion:
* **Style Detector Hook**: Incorporates continuous background style scanning on the iframe window:
  ```ts
  const frameBody = iframeRef.current?.contentWindow?.document.body;
  if (frameBody) {
    const computedBg = window.getComputedStyle(frameBody).backgroundColor;
    // Notify the parent react context to realign the parent projector frame's background
  }
  ```
* **Immersive Zero-Flicker Transitions**: State alterations (such as switching from full-width view to simulated mobile device sizes) are driven by smooth, hardware-accelerated motion curves to prevent abrupt jumps.
