import React, { useState, useEffect, useRef } from 'react'
import { Modal, Grid, Input, TextArea, Icon } from 'semantic-ui-react'
import { ActionButton } from '/src/components/ui/Buttons'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { Opener } from '/src/hooks/useOpener'
import { emitter } from '/src/three/game'

interface PrivacyConsentProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
}

const PrivacyConsentModal: React.FC<PrivacyConsentProps> = ({ isOpen, onAccept, onDecline }) => {
  const { aspectWidth } = useGameAspect()
  return (
    <Modal
      size="small"
      open={isOpen}
      className="ModalText"
    >
      <Modal.Header>
        🔒 Privacy Notice
      </Modal.Header>
      <Modal.Content>
        <p>To help us debug this issue more effectively, we'd like to include some basic system information in the bug report:</p>
        <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
          <li>Browser type and version</li>
          <li>Screen resolution and device info</li>
          <li>Memory usage and performance data</li>
          <li>Network connection details</li>
          <li>Current page URL</li>
        </ul>
        <p>This information helps us reproduce and fix bugs faster. Would you like to include this data?</p>
        <p style={{ fontSize: aspectWidth(0.85), color: '#888', marginTop: aspectWidth(1.5) }}>
          <strong>Note:</strong> No personal information or wallet data is included.
        </p>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Grid.Row columns='equal'>
            <Grid.Column>
              <ActionButton large fill label='No Thanks' onClick={onDecline} />
            </Grid.Column>
            <Grid.Column>
              <ActionButton large fill important label='Include System Info' onClick={onAccept} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

const getSystemInfo = () => {
  const nav = navigator as any
  const performance = window.performance as any
  
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    platform: nav.platform,
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    
    memory: performance.memory ? {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    } : 'Not available',
    
    connection: nav.connection ? {
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt
    } : 'Not available',
    
    currentUrl: window.location.href,
    timestamp: new Date().toISOString()
  }
}

// TODO: File upload functionality - requires backend server for GitHub integration
// const processFilesForGitHub = async (files: File[]) => {
//   const processedFiles = []
//   
//   for (const file of files) {
//     try {
//       const base64 = await fileToBase64(file)
//       const isImage = file.type.startsWith('image/')
//       
//       processedFiles.push({
//         name: file.name,
//         size: file.size,
//         type: file.type,
//         content: base64,
//         isImage: isImage
//       })
//     } catch (err) {
//       console.error(`Failed to process file ${file.name}:`, err)
//     }
//   }
//   
//   return processedFiles
// }

// const fileToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()
//     reader.onload = () => resolve(reader.result as string)
//     reader.onerror = reject
//     reader.readAsDataURL(file)
//   })
// }

const createGithubIssue = async (
  username: string,
  title: string,
  errorDescription: string,
  stepsToReproduce: string[],
  additionalContext: string,
  includeSystemInfo: boolean,
  // TODO: File attachments parameter
  // attachedFiles: File[] = []
) => {
  const repoUrl = 'https://github.com/underware-gg/pistols'
  
  let systemInfoSection = ''
  
  if (includeSystemInfo) {
    const systemInfo = getSystemInfo()
    
    const memoryInfo = typeof systemInfo.memory === 'object' ? 
      `${systemInfo.memory.usedJSHeapSize} / ${systemInfo.memory.totalJSHeapSize} (limit: ${systemInfo.memory.jsHeapSizeLimit})` : 
      systemInfo.memory
    
    const connectionInfo = typeof systemInfo.connection === 'object' ? 
      `${systemInfo.connection.effectiveType} (${systemInfo.connection.downlink}Mbps, ${systemInfo.connection.rtt}ms RTT)` : 
      systemInfo.connection

    systemInfoSection = `
### System Information
- **Current URL**: ${systemInfo.currentUrl}
- **Browser**: ${systemInfo.userAgent}
- **Platform**: ${systemInfo.platform}
- **Language**: ${systemInfo.language}
- **Screen**: ${systemInfo.screenWidth}x${systemInfo.screenHeight} (${systemInfo.colorDepth}-bit, ${systemInfo.pixelRatio}x pixel ratio)
- **Viewport**: ${systemInfo.viewportWidth}x${systemInfo.viewportHeight}
- **Memory Usage**: ${memoryInfo}
- **Connection**: ${connectionInfo}
- **Online Status**: ${systemInfo.onLine ? 'Online' : 'Offline'}
- **Cookies Enabled**: ${systemInfo.cookieEnabled ? 'Yes' : 'No'}
- **Timestamp**: ${systemInfo.timestamp}

`
  }

  const validSteps = stepsToReproduce.filter(step => step.trim())
  const stepsSection = validSteps.length > 0 
    ? validSteps.map((step, index) => {
        const lines = step.trim().split('\n')
        const firstLine = `**Step ${index + 1}:** ${lines[0]}`
        const continuationLines = lines.slice(1).map(line => `   ${line}`).join('\n')
        const formattedStep = continuationLines ? `${firstLine}\n   ${continuationLines}` : firstLine
        return `${formattedStep}\n`
      }).join('\n')
    : '> _No reproduction steps provided_'

  const additionalContextSection = additionalContext?.trim() 
    ? `---

### 💭 Additional Context
${additionalContext.trim()}

`
    : ''

  // TODO: File attachments - requires backend server for GitHub integration
  // let filesSection = ''
  // if (attachedFiles.length > 0) {
  //   const processedFiles = await processFilesForGitHub(attachedFiles)
  //   
  //   filesSection = `---

  // ### 📎 Attached Files

  // `
  //   
  //   for (const file of processedFiles) {
  //     const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
  //     filesSection += `**${file.name}** (${fileSizeMB}MB, ${file.type})\n`
  //     
  //     if (file.isImage && file.size < 2 * 1024 * 1024) { // Only embed images smaller than 2MB
  //       filesSection += `![${file.name}](${file.content})\n\n`
  //     } else if (file.isImage) {
  //       filesSection += `*[Image too large for inline display - ${fileSizeMB}MB]*\n\n`
  //     } else {
  //       // For non-images, include first few lines if it's text
  //       if (file.type.includes('text') || file.name.endsWith('.log') || file.name.endsWith('.txt')) {
  //         try {
  //           const textContent = atob(file.content.split(',')[1]).substring(0, 500)
  //           filesSection += `\`\`\`\n${textContent}${textContent.length >= 500 ? '...' : ''}\n\`\`\`\n\n`
  //         } catch {
  //           filesSection += `📄 *[${file.type} file attached]*\n\n`
  //         }
  //       } else {
  //         filesSection += `📄 *[${file.type} file attached]*\n\n`
  //       }
  //     }
  //   }
  // }

  const errorCodeBlock = `\`\`\`
${errorDescription.trim()}
\`\`\``

  const issueTemplate = `# 🐛 Bug Report${username?.trim() ? `\n\n> **Reported by:** \`${username.trim()}\`` : ''}

---

## 🚨 Error Description

${errorCodeBlock}

---

## 📝 Steps to Reproduce

${stepsSection}${systemInfoSection}${additionalContextSection}---

<sub>🤖 This issue was automatically generated from the **Pistols at Dawn** bug reporting system</sub>`

  const issueTitle = title.trim() ? `[USER-BUG] ${title.trim()}` : '[USER-BUG] Bug Report'
  const encodedTitle = encodeURIComponent(issueTitle)
  const encodedBody = encodeURIComponent(issueTemplate)
  const githubIssueUrl = `${repoUrl}/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=bug,user-report,auto-generated`
  
  window.open(githubIssueUrl, '_blank')
}

interface BugReportModalProps {
  opener: Opener
  initialError?: string
  initialTitle?: string
}

export default function BugReportModal({ opener, initialError, initialTitle }: BugReportModalProps) {
  const { aspectWidth, aspectHeight, boxW, boxH } = useGameAspect()
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState(initialTitle?.trim() || '')
  const [errorDescription, setErrorDescription] = useState(initialError?.trim() || '')
  const [stepsToReproduce, setStepsToReproduce] = useState([''])
  const [additionalContext, setAdditionalContext] = useState('')
  // TODO: File upload state - requires backend server
  // const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  // const [isDragOver, setIsDragOver] = useState(false)
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const contextTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  // TODO: File upload ref - requires backend server
  // const fileInputRef = useRef<HTMLInputElement>(null)

  const autoExpandTextArea = (textArea: HTMLTextAreaElement) => {
    const currentScrollTop = textArea.closest('.content')?.scrollTop || 0
    const minHeight = aspectHeight(4)
    textArea.style.height = `${minHeight}px`
    textArea.style.height = Math.max(minHeight, textArea.scrollHeight) + 'px'
    
    const contentElement = textArea.closest('.content') as HTMLElement
    if (contentElement) {
      contentElement.scrollTop = currentScrollTop
    }
  }

  emitter.on('player_username', (username: string | null) => {
    if (username) {
      setUsername(username)
    }
  })

  useEffect(() => {
    if (opener.isOpen) {
      setTimeout(() => {
        if (errorTextAreaRef.current && errorDescription) {
          autoExpandTextArea(errorTextAreaRef.current)
        }
        if (contextTextAreaRef.current && additionalContext) {
          autoExpandTextArea(contextTextAreaRef.current)
        }
      }, 100)
    }
  }, [opener.isOpen, errorDescription, additionalContext])

  useEffect(() => {
    if (initialError?.trim()) {
      setErrorDescription(initialError.trim())
    } else {
      setErrorDescription('')
    }
  }, [initialError])

  useEffect(() => {
    if (initialTitle?.trim()) {
      setTitle(initialTitle.trim())
    } else {
      setTitle('')
    }
  }, [initialTitle])

  // TODO: File handling functions - requires backend server for GitHub integration
  // const handleFileSelect = (files: FileList | null) => {
  //   if (!files) return
  //   
  //   const newFiles = Array.from(files).filter(file => {
  //     // Limit file size to 10MB per file
  //     if (file.size > 10 * 1024 * 1024) {
  //       alert(`File "${file.name}" is too large. Maximum size is 10MB.`)
  //       return false
  //     }
  //     return true
  //   })
  //   
  //   setAttachedFiles(prev => [...prev, ...newFiles])
  // }

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   setIsDragOver(false)
  //   
  //   handleFileSelect(e.dataTransfer.files)
  // }

  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   setIsDragOver(true)
  // }

  // const handleDragLeave = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   setIsDragOver(false)
  // }

  // const removeFile = (index: number) => {
  //   setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  // }

  // const formatFileSize = (bytes: number) => {
  //   if (bytes === 0) return '0 B'
  //   const k = 1024
  //   const sizes = ['B', 'KB', 'MB', 'GB']
  //   const i = Math.floor(Math.log(bytes) / Math.log(k))
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  // }

  const addStep = () => {
    const newSteps = [...stepsToReproduce, '']
    setStepsToReproduce(newSteps)
    
    setTimeout(() => {
      const newIndex = newSteps.length - 1
      stepRefs.current[newIndex]?.focus()
    }, 50)
  }

  const removeStep = (index: number) => {
    if (stepsToReproduce.length > 1) {
      setStepsToReproduce(stepsToReproduce.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, value: string) => {
    const newSteps = [...stepsToReproduce]
    newSteps[index] = value
    setStepsToReproduce(newSteps)
  }

  const handleStepKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey && index === stepsToReproduce.length - 1) {
      e.preventDefault()
      addStep()
    }
  }

  const resetForm = () => {
    setUsername('')
    setTitle(initialTitle?.trim() || '')
    setErrorDescription(initialError?.trim() || '')
    setStepsToReproduce([''])
    setAdditionalContext('')
    // TODO: Reset file attachments when implemented
    // setAttachedFiles([])
    setShowPrivacyConsent(false)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    opener.close()
  }

  const handleSubmit = () => {
    if (!title.trim() || !errorDescription.trim()) {
      return
    }

    const validSteps = stepsToReproduce.filter(step => step.trim())
    if (validSteps.length === 0) {
      return
    }

    setShowPrivacyConsent(true)
  }

  const handlePrivacyAccept = async () => {
    setShowPrivacyConsent(false)
    setIsSubmitting(true)
    try {
      await createGithubIssue(username, title, errorDescription, stepsToReproduce, additionalContext, true)
      handleClose()
    } catch (err) {
      console.error('Failed to create GitHub issue:', err)
      setIsSubmitting(false)
    }
  }

  const handlePrivacyDecline = async () => {
    setShowPrivacyConsent(false)
    setIsSubmitting(true)
    try {
      await createGithubIssue(username, title, errorDescription, stepsToReproduce, additionalContext, false)
      handleClose()
    } catch (err) {
      console.error('Failed to create GitHub issue:', err)
      setIsSubmitting(false)
    }
  }

  const isFormValid = title.trim() && errorDescription.trim() && stepsToReproduce.some(step => step.trim())

  return (
    <>
      <Modal
        size={null}
        open={opener.isOpen}
        onClose={handleClose}
        className="ModalText"
        style={{
          width: aspectWidth(60),
          height: aspectHeight(80),
          top: aspectHeight(10) + boxH,
          left: aspectWidth(20) + boxW,
          maxHeight: 'none',
          maxWidth: 'none',
          margin: 0,
          position: 'fixed'
        }}
      >
        <Modal.Header>
          🐛 Report a Bug
        </Modal.Header>
        
        <Modal.Content 
          className="BugReportModalContent"
          style={{
            height: aspectHeight(65),
            overflowY: 'auto',
            padding: aspectWidth(2)
          }}
        >
          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              👤 Your Username (Optional)
            </h4>
            <Input
              fluid
              className="bug-report-input"
              placeholder="Enter your username or handle (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ marginBottom: aspectWidth(1) }}
            />
            <p style={{ fontSize: aspectWidth(1), color: '#888', margin: 0 }}>
              Help us recognize your effort! This is completely optional.
            </p>
          </div>

          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              📌 Bug Title *
            </h4>
            <Input
              fluid
              className="bug-report-input"
              placeholder="Brief description of the bug (e.g., 'DUEL: Pact exists')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: aspectWidth(1) }}
            />
            {initialTitle?.trim() && (
              <p style={{ fontSize: aspectWidth(1), color: '#C0C0C0', margin: 0 }}>
                ✅ Pre-filled from error analysis
              </p>
            )}
          </div>

          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              🚨 Error Description *
            </h4>
            <TextArea
              ref={errorTextAreaRef}
              className="BugReportTextArea"
              placeholder="Describe the error or bug you encountered..."
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              rows={1}
              style={{ 
                width: '100%', 
                marginBottom: aspectWidth(1),
                minHeight: aspectHeight(4),
                height: aspectHeight(4),
                resize: 'none',
                overflow: 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                autoExpandTextArea(target)
              }}
            />
            {initialError?.trim() && (
              <p style={{ fontSize: aspectWidth(1), color: '#C0C0C0', margin: 0 }}>
                ✅ Pre-filled from error details
              </p>
            )}
          </div>

          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              📝 Steps to Reproduce *
            </h4>
            <p style={{ fontSize: aspectWidth(1), color: '#888', marginBottom: aspectWidth(1) }}>
              Help us understand how to reproduce this issue. Press Enter to add the next step.
            </p>
            {stepsToReproduce.map((step, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: aspectWidth(0.5) }}>
                <span style={{ marginRight: aspectWidth(0.5), color: '#C0C0C0', fontWeight: 'bold', minWidth: aspectWidth(1.5) }}>
                  {index + 1}.
                </span>
                <TextArea
                  ref={(el) => {
                    stepRefs.current[index] = el
                  }}
                  className="BugReportTextArea"
                  placeholder={`Step ${index + 1}...`}
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  onKeyPress={(e) => handleStepKeyPress(e, index)}
                  rows={1}
                  style={{ 
                    marginRight: aspectWidth(0.5), 
                    flex: 1,
                    minHeight: aspectHeight(4),
                    height: aspectHeight(4),
                    resize: 'none',
                    overflow: 'hidden'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    autoExpandTextArea(target)
                  }}
                />
                {stepsToReproduce.length > 1 && (
                  <Icon
                    name="trash"
                    link
                    onClick={() => removeStep(index)}
                    style={{ color: '#ff6b6b', cursor: 'pointer' }}
                  />
                )}
              </div>
            ))}
            <div style={{ marginTop: aspectWidth(0.5), marginLeft: aspectWidth(2) }}>
              <ActionButton
                label="+ Add Step"
                onClick={addStep}
              />
            </div>
          </div>

          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              💭 Additional Context (Optional)
            </h4>
            <TextArea
              ref={contextTextAreaRef}
              className="BugReportTextArea"
              placeholder="Any additional details, workarounds, or context that might help..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={1}
              style={{ 
                width: '100%',
                minHeight: aspectHeight(4),
                height: aspectHeight(4),
                resize: 'none',
                overflow: 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                autoExpandTextArea(target)
              }}
            />
          </div>

          {/* TODO: File Upload Section - Requires backend server for GitHub integration */}
          {/* 
          <div style={{ marginBottom: aspectWidth(2) }}>
            <h4 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5), fontSize: aspectWidth(1.2) }}>
              📎 Attach Files (Optional)
            </h4>
            <p style={{ fontSize: aspectWidth(1), color: '#888', marginBottom: aspectWidth(1) }}>
              Upload screenshots, logs, or any files that help explain the issue. Max 10MB per file.
            </p>
            
            <div 
              className={`FileDropZone ${isDragOver ? 'DragOver' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{ position: 'relative' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
                onChange={(e) => handleFileSelect(e.target.files)}
                accept="image/*,.txt,.log,.json,.xml,.zip,.pdf,.md,.js,.ts,.jsx,.tsx,.css,.scss,.html,.py,.rb,.go,.java,.cpp,.h,.c"
              />
              <Icon name="cloud upload" size="big" style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5) }} />
              <p style={{ margin: `0 0 ${aspectWidth(0.5)}px 0`, color: '#C0C0C0', fontSize: aspectWidth(1), fontWeight: '500' }}>
                {isDragOver ? '📂 Drop files here!' : '📂 Drag & drop files here or 👆 click to browse'}
              </p>
              <p style={{ margin: 0, color: '#888', fontSize: aspectWidth(0.85) }}>
                Supports images, logs, screenshots, and other files (max 10MB each)
              </p>
            </div>

            {attachedFiles.length > 0 && (
              <div style={{ marginTop: aspectWidth(1) }}>
                <h5 style={{ color: '#C0C0C0', marginBottom: aspectWidth(0.5) }}>
                  📋 Attached Files ({attachedFiles.length})
                </h5>
                <div className="AttachedFilesList">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="AttachedFileItem">
                      <Icon 
                        name={file.type.startsWith('image/') ? 'image' : 'file'} 
                        style={{ marginRight: aspectWidth(0.5), color: '#C0C0C0' }} 
                      />
                      <span style={{ flex: 1, color: '#C0C0C0' }}>
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <Icon
                        name="trash"
                        link
                        onClick={() => removeFile(index)}
                        style={{ color: '#ff6b6b', cursor: 'pointer', marginLeft: aspectWidth(0.5) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          */}

          {!isFormValid && (
            <div className="BugReportValidationWarning" style={{ marginBottom: aspectWidth(1) }}>
              <p style={{ fontSize: aspectWidth(1) }}>
                ⚠️ <strong>Please fill out required fields:</strong>
              </p>
              <ul style={{ fontSize: aspectWidth(1) }}>
                {!title.trim() && <li>Bug title is required</li>}
                {!errorDescription.trim() && <li>Error description is required</li>}
                {!stepsToReproduce.some(step => step.trim()) && <li>At least one reproduction step is required</li>}
              </ul>
            </div>
          )}
        </Modal.Content>
        
        <Modal.Actions className='NoPadding'>
          <Grid className='FillParent Padded' textAlign='center'>
            <Grid.Row columns='equal'>
              <Grid.Column>
                <ActionButton
                  fill
                  label='Cancel'
                  onClick={handleClose}
                  disabled={isSubmitting}
                />
              </Grid.Column>
              <Grid.Column>
                <ActionButton
                  fill
                  important
                  label={isSubmitting ? 'Creating Report...' : 'Submit Bug Report'}
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Modal.Actions>
      </Modal>

      <PrivacyConsentModal
        isOpen={showPrivacyConsent}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
    </>
  )
} 