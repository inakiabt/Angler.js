//The following is a javascript example of syncing user timestamps with your server's time


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
