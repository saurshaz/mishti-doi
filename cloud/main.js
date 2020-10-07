// var Parse = require("parse-server");
// Parse.Cloud.define('hello', function(req, res) {
//   console.log('cloud code is running');
//   res.success('Hi2');
// });


// // var kue = require('kue')
// // var redisUrl = process.env.REDIS_URL
// // var jobs = kue.createQueue({ redis: redisUrl })

// /**
//  * Create the job for expiring round after 24h
// // */
// // function createRoundExpiredJob(round) {
// //     jobs.create('roundExpired', {
// //         objectId: round.id
// //     })
// //     .removeOnComplete(true)
// //     .delay(round.createdAt.addADay())
// //     .save()
// // }

// Parse.Cloud.job("sendReport", function(request, response) {
//     console.log('aaaa');
// });

// Parse.Cloud.job("sendReport2", function(request, response) {
//     console.log('aaaa');
// });