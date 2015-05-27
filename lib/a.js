var taskcluster = require('taskcluster-client');
var _ = require('lodash');
var slug = require('slugid');

console.log(slug.v4());
console.log(_.map([1,2,3],function(n) {return n*3}));
