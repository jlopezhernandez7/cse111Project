DELETE FROM users;
DELETE FROM event;
DELETE FROM status;
DELETE FROM tags;
DELETE FROM canconnect;
DELETE FROM posts;
DELETE FROM media;
DELETE FROM preferences;


-- USERS

INSERT INTO users (u_username, u_email, u_password) VALUES
('ace',   'ace@ucmerced.edu',   'pass_ace'),
('zoro',  'zoro@ucmerced.edu',  'pass_zoro'),
('mika',  'mika@ucmerced.edu',  'pass_mika');




-- EVENTS
INSERT INTO event (e_eventDate, e_location, e_userID, e_type, e_name,
                   e_duration, e_capacity, e_statusID, e_startTime)
VALUES
('2025-11-20', 'Granite Pass 135', 1, 'anime',   'Anime Screening Night', 180, 80, 1,'1:30pm '),
('2025-11-22', 'The Quad',         2, 'music',   'Guitar Jam on the Lawn', 120, 40, 2, '2:30pm' ),
('2025-11-24', 'Lake Yosemite',    3, 'nature',  'Sunrise Hike',          180, 25, 3, '4:30pm');


--change hour to 
-- STATUS rows (one per event; counts start at 0)
INSERT INTO status (s_countGoing, s_maybeGoing) VALUES
(4, 5),  -- statusID = 1
(2, 1),  -- statusID = 2
(29, 13);  -- statusID = 3


-- TAGS  
INSERT INTO tags (t_type, t_date, t_duration, t_capacity, t_startTime) VALUES
('anime',  '2025-11-20',     180,  80, '1:30pm'),      -- tagsID = 1
('anime',  '2025-11-20',     NULL,  50, '2:30pm'),        -- tagsID = 2
('music',  '2025-11-22',  120,  40 , '2:30pm'),        
('nature', NULL,             NULL,  NULL, NULL),   -- tagsID = 
('study', NULL, NULL, NULL, NULL);



-- CANCONNECT (Event ↔ Tag links)
-- Event 1 is anime; Event 3 is music; Event 4 is nature
INSERT INTO canconnect (c_eventID, c_tagsID) VALUES
(1, 1),  -- Anime Screening ↔ anime
(2, 3),  -- Guitar Jam    ↔ music
(3, 4), -- Sunrise Hike  ↔ nature
(1,5);-- 




-- POSTS (event updates)
INSERT INTO posts (postTitle, p_eventID, postContent) VALUES
('Welcome to Anime Night', 1, 'We will watch three episodes of One Piece.'),
('Song Suggestions',       2, 'Drop your favorite riffs for the jam.'),
('Hike Checklist',         3, 'Bring water, comfy shoes, and a jacket.');

-- MEDIA (event flyers)
INSERT INTO media (m_mediaType, m_eventID, m_mediaURL) VALUES
--0: images, 1: videos
(0, 1, 'https://example.com/flyers/anime.png'),   -- image
(0, 2, 'https://example.com/flyers/guitar.jpg'),
(0, 3, 'https://example.com/flyers/hike.jpg');




-- PREFERENCES (User ↔ Tag + notifications)
-- Ace likes anime & music notifications
-- Zoro likes gears
-- Mika likes nature
INSERT INTO preferences (p_tagsID, p_userID, notification) VALUES
(1, 1, 1),  -- user 1, tag anime, notifications ON
(2, 1, 1),  -- user 1, tag music, ON
(4, 2, 1),  -- user 2, tag gears, ON
(3, 3, 0);  -- user 3, tag nature, OFF