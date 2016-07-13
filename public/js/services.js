'use strict';

/* Services */

angular.module('RandomTipServices', ['ngSanitize', 'ngResource'])
    .factory('TipProvider', ['$sce', '$timeout', 'FGAdviceProvider', 'RssProvider', 'ReadabilityProvider', function($sce, $timeout, FGAdviceProvider, RssProvider, ReadabilityProvider){
    	var service = {
    	      currentTip: {
    	        title: 'Loading...',
    	        content: $sce.trustAsHtml('<h2>New tip is being loaded</h2>')
    	      }
    	};
    
    	function run(){
            var picker = Math.floor(Math.random()*3);
            if(picker < 2){
                var provider = FGAdviceProvider;
            }
            else{
                var provider = RssProvider;
            }
            provider = ReadabilityProvider;
            provider.getTip(function(tip){
                service.currentTip.title = $sce.trustAsHtml(tip.title);
       	        service.currentTip.content = $sce.trustAsHtml(tip.content);
            	$timeout(function(){run();}, 1 * 600000);
            });
    	}
    
    	$timeout(function(){run();}, 5000);
      return service;
    }])
    .factory('FGAdviceProvider', ['$resource', function($resource){
        var service = $resource('/external/fga', {}, {
            fetch: { method: 'GET', isArray: false }
        });
        return {
           getTip: function(setTip){
                service.fetch(function (data) { //lookup title
                        setTip({title: "&nbsp;-&nbsp;" + data.text, content: ""});
                    });
           }
        };
    }])
    .factory('ReadabilityProvider', ['$resource', function($resource){
        var service = $resource('/external/readability', {}, {
            fetch: { method: 'GET', isArray: false }
        });
        return {
           getTip: function(setTip){
                service.fetch(function (data) { //lookup title
                        setTip({title: "Readability" + data.text, content: ""});
                    });
           }
        };
    }])
    .factory('RssProvider', ['UrlLookup', 'FeedLoad', function(UrlLookup, FeedLoad){
        return {
           getTip: function(setTip){
                UrlLookup.fetch({q: 'http://www.i-programmer.info/index.php?option=com_ninjarsssyndicator&feed_id=1&format=raw'}, {}, function (data) {
                    if (data.responseStatus != 200 || (data.responseData && data.responseData.url == '')) {
                        alert(data.responseDetails || 'Feed not found!');
                        return;
                    }
        
                    var feed = data.responseData;
                    FeedLoad.fetch({q: data.responseData.url}, {}, function (data) { //lookup title
                        if (data.responseStatus != 200) {
                            return;
                        }

            		    setTip({
                            title: data.responseData.feed.entries[0].title, 
                            content: data.responseData.feed.entries[0].content
                        });
                    });
                });
           }
        }
    }])
    .factory('FeedLoad', function ($resource) {
        return $resource('http://ajax.googleapis.com/ajax/services/feed/load', {}, {
            fetch: { method: 'JSONP', params: {v: '1.0', callback: 'JSON_CALLBACK'} }
        });
    })
    .factory('UrlLookup', function ($resource) {
        return $resource('http://ajax.googleapis.com/ajax/services/feed/lookup', {}, {
            fetch: { method: 'JSONP', params: {v: '1.0', callback: 'JSON_CALLBACK'} }
        });
    })
    .service('LocalObjectStorage', function () {
        this.getObject = function (key) {
            return JSON.parse(localStorage.getItem(key))
        };

        this.setObject = function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        };

        this.removeObject = function (key) {
            localStorage.removeItem(key);
        };

        this.contains = function (key) {
            return localStorage.getItem(key) ? true : false;
        };
    })
    .service('FeedList', ['$rootScope', 'LocalObjectStorage', function ($rootScope, LocalObjectStorage) {
        this.add = function (url, title) {
            var list = this.get();
            var id = localStorage.getItem('FeedListId') ? localStorage.getItem('FeedListId') : 1;

            list.push({
                url:    url,
                title:  title,
                id: id
            });

            LocalObjectStorage.setObject('FeedList',  list);
            localStorage.setItem('FeedListId', ++id);
            $rootScope.$broadcast('FeedList', list);
        };

        this.delete = function (id) {
            var list = this.get();

            for (var i = list.length - 1; i >= 0; i--) {
                if (list[i].id == id) {
                    list.splice(i, 1);
                }
            }

            LocalObjectStorage.setObject('FeedList', list);
            $rootScope.$broadcast('FeedList', list);
        };

        this.get = function () {
            if (LocalObjectStorage.contains('FeedList')) {
                return LocalObjectStorage.getObject('FeedList');
            }

            return new Array({
                url: 'http://cacodaemon.de/index.php?rss=1',
                title: 'Cacomania',
                id: 0
            });
        };

        this.getById = function(id) {
            var list = this.get();

            for (var i = list.length - 1; i >= 0; i--) {
                if (list[i].id == id) {
                    return list[i];
                }
            }

            return null;
        };

        this.getMinId = function () {
            var list = this.get();
            var minId = Number.MAX_VALUE;

            for (var i = list.length - 1; i >= 0; i--) {
                minId = Math.min(minId, list[i].id);
            }

            return minId;
        };
    }]);