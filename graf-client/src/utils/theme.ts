export function applyPalette(palette: Record<string, string>) {
  Object.entries(palette).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
}

export function resetPalette() {
  document.documentElement.removeAttribute('style');
}
