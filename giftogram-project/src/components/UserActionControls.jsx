import { uiStyles as styles } from '../styles/uiStyles'

function UserActionControls({
  blockState,
  disabled,
  isProcessing,
  onBlock,
  onMessage,
  onUnblock,
}) {
  const isBlockStateKnown = typeof blockState === 'boolean'
  const isBlockDisabled = disabled || isProcessing || blockState === true || !isBlockStateKnown
  const isUnblockDisabled = disabled || isProcessing || blockState === false || !isBlockStateKnown

  return (
    <div style={styles.buttonRow}>
      <button disabled={disabled} onClick={onMessage} style={styles.button} type="button">
        Message
      </button>
      <button
        disabled={isBlockDisabled}
        onClick={onBlock}
        style={{
          ...styles.button,
          ...styles.secondaryButton,
          ...(isBlockDisabled ? styles.disabledButton : {}),
        }}
        type="button"
      >
        {isProcessing ? 'Working...' : !isBlockStateKnown ? 'Loading...' : blockState === true ? 'Blocked' : 'Block'}
      </button>
      <button
        disabled={isUnblockDisabled}
        onClick={onUnblock}
        style={{
          ...styles.button,
          ...styles.subtleButton,
          ...(isUnblockDisabled ? styles.disabledButton : {}),
        }}
        type="button"
      >
        {isProcessing ? 'Working...' : !isBlockStateKnown ? 'Loading...' : 'Unblock'}
      </button>
    </div>
  )
}

export default UserActionControls
