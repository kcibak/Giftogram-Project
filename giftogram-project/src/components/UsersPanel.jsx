import UserActionControls from './UserActionControls'
import { uiStyles as styles } from '../styles/uiStyles'

function UsersPanel({
  currentUser,
  loading,
  loadingBlockForUserId,
  onBlock,
  onMessage,
  onRefresh,
  onUnblock,
  selectedUser,
  users = [],
  userBlockState,
}) {
  return (
    <section style={styles.panel}>
      <div style={styles.userHeader}>
        <div>
          <h2 style={styles.panelTitle}>Users</h2>
          <p style={styles.muted}>{currentUser ? 'Fetch and act on other users.' : 'Login required.'}</p>
        </div>

        <button
          disabled={!currentUser || loading}
          onClick={onRefresh}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
            ...(!currentUser || loading ? styles.disabledButton : {}),
          }}
          type="button"
        >
          Refresh
        </button>
      </div>

      {!currentUser && <p style={styles.muted}>No authenticated user yet.</p>}

      {currentUser && (
        <div style={styles.usersList}>
          {users.length === 0 && (
            <p style={styles.muted}>{loading ? 'Loading users...' : 'No users returned.'}</p>
          )}

          {users.map((user) => {
            const isSelected = selectedUser?.user_id === user.user_id
            const blockState = userBlockState[user.user_id]
            const isProcessing = loadingBlockForUserId === user.user_id

            return (
              <div
                key={user.user_id}
                style={{
                  ...styles.userItem,
                  ...(isSelected ? styles.selectedUserItem : {}),
                }}
              >
                <div style={styles.userHeader}>
                  <div>
                    <p style={styles.userName}>
                      {user.first_name} {user.last_name}
                    </p>
                    <p style={styles.mono}>{user.user_id}</p>
                    {blockState === true && <span style={styles.blockPill}>Blocked</span>}
                  </div>
                </div>

                <UserActionControls
                  blockState={blockState}
                  disabled={loading}
                  isProcessing={isProcessing}
                  onBlock={() => onBlock(user)}
                  onMessage={() => onMessage(user)}
                  onUnblock={() => onUnblock(user)}
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default UsersPanel
