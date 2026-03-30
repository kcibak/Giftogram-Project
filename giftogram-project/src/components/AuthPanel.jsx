import { uiStyles as styles } from '../styles/uiStyles'

function AuthPanel({
  authForm,
  authMode,
  currentUser,
  loading,
  onChange,
  onLogin,
  onLogout,
  onModeChange,
  onRegister,
  statusMessage,
  statusType,
}) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>Authentication</h2>

      {currentUser ? (
        <div style={styles.buttonRow}>
          <button
            onClick={onLogout}
            style={{ ...styles.button, ...styles.secondaryButton }}
            type="button"
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          <div style={styles.buttonRow}>
            <button
              onClick={() => onModeChange('login')}
              style={{ ...styles.button, ...(authMode === 'login' ? {} : styles.secondaryButton) }}
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => onModeChange('register')}
              style={{
                ...styles.button,
                ...(authMode === 'register' ? {} : styles.secondaryButton),
              }}
              type="button"
            >
              Register
            </button>
          </div>

          <div style={{ ...styles.formRow, marginTop: '16px' }}>
            <label style={styles.label}>
              Email
              <input
                onChange={(event) => onChange('email', event.target.value)}
                placeholder="email@example.com"
                style={styles.input}
                type="email"
                value={authForm.email}
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                onChange={(event) => onChange('password', event.target.value)}
                placeholder="Password"
                style={styles.input}
                type="password"
                value={authForm.password}
              />
            </label>

            {authMode === 'register' && (
              <>
                <label style={styles.label}>
                  First Name
                  <input
                    onChange={(event) => onChange('first_name', event.target.value)}
                    placeholder="First name"
                    style={styles.input}
                    type="text"
                    value={authForm.first_name}
                  />
                </label>

                <label style={styles.label}>
                  Last Name
                  <input
                    onChange={(event) => onChange('last_name', event.target.value)}
                    placeholder="Last name"
                    style={styles.input}
                    type="text"
                    value={authForm.last_name}
                  />
                </label>
              </>
            )}
          </div>

          <div style={styles.buttonRow}>
            <button
              disabled={loading}
              onClick={authMode === 'register' ? onRegister : onLogin}
              style={{ ...styles.button, ...(loading ? styles.disabledButton : {}) }}
              type="button"
            >
              {loading ? 'Working...' : authMode === 'register' ? 'Register' : 'Login'}
            </button>
          </div>
        </>
      )}

      {currentUser && (
        <div style={styles.userBadge}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
            {currentUser.first_name} {currentUser.last_name}
          </p>
          <p style={{ ...styles.muted, marginBottom: '4px' }}>{currentUser.email}</p>
          <p style={styles.mono}>{currentUser.user_id}</p>
        </div>
      )}

      {statusMessage && (
        <p
          style={{
            ...styles.status,
            ...(statusType === 'error' ? styles.error : statusType === 'success' ? styles.success : {}),
          }}
        >
          {statusMessage}
        </p>
      )}
    </section>
  )
}

export default AuthPanel
