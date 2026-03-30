import { uiStyles as styles } from '../styles/uiStyles'

function MessageComposer({
  disabled,
  loading,
  messageInput,
  onMessageInputChange,
  onSend,
  selectedUser,
}) {
  return (
    <div style={styles.composer}>
      <textarea
        disabled={disabled}
        onChange={(event) => onMessageInputChange(event.target.value)}
        placeholder={
          selectedUser?.first_name
            ? `Send a message to ${selectedUser.first_name}...`
            : 'Send a message...'
        }
        style={styles.textarea}
        value={messageInput}
      />
      <div style={styles.buttonRow}>
        <button
          disabled={disabled || loading || !(messageInput || '').trim()}
          onClick={onSend}
          style={{
            ...styles.button,
            ...(disabled || loading || !(messageInput || '').trim() ? styles.disabledButton : {}),
          }}
          type="button"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default MessageComposer
