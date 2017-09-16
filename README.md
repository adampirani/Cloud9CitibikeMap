## Description

This workspace allows a user to search for all citibike rides within a time
range on December 1, 2014, and animate those rides based on google maps default 
bicycling directions

## Running the server

    $ node server.js
    

## TODO:
* Set map based on boundaries, not based on zoom & center
* Include database data in github
* Display current time of day while animating
* Extend to more days
* Compare trip time vs. google estimated trip time (change color of line based
 on results - ie: red for fast, blue for slow)
* Create a page to upload csv

**RouteProcessor.js:**
* Use processRoutes.html as a UI to show progress
* Don't use a timer of 500ms per request to skirt google API limits. Use promises
* Lookup based on success of previous lookup. Don't keep looking up when past quota
