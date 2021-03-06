/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

let _ = require('lodash');
let _http = require('http');
let _https = require('https');
let Promise = require('bluebird');
let URL = require('url');
let qs = require('querystring');

let RequestError = require('./errors').RequestError;
let ErrorType = require('./errors').types;

let request = function(params){
	return new Promise((resolve, reject) => {
		if(_.isString(params)){
			params = { url: params };
		}

		params = _.defaults(params || {}, {
			method: 'GET',
			headers: {}
		});

		if(!params.url){
			return reject(new RequestError(ErrorType.MISSING_FIELDS, {
				message: 'url is required',
				fields: { url: 'field is required' }
			}));
		}

		if(params.redirectCount == 5){
			return reject(new RequestError(ErrorType.REDIRECT_COUNT_EXCEEDED));
		}

		let originalUrl = params.url;
		let url = URL.parse(originalUrl);
		delete params.url;
		_.extend(params, _.pick(url, ['hostname', 'port', 'path', 'protocol']));
		if(!params.port){
			delete params.port;
		}
		params.method = params.method.toUpperCase();

		let http = params.protocol == 'https:' ? _https : _http;

		let req = http.request(params);

		req.on('response', function(res){
			let ended = false;

			let data = '';
			res.on('data', function(d){
				data += d.toString();
			});

			let handleEnd = function(){
				ended = true;
				let statusCode = res.statusCode;
				let shortCode = parseInt(statusCode / 100);

				if(!!res.headers['content-type'].match(/^application\/json/g)){
					try {
						data = JSON.parse(data);
					} catch(e){}
				}

				if(_.contains([1, 2], shortCode)) {
					resolve({
						statusCode: statusCode,
						data: data,
						headers: res.headers,
						url: originalUrl
					});
				} else if(_.contains([301, 302], statusCode) && res.headers.location) {
					params.url = res.headers.location;
					params.redirectCount = params.redirectCount || 0;
					params.redirectCount++;
					resolve(request(params));
				} else {
					reject({
						statusCode: statusCode,
						data: data,
						headers: res.headers,
						url: originalUrl
					});
				}

				res.removeAllListeners();
			};

			res.on('end', handleEnd);
			res.on('close', function(){
				if(!ended){
					handleEnd();
				}
				res.removeAllListeners();
			});

			res.on('error', function(){
				reject(new RequestError(ErrorType.REQUEST_ERROR, err));
				res.removeAllListeners();
			});

		});

		req.on('error', function(err){
			reject(new RequestError(ErrorType.REQUEST_ERROR, err));
			req.removeAllListeners();
		});

		req.on('abort', function(err){
			reject(new RequestError(ErrorType.REQUEST_ABORTED, err));
			req.removeAllListeners();
		});

		if(params.method != 'GET' && params.data){
			let dataString = '';
			if(params.headers['Content-Type'] == 'application/json'){
				dataString = _.isString(params.data) ? params.data : JSON.stringify(params.data);
			} else if(_.isPlainObject(params.data)){
				dataString = qs.stringify(params.data);
			} else if(_.isString(params.data)) {
				dataString = params.data;
			}

			if(dataString && dataString.length){
				req.write(dataString);
			}
		}

		req.end();

	});
};


module.exports = request;