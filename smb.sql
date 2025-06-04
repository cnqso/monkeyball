-- Database setup for Super Monkey Ball League Tracker

DROP DATABASE IF EXISTS smb;
CREATE DATABASE IF NOT EXISTS smb;
USE smb;

-- Table: PLAYERS
DROP TABLE IF EXISTS round_players;
DROP TABLE IF EXISTS congress_players;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS congresses;
DROP TABLE IF EXISTS players;

CREATE TABLE IF NOT EXISTS players (
    player_tag VARCHAR(50) PRIMARY KEY,  -- Unique identifier (e.g., "BananaKing", "ApeDynamo")
    real_name VARCHAR(100) NOT NULL,     -- Real name (optional but nice to have)
    monkey_preference TINYINT NOT NULL CHECK (monkey_preference BETWEEN 1 AND 4), -- 1: AiAi, 2: MeeMee, 3: Baby, 4: GonGon
    profile_picture_id TINYINT NOT NULL CHECK (profile_picture_id BETWEEN 0 AND 99), -- Predetermined profile pictures
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP  -- When they joined the league
);

-- Table: CONGRESSES
CREATE TABLE IF NOT EXISTS congresses (
    congress_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,          -- Custom name for the congress (e.g., "Summer Slam")
    date DATE NOT NULL,                  -- Date of the congress
    location VARCHAR(100),               -- Physical or virtual location
    notes TEXT                           -- Optional notes (e.g., "4-player chaos!")
);

-- Junction table: CONGRESS_PLAYERS (many-to-many relationship)
CREATE TABLE IF NOT EXISTS congress_players (
    congress_id INT NOT NULL,
    player_tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (congress_id, player_tag),
    FOREIGN KEY (congress_id) REFERENCES congresses(congress_id) ON DELETE CASCADE,
    FOREIGN KEY (player_tag) REFERENCES players(player_tag) ON DELETE CASCADE
);

-- Table: ROUNDS
CREATE TABLE IF NOT EXISTS rounds (
    round_id INT AUTO_INCREMENT PRIMARY KEY,
    congress_id INT NOT NULL,            -- Which congress this round belongs to
    difficulty ENUM('Beginner', 'Advanced', 'Expert', 'Master') NOT NULL,
    round_order INT NOT NULL,            -- Order of the round in the congress (1st, 2nd, etc.)
    FOREIGN KEY (congress_id) REFERENCES congresses(congress_id) ON DELETE CASCADE
);

-- Table: ROUND_PLAYERS (scores for each player in a round)
CREATE TABLE IF NOT EXISTS round_players (
    round_id INT NOT NULL,
    player_tag VARCHAR(50) NOT NULL,
    stage_reached INT NOT NULL,           -- Last stage cleared (e.g., 10 for Beginner)
    lives_lost INT DEFAULT 0,             -- Lives lost (for tiebreaker)
    extra_stages INT DEFAULT 0,           -- Extra stages completed (for tiebreaker)
    monkey_used TINYINT NOT NULL CHECK (monkey_used BETWEEN 1 AND 4), -- Which monkey they actually used
    tiebreaker_points INT DEFAULT NULL,   -- Points from Monkey Target (if needed)
    score INT DEFAULT NULL,               -- Optional future scoring system
    final_rank INT,                       -- Calculated rank in the round (1st, 2nd, etc.)
    PRIMARY KEY (round_id, player_tag),
    FOREIGN KEY (round_id) REFERENCES rounds(round_id) ON DELETE CASCADE,
    FOREIGN KEY (player_tag) REFERENCES players(player_tag) ON DELETE CASCADE
);

-- Insert test players
INSERT INTO players (player_tag, real_name, monkey_preference, profile_picture_id) VALUES
    ('BananaKing', 'John Smith', 1, 1),      -- Prefers AiAi
    ('SpeedRunner', 'Jane Doe', 2, 2),       -- Prefers MeeMee
    ('MonkeyMaster', 'Alex Johnson', 3, 3),  -- Prefers Baby
    ('ApeWarrior', 'Sam Wilson', 4, 4);      -- Prefers GonGon

-- Create a test congress
INSERT INTO congresses (name, date, location, notes) VALUES
    ('Test Tournament', CURRENT_DATE, 'Online', 'Initial test congress');

-- Add all test players to the test congress
INSERT INTO congress_players (congress_id, player_tag) VALUES
    (1, 'BananaKing'),
    (1, 'SpeedRunner'),
    (1, 'MonkeyMaster'),
    (1, 'ApeWarrior');