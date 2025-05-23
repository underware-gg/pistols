import { useState, useEffect, useMemo, useCallback } from 'react';

export const useGameAspect = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const aspectRatio = useMemo(() => {
    const aspect = 1.7777;
    const aspectW = Math.min(windowSize.width, windowSize.height * aspect);
    const aspectH = Math.min(windowSize.width / aspect, windowSize.height);
    const boxW = (windowSize.width - aspectW) / 2;
    const boxH = (windowSize.height - aspectH) / 2;

    return {
      aspect,
      aspectW,
      aspectH,
      boxW,
      boxH,
    };
  }, [windowSize]);

  const aspectWidth = useCallback((vw: number) => {
    return (vw / 100) * aspectRatio.aspectW;
  }, [aspectRatio]);

  const aspectHeight = useCallback((vh: number) => {
    return (vh / 100) * aspectRatio.aspectH;
  }, [aspectRatio]);

  const pixelsToAspectWidth = useCallback((px: number) => {
    return (px / aspectRatio.aspectW) * 100;
  }, [aspectRatio]);

  const pixelsToAspectHeight = useCallback((px: number) => {
    return (px / aspectRatio.aspectH) * 100; 
  }, [aspectRatio]);

  return {
    ...aspectRatio,
    aspectWidth,
    aspectHeight,
    pixelsToAspectWidth,
    pixelsToAspectHeight,
  };
};
