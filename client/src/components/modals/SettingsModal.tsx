import React, { useState, useEffect } from 'react'
import { Modal, Button, Icon, Image } from 'semantic-ui-react'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { ActionButton } from '/src/components/ui/Buttons'
import { useGameAspect } from '/src/hooks/useGameAspect'
import Slider from '@mui/material/Slider'
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

  const handleQualityChange = (value: string) => {
    dispatchSetting(SettingsActions.QUALITY, value)
  }

  // Log quality changes and apply them to the game
  useEffect(() => {
    // This effect will run whenever the quality setting changes
    console.log(`Quality setting changed to: ${settings.quality}`);
    
    // Apply quality settings to the game engine - uncomment when ready to implement
    // setQualityPreset(settings.quality as QualityPreset);
    
    // // Apply changes to existing scene
    // applyQualityChanges();
    
  }, [settings.quality]);

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

  // Function to get description text for each quality setting
  const getQualityDescription = (quality: string) => {
    switch(quality) {
      case 'low': return "Optimized for performance with reduced graphics quality.";
      case 'medium': return "Balanced approach between visual quality and performance.";
      case 'high': return "Maximum visual fidelity, with all graphical features enabled.";
      default: return "";
    }
  };

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
              <h3>Quality Settings</h3>
              
              {/* The tentacles of quality shall wrap around your game experience, squeezing out the best performance! */}
              <div className="QualitySelector">
                {['low', 'medium', 'high'].map((quality) => (
                  <Button 
                    key={quality}
                    className={`QualityButton ${settings.quality === quality ? 'active' : ''}`}
                    onClick={() => handleQualityChange(quality)}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Button>
                ))}
              </div>
              
              {/* Description of selected quality level */}
              <div className="QualityDescription">
                {getQualityDescription(settings.quality)}
              </div>
            </div>

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
          <div className="AboutSection">
            {/* Top section - Split into left and right */}
            <div className="SplitSection">
              {/* Left Side - Underware */}
              <div className="SectionSide LeftSide">
                <div className="SectionTitle">
                  Game made by:
                </div>
                
                <div className="LogoContainer">
                  <Image src='/images/logo/underware_text.svg' width={aspectWidth(8.4)} height={aspectWidth(8.4)} />
                </div>

                {/* Left side social links */}
                <div className="SocialLinksGrid">
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://underware.gg', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="globe" />
                    </div>
                    <span>Website</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://discord.gg/underware', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="discord" />
                    </div>
                    <span>Discord</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://github.com/underware-gg', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="github" />
                    </div>
                    <span>GitHub</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://x.com/underware_gg', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="twitter" />
                    </div>
                    <span>Twitter</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Game */}
              <div className="SectionSide RightSide">
                <div className="SectionTitle">
                  Game info:
                </div>
                
                <div className="CenteredLogo">
                  <Logo vertical showName width={6} />
                </div>

                {/* Right side social links */}
                <div className="SocialLinksGrid">
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://pistols.gg', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="globe" />
                    </div>
                    <span>Website</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://github.com/underware-gg/pistols', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="github" />
                    </div>
                    <span>GitHub</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://x.com/pistols_gg', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="twitter" />
                    </div>
                    <span>Twitter</span>
                  </div>
                  
                  <div 
                    className="socialLinkStyle"
                    onClick={() => window.open('https://book.dojoengine.org/', '_blank')}
                  >
                    <div className="socialIconStyle">
                      <Icon name="book" />
                    </div>
                    <span>Docs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner logos - Pinned to bottom but above version */}
            <div className="PartnerLogosContainer">
              <div className="PartnerLogos">
                <div 
                  className="PartnerLogo"
                  onClick={() => window.open('https://x.com/lootrealms?lang=en', '_blank')}
                  title="Explore the Realms World Discord"
                >
                  <img 
                    src="/images/logo/RealmsWorld.svg" 
                    alt="RealmsWorld" 
                  />
                </div>
                <div 
                  className="PartnerLogo"
                  onClick={() => window.open('https://starknet.io/', '_blank')}
                  title="Learn more about Starknet"
                >
                  <img 
                    src="/images/logo/starknet.png" 
                    alt="Starknet" 
                    className="starknet"
                  />
                </div>
                <div 
                  className="PartnerLogo"
                  onClick={() => window.open('https://www.dojoengine.org/', '_blank')}
                  title="Learn more about Dojo"
                >
                  <img 
                    src="/images/logo/dojo.svg" 
                    alt="Dojo" 
                  />
                </div>
                <div 
                  className="PartnerLogo"
                  onClick={() => window.open('https://docs.cartridge.gg/', '_blank')}
                  title="Learn more about Cartridge"
                >
                  <img 
                    src="/images/logo/cartridge.svg" 
                    alt="Cartridge" 
                  />
                </div>
              </div>
            </div>

            <div className="VersionNumber">
              v{PACKAGE_VERSION}
            </div>
          </div>
        )}
      </Modal.Content>
    </Modal>
  )
} 