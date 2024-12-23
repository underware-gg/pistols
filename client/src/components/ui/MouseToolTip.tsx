import React, { useEffect, useRef, useState } from 'react'
import { Label } from 'semantic-ui-react'
import { useGameEvent } from '@/hooks/useGameEvent'


export function MouseToolTip() {
  const { value: hoverSceneValue } = useGameEvent('hover_scene', null);
  const tooltipRef = useRef(null);
  const [mousePos, setMousePos] = useState<any>(null);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useEffect(() => {
    
    if (tooltipRef.current && mousePos) {
      tooltipRef.current.style.left = `${mousePos.clientX - tooltipRef.current.clientWidth / 2}px`;
      tooltipRef.current.style.top = `${mousePos.clientY - tooltipRef.current.clientHeight}px`;
    }
  }, [hoverSceneValue, mousePos]);

  const handleMouseMove = (event) => {
    setMousePos(event)
  };

  return (
    <div ref={tooltipRef} id='MouseToolTipAnchor' className='Relative NoMouse NoDrag'>
      {hoverSceneValue ? (
        <Label pointing='below' className='ToolTip'>
          <div dangerouslySetInnerHTML={{ __html: hoverSceneValue }} />
        </Label>
      ) : (
        <></>
      )}
    </div>
  );
}