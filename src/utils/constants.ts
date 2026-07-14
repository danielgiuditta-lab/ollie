export const INITIAL_HTML_LOADING_SKELETON = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    .animate-pulse-subtle { animation: pulse-subtle 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  </style>
</head>
<body class="p-8 bg-white text-slate-800 font-sans flex flex-col items-center justify-center min-h-screen">
  <div class="max-w-xl w-full flex flex-col items-center gap-6 text-center">
    <div class="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <svg class="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <div class="space-y-1.5">
      <h3 class="text-base font-semibold text-slate-900">Assembling Application Code</h3>
      <p class="text-xs text-slate-500 max-w-xs">Generating interface structure, styles, and interactive state components...</p>
    </div>
    <div class="w-full max-w-sm space-y-2.5 pt-2">
      <div class="h-3.5 bg-slate-100 rounded-full animate-pulse-subtle w-3/4 mx-auto"></div>
      <div class="h-3.5 bg-slate-100 rounded-full animate-pulse-subtle w-full"></div>
      <div class="h-3.5 bg-slate-100 rounded-full animate-pulse-subtle w-4/5 mx-auto"></div>
    </div>
  </div>
</body>
</html>`;
