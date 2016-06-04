/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

let Request = require('../');

Request({
	method: 'GET',
	url: 'https://google.com/'
})
.then((data) => {
	console.log(data);
});