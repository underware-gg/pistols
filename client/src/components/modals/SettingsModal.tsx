import React, { useState } from 'react'
import { Modal, Button, Icon, Image } from 'semantic-ui-react'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { ActionButton } from '/src/components/ui/Buttons'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { Slider } from '@mui/material'
import { SceneName } from '/src/data/assets'
import { Opener } from '/src/hooks/useOpener'
import Logo from '/src/components/Logo'
import { PACKAGE_VERSION } from '/src/utils/constants'

interface SettingsModalProps {
  opener: Opener
}

export default function SettingsModal({ opener }: SettingsModalProps) {
  const { settings, dispatchSetting, SettingsActions } = useSettings()
  const { atGate, atDoor, atTutorial, dispatchSetScene } = usePistolsScene()
  const [view, setView] = useState<'settings' | 'about'>('settings')
  const { aspectWidth, aspectHeight } = useGameAspect()

  const handleMusicToggle = () => {
    dispatchSetting(SettingsActions.MUSIC_ENABLED, !settings.musicEnabled)
  }

  const handleSfxToggle = () => {
    dispatchSetting(SettingsActions.SFX_ENABLED, !settings.sfxEnabled)
  }

  const handleMusicVolumeChange = (event: Event, value: number | number[]) => {
    dispatchSetting(SettingsActions.MUSIC_VOLUME, value as number)
  }

  const handleSfxVolumeChange = (event: Event, value: number | number[]) => {
    dispatchSetting(SettingsActions.SFX_VOLUME, value as number)
  }

  const handleReturnToTavern = () => {
    dispatchSetScene(SceneName.Tavern)
    opener.close()
  }

  const handleClose = () => {
    if (view === 'about') {
      setView('settings')
    } else {
      opener.close()
    }
  }

  return (
    <Modal
      open={opener.isOpen}
      onClose={() => {
        setView('settings')
        opener.close()
      }}
      size="tiny"
      className="SettingsModal"
    >
      <Modal.Header>
        <span>{view === 'settings' ? 'Settings' : 'About Us'}</span>
        <Icon name="close" className="SettingsCloseIcon" onClick={handleClose} />
      </Modal.Header>

      <Modal.Content>
        {view === 'settings' ? (
          <>
            <div className="SettingsSection">
              <h3>Audio Settings</h3>
              
              <div className="SettingsControl">
                <div className="ControlHeader">
                  <span>Music</span>
                  <Button 
                    icon={settings.musicEnabled ? 'volume up' : 'volume off'} 
                    onClick={handleMusicToggle}
                  />
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.musicVolume}
                  onChange={handleMusicVolumeChange}
                  sx={{
                    color: '$color-bright',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '$color-bright',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '$color-bright',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba($color-bright, 0.3)',
                    },
                  }}
                />
              </div>

              <div className="SettingsControl">
                <div className="ControlHeader">
                  <span>Sound Effects</span>
                  <Button 
                    icon={settings.sfxEnabled ? 'volume up' : 'volume off'} 
                    onClick={handleSfxToggle}
                  />
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.sfxVolume}
                  onChange={handleSfxVolumeChange}
                  sx={{
                    color: '$color-bright',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '$color-bright',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '$color-bright',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba($color-bright, 0.3)',
                    },
                  }}
                />
              </div>
            </div>

            <div className="InfoSection">
              <div className="InfoButtons">
                {!atGate && !atDoor && !atTutorial && (
                  <ActionButton 
                    label="Return to Tavern" 
                    important={true}
                    onClick={handleReturnToTavern}
                    />
                )}
                <ActionButton label="About Us" className='spaced' onClick={() => setView('about')}/>
                <ActionButton label="Contact Us" className='spaced' onClick={() => {
                  window.open('https://x.com/underware_gg', '_blank')
                }}/>
              </div>
            </div>
          </>
        ) : (
          <div className="AboutSection" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            minHeight: aspectHeight(52)
          }}>
            {/* Top section - Split into left and right */}
            <div style={{ 
              display: 'flex',
              width: '100%',
              marginBottom: '2rem',
              gap: '1rem'
            }}>
              {/* Left Side - Underware */}
              <div style={{ 
                flex: 1,
                paddingRight: '1rem',
                borderRight: '1px solid rgba(200, 182, 168, 0.3)'
              }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#c8b6a8', 
                  marginBottom: aspectWidth(1),
                  fontWeight: 500,
                  width: '100%',
                  textAlign: 'center'
                }}>
                  Game made by:
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <div className='NoMouse NoDrag' style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: aspectWidth(1),
                    width: '100%',
                  }}>
                    <Image src='/images/logo/underware_text.svg' width={aspectWidth(8.4)} height={aspectWidth(8.4)} />
                  </div>
                </div>

                {/* Underware Social Links */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gridGap: '0.8rem',
                  marginTop: '0.5rem'
                }}>
                  <a 
                    href="https://underware.gg" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="globe" />
                    </div>
                    <span>Website</span>
                  </a>
                  
                  <a 
                    href="https://discord.gg/underware" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="discord" />
                    </div>
                    <span>Discord</span>
                  </a>
                  
                  <a 
                    href="https://github.com/funDAOmental" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="github" />
                    </div>
                    <span>GitHub</span>
                  </a>
                  
                  <a 
                    href="https://x.com/underware_gg" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="twitter" />
                    </div>
                    <span>Twitter</span>
                  </a>
                </div>
              </div>
              
              {/* Right Side - Game */}
              <div style={{ flex: 1, paddingLeft: '1rem' }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#c8b6a8', 
                  marginBottom: aspectWidth(1),
                  fontWeight: 500,
                  width: '100%',
                  textAlign: 'center'
                }}>
                  Game info:
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Logo vertical showName width={6} />
                </div>

                {/* Game Social Links */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gridGap: '0.8rem',
                  marginTop: '0.5rem'
                }}>
                  <a 
                    href="https://pistols.at" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="globe" />
                    </div>
                    <span>Website</span>
                  </a>
                  
                  <a 
                    href="https://github.com/funDAOmental/pistols" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="github" />
                    </div>
                    <span>GitHub</span>
                  </a>
                  
                  <a 
                    href="https://x.com/dawnpistols" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="twitter" />
                    </div>
                    <span>Twitter</span>
                  </a>
                  
                  <a 
                    href="https://book.dojoengine.org/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="socialLinkStyle"
                  >
                    <div className="socialIconStyle">
                      <Icon name="book" />
                    </div>
                    <span>Docs</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Partner logos - Pinned to bottom but above version */}
            <div style={{ 
              position: 'absolute',
              bottom: '3rem',
              left: 0,
              right: 0
            }}>
              <div className="PartnerLogos" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: aspectWidth(2.5),
                padding: aspectWidth(1.5),
                backgroundColor: 'rgba(239, 151, 88, 0.15)',
                border: '1px solid rgba(239, 151, 88, 0.15)',
                borderRadius: '6px',
                margin: '0 auto',
                width: '85%',
                maxWidth: '500px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}>
                <a 
                  href="https://x.com/lootrealms?lang=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Explore the Realms World Discord"
                >
                  <img 
                    src="/images/logo/RealmsWorld.svg" 
                    alt="RealmsWorld" 
                    style={{ 
                      width: aspectWidth(3.6), 
                      height: aspectWidth(3.6), 
                      objectFit: 'contain',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(239, 151, 88, 1))'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
                <a 
                  href="https://starknet.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Learn more about Starknet"
                >
                  <img 
                    src="/images/logo/starknet.png" 
                    alt="Starknet" 
                    style={{ 
                      width: aspectWidth(4), 
                      height: aspectWidth(3.6), 
                      objectFit: 'contain',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(239, 151, 88, 1))'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
                <a 
                  href="https://www.dojoengine.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Learn more about Dojo"
                >
                  <img 
                    src="/images/logo/dojo.svg" 
                    alt="Dojo" 
                    style={{ 
                      width: aspectWidth(3.6), 
                      height: aspectWidth(3.6), 
                      objectFit: 'contain',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(239, 151, 88, 1))'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
                <a 
                  href="https://docs.cartridge.gg/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Learn more about Cartridge"
                >
                  <img 
                    src="/images/logo/cartridge.svg" 
                    alt="Cartridge" 
                    style={{ 
                      width: aspectWidth(3.6), 
                      height: aspectWidth(3.6), 
                      objectFit: 'contain',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(239, 151, 88, 1))'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: aspectWidth(1),
              left: 0,
              right: 0,
              fontSize: '0.85rem',
              color: 'rgba(200, 182, 168, 0.8)',
              opacity: 0.7,
              textAlign: 'center'
            }}>
              v{PACKAGE_VERSION}
            </div>
          </div>
        )}
      </Modal.Content>
    </Modal>
  )
} 