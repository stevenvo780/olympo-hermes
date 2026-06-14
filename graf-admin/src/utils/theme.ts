export function applyPalette(palette: Record<string, string>) {
  Object.entries(palette).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
}

export const getTextColorForBackground = (bgColor: string): string => {
  if (bgColor.includes('warning') || bgColor === '#ffc107' || bgColor === '#ffca2c') {
    return 'var(--dark-color)';
  }
  
  return 'var(--white-color)';
};

export function resetPalette() {
  document.documentElement.removeAttribute('style');
}
