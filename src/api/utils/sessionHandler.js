'use strict';
const fastifySession = require('fastify-session');
const Store = new fastifySession.Store();

    exports.set = function (sessionId, session) {
        Store.set(sessionId, session, function (e) {
            if(e)
                console.log(e);
        });
    }
     exports.get = function (sessionId) {
        let session;
          Store.get(sessionId, function(e,s){
             //console.log("Error:",e);
             //console.log("Session: ",s);
             session = s;
         });
          return session;
    }

    exports.getAll = function () {
        return Store.store;
    }

    exports.remove = function(sessionId) {
        Store.destroy(sessionId,function (e) {
            if(e)
                console.log(e);
        });
    }

