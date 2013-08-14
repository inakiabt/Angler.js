//
(function(){

    var angler = {}
    var root = this //window

    angler.errorLog = [] //currently attaching to request object; server can handle as necessary
    //defaults:
    angler.heartBeat = 10000
    angler.isTagOnly = false //will set whether or not angler only records tagged events
    angler.isSaveTagOnly = false

    var active,
        sessionId,
        events,
        timeStampStart,
        timeStampEnd,
        path,
        activeTimer,
        lastEvent, //keeps track of latest timeStamp to prevent duplicate events
        lastHook, //time of last eventHook called; for preventing multiple saves after a url change
        lastSave,
        atomic = true, //prevents multiple pathChecks returning true before path has been updated
        heartBeat

    //ie8 support
    if (typeof console === 'undefined' || typeof console.log === 'undefined') {
        console = {}
        console.log = function(msg){
            angler.errorLog.push(msg)
        }
    }

    var heartMonitor = function(){

        if(!active){
            clearInterval(heartBeat)
            activeTimer = false //will still save session immediately after this, but not again until activity resumes
        }

        saveSession(function(err){
            if(err){
                angler.errorLog.push(err)
            }
            active = false
            pathCheck()
        })
    }

    var saveSession = function(callback){
        if(angler.isSaveTagOnly){
            if(events && events.length <= 1)
                return callback(null)
        }

        if((Date.now() - lastSave) < 300){ 
            //lastSave is reset to 0 in newSession, so this will only be 
            //triggered for 2 subsequent requests of the same sessionId (which should not ever happen)
            lastSave = Date.now()
            return callback(null)
        }

        var data = dataRender()
        lastSave = Date.now()
        data.sendStamp = Date.now()
        
        $.ajax({
            type: 'POST',
            url: '/angle/'+sessionId,
            timeout: 750, //this should not be changed!
            data: data,
            dataType: 'json',
            success: function() {
                angler.errorLog = []
                callback(null)
            },
            error: function(jqXHR) {
                callback(jqXHR.responseText)
            }
        });
    }

    var newSession = function(){
        active = true
        sessionId = uuidGen()
        events = []
        timeStampStart = Date.now()
        timeStampEnd = Date.now()
        path = window.location.pathname+window.location.search
        path = pathClean(path)
        activeTimer = true
        lastEvent = 0
        lastSave = 0
        lastHook = 0
        events.push({
            data     : 'Page Loaded',
            timeStamps: [{
                start   : timeStampStart,
                end     : timeStampEnd
            }]
        })
        if(heartBeat)
            clearInterval(heartBeat)
        heartBeat = setInterval(heartMonitor,angler.heartBeat)

        atomic = false //this should always be the last line of newSession()
    }

    var uuidGen = function(){ //uuid logic based off of http://stackoverflow.com/a/2117523/1459449
        var uuid = '_sidxxxxxxxxxxxyxxxxxxxx'.replace(
            /[xy]/g, 
            function (c) { 
                var r = Math.random() * 16 | 0, //(0 to 15)
                    v = c === 'x' ? r : (r & 0x3 | 0x8) //v = 0 to F (hex)
                return v.toString(16)
            }
        );

        return uuid
    }

    var dataRender = function(){

        var data = {}

        if(events[events.length-1].timeStamps[events[events.length-1].timeStamps.length-1].start === timeStampStart){
            events[events.length-1].timeStamps[events[events.length-1].timeStamps.length-1].end = timeStampEnd
        }
        else{
            events[events.length-1].timeStamps.push({ start : timeStampStart, end : timeStampEnd})
        }

        data.user = window.angler_user || null
        data.events = events
        data.path = path
        data.errorLog = angler.errorLog

        return data
    }

    var pathCheck = function(){

        if(atomic){
            return
        }

        if(pathClean(window.location.pathname+window.location.search) !== path){
            atomic = true //reset in newSession

            saveSession(function(err){
                if(err){
                    angler.errorLog.push(err)
                }
                newSession()
            })
        }
    }

    var activeCheck = function(){
        if(atomic)
            return

        if(!activeTimer){
            activeTimer = true
            timeStampStart = Date.now()
            timeStampEnd = Date.now()
            events[events.length-1].timeStamps.push({ start : timeStampStart, end : timeStampEnd})
            heartBeat = setInterval(heartMonitor,angler.heartBeat)
        }
    }

    var pathClean = function(rawPath){
        var cleanPath = rawPath

        if(rawPath[rawPath.length-1] === '/' && rawPath !== '/'){
            cleanPath = rawPath.substring(0,rawPath.length-1)
        }
        return cleanPath
    }

    var start = function(configObj){
        if(!configObj || typeof configObj !== 'object')
            return console.log('angler not started due to invalid config params')

        var configs = []
        
        for(var name in configObj) {  
            if (configObj.hasOwnProperty(name))  
              configs.push(name);  
        }

        var isConfigSkipped = false

        $.each(configs,function(config){
            if(typeof configObj[configs[config]] === 'undefined'){
                isConfigSkipped = true
                return true
            }

            if(typeof angler[configs[config]] !== typeof configObj[configs[config]]){
                isConfigSkipped = true
                return true
            }

            angler[configs[config]] = configObj[configs[config]]
        })

        if(isConfigSkipped)
            console.log('One or more config params were skipped due to being invalid; angler started with defaults')
        
        newSession()
        startHooks()
        console.log('Angler Started')
    }

    angler.start = start

    //Hook setup
    var startHooks = function(){
        $().ready(function(){

            $(document.body).mousemove(function(){
                active = true
                timeStampEnd = Date.now()

                if((Date.now() - lastHook) < 100)
                    return
                else
                    lastHook = Date.now()

                activeCheck()
                pathCheck()
            })

            $(document.body).mousedown(function(e){
                active = true
                timeStampEnd = Date.now()
                lastHook = Date.now()

                if(timeStampEnd > lastEvent){

                    if(angler.isTagOnly && !e.target.dataset.angler)
                        return

                    timeStampStart = Date.now()
                    events[events.length-1].timeStamps[events[events.length-1].timeStamps.length-1].end = timeStampEnd

                    events.push(
                    {
                        nodeName : e.target.nodeName,
                        elementIdName : e.target.id,
                        elementClassName : e.target.className,
                        data : e.target.dataset.angler,
                        href : e.target.href,
                        timeStamps : [{
                            start: timeStampStart,
                            end: timeStampEnd
                        }]
                    })

                    lastEvent = timeStampEnd
                }

                activeCheck()
                pathCheck()
            })

            $(document.body).keyup(function(e){
                active = true
                timeStampEnd = Date.now()
                lastHook = Date.now()
                activeCheck()
                pathCheck()
            })

        })
    }

    root.angler = angler //assign final object to root
}())