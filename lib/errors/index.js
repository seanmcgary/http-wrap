/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

exports.types = {
	MISSING_FIELDS: {
		statusCode: 400,
		message: 'Missing fields',
		code: 'missing_fields'
	},
	REQUEST_ERROR: {
		statusCode: 400,
		message: 'Request error',
		code: 'request_error'
	},
	REQUEST_ABORTED: {
		statusCode: 400,
		message: 'Request aborted',
		code: 'request_aborted'
	},
	REDIRECT_COUNT_EXCEEDED: {
		statusCode: 400,
		message: 'Redirect count exceeded',
		code: 'redirect_count_exceeded'
	}
};

exports.RequestError = function(type, context){
	this.type = type;
	context = context || {};

	if(context instanceof Error){
		context = {
			message: context.message,
			stack: context.stack
		};
	}
	this.context = context || {};

	return this;
};

