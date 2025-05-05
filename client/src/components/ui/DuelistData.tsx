import React, { useState, useEffect, useMemo } from 'react';
import { useDuelist, useDuelistStatus } from '/src/stores/duelistStore';
import { BigNumberish } from 'starknet';

// Interface for exported duelist data
export interface DuelistDataProps {
  duelistId: BigNumberish;
}

export interface DuelistDataValues {
  id: BigNumberish;
  name: string;
  isDead: boolean;
  isActive: boolean;
  totalDuels: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  honour: number;
  winRatio: number | null;
}

export const DuelistData: React.FC<DuelistDataProps & {
  onDataLoad: (data: DuelistDataValues) => void;
}> = ({ duelistId, onDataLoad }) => {
  // Fetch duelist data using the store hooks
  const {
    nameAndId,
    isDead,
    isInAction,
    status: duelistStatus,
  } = useDuelist(duelistId);

  // Get detailed status information
  const {
    total_duels,
    total_wins,
    total_losses,
    total_draws,
    honour,
    winRatio
  } = useDuelistStatus(duelistStatus);
  
  // Create a data object to expose
  const duelistData = useMemo(() => {
    const data: DuelistDataValues = {
      id: duelistId,
      name: nameAndId || `Duelist #${duelistId.toString()}`,
      isDead: isDead,
      isActive: isInAction,
      totalDuels: total_duels,
      totalWins: total_wins,
      totalLosses: total_losses,
      totalDraws: total_draws,
      honour: honour,
      winRatio: winRatio
    };
    return data;
  }, [
    duelistId, 
    nameAndId, 
    isDead, 
    isInAction, 
    total_duels, 
    total_wins, 
    total_losses, 
    total_draws, 
    honour, 
    winRatio
  ]);
  
  // Call the onDataLoad callback whenever data changes
  useEffect(() => {
    onDataLoad(duelistData);
  }, [duelistData, onDataLoad]);
  
  // This component doesn't render anything visible
  return null;
};

export default DuelistData; 