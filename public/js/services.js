'use strict';

/* Services */

angular.module('RandomTipServices', ['ngSanitize', 'ngResource'])
    .factory('TipProvider', ['$sce', '$timeout', 'FGAdviceProvider', 'RssProvider', 'ReadabilityProvider', function ($sce, $timeout, FGAdviceProvider, RssProvider, ReadabilityProvider) {
        var service = {
            currentTip: {
                title: 'Loading...',
                content: $sce.trustAsHtml('<h2>New tip is being loaded</h2>')
            }
        };

        function run() {
            var picker = Math.floor(Math.random() * 3);
            if (picker < 2) {
                var provider = FGAdviceProvider;
            }
            else {
                var provider = RssProvider;
            }
            //provider = ReadabilityProvider;
            provider.getTip(function (tip) {
                if(tip){
                    service.currentTip.title = $sce.trustAsHtml(tip.title);
                    service.currentTip.content = $sce.trustAsHtml(tip.content);
                    $timeout(function () { run(); }, 1 * 600000);
                }
                else
                    $timeout(function () { run(); }, 0);                
            });
        }

        $timeout(function () { run(); }, 5000);
        return service;
    }])
    .factory('FGAdviceProvider', ['$resource', function ($resource) {
        var service = $resource('/external/fga', {}, {
            fetch: { method: 'GET', isArray: false }
        });
        return {
            getTip: function (setTip) {
                service.fetch(function (data) { //lookup title
                    setTip({ title: "&nbsp;-&nbsp;" + data.text, content: "" });
                });
            }
        };
    }])
    .factory('ReadabilityProvider', ['$resource', function ($resource) {
        var service = $resource('/external/readability', {}, {
            fetch: { method: 'GET', isArray: false }
        });
        return {
            getTip: function (setTip) {
                service.fetch(function (data) { //lookup title
                    setTip({ title: "Readability" + data.text, content: "" });
                });
            }
        };
    }])
    .factory('RssProvider', ['FeedLoader', function (FeedLoader) {
        return {
            getTip: function (setTip) {
                FeedLoader.fetch({ rss_url: 'http://www.i-programmer.info/index.php?option=com_ninjarsssyndicator&feed_id=1&format=raw' }, {},
                    function (data) { //lookup title
                        if (data.status != "ok" || !data.items.length) {
                            return setTip(null);
                        }
                        var picker = Math.floor(Math.random() * data.items.length);                        
                        setTip({
                            title: data.items[picker].title,
                            content: data.items[picker].content
                        });
                    });
            }
        }
    }])
    .factory('FeedLoader', function ($resource) {
        return $resource('https://api.rss2json.com/v1/api.json', {}, {
            fetch: { method: 'GET', params: {} }
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
                url: url,
                title: title,
                id: id
            });

            LocalObjectStorage.setObject('FeedList', list);
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

        this.getById = function (id) {
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