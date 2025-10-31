import React, { useState, useEffect, useMemo, useRef } from 'react'

interface QueueTimerProps {
  queueTime: number
  showTimer: boolean
  className?: string
}

export const QueueTimer: React.FC<QueueTimerProps> = ({ 
  queueTime, 
  showTimer, 
  className = '' 
}) => {
  const timerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!queueTime || !showTimer || !timerRef.current) return
    
    const updateDisplay = () => {
      if (!timerRef.current) return
      
      const now = Date.now()
      const elapsed = Math.floor((now - (queueTime * 1000)) / 1000)
      const currentSecond = Math.floor(now / 1000)
      const colonVisible = currentSecond % 2 === 0
      
      // Update the DOM directly without triggering React re-renders
      timerRef.current.innerHTML = formatQueueTime(elapsed, colonVisible)
    }
    
    // Update immediately
    updateDisplay()
    
    // Update every second - but only update the DOM, not React state!
    const interval = setInterval(updateDisplay, 1000)
    
    return () => clearInterval(interval)
  }, [queueTime, showTimer])

  const formatQueueTime = (seconds: number, showColon: boolean) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const colon = showColon ? ':' : ' '
    
    if (hours > 0) {
      // HH:MM format when over 1 hour - add subtle 'h' indicator to clarify it's hours
      return `${hours.toString().padStart(2, '0')}${colon}${mins.toString().padStart(2, '0')}<span class="timer-unit">h</span>`
    } else {
      // MM:SS format when under 1 hour - no indicator needed (presence of seconds makes it clear)
      return `${mins.toString().padStart(2, '0')}${colon}${secs.toString().padStart(2, '0')}`
    }
  }

  if (!queueTime || !showTimer) {
    return null
  }

  return (
    <div 
      ref={timerRef}
      className={`queue-timer ${className}`}
    >
    </div>
  )
}
