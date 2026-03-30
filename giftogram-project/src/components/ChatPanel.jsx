import MessageComposer from './MessageComposer'
import { uiStyles as styles } from '../styles/uiStyles'

function ChatPanel({
  currentUser,
  loading,
  messageInput,
  messages,
  onMessageInputChange,
  onSend,
  selectedUser,
}) {
  return (
    <section style={{ ...styles.panel, minHeight: '640px' }}>
      <div style={styles.chatTop}>
        <div>
          <h2 style={styles.panelTitle}>Chat</h2>
          <p style={styles.muted}>
            {selectedUser
              ? `Conversation with ${selectedUser.first_name} ${selectedUser.last_name}`
              : 'Select a user to load messages.'}
          </p>
        </div>
      </div>

      {!currentUser && <p style={styles.muted}>Login first to access messages.</p>}

      {currentUser && !selectedUser && (
        <p style={styles.muted}>Pick a user from the list to start testing chat endpoints.</p>
      )}

      {currentUser && selectedUser && (
        <>
          <div style={styles.messageList}>
            {messages.length === 0 && (
              <p style={styles.muted}>{loading ? 'Loading messages...' : 'No messages yet.'}</p>
            )}

            {messages.map((message) => (
              <div key={message.message_id} style={styles.messageItem}>
                <p style={styles.messageSender}>{message.sender_user_id}</p>
                <p style={styles.messageText}>{message.message}</p>
              </div>
            ))}
          </div>

          <MessageComposer
            disabled={!currentUser || !selectedUser}
            loading={loading}
            messageInput={messageInput}
            onMessageInputChange={onMessageInputChange}
            onSend={onSend}
            selectedUser={selectedUser}
          />
        </>
      )}
    </section>
  )
}

export default ChatPanel
