"use strict";

var plugin = {},
	async = module.parent.require('async'),
	topics = module.parent.require('./topics'),
	posts = module.parent.require('./posts'),
	categories = module.parent.require('./categories'),
	meta = module.parent.require('./meta'),
	privileges = module.parent.require('./privileges'),
	rewards = module.parent.require('./rewards'),
	user = module.parent.require('./user'),
	helpers = module.parent.require('./controllers/helpers'),
	db = module.parent.require('./database'),
	SocketPlugins = module.parent.require('./socket.io/plugins'),
	pagination = module.parent.require('./pagination');

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;

	app.get('/admin/plugins/question-and-answer', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/question-and-answer', renderAdmin);

	app.get('/unsolved', middleware.buildHeader, renderUnsolved);
	app.get('/api/unsolved', renderUnsolved);

	app.get('/solved', middleware.buildHeader, renderSolved);
	app.get('/api/solved', renderSolved);

	handleSocketIO();

	callback();
};

plugin.appendConfig = function(config, callback) {
	meta.settings.get('question-and-answer', function(err, settings) {
		config['question-and-answer'] = settings;
		callback(null, config);
	});
};

plugin.addNavigation = function(menu, callback) {
	menu = menu.concat(
		[
			{
				"route": "/unsolved",
				"title": "[[qanda:menu.unsolved]]",
				"iconClass": "fa-question-circle",
				"textClass": "visible-xs-inline",
				"text": "[[qanda:menu.unsolved]]"
			},
			{
				"route": "/solved",
				"title": "[[qanda:menu.solved]]",
				"iconClass": "fa-check-circle",
				"textClass": "visible-xs-inline",
				"text": "[[qanda:menu.solved]]"
			}
		]
	);

	callback (null, menu);
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
		if (parseInt(topic.isQuestion, 10)) {
			if (parseInt(topic.isSolved, 10)) {
				topic.title = '<span class="answered"><i class="fa fa-question-circle"></i> [[qanda:topic_solved]]</span> ' + topic.title;
			} else {
				topic.title = '<span class="unanswered"><i class="fa fa-question-circle"></i> [[qanda:topic_unsolved]]</span> ' + topic.title;
			}
		}
		
		return next(null, topic);
	}, function(err, topics) {
		return callback(err, data);
	});
};

plugin.addThreadTool = function(data, callback) {
	var isSolved = parseInt(data.topic.isSolved, 10);

	if (parseInt(data.topic.isQuestion, 10)) {
		data.tools = data.tools.concat([
			{
				class: 'toggleSolved ' + (isSolved ? 'alert-warning topic-solved' : 'alert-success topic-unsolved'),
				title: isSolved ? '[[qanda:thread.tool.mark_unsolved]]' : '[[qanda:thread.tool.mark_solved]]',
				icon: isSolved ? 'fa-question-circle' : 'fa-check-circle'
			},
			{
				class: 'toggleQuestionStatus',
				title: '[[qanda:thread.tool.make_normal]]',
				icon: 'fa-comments'
			}
		]);	
	} else {
		data.tools.push({
			class: 'toggleQuestionStatus alert-warning',
			title: '[[qanda:thread.tool.as_question]]',
			icon: 'fa-question-circle'
		});
	}
	
	callback(false, data);
};

plugin.addPostTool = function(postData, callback) {
	topics.getTopicDataByPid(postData.pid, function(err, data) {
		data.isSolved = parseInt(data.isSolved, 10) === 1;
		data.isQuestion = parseInt(data.isQuestion, 10) === 1;

		if (data.uid && !data.isSolved && data.isQuestion && parseInt(data.mainPid, 10) !== parseInt(postData.pid, 10)) {		
			postData.tools.push({
				"action": "qanda/post-solved",
				"html": "[[qanda:post.tool.mark_correct]]",
				"icon": "fa-check-circle"
			});
		}

		callback(false, postData);
	});
};

plugin.getConditions = function(conditions, callback) {
	conditions.push({
		"name": "Times questions accepted",
		"condition": "qanda/question.accepted"
	});

	callback(false, conditions);
};

function renderAdmin(req, res, next) {
	async.waterfall([
		async.apply(db.getSortedSetRange, 'categories:cid', 0, -1),
		function(cids, next) {
			categories.getCategoriesFields(cids, ['cid', 'name'], next);
		}
	], function(err, data) {
		res.render('admin/plugins/question-and-answer', {
			categories: data
		});
	});
}

function handleSocketIO() {
	SocketPlugins.QandA = {};

	SocketPlugins.QandA.toggleSolved = function(socket, data, callback) {
		privileges.topics.canEdit(data.tid, socket.uid, function(err, canEdit) {
			if (!canEdit) {
				return callback(new Error('[[error:no-privileges]]'));
			}

			if (data.pid) {
				toggleSolved(data.tid, data.pid, callback);
			} else {
				toggleSolved(data.tid, callback);
			}
		});
	};

	SocketPlugins.QandA.toggleQuestionStatus = function(socket, data, callback) {
		privileges.topics.canEdit(data.tid, socket.uid, function(err, canEdit) {
			if (!canEdit) {
				return callback(new Error('[[error:no-privileges]]'));
			}

			toggleQuestionStatus(data.tid, callback);
		});
	};
}

