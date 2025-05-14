import React, { createContext, useContext, useMemo, ReactNode, useState, useEffect } from 'react'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { useDuelistStack, useDuelist } from '/src/stores/duelistStore'
import { BigNumberish } from 'starknet';

// Create context for organized duelists
type PlayerDuelistsContextType = {
  activeDuelists: BigNumberish[];
  deadDuelists: BigNumberish[];
}

const PlayerDuelistsContext = createContext<PlayerDuelistsContextType>({
  activeDuelists: [],
  deadDuelists: []
});

// Hook to use the context
export const usePlayerDuelistsOrganized = () => useContext(PlayerDuelistsContext);

// Main provider component
interface PlayerDuelistsProviderProps {
  children: ReactNode;
}

export const PlayerDuelistsProvider: React.FC<PlayerDuelistsProviderProps> = ({ children }) => {
  // Start with empty values
  const [contextValue, setContextValue] = useState<PlayerDuelistsContextType>({
    activeDuelists: [],
    deadDuelists: []
  });
  
  // Use an effect to load everything once mounted
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Only initialize once component is mounted
    setIsReady(true);
  }, []);
  
  if (!isReady) {
    return (
      <PlayerDuelistsContext.Provider value={contextValue}>
        {children}
      </PlayerDuelistsContext.Provider>
    );
  }
  
  // Now it's safe to use hooks as the component has mounted
  return <LoadedProvider>{children}</LoadedProvider>;
};

// This component only renders after the parent component has mounted
const LoadedProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const { duelistIds } = useDuelistsOfPlayer();
  const [activeIds, setActiveIds] = useState<BigNumberish[]>([]);
  const [deadIds, setDeadIds] = useState<BigNumberish[]>([]);
  
  // Helper function to check if a BigNumberish is in array
  const isInArray = (arr: BigNumberish[], value: BigNumberish): boolean => {
    return arr.some(item => String(item) === String(value));
  };
  
  // For each duelist, check if it's active
  const duelistCheckers = useMemo(() => {
    return duelistIds.map(id => (
      <DuelistChecker 
        key={String(id)}
        duelistId={id}
        onCheck={(isActive, isDead) => {
          // Handle active status
          if (isActive && !isDead) {
            setActiveIds(prev => isInArray(prev, id) ? prev : [...prev, id]);
          } else {
            setActiveIds(prev => prev.filter(activeId => String(activeId) !== String(id)));
          }
          
          // Handle dead status
          if (isDead) {
            setDeadIds(prev => isInArray(prev, id) ? prev : [...prev, id]);
          } else {
            setDeadIds(prev => prev.filter(deadId => String(deadId) !== String(id)));
          }
        }}
      />
    ));
  }, [duelistIds]);
  
  // Create context value
  const contextValue = useMemo(() => ({
    activeDuelists: activeIds,
    deadDuelists: deadIds
  }), [activeIds, deadIds]);
  
  return (
    <PlayerDuelistsContext.Provider value={contextValue}>
      {duelistCheckers}
      {children}
    </PlayerDuelistsContext.Provider>
  );
};

// Simple component to check if a duelist is active and/or dead
interface DuelistCheckerProps {
  duelistId: BigNumberish;
  onCheck: (isActive: boolean, isDead: boolean) => void;
}

const DuelistChecker: React.FC<DuelistCheckerProps> = ({ duelistId, onCheck }) => {
  const { activeDuelistId } = useDuelistStack(duelistId);
  const { isDead } = useDuelist(duelistId);
  
  useEffect(() => {
    const isActive = String(duelistId) === String(activeDuelistId);
    onCheck(isActive, isDead);
  }, [duelistId, activeDuelistId, isDead, onCheck]);
  
  return null; // No UI needed
} 