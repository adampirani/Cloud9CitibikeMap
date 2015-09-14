This workspace allows a user to search for all citibike rides within a time
range on December 1, 2014, and animate those rides based on google maps default 
bicycling directions

Notes / TODO:
*Set map based on boundaries, not based on zoom & center
*Restrict file sizes in database to use github?
*Display current time of day while animating
*Extend to more days (may require upgraded Cloud9 account for disk space)
*Compare trip time vs. google estimated trip time (change color of line based
 on results - ie: red for fast, blue for slow)
*Create a page to upload csv
processRoutes.html:
*Improve processRoutes.html to show progress
*Don't use a timer of 500ms per request to skirt google API limits. Use promises/generators
*Save all directions in a new collection, based on start location id & end 
 location id. Lookup directions from that collection for each trip instead
 of saving to trip
*Lookup based on success of previous lookup. Don't keep looking up when past quota

## Running the server
 
1)   Open `server.js` and start the app by clicking on the "Run" button in the top menu.

OR
                                    
b.   Alternatively you can launch the app from the Terminal:

    $ node server.js
    

Once the server is running, open the project in the shape of 'https://citibike-google-maps-aplikesbikes.c9.io/'


