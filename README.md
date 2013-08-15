#Angler.js

Angler.js is tool for advanced event and session tracking. See a working example at www.sdrobs.com/home/angler

The above example shows a very simple data rendering with time graphs, predicted users actions, and event statistics. Angler data can easily be rendered to show much more powerful renderings though, such as heatmaps, user reenactment, and A-B testing overlays.

###Client Side:

    <script src="../angler.js"></script>
    
    <script>
        angler.start({
            heartBeat:10000,
            isTagOnly: true,
            isSaveTagOnly: true
        })
    </script>

Tag any elements you want tracked with ```data-angler="Event Name"```. Spaces in the event name are allowed.

Or, if you call angler.start() with isTagOnly and isSaveTagOnly set to false, all clicks will be tracked as individual events.

Note that Angler.js does require Jquery to run properly.

=======
###Server Side:

As of right now, angler does not sync client-side timezones/offsets. This is because there is no guarantee that a user's computer is correctly synced to its set timezone, and such inaccuracy could malform your data.

As such, it is STRONGLY recommended that you sync all incoming timestamps to your server's time. Syncing is simple; the following is a node.js (javascript) example of how to sync all incoming times:
    
    //Angler sends the sendStamp variable with all requests, representing a unix int of the exact time the post was sent
    var timeDiff = Math.abs(Date.now() - req.body.sendStamp)
    
    //the ajax call has a timeout of 750ms, so if this time is exceeded, all timestamps should be adjusted
    if(timeDiff > 750){
        var lastEvent = req.body.events[req.body.events.length-1]
        
        //loop through each timestamp and add the time offset
        req.body.events.forEach(function(event){
            event.timeStamps.forEach(function(timeStamp){
                timeStamp.end = parseInt(timeStamp.end, 10) + timeDiff
                timeStamp.start = parseInt(timeStamp.start, 10) + timeDiff
            })
        })
    }
    //and that's it! Super simple.

Angler posts all data to '/angle/:anglerId', so you will need to set up a route to receive and save angler data to your database. 
Once it is saved, you can manipulate angler data however you want!
 
=======

###Additional help:

Angler will post data conforming to the following schema:

    var anglerSession = new Schema({
        path                        : { type : String, required : true },
        sessionId                   : { type : String, required : true, index: true },
        user                        : { type : String }, //optional; can be populated either on client side or server side
        events: [{
            nodeName             : { type : String },
            elementIdName        : { type : String },
            elementClassName     : { type : String },
            data                 : { type : String },
            href                 : { type : String },
            timeStamps:    [{
                start : { type : Number },
                end   : { type : Number }
            }]
        }]
    })
    
Essentially, angler records timestamps marking the start and end of each spurt of user activity on a page, while storing it within the context of the associated events. This allows a near perfect modeling of what a user did during any one time on a page.

One 'anglerSession' is created for each visit to a url, and resets every time the url changes. For example, if a user goes to a new page, then clicks back, three different sessions will have been created. You can easily sort this data server-side by url for a wholistic view of a specific page.

Angler is best suited for websites using client-side rendering engines such as backbone or ember, because it allows angler to save data on a detected url change. If you are simply serving static pages, it is highly recommended that you set 'heartBeat' on start to a low value (~3000 ms or so) to avoid losing data.

To clarify, the heartBeat controls both saving, and inactivity dormancy. As long as any activity is detected between consecutive heartbeats, angler will save its current data on this interval. If no activity was recorded since the last heartbeat, angler will go into a waiting state, where it stops storing data until further activity resumes. On activity resume, a new set of start and end timestamps will be appended to the current event context, essentially marking the specific periods of user activity.

Feel free to contact me if you have any questions.

======
###Testing:

Tests should be run using npm (Node Package Manager)

If you do not already have it, run ```sudo apt-get install nodejs```. After installation, navigate to the main angler.js directory and run ```npm install``` to install all necessary dependencies.

Next, you will need phantomjs, which is a headless browser for simulating a proper test environment. You can find a working binary at phantomjs.org.

Assuming everything has installed correctly, you can now run ```npm test``` to start the main test file, init.js, which will run all appropriate test files through phantomjs.

======

### License

(The MIT License)

Copyright (c) 2013 Sold. srobin@mit.edu;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
