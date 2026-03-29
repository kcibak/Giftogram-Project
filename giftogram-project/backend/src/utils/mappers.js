function toUserResponse(user) {
  return {
    user_id: user.publicId,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
  };
}

function toLoginResponse({ token, expiresAt, user }) {
  return {
    token,
    expires_at: formatDateValue(expiresAt),
    user: toUserResponse(user),
  };
}

function toMessageResponse(message) {
  return {
    message_id: message.publicId,
    sender_user_id: message.senderPublicId,
    message: message.message,
    epoch: message.epoch,
  };
}

module.exports = {
  toLoginResponse,
  toUserResponse,
  toMessageResponse,
};

function formatDateValue(value) {
  // Gracefully handle missing or invalid date inputs when formatting response values.
  if (value == null) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
