export function useResponsive() {
  return {
    isSm: useMediaQuery('(width >= 40rem)'),
    isMd: useMediaQuery('(width >= 48rem)'),
    isLg: useMediaQuery('(width >= 64rem)'),
    isXl: useMediaQuery('(width >= 80rem)'),
    is2xl: useMediaQuery('(width >= 96rem)'),
  };
}
