import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb || width < BREAKPOINTS.md;
  const isTablet = isWeb && width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = isWeb && width >= BREAKPOINTS.lg;

  return {
    width,
    height,
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    isWide: isWeb && width >= BREAKPOINTS.md,
  };
}

export const webCommonStyles = {
  centeredCardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  cardMaxWidth: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  onboardingCardMaxWidth: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
};
