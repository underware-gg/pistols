import React from 'react';
import { MenuDuel, MenuDuelControl } from '/src/components/Menus';
import { DojoSetupErrorDetector } from '/src/components/account/DojoSetupErrorDetector';
import { MenuDebugAnimations } from '/src/components/MenusDebug';

interface DuelUIControlsProps {
  duelId: bigint;
  debugMode: boolean;
  onPlay: () => void;
  onStep: () => void;
  onReset: () => void;
  isPlaying: boolean;
}

/**
 * Component to manage duel UI controls
 */
export const DuelUIControls: React.FC<DuelUIControlsProps> = ({
  duelId,
  debugMode,
  onPlay,
  onStep,
  onReset,
  isPlaying,
}) => {

  return (
    <>
      {/* Control menus */}
      <MenuDuel duelId={duelId} />
      <MenuDuelControl 
        clickPlay={onPlay}
        clickStep={onStep} 
        clickReset={onReset}
        isPlaying={isPlaying}
      />

      <DojoSetupErrorDetector />

      {/* {debugMode && <MenuDebugAnimations />} */}
    </>
  );
};

export default DuelUIControls; 