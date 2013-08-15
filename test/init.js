var async = require('async'),
    spawn = require('child_process').spawn

async.series({
    heartbeat:function(callback){
        console.log('Starting tests for heartBeat:')

        var name = Object.keys(this)[0]
        var dur = Date.now()

        var hb = spawn('./phantomjs',['./test/heartbeat.js'])
        hb.stdout.setEncoding('utf8')

        hb.stdout.on('data', function (result) {
            result = result.slice(0, result.length - 1)

            if(result === 'pass'){
                console.log(name + ' tests passed in ' + (Date.now() - dur) + 'ms\n')
                hb.kill()
                return callback(null)
            }
            else{
                hb.kill()
                return callback({test:name, msg: result})
            }
        })

        hb.stderr.on('data', function (err) {
            hb.kill()
            console.log('stderr received (not an error directly from test)')
            return callback({test :'Heartbeat', msg: err })
        });
    }
},function(err,tests){
    if(err){
        console.log('Test "' + err.test +'" failed with the following error message:')
        console.log(err.msg)
        console.log('Further tests aborted.')
    }
    else{
        console.log('All tests passed')
    }
})

