import React, { useEffect, useRef, useState } from 'react'
import { Label } from 'semantic-ui-react'
import { useGameEvent } from '/src/hooks/useGameEvent'

interface MouseToolTipProps {
  text?: string | null;
}

export function MouseToolTip({ text }: MouseToolTipProps) {
  const { value: hoverSceneValue } = useGameEvent('hover_description', null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLElement | null>(null);
  const arrowRef = useRef<HTMLElement | null>(null);
  const [mousePos, setMousePos] = useState<{clientX: number, clientY: number} | null>(null);
  const [isBelow, setIsBelow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const edgeMargin = 16;

  const setLabelReference = (el: HTMLElement | null) => {
    labelRef.current = el;
    
    if (el) {
      setTimeout(() => {
        const styleId = 'tooltip-arrow-style';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        arrowRef.current = styleElement;
      }, 0);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useEffect(() => {
    if (text !== null || hoverSceneValue !== null) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [text, hoverSceneValue]);
  
  useEffect(() => {
    if (tooltipRef.current && mousePos) {
      requestAnimationFrame(() => {
        if (!tooltipRef.current) return;
        
        tooltipRef.current.style.opacity = isVisible ? '1' : '0';
        
        const tooltipWidth = tooltipRef.current.offsetWidth;
        const tooltipHeight = tooltipRef.current.offsetHeight;
        
        if (!tooltipWidth || !tooltipHeight) return;
        
        const viewportWidth = window.innerWidth;
        
        let left = mousePos.clientX - (tooltipWidth / 2);
        let top = mousePos.clientY - tooltipHeight - 10;
        
        let arrowLeft = 50;
        
        if (left < edgeMargin) {
          arrowLeft = ((mousePos.clientX - edgeMargin) / tooltipWidth) * 100;
          left = edgeMargin;
        } else if (left + tooltipWidth > viewportWidth - edgeMargin) {
          arrowLeft = ((mousePos.clientX - (viewportWidth - tooltipWidth - edgeMargin)) / tooltipWidth) * 100;
          left = viewportWidth - tooltipWidth - edgeMargin;
        }
        
        arrowLeft = Math.max(10, Math.min(90, arrowLeft));
        
        if (top < edgeMargin) {
          top = mousePos.clientY + 15;
          setIsBelow(true);
        } else {
          setIsBelow(false);
        }
        
        tooltipRef.current.style.left = `${left}px`;
        tooltipRef.current.style.top = `${top}px`;
        
        if (arrowRef.current) {
          const direction = isBelow ? 'above' : 'below';
          const cssRule = `#MouseToolTipAnchor .ui.${direction}.pointing.label:before { left: ${arrowLeft}% !important; }`;
          (arrowRef.current as HTMLStyleElement).innerHTML = cssRule;
        }
      });
    }
  }, [hoverSceneValue, text, mousePos, isBelow, isVisible, edgeMargin]);

  const handleMouseMove = (event: MouseEvent) => {
    setMousePos({
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  const displayText = text || hoverSceneValue;

  return (
    <>
      <div 
        ref={tooltipRef} 
        id='MouseToolTipAnchor' 
        className='Relative NoMouse NoDrag'
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
        }}
      >
        {displayText && (
          <Label 
            pointing={isBelow ? 'above' : 'below'} 
            style={{
              position: 'relative',
              textAlign: 'center',
              display: 'inline-block',
              minWidth: '200px'
            }}
            ref={setLabelReference}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: displayText }} 
              style={{ textAlign: 'center' }}
            />
          </Label>
        )}
      </div>
    </>
  );
}