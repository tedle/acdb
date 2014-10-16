/*! acdb v0.0.1
 *  Source: http://github.com/tedle/acdb.git
 *  License: MIT */
var acdbApp=angular.module("acdbApp",["ngRoute"]);acdbApp.config(["$routeProvider","$locationProvider",function(a,b){a.when("/",{controller:"ChecklistController",templateUrl:"templates/checklist.html"}).when("/import/:savedata/",{controller:"ImportController",templateUrl:"templates/import.html"}).otherwise({redirectTo:"/"}),b.html5Mode(!0)}]),acdbApp.controller("ChecklistController",["$scope","date","encyclopedia","saveData",function(a,b,c,d){a.error={api:!1},a.date=b,a.sort={order:["slot"],reverse:!1,set:function(b){a.sort.reverse=this.order.toString()==b.toString()?!this.reverse:!1,a.sort.order=b}},a.species={fish:c.fish(),bugs:c.bugs()},c.loaded().then(function(){d.load()},function(){a.error.api=!0}),a.$watch("species",function(){d.save()},!0),a.$watch("date.offsetAsHours()",function(){d.save()},!0),a.saveData=d}]),acdbApp.controller("ImportController",["$scope","$location","$routeParams","cookie","saveData",function(a,b,c,d,e){var f=c.savedata;try{e.decodeSaveStr(f),a.saveStr=f}catch(g){a.corrupt=!0}a.accept=function(){d.set("checklist",f,365),a.index()},a.index=function(){b.path("/")}}]),acdbApp.directive("autoSelect",function(){return{restrict:"A",link:function(a,b){b.on("click",function(){this.select()})}}}),acdbApp.service("acdbApi",["$http","$q","Species",function(a,b,c){function d(d){var e=a.get(d).then(function(a){return a.data.forEach(function(b,d){a.data[d]=new c(b.slot,b.name,b.location,b.schedule,b.value),"shadow"in b&&(a.data[d].shadow=b.shadow)}),a.data},function(a){return b.reject(a)});return e}this.bugs=function(){return d("/api/cf/bug/all")},this.fish=function(){return d("api/cf/fish/all")}}]),acdbApp.service("cookie",[function(){this.set=function(a,b,c){var d=new Date;d.setTime(d.getTime()+24*c*60*60*1e3);var e="expires="+d.toUTCString();document.cookie=a+"="+b+"; "+e},this.get=function(a){a+="=";for(var b=document.cookie.split(";"),c=0;c<b.length;c++){for(var d=b[c];" "==d.charAt(0);)d=d.substring(1);if(-1!=d.indexOf(a))return d.substring(a.length,d.length)}return""}}]),acdbApp.service("date",["$interval",function(a){var b=new Date,c=0,d=0,e=0;a(this.get,6e4),this.get=function(){return b=new Date,b.setMonth(b.getMonth()+c),b.setDate(b.getDate()+d),b.setHours(b.getHours()+e),b},this.reset=function(){c=0,d=0,e=0,this.get()},this.incMonth=function(a){c+=a},this.incDate=function(a){d+=a},this.incHours=function(a){e+=a},this.offsetAsHours=function(){var a=new Date,b=this.get();return(b-a)/1e3/60/60}}]),acdbApp.service("encyclopedia",["$q","acdbApi","Species",function(a,b){var c=[],d=[];this.fish=function(){return c},this.bugs=function(){return d},this.loaded=function(){return e};var e=a.all({fish:b.fish(),bugs:b.bugs()}).then(function(a){a.fish.forEach(function(a){c[a.slot-1]=a}),a.bugs.forEach(function(a){d[a.slot-1]=a})},function(b){return a.reject(b)})}]),acdbApp.service("saveData",["$location","date","cookie","encyclopedia",function(a,b,c,d){function e(a){return l.forEach(function(b){a=a.split(b[1]).join(b[0])}),atob(a)}function f(a){var b=btoa(a);return l.forEach(function(a){b=b.split(a[0]).join(a[1])}),b}function g(a){for(var b=0,c=0;8>c;c++)b|=a[c]<<7-c;return b}function h(a){a=a.charCodeAt(0);for(var b=new Array(8),c=0;8>c;c++)b[c]|=Boolean(a>>7-c&1);return b}function i(a){a|=0;for(var b=new Array(32),c=0;32>c;c++)b[c]=Boolean(a>>31-c&1);return b}function j(a){for(var b=0,c=0;32>c;c++)b|=a[c]<<31-c;return b}var k=1,l=[["/","_"],["+","-"],["=","."]],m=64,n=64,o=!1,p="";this.url=function(){return p},this.setUrl=function(b){var c=a.protocol()+"://"+a.host();80!=a.port()&&(c+=":"+a.port()),c+="/import/"+b+"/",p=c},this.save=function(){if(o){var a=d.fish(),e=d.bugs(),f=b.offsetAsHours(),g=this.encodeSaveStr(a,e,f);c.set("checklist",g,365),this.setUrl(g)}},this.load=function(){o=!0;var a=c.get("checklist");if(this.setUrl(a),""!==a){if(data=this.decodeSaveStr(a),d.fish().length!=data.fish.length||d.bugs().length!=data.bugs.length)throw"[LoadData]: Unexpected number of species";d.fish().forEach(function(a){a.caught=data.fish[a.slot-1]}),d.bugs().forEach(function(a){a.caught=data.bugs[a.slot-1]}),b.incHours(data.hours)}},this.encodeSaveStr=function(a,b,c){var d=new Array(m),e=new Array(n);if(a.length!=d.length||b.length!=e.length)throw"[SaveData]: Unexpected number of species";a.forEach(function(a){d[a.slot-1]=Boolean(a.caught)}),b.forEach(function(a){e[a.slot-1]=Boolean(a.caught)}),offsetBits=i(c),saveBits=d.concat(e,offsetBits);var h="";h+=String.fromCharCode(k);for(var j=0;j<saveBits.length;j+=8){var l=saveBits.slice(j,j+8);h+=String.fromCharCode(g(l))}return f(h)},this.decodeSaveStr=function(a){var b=0,c=new Array(m),d=new Array(n),f=0,i=e(a),l=[],o=0;if(angular.forEach(i,function(a){var b=h(a);l=l.concat(b)}),l.length!=8+m+n+32)throw"[LoadData]: Corrupted save data";if(b=g(l.slice(o,o+8)),o+=8,b!=k)throw"[LoadData]: Outdated save data";l.slice(o,o+m).forEach(function(a,b){c[b]=Boolean(a)}),o+=m,l.slice(o,o+n).forEach(function(a,b){d[b]=Boolean(a)}),o+=n;var p=l.slice(o);f=j(p);var q={fish:c,bugs:d,hours:f};return q}}]),acdbApp.factory("Species",["$filter","date",function(a,b){function c(a,c,e,f,g){this.slot=a,this.name=c,this.habitat=e,this.schedule=f,this.value=g,this.caught=!1,this.season=d(this.schedule),this.seasonalCache={date:b.get(),data:null}}function d(b){var c="";return angular.forEach(b,function(b,d){d>0&&(c+=", "),season=new Date,1==b.month.start&&12==b.month.end?c+="All Year ":b.month.start==b.month.end?(season.setMonth(b.month.start-1),1!=b.day.start||31!=b.day.end?(season.setDate(b.day.start),c+=a("date")(season,"MMM d-"),season.setDate(b.day.end),c+=a("date")(season,"d ")):c+=a("date")(season,"MMM ")):(season.setMonth(b.month.start-1),1!=b.day.start?(season.setDate(b.day.start),c+=a("date")(season,"MMM d-")):c+=a("date")(season,"MMM-"),season.setMonth(b.month.end-1),31!=b.day.end?(season.setDate(b.day.end),c+=a("date")(season,"MMM d ")):c+=a("date")(season,"MMM ")),0===b.hour.start&&24===b.hour.end?c+="(All day)":(season.setHours(b.hour.start),c+=angular.lowercase(a("date")(season,"(ha-")),season.setHours(b.hour.end),c+=angular.lowercase(a("date")(season,"ha)")))}),c}return c.prototype.seasonalData=function(){var c=b.get();if(this.seasonalCache.date.getHours()==c.getHours()&&this.seasonalCache.date.getDate()==c.getDate()&&this.seasonalCache.date.getMonth()==c.getMonth()&&null!==this.seasonalCache.data)return this.seasonalCache.data;var d=!1,e=!1,f=!1,g={code:0,next:{month:12,hour:24},str:""};if(angular.forEach(this.schedule,function(a){var c=new Date(b.get());c.setMonth(a.month.start-1),c.setDate(a.day.start);var h=new Date(b.get());if(h.setMonth(a.month.end-1),h.setDate(a.day.end),b.get()>=c&&b.get()<=h)d=e=!0;else if((b.get()>=c||b.get()<=h)&&a.month.start>a.month.end)d=e=!0;else{var i=a.month.start-(b.get().getMonth()+1);0>i&&(i+=12),i<g.next.month&&(g.next.month=i)}if(c=new Date(b.get()),c.setHours(a.hour.start),h=new Date(b.get()),h.setHours(a.hour.end),b.get()>=c&&b.get()<h)f=!0;else if((b.get()>=c||b.get()<h)&&a.hour.start>a.hour.end)f=!0;else if(e){var j=a.hour.start-b.get().getHours();0>j&&(j+=24),j<g.next.hour&&(g.next.hour=j)}e!=f&&(e=f=!1)},this),e&&f)g.code=2,g.next.month=0,g.next.hour=0,g.str="Now";else if(d){g.code=1,g.next.month=0;var h=new Date(b.get());h.setHours(h.getHours()+g.next.hour),g.str=angular.lowercase(a("date")(h,"ha"))}else{g.code=0;var i=new Date(b.get());i.setMonth(i.getMonth()+g.next.month),g.str=a("date")(i,"MMM")}return this.seasonalCache.date=b.get(),this.seasonalCache.data=g,g},c}]),angular.module("acdbApp").run(["$templateCache",function(a){"use strict";a.put("templates/checklist.html",'<div class="container"><div class="row"><div class="form-group col-sm-3"><button ng-click="showTimeControls = !showTimeControls" class="btn btn-block btn-default">{{date.get() | date: \'MMMM dd, ha\'}}</button></div><div class="form-group col-sm-4 col-md-3"><div class="input-group"><div class="input-group-addon"><span class="fa fa-search"></span></div><input type="text" ng-model="searchFilter.name" class="form-control" placeholder="Filter species" autocapitalize="off" autocorrect="off" autocomplete="off"></div></div></div><div class="row form-group" ng-show="showTimeControls"><div class="panel panel-default"><div class="panel-heading">Date settings</div><div class="panel-body"><div class="col-sm-4 col-md-3"><div class="input-group"><span class="input-group-btn"><button ng-click="date.incMonth(-1)" class="btn btn-default"><span class="fa fa-chevron-left"></span></button></span> <input type="text" class="form-control text-center" value="{{date.get() | date: \'MMMM\'}}" readonly> <span class="input-group-btn"><button ng-click="date.incMonth(1)" class="btn btn-default"><span class="fa fa-chevron-right"></span></button></span></div></div><div class="col-sm-3 col-md-2"><div class="input-group"><span class="input-group-btn"><button ng-click="date.incDate(-1)" class="btn btn-default"><span class="fa fa-chevron-left"></span></button></span> <input type="text" class="form-control text-center" value="{{date.get() | date: \'dd\'}}" readonly> <span class="input-group-btn"><button ng-click="date.incDate(1)" class="btn btn-default"><span class="fa fa-chevron-right"></span></button></span></div></div><div class="col-sm-3 col-lg-2"><div class="input-group"><span class="input-group-btn"><button ng-click="date.incHours(-1)" class="btn btn-default"><span class="fa fa-chevron-left"></span></button></span> <input type="text" class="form-control text-center" value="{{date.get() | date: \'ha\'}}" readonly> <span class="input-group-btn"><button ng-click="date.incHours(1)" class="btn btn-default"><span class="fa fa-chevron-right"></span></button></span></div></div><div class="col-sm-1"><div class="input-group btn-block"><button ng-click="date.reset()" class="btn btn-block btn-danger">Reset <span class="fa fa-remove"></span></button></div></div></div></div></div><div class="row" ng-init="tab.active=\'fish\'"><ul class="nav nav-tabs" role="tablist"><li ng-class="{active: tab.active==\'fish\'}" class="text-center col-xs-6 col-sm-3" ng-click="tab.active = \'fish\'"><a role="tab">Fish</a></li><li ng-class="{active: tab.active==\'bugs\'}" class="text-center col-xs-6 col-sm-3" ng-click="tab.active = \'bugs\'"><a role="tab">Bugs</a></li></ul><div class="tab-content"><table class="table table-striped"><thead><tr><th ng-click="sort.set([\'caught\', \'slot\'])"><span class="fa fa-check"></span></th><th ng-click="sort.set(\'slot\')">#</th><th ng-click="sort.set(\'name\')">Name</th><th ng-click="sort.set([\'-seasonalData().code\', \'seasonalData().next.month\', \'caught\', \'slot\'])">Season</th><th ng-click="sort.set([\'habitat\', \'name\'])">Location</th><th class="hidden-xs" ng-click="sort.set(\'shadow\')" ng-show="tab.active==\'fish\'">Shadow</th><th class="hidden-xs" ng-click="sort.set(\'value\')">Value</th></tr></thead><tbody><tr ng-repeat="animal in (tab.active==\'fish\' ? species.fish : species.bugs) | orderBy:sort.order:sort.reverse | filter: searchFilter" ng-class="{success: animal.caught, info: animal.seasonalData().code==2 && !animal.caught}" ng-hide="error.api"><td><input type="checkbox" ng-model="animal.caught"></td><td>{{animal.slot}}</td><td>{{animal.name}}</td><td><span class="visible-xs">{{animal.seasonalData().str}}</span> <span class="hidden-xs">{{animal.season}}</span></td><td>{{animal.habitat}}</td><td class="hidden-xs" ng-show="tab.active==\'fish\'">{{animal.shadow}}</td><td class="hidden-xs">{{animal.value}}</td></tr></tbody><tfoot><tr ng-show="error.api"><td colspan="100" class="danger">Failed to load encyclopedia from database, try refreshing</td></tr></tfoot></table></div></div><div class="row"><div class="form-group col-sm-9 col-md-7 col-lg-6"><div class="panel panel-default"><div class="panel-heading">Export save data</div><div class="panel-body"><input type="text" value="{{saveData.url()}}" class="form-control" placeholder="Save data" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck auto-select></div></div></div></div></div>'),a.put("templates/import.html",'<div class="container"><div class="row"><div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"><div class="jumbotron"><h1>Import Save Data</h1><div ng-hide="corrupt"><p>Do you want to import this save token?</p><pre>{{saveStr}}</pre><br><div class="form-group"><button ng-click="accept()" class="btn btn-lg btn-primary">Yeah!</button> <button ng-click="index()" class="btn btn-lg btn-default">No way!</button></div></div><div ng-show="corrupt"><div class="alert alert-danger"><p>Save data is either corrupted or poorly formatted</p></div><div class="form-group"><button ng-click="index()" class="btn btn-lg btn-default">Take me home</button></div></div></div></div></div></div>')}]);