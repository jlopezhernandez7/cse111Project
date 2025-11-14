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
WHERE e_location = 'libray 202'--spelled library wrong on purpose
