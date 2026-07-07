export const themeTokens = {
  // Combined light/dark tailwind classes
  
  // Hover background for transparent/borderless elements (e.g. Nav, transparent buttons)
  hoverBg: 'hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A]',
  
  // Background for filled buttons/tabs when idle
  filledBg: 'bg-[#003BC4]/5 dark:bg-[#282A2D]',
  
  // Background for filled buttons/tabs when hovered
  filledHoverBg: 'hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A]',
  
  // Background for items when selected (e.g. Nav active space/chat)
  selectedBg: 'bg-[#f0f4f9] dark:bg-[#2B2D31]',
  
  // Interactive text states
  text: {
    idle: 'text-slate-700 dark:text-[#E3E3E3] hover:text-slate-900 dark:hover:text-white',
    selected: 'text-slate-900 dark:text-white font-semibold',
    iconIdle: 'text-slate-700 dark:text-[#E3E3E3]',
    iconSelected: 'text-slate-900 dark:text-white',
  },
  
  // Separate theme objects if a component needs theme-specific classes dynamically
  light: {
    hoverBg: 'hover:bg-[#003BC4]/10',
    filledBg: 'bg-[#003BC4]/5',
    filledHoverBg: 'hover:bg-[#003BC4]/10',
    selectedBg: 'bg-[#f0f4f9]',
    text: {
      idle: 'text-slate-700 hover:text-slate-900',
      selected: 'text-slate-900 font-semibold',
    }
  },
  dark: {
    hoverBg: 'hover:bg-[#35373A]',
    filledBg: 'bg-[#282A2D]',
    filledHoverBg: 'hover:bg-[#35373A]',
    selectedBg: 'bg-[#2B2D31]',
    text: {
      idle: 'text-[#E3E3E3] hover:text-white',
      selected: 'text-white font-semibold',
    }
  }
};
