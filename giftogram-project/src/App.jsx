import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './components/AuthPanel'
import ChatPanel from './components/ChatPanel'
import UsersPanel from './components/UsersPanel'
import {
  createApiClient,
  DEFAULT_API_BASE_URL,
  normalizeApiBaseUrl,
} from './services/apiClient'
import { uiStyles as styles } from './styles/uiStyles'

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authToken, setAuthToken] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [userBlockState, setUserBlockState] = useState({})
  const [loadingBlockForUserId, setLoadingBlockForUserId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('info')
  const [apiStatus, setApiStatus] = useState({
    state: 'checking',
    message: `Checking API at ${API_BASE_URL}`,
  })
  const [loading, setLoading] = useState({
    auth: false,
    users: false,
    messages: false,
    send: false,
    block: false,
    health: false,
  })

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE_URL,
        getAuthToken: () => authToken,
        onConnected: (baseUrl) => {
          setApiStatus({
            state: 'connected',
            message: `API reachable at ${baseUrl}`,
          })
        },
        onDisconnected: (message) => {
          setApiStatus({
            state: 'disconnected',
            message,
          })
        },
      }),
    [authToken]
  )

  useEffect(() => {
    checkApiHealth()
  }, [])

  useEffect(() => {
    if (!currentUser || !authToken) {
      setUsers([])
      return
    }

    fetchUsers()
  }, [currentUser, authToken])

  function updateAuthField(field, value) {
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function setStatus(message, type = 'info') {
    setStatusMessage(message)
    setStatusType(type)
  }

  function reconcileBlockState(nextUsers) {
    setUserBlockState((current) => {
      const nextState = {}

      nextUsers.forEach((user) => {
        nextState[user.user_id] =
          typeof current[user.user_id] === 'boolean' ? current[user.user_id] : false
      })

      return nextState
    })
  }

  async function checkApiHealth() {
    setLoading((current) => ({ ...current, health: true }))
    setApiStatus({
      state: 'checking',
      message: `Checking API at ${API_BASE_URL}`,
    })

    try {
      await apiClient.checkHealth()
      setApiStatus({
        state: 'connected',
        message: `API and database are reachable at ${apiClient.baseUrl}`,
      })
    } catch (error) {
      setApiStatus({
        state: 'disconnected',
        message:
          `Backend unreachable at ${apiClient.baseUrl}. ` +
          'Start the stack with `docker compose up --build`.',
      })
    } finally {
      setLoading((current) => ({ ...current, health: false }))
    }
  }

  async function handleRegister() {
    setLoading((current) => ({ ...current, auth: true }))

    try {
      const data = await apiClient.register({
        email: authForm.email,
        password: authForm.password,
        first_name: authForm.first_name,
        last_name: authForm.last_name,
      })

      if (!data?.user_id) {
        throw new Error('Register response was missing the created user payload.')
      }

      setStatus(
        `Registered ${data.first_name} ${data.last_name}. You can log in now.`,
        'success'
      )
      setAuthMode('login')
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, auth: false }))
    }
  }

  async function handleLogin() {
    setLoading((current) => ({ ...current, auth: true }))

    try {
      const data = await apiClient.login({
        email: authForm.email,
        password: authForm.password,
      })

      if (!data?.token || !data?.user?.user_id) {
        throw new Error('Login response was missing the session token or user payload.')
      }

      setAuthToken(data.token)
      setCurrentUser(data.user)
      setSelectedUser(null)
      setMessages([])
      setStatus(`Logged in as ${data.user.first_name} ${data.user.last_name}`, 'success')
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, auth: false }))
    }
  }

  function handleLogout() {
    setAuthToken('')
    setCurrentUser(null)
    setUsers([])
    setUserBlockState({})
    setSelectedUser(null)
    setMessages([])
    setMessageInput('')
    setLoadingBlockForUserId('')
    setAuthMode('login')
    setStatus('Logged out successfully.', 'success')
  }

  async function fetchUsers() {
    if (!currentUser?.user_id) {
      return
    }

    setLoading((current) => ({ ...current, users: true }))

    try {
      const data = await apiClient.listUsers(currentUser.user_id)
      const nextUsers = data?.users || []
      setUsers(nextUsers)
      reconcileBlockState(nextUsers)
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, users: false }))
    }
  }

  async function fetchMessages(user) {
    if (!currentUser?.user_id || !user?.user_id) {
      return
    }

    setLoading((current) => ({ ...current, messages: true }))

    try {
      const data = await apiClient.viewMessages(currentUser.user_id, user.user_id)
      setMessages(data?.messages || [])
    } catch (error) {
      setMessages([])
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, messages: false }))
    }
  }

  async function handleSelectUser(user) {
    setSelectedUser(user)
    await fetchMessages(user)
  }

  async function handleSendMessage() {
    if (!currentUser?.user_id || !selectedUser?.user_id || !messageInput.trim()) {
      return
    }

    setLoading((current) => ({ ...current, send: true }))

    try {
      await apiClient.sendMessage({
        sender_user_id: currentUser.user_id,
        receiver_user_id: selectedUser.user_id,
        message: messageInput,
      })

      setMessageInput('')
      setStatus(`Message sent to ${selectedUser.first_name}.`, 'success')
      await fetchMessages(selectedUser)
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, send: false }))
    }
  }

  async function handleBlock(user) {
    if (!user?.user_id) {
      return
    }

    setLoading((current) => ({ ...current, block: true }))
    setLoadingBlockForUserId(user.user_id)

    try {
      await apiClient.blockUser(user.user_id)
      setUserBlockState((current) => ({ ...current, [user.user_id]: true }))
      setStatus(`Blocked ${user.first_name} ${user.last_name}.`, 'success')

      if (selectedUser?.user_id === user.user_id) {
        await fetchMessages(user)
      }
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, block: false }))
      setLoadingBlockForUserId('')
    }
  }

  async function handleUnblock(user) {
    if (!user?.user_id) {
      return
    }

    setLoading((current) => ({ ...current, block: true }))
    setLoadingBlockForUserId(user.user_id)

    try {
      await apiClient.unblockUser(user.user_id)
      setUserBlockState((current) => ({ ...current, [user.user_id]: false }))
      setStatus(`Unblocked ${user.first_name} ${user.last_name}.`, 'success')

      if (selectedUser?.user_id === user.user_id) {
        await fetchMessages(user)
      }
    } catch (error) {
      setStatus(error.message, 'error')
    } finally {
      setLoading((current) => ({ ...current, block: false }))
      setLoadingBlockForUserId('')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroHeader}>
            <div>
              <p style={{ ...styles.muted, marginBottom: '10px' }}>REST API demo frontend</p>
              <h1 style={styles.heroTitle}>Giftogram Chat Tester</h1>
              <p style={styles.heroText}>
                Minimal single-page React UI for exercising auth, users, messaging,
                and blocking endpoints against the local backend.
              </p>
            </div>

            <div style={styles.buttonRow}>
              <span
                style={{
                  ...styles.infoChip,
                  ...(apiStatus.state === 'connected'
                    ? styles.infoChipSuccess
                    : apiStatus.state === 'disconnected'
                      ? styles.infoChipError
                      : {}),
                }}
              >
                {apiStatus.state === 'connected'
                  ? 'API Connected'
                  : apiStatus.state === 'disconnected'
                    ? 'API Offline'
                    : 'Checking API'}
              </span>
              <button
                disabled={loading.health}
                onClick={checkApiHealth}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  ...(loading.health ? styles.disabledButton : {}),
                }}
                type="button"
              >
                {loading.health ? 'Checking...' : 'Retry Health Check'}
              </button>
            </div>
          </div>

          <p
            style={{
              ...styles.status,
              ...(apiStatus.state === 'connected'
                ? styles.success
                : apiStatus.state === 'disconnected'
                  ? styles.error
                  : {}),
            }}
          >
            {apiStatus.message}
          </p>
        </section>

        <div style={styles.grid}>
          <div style={styles.leftColumn}>
            <AuthPanel
              authForm={authForm}
              authMode={authMode}
              currentUser={currentUser}
              loading={loading.auth}
              onChange={updateAuthField}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onModeChange={setAuthMode}
              onRegister={handleRegister}
              statusMessage={statusMessage}
              statusType={statusType}
            />

            <UsersPanel
              currentUser={currentUser}
              loading={loading.users || loading.block}
              loadingBlockForUserId={loadingBlockForUserId}
              onBlock={handleBlock}
              onMessage={handleSelectUser}
              onRefresh={fetchUsers}
              onUnblock={handleUnblock}
              selectedUser={selectedUser}
              userBlockState={userBlockState}
              users={users}
            />
          </div>

          <ChatPanel
            currentUser={currentUser}
            loading={loading.messages || loading.send}
            messageInput={messageInput}
            messages={messages}
            onMessageInputChange={setMessageInput}
            onSend={handleSendMessage}
            selectedUser={selectedUser}
          />
        </div>
      </div>
    </div>
  )
}

export default App
