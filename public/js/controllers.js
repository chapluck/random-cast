'use strict';

/* Controllers */
var randomCastApp = angular.module('randomCast', ['RandomTipServices']);

randomCastApp.controller('RandomTipCtrl', ['$scope', 'TipProvider', function($scope, TipProvider) {
  $scope.tip =  TipProvider.currentTip;
}]);