function toggleSolved(tid, pid, callback) {
	if (!callback) {
		callback = pid;
		pid = false;
	}

	topics.getTopicField(tid, 'isSolved', function(err, isSolved) {
		isSolved = parseInt(isSolved, 10) === 1;

		async.parallel([
			function(next) {
				topics.setTopicField(tid, 'isSolved', isSolved ? 0 : 1, next);
			},
			function(next) {
				if (!isSolved && pid) {
					topics.setTopicField(tid, 'solvedPid', pid, next);
				} else {
					topics.deleteTopicField(tid, 'solvedPid', next);
				}
			},
			function(next) {
				if (!isSolved && pid) {
					posts.getPostData(pid, function(err, data) {
						rewards.checkConditionAndRewardUser(data.uid, 'qanda/question.accepted', function(callback) {
							user.incrementUserFieldBy(data.uid, 'qanda/question.accepted', 1, callback);
						});

						next();
					});
				} else {
					next();
				}
			},
			function(next) {
				if (!isSolved) {
					db.sortedSetRemove('topics:unsolved', tid, function() {
						db.sortedSetAdd('topics:solved', Date.now(), tid, next);
					});
				} else {
					db.sortedSetAdd('topics:unsolved', Date.now(), tid, function() {
						db.sortedSetRemove('topics:solved', tid, next);
					});
				}
			}
		], function(err) {
			callback(err, {isSolved: !isSolved});
		});
	});
}

function toggleQuestionStatus(tid, callback) {
	topics.getTopicField(tid, 'isQuestion', function(err, isQuestion) {
		isQuestion = parseInt(isQuestion, 10) === 1;

		async.parallel([
			function(next) {
				topics.setTopicField(tid, 'isQuestion', isQuestion ? 0 : 1, next);
			},
			function(next) {
				if (!isQuestion) {
					async.parallel([
						function(next) {
							topics.setTopicField(tid, 'isSolved', 0, next);
						},
						function(next) {
							db.sortedSetAdd('topics:unsolved', Date.now(), tid, next);
						},
						function(next) {
							db.sortedSetRemove('topics:solved', tid, next);
						}
					], next);
				} else {
					db.sortedSetRemove('topics:unsolved', tid, function() {
						db.sortedSetRemove('topics:solved', tid, next);
						topics.deleteTopicField(tid, 'solvedPid');
					});
				}
			}
		], function(err) {
			callback(err, {isQuestion: !isQuestion});
		});
	});	
}

function renderUnsolved(req, res, next) {
	var page = parseInt(req.query.page, 10) || 1;
	var pageCount = 1;
	var stop = 0;
	var topicCount = 0;
	var settings;
	
	async.waterfall([
		function (next) {
			async.parallel({
				settings: function(next) {
					user.getSettings(req.uid, next);
				},
				tids: function (next) {
					db.getSortedSetRevRange('topics:unsolved', 0, 199, next);
				}
			}, next);
		},
		function (results, next) {
			settings = results.settings;
			privileges.topics.filterTids('read', results.tids, req.uid, next);
		},
		function (tids, next) {
			var start = Math.max(0, (page - 1) * settings.topicsPerPage);
			stop = start + settings.topicsPerPage - 1;

			topicCount = tids.length;
			pageCount = Math.max(1, Math.ceil(topicCount / settings.topicsPerPage));
			tids = tids.slice(start, stop + 1);

			topics.getTopicsByTids(tids, req.uid, next);
		}
	], function(err, topics) {
		if (err) {
			return next(err);
		}
		
		var data = {};
		data.topics = topics;
		data.nextStart = stop + 1;
		data.set = 'topics:unsolved';
		data['feeds:disableRSS'] = true;
		data.pagination = pagination.create(page, pageCount);
		if (req.path.startsWith('/api/unsolved') || req.path.startsWith('/unsolved')) {
			data.breadcrumbs = helpers.buildBreadcrumbs([{text: 'Unsolved'}]);
		}
		
		res.render('recent', data);
	});
}

function renderSolved(req, res, next) {
	var page = parseInt(req.query.page, 10) || 1;
	var pageCount = 1;
	var stop = 0;
	var topicCount = 0;
	var settings;
	
	async.waterfall([
		function (next) {
			async.parallel({
				settings: function(next) {
					user.getSettings(req.uid, next);
				},
				tids: function (next) {
					db.getSortedSetRevRange('topics:solved', 0, 199, next);
				}
			}, next);
		},
		function (results, next) {
			settings = results.settings;
			privileges.topics.filterTids('read', results.tids, req.uid, next);
		},
		function (tids, next) {
			var start = Math.max(0, (page - 1) * settings.topicsPerPage);
			stop = start + settings.topicsPerPage - 1;

			topicCount = tids.length;
			pageCount = Math.max(1, Math.ceil(topicCount / settings.topicsPerPage));
			tids = tids.slice(start, stop + 1);

			topics.getTopicsByTids(tids, req.uid, next);
		}
	], function(err, topics) {
		if (err) {
			return next(err);
		}
		
		var data = {};
		data.topics = topics;
		data.nextStart = stop + 1;
		data.set = 'topics:solved';
		data['feeds:disableRSS'] = true;
		data.pagination = pagination.create(page, pageCount);
		if (req.path.startsWith('/api/solved') || req.path.startsWith('/solved')) {
			data.breadcrumbs = helpers.buildBreadcrumbs([{text: 'Solved'}]);
		}
		
		res.render('recent', data);
	});
}

module.exports = plugin;
