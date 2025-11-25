.mode table
.headers on

--1) searching event with tag type 'anime'
.print "query 1 " 
.print "Events with tag type 'anime':"
.print " " 
SELECT eventID, e_name, e_eventdate
FROM event, tags, canconnect
WHERE eventID = c_eventID
AND tagsID = c_tagsID
AND t_type = 'anime';



--2) 
.print " " 
.print "query 2 " 
.print "Events happening at 'libray 202':"
.print " " 

SELECT e_name, e_location, e_eventdate
FROM event
WHERE e_location = 'libray 202';--spelled library wrong on purpose



--Added 3 through 11
--3)
.print " " 
.print "query 3 " 
.print "Show all users and the events they have created"
.print " " 

select u_username as Host, e_name as EventName
from event, users
where e_userID = userID
order by Host;

--4)

.print " " 
.print "query 4 " 
.print "Shows all events orders by most recent first"
.print " "
--I thinks tags need not be included but not sure
select e_eventdate, e_name
from event
order by e_eventdate;

--5)

.print " " 
.print "query 5 " 
.print "Shows all events with keyword "Night" in their name."
.print " "

Select e_name
from event 
where e_name Like '%Night%';

--6)

.print " " 
.print "query 6 " 
.print "Shows all events and the amount of people signed up to go and those thinking about going."
.print " "

Select e_name, s_countGoing as PeopleGoing, s_maybeGoing as ThinkingAboutIt
from event, status
where e_statusID = statusID;

--7)

.print " " 
.print "query 7 " 
.print "Shows all events and their posts"
.print " "

Select e_name as Event, postTitle, postContent
from event, posts
where eventID = p_eventID
order by Event;

--8)

.print " " 
.print "query 8" 
.print "Shows all events with media"
.print " "

SELECT e_name as Event, m_mediaURL as Media
from event, media
where eventID = m_eventID
order by Event;

--9) 

.print " " 
.print "query 9 " 
.print "Shows all events that will occur within 7 days"
.print " "

Select e_name AS Event, e_eventDate AS Date
from event
where e_eventDate BETWEEN DATE('now', 'localtime') and DATE('now', 'localtime', '+7 days')
order by Date;

--10)

.print " " 
.print "query 10 " 
.print "Shows all events with duration longer than an hour or capacity larger than 20 using tags"
.print " "

SELECT e_name AS Event, t_duration, t_capacity
FROM event, tags, canconnect
WHERE eventID = c_eventID
AND tagsID = c_tagsID
AND (t_duration > 60 or t_capacity > 20); 

--11)

.print " " 
.print "query 11 " 
.print "Shows all users who have created a event that has passed "
.print " "

Select DISTINCT u_username
from users, event
where userID = e_userID
and e_eventDate < DATE('NOW', 'localtime'); --Empty because events havent passed yet if we flip sign,  future events will show



--12)
.print " " 
.print "query 12 " 
.print "Shows all users who have not created any events"
.print " "
 --left join to show all null values of users with no events
SELECT u_username
FROM users u
left join event e on u.userID = e.e_userID
WHERE e.e_userID IS NULL;

-- --13)
-- .print " " 
-- .print "query 13 " 
-- .print "display user  who are  marked "going" for an event and the event names and date "  
-- .print " "
--believe we are not tracking which users are going to what events, maybe need to another table connecting to status,
-- attendance: displaying event id and user id an a_status(0 or 1)




--14) 
.print " " 
.print "query 14 " 
.print "Shows events with all their tags "
.print " "
SELECT eventID, e_name as eventName, tagsID, t_type, t_date, t_capacity
FROM event e
JOIN canconnect c ON e.eventID = c.c_eventID 
JOIN tags t ON c.c_tagsID = t.tagsID
ORDER BY eventID;



--15)
.print " "
.print "query 15 "
.print "Shows the total number of events happening at each location"
.print " "

SELECT e_location AS Location, COUNT(*) as TotalEvents

FROM event 
GROUP BY e_location;

--16)
.print " "
.print "query 16 "
.print "display the most popular event based on highest going count"
.print " "


SELECT e.e_name   AS Event, e.e_eventDate  AS Date, e.e_location AS Location, s.s_countGoing AS Going
FROM event  e
JOIN status s ON s.statusID = e.e_statusID
ORDER BY s.s_countGoing DESC
LIMIT 1;

--17) 
.print " "
.print "query 17 "
.print "show all events that are happening today"
.print " "
SELECT e_name      AS eventName, e_eventDate AS DateOfevent, e_location
FROM event e
WHERE e.e_eventDate = DATE('now', 'localtime'); --using pst not utc, utc messes the query up in our time


--18)
.print " "
.print "query 18 "
.print "show all events that user 1 created "
.print " "

SELECT u.u_username  AS User,e.e_name   AS Event, e.e_eventDate AS Date,
e.e_location  AS Location
FROM users u
JOIN event e ON e.e_userID = u.userID
WHERE u.userID = 1;


--19)
.print " "
.print "query 19 "
.print "show all events that have more than 10 person maybe going  or going "
.print " "

SELECT e.e_name  AS Event, e.e_eventDate  AS Date, s.s_countGoing AS Going,
s.s_maybeGoing AS MaybeGoing
FROM event  e
JOIN status s ON s.statusID = e.e_statusID
WHERE s.s_countGoing  > 10
OR s.s_maybeGoing > 10;


--20)
.print " "
.print "query 20 "
.print "show all users who have created more than 1 events in the  month of november 2025"


SELECT u.u_username  AS User,
       COUNT(e.eventID) AS numEvents
FROM users u
JOIN event e ON e.e_userID = u.userID
WHERE e.e_eventDate >= '2025-11-01'
  AND e.e_eventDate <  '2025-12-01'
GROUP BY u.userID
HAVING COUNT(e.eventID) > 1;


--21) 
.print " "
.print "query 21 "
.print "show all users who prefer tags of nature or music"




SELECT DISTINCT u.u_username AS User, t.t_type  AS Tag
FROM users       u
JOIN preferences p ON p.p_userID = u.userID
JOIN tags        t ON t.tagsID   = p.p_tagsID
WHERE t.t_type IN ('nature', 'music');

.print " "
.print " "

SELECT a_userID, e.eventID, a.a_going
FROM attendance a 
JOIN status s on a.attendID = s.s_attendID
JOIN event e on s.s_eventID = e.eventID
WHERE e.eventID = 1;











