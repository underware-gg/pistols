import { useGameEvent } from "@/pistols/hooks/useGameEvent"
import { emitter } from "@/pistols/three/game";
import { MenuLabels } from "@/pistols/utils/pistols"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Label } from "semantic-ui-react"


export function MouseToolTip() {
  const { value: hoverSceneValue } = useGameEvent('hover_scene', null)

  useEffect(() => {
    if (hoverSceneValue !== null) {
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoverSceneValue]);

  const handleMouseMove = (event) => {
    const tooltipAnchor = document.getElementById('MouseToolTipAnchor');
    if (tooltipAnchor) {
      tooltipAnchor.style.left = `${event.clientX - tooltipAnchor.clientWidth / 2}px`;
      tooltipAnchor.style.top = `${event.clientY - tooltipAnchor.clientHeight}px`;
    }
  };
  
  if (!hoverSceneValue) {
    return <></>
  }

  return (
    <div id='MouseToolTipAnchor' className='Relative'>
      <Label pointing='below' className='ToolTip'>
        <div dangerouslySetInnerHTML={{ __html: hoverSceneValue }} />
      </Label>
    </div>
  )
}