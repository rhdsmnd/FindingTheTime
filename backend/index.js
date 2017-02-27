import express from 'express';

var app = express();

var clicks = [];




app.listen(2999, function() {
	console.log(process.env);
	console.log("Web server started.");
});
