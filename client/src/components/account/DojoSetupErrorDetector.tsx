import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useDojoStatus } from '@underware/pistols-sdk/dojo'

export function DojoSetupErrorDetector() {
  const { isError } = useDojoStatus()
  const navigate = useNavigate()
  useEffect(() => {
    if(isError) {
      navigate('/')
      // location.href = '/'
    }
  }, [isError])
  return <></>
}