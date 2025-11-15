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
.print "Show all users and the vents they have created"
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
where e_eventDate BETWEEN DATE('now') and DATE('now', '+7 days')
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
.print "Shows all users who have created a completed event"
.print " "

Select DISTINCT u_username
from users, event
where userID = e_userID
and e_eventDate < DATE('NOW');
