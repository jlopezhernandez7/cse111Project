PRAGMA foreign_keys = ON;--not sure if to include 

DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS canconnect;
DROP TABLE IF EXISTS preferences;
DROP TABLE IF EXISTS tags;


CREATE TABLE  user (
    userID INTEGER PRIMARY KEY,
    u_username VARCHAR(50) UNIQUE NOT NULL,
    u_email VARCHAR(100) UNIQUE NOT NULL,
    u_password VARCHAR(255) NOT NULL

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event (
    eventID INTEGER PRIMARY KEY,
    e_eventDate DATE NOT NULL,
    e_location VARCHAR(150),
    e_userID INTEGER,--fk to users table
    e_type VARCHAR(50),
    e_name VARCHAR(100) NOT NULL,
    e_duration INTEGER,
    e_capacity INTEGER, 
    e_statusID INTEGER,--fk to status table
    
    FOREIGN KEY (e_userID) REFERENCES user(userID),
    FOREIGN KEY (e_statusID) REFERENCES status(statusID)

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE status (
    statusID INTEGER PRIMARY KEY,
    s_countGoing INTEGER DEFAULT 0,
    s_maybeGoing INTEGER DEFAULT 0
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    postID INTEGER PRIMARY KEY,
    postTitle VARCHAR(200) NOT NULL, -- Title of the post
    p_eventID INTEGER,--fk to post table
    postContent TEXT NOT NULL,
    FOREIGN KEY (p_eventID) REFERENCES event(eventID) 

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
    mediaID INTEGER PRIMARY KEY,
    m_mediaType INTEGER,--image or video
    m_eventID INTEGER,--fk to event table
    m_mediaURL VARCHAR(255) NOT NULL,
    FOREIGN KEY (m_eventID) REFERENCES event(eventID) 

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    tagsID INTEGER PRIMARY KEY,
    t_type VARCHAR(50),
    t_date VARCHAR(50),
    t_duration INTEGER,--minutes 
    t_capacity INTEGER

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE canconnect (
    c_eventID INTEGER NOT NULL,
    c_tagsID INTEGER NOT NULL,
    PRIMARY KEY (c_eventID, c_tagsID),
    FOREIGN KEY (c_eventID) REFERENCES event(eventID),
    FOREIGN KEY (c_tagsID)  REFERENCES tags(tagsID)  
    

    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE preferences (
  p_tagsID INTEGER NOT NULL,
  p_userID  INTEGER NOT NULL,
  notification  BOOLEAN DEFAULT FALSE,

  PRIMARY KEY (p_userID, p_tagsID),
  FOREIGN KEY (p_userID) REFERENCES user(userID) ,
  FOREIGN KEY (p_tagsID)  REFERENCES tags(tagsID)  
      -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);