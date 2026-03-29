-- Users table: Stores information about registered users, including authentication details and profile information.
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE, -- UUID exposed externally
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    role ENUM('user', 'admin') DEFAULT 'user',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),

    INDEX idx_email (email),
    INDEX idx_public_id (public_id)
);


-- Messages table: Stores private messages exchanged between users.
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    epoch BIGINT NOT NULL, -- for API response format

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_conversation (sender_id, receiver_id),
    INDEX idx_created_at (created_at)
);


-- Sessions table: Manages user authentication sessions with token hashes and expiration times.
CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,

    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash)
);


-- User blocks table: Tracks which users have blocked other users to prevent unwanted interactions.
CREATE TABLE user_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,

    CONSTRAINT chk_user_blocks_no_self_block CHECK (blocker_id <> blocked_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

    UNIQUE(blocker_id, blocked_id),

    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);


