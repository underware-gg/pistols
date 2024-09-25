import { useState, useEffect, useMemo } from 'react';

const useGameAspect = () => {
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
      aspectW,
      aspectH,
      boxW,
      boxH,
    };
  }, [windowSize]);

  const aspectWidth = (vw: number) => {
    return (vw / 100) * aspectRatio.aspectW;
  };

  const aspectHeight = (vh: number) => {
    return (vh / 100) * aspectRatio.aspectH;
  };

  return {
    ...aspectRatio,
    aspectWidth,
    aspectHeight,
  };
};

export default useGameAspect;
