var page = require('webpage').create()
page.content = '<html><body><div class="test-class" data-angler="test event">test123</div></body></html>'
page.onConsoleMessage = function (msg) { 
	if(msg !== 'Angler Started')
		console.log(msg) 
}

page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
	if(page.injectJs('angler.js')) {
	    page.evaluate(function() {

	    	var assert = function(one,two){
	    		if(one === two)
	    			return true
	    		else
	    			return false
	    	}

    	    angler.start({
		        heartBeat:3000,
		        isTagOnly: true,
		        isSaveTagOnly: false
		    })
//begin tests here
	        if(!assert(angler._getInfo('active'),true))
	        	console.log("angler start variables being improperly set")
	        if(!assert(angler.heartBeat,3000))
	        	console.log("angler config params not being set properly")

	        var saveCheck = function(){
	        	if(!assert(angler._getInfo('lastSave'),0))
	        		console.log('pass')
	        	setTimeout(saveCheck,0)
	        }

	        saveCheck()

//end tests here
	    })
	}
})