const DEFAULT_API_BASE_URL = 'http://localhost:3000'

export function normalizeApiBaseUrl(value) {
  return String(value || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

export function createApiClient({ baseUrl, getAuthToken, onConnected, onDisconnected }) {
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl)

  async function request(path, options = {}) {
    try {
      const authToken = getAuthToken ? getAuthToken() : ''
      const { headers: optionHeaders, ...restOptions } = options || {}
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(optionHeaders || {}),
        },
        ...restOptions,
      })

      const data = await response.json().catch(() => null)

      if (onConnected) {
        onConnected(normalizedBaseUrl)
      }

      if (!response.ok) {
        throw new Error(formatApiErrorMessage(data, response.status))
      }

      return data
    } catch (error) {
      if (isNetworkError(error)) {
        const message =
          `Backend unreachable at ${normalizedBaseUrl}. ` +
          'Make sure Docker is running and start the stack with `docker compose up --build`.'

        if (onDisconnected) {
          onDisconnected(message)
        }

        throw new Error(message)
      }

      throw error
    }
  }

  return {
    baseUrl: normalizedBaseUrl,
    request,
    async checkHealth() {
      try {
        const response = await fetch(`${normalizedBaseUrl}/health`)
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(formatHealthFailureMessage(data))
        }

        return data
      } catch (error) {
        if (isNetworkError(error)) {
          const message =
            `Backend unreachable at ${normalizedBaseUrl}. ` +
            'Make sure Docker is running and start the stack with `docker compose up --build`.'

          if (onDisconnected) {
            onDisconnected(message)
          }

          throw new Error(message)
        }

        throw error
      }
    },
    register(payload) {
      return request('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    login(payload) {
      return request('/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    listUsers(requesterUserId) {
      if (requesterUserId == null || requesterUserId === '') {
        throw new Error('requesterUserId is required for listUsers.')
      }

      const params = new URLSearchParams({ requester_user_id: requesterUserId })
      return request(`/list_all_users?${params.toString()}`, { method: 'GET' })
    },
    viewMessages(userIdA, userIdB) {
      if (userIdA == null || userIdA === '' || userIdB == null || userIdB === '') {
        throw new Error('Both userIdA and userIdB are required for viewMessages.')
      }

      const params = new URLSearchParams({ user_id_a: userIdA, user_id_b: userIdB })
      return request(`/view_messages?${params.toString()}`, { method: 'GET' })
    },
    sendMessage(payload) {
      return request('/send_message', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    blockUser(blockedUserId) {
      return request('/block_user', {
        method: 'POST',
        body: JSON.stringify({ blocked_user_id: blockedUserId }),
      })
    },
    unblockUser(blockedUserId) {
      return request('/unblock_user', {
        method: 'POST',
        body: JSON.stringify({ blocked_user_id: blockedUserId }),
      })
    },
  }
}

function formatApiErrorMessage(payload, statusCode) {
  const title = payload?.error_title
  const message = payload?.error_message || payload?.message || 'Request failed.'
  const code = payload?.error_code
  const parts = []

  if (title) {
    parts.push(title)
  }

  parts.push(message)

  if (code) {
    parts.push(`code ${code}`)
  } else if (statusCode) {
    parts.push(`status ${statusCode}`)
  }

  return parts.join(' | ')
}

function formatHealthFailureMessage(payload) {
  if (!payload) {
    return 'Health check failed.'
  }

  if (payload?.database === 'down') {
    return 'Health check failed because the database is unavailable.'
  }

  return payload?.message || 'Health check failed.'
}

function isNetworkError(error) {
  return error instanceof TypeError
}

export { DEFAULT_API_BASE_URL }
