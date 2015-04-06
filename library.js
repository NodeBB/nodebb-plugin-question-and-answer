"use strict";

var plugin = {},
	async = module.parent.require('async'),
	SocketPlugins = module.parent.require('./socket.io/plugins');

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;

	app.get('/admin/plugins/question-and-answer', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/question-and-answer', renderAdmin);

	handleSocketIO();

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

plugin.getTopics = function(data, callback) {
	var topics = data.topics;

	async.map(topics, function(topic, next) {
		if (topic.isQuestion) {
			if (topic.isSolved) {
				topic.title = '<span class="answered"><i class="fa fa-question-circle"></i> Solved</span> ' + topic.title;
			} else {
				topic.title = '<span class="unanswered"><i class="fa fa-question-circle"></i> Unsolved</span> ' + topic.title;
			}
		}
		
		return next(null, topic);
	}, function(err, topics) {
		return callback(err, data);
	});
};

plugin.addThreadTool = function(data, callback) {
	if (data.topic.isQuestion) {
		data.tools.concat([
			{
				class: 'toggleSolved',
				title: data.topic.isSolved ? 'Mark as Unsolved' : 'Mark as Solved',
				icon: 'fa-check'
			},
			{
				class: 'toggleQuestionStatus',
				title: 'Make this a normal topic',
				icon: 'fa-comments'
			}
		]);	
	} else {
		data.tools.push({
			class: 'toggleQuestionStatus',
			title: 'Ask as question',
			icon: 'fa-question-circle'
		})
	}
	
	callback(false, data);
};

function renderAdmin(req, res, next) {
	res.render('admin/plugins/question-and-answer', {});
}

function handleSocketIO() {
	SocketPlugins.QandA = {};

	SocketPlugins.QandA.toggleSolved = function(socket, data, callback) {
		user.isAdministrator(socket.uid, function(err, isAdmin) {
			if (isAdmin) {
				plugin.check(callback);
			}
		});
	};

	//SocketPlugins.QandA.
}

module.exports = plugin;