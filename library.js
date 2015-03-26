"use strict";

var plugin = {},
	async = module.parent.require('async');

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;

	app.get('/admin/plugins/question-and-answer', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/question-and-answer', renderAdmin);

	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/question-and-answer',
		icon: 'fa-question-circle',
		name: 'Q&A'
	});

	callback(null, header);
};

plugin.getCategory = function(data, callback) {
	var topics = data.category.topics;

	async.map(topics, function(topic, next) {
		topic.title = '<span class="badge answered"><i class="fa fa-question-circle"></i> Answered</span> ' + topic.title;
		return next(null, topic);
	}, function(err, topics) {
		return callback(err, data);
	});
};


function renderAdmin(req, res, next) {
	res.render('admin/plugins/question-and-answer', {});
}

module.exports = plugin;