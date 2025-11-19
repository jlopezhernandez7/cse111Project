    --1. A user updates their password
UPDATE users SET u_password = 'new_secure_pass_ace' --from 'pass_ace'
WHERE u_username = 'ace';

UPDATE users SET u_email = 'ace123@ucmerced.edu'-- from ace@ucmerced.edu
WHERE u_username = 'ace';


--2 event modifications

INSERT  OR IGNORE INTO event ( eventID, e_eventDate, e_location, e_userID,
e_type, e_name, e_duration, e_capacity, e_statusID, e_startTime
)
VALUES (
    4,'2025-11-18','COB2 170',1,'gaming','Minecraft Build Night', 
    180, 60, 4, '5:00pm'                    
), ( 5, '2025-11-17', 'The pav', 2, 'gaming', 'Movie Night', 100, 50, 5,'9:00pm');

UPDATE event SET e_location = 'libray 202' --from Granite Pass 135
WHERE eventID = 1;

DELETE  FROM event  
WHERE e_type = 'nature' and e_name = 'Sunrise Hike';


--create a new status row for a new event

INSERT OR IGNORE INTO status (statusID, s_countGoing, s_maybeGoing)
VALUES (4, 0, 0),
(5,50,20);   -- new status for the new event

--Add a new tag for Minecraft events
INSERT OR IGNORE INTO tags (tagsID, t_type, t_date, t_duration, t_capacity)
VALUES (
    5,
    'minecraft',
    '2025-11-30',
    NULL,
    60

);

-- INSERT OR IGNORE INTO canconnect ( c_eventID, c_tagsID)




-- User 1 turns off notifications for one anime tag
UPDATE preferences
SET notification = 0
WHERE p_userID = 1 AND p_tagsID = 2;




-- User 3 decides to turn on notifications for the music tag

UPDATE preferences
SET notification = 1
WHERE p_userID = 3 AND p_tagsID = 3;



-- User 2 unsubscribes from a tag completely
DELETE FROM preferences
WHERE p_userID = 2 AND p_tagsID = 4;






-- Update status counts for Anime Screening
-- more people marked "going"

UPDATE status
SET s_countGoing = s_countGoing + 3,
    s_maybeGoing = s_maybeGoing - 1
WHERE statusID = 1;


-- Add a new post for Anime Screening Night

INSERT INTO posts (postTitle, p_eventID, postContent)
VALUES (
    'Snacks for Anime Night',
    1,
    'Bring popcorn, chips, and drinks!'
);


-- Edit the original Anime Night post text
UPDATE posts
SET postContent = 'We will watch three episodes of One Piece and maybe a movie.'--added "and maybe a movie"
WHERE postTitle = 'Welcome to Anime Night';


-- Remove a media file from Guitar Jam 

DELETE FROM media
WHERE mediaID = 2;




--  Cancel the Sunrise Hike event
-- First delete children  then the event + its status

DELETE FROM media      WHERE m_eventID = 3;
DELETE FROM posts      WHERE p_eventID = 3;
DELETE FROM canconnect WHERE c_eventID = 3;
DELETE FROM event      WHERE eventID = 3;
DELETE FROM status     WHERE statusID = 3;