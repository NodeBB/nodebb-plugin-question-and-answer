'use strict';

const topics = require.main.require('./src/topics');
const posts = require.main.require('./src/posts');
const categories = require.main.require('./src/categories');
const meta = require.main.require('./src/meta');
const privileges = require.main.require('./src/privileges');
const rewards = require.main.require('./src/rewards');
const user = require.main.require('./src/user');
const helpers = require.main.require('./src/controllers/helpers');
const db = require.main.require('./src/database');
const plugins = require.main.require('./src/plugins');
const SocketPlugins = require.main.require('./src/socket.io/plugins');
const pagination = require.main.require('./src/pagination');

const plugin = module.exports;

plugin.init = async function (params) {
	const app = params.router;
	const middleware = params.middleware;

	app.get('/admin/plugins/question-and-answer', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/question-and-answer', renderAdmin);

	app.get('/unsolved', middleware.buildHeader, renderUnsolved);
	app.get('/api/unsolved', renderUnsolved);

	app.get('/solved', middleware.buildHeader, renderSolved);
	app.get('/api/solved', renderSolved);

	handleSocketIO();

	plugin._settings = await meta.settings.get('question-and-answer');
};

plugin.appendConfig = async function (config) {
	config['question-and-answer'] = plugin._settings;
	return config;
};

plugin.addNavigation = async function (menu) {
	menu = menu.concat(
		[
			{
				route: '/unsolved',
				title: '[[qanda:menu.unsolved]]',
				iconClass: 'fa-question-circle',
				textClass: 'visible-xs-inline',
				text: '[[qanda:menu.unsolved]]',
			},
			{
				route: '/solved',
				title: '[[qanda:menu.solved]]',
				iconClass: 'fa-check-circle',
				textClass: 'visible-xs-inline',
				text: '[[qanda:menu.solved]]',
			},
		]
	);
	return menu;
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/question-and-answer',
		icon: 'fa-question-circle',
		name: 'Q&A',
	});
	return header;
};

plugin.getTopic = async function (hookData) {
	if (parseInt(hookData.templateData.isQuestion, 10)) {
		hookData.templateData.icons.push(
			parseInt(hookData.templateData.isSolved, 10)
				? '<span class="answered"><i class="fa fa-check"></i>[[qanda:topic_solved]]</span>'
				: '<span class="unanswered"><i class="fa fa-question-circle"></i> [[qanda:topic_unsolved]]</span>'
		);
	}

	const solvedPid = parseInt(hookData.templateData.solvedPid, 10);
	if (!solvedPid || hookData.templateData.pagination.currentPage > 1) {
		return hookData;
	}
	const answers = await posts.getPostsByPids([solvedPid], hookData.uid);
	const postsData = await topics.addPostData(answers, hookData.uid);
	let post = postsData[0];
	if (post) {
		const bestAnswerTopicData = { ...hookData.templateData };
		bestAnswerTopicData.posts = postsData;
		await topics.modifyPostsByPrivilege(bestAnswerTopicData, await privileges.topics.get(hookData.templateData.tid, hookData.req.uid));
		post = bestAnswerTopicData.posts[0];
		post.index = -1;

		const op = hookData.templateData.posts.shift();
		hookData.templateData.posts.unshift(post);
		hookData.templateData.posts.unshift(op);
	}

	// Also expose an `isAnswer` boolean in the post object itself
	hookData.templateData.posts.forEach((post) => {
		post.isAnswer = post.pid === solvedPid;
	});

	return hookData;
};

plugin.getTopics = async function (hookData) {
	hookData.topics.forEach((topic) => {
		if (topic && parseInt(topic.isQuestion, 10)) {
			if (parseInt(topic.isSolved, 10)) {
				topic.icons.push('<span class="answered"><i class="fa fa-check"></i> [[qanda:topic_solved]]</span>');
			} else {
				topic.icons.push('<span class="unanswered"><i class="fa fa-question-circle"></i> [[qanda:topic_unsolved]]</span>');
			}
		}
	});
	return hookData;
};

plugin.addThreadTool = async function (hookData) {
	var isSolved = parseInt(hookData.topic.isSolved, 10);

	if (parseInt(hookData.topic.isQuestion, 10)) {
		hookData.tools = hookData.tools.concat([
			{
				class: 'toggleSolved ' + (isSolved ? 'alert-warning topic-solved' : 'alert-success topic-unsolved'),
				title: isSolved ? '[[qanda:thread.tool.mark_unsolved]]' : '[[qanda:thread.tool.mark_solved]]',
				icon: isSolved ? 'fa-question-circle' : 'fa-check-circle',
			},
			{
				class: 'toggleQuestionStatus',
				title: '[[qanda:thread.tool.make_normal]]',
				icon: 'fa-comments',
			},
		]);
	} else {
		hookData.tools.push({
			class: 'toggleQuestionStatus alert-warning',
			title: '[[qanda:thread.tool.as_question]]',
			icon: 'fa-question-circle',
		});
	}
	return hookData;
};

plugin.addPostTool = async function (postData) {
	const data = await topics.getTopicDataByPid(postData.pid);
	if (!data) {
		return postData;
	}

	data.isSolved = parseInt(data.isSolved, 10) === 1;
	data.isQuestion = parseInt(data.isQuestion, 10) === 1;

	if (data.uid && !data.isSolved && data.isQuestion && parseInt(data.mainPid, 10) !== parseInt(postData.pid, 10)) {
		postData.tools.push({
			action: 'qanda/post-solved',
			html: '[[qanda:post.tool.mark_correct]]',
			icon: 'fa-check-circle',
		});
	}
	return postData;
};

plugin.getConditions = async function (conditions) {
	conditions.push({
		name: 'Times questions accepted',
		condition: 'qanda/question.accepted',
	});
	return conditions;
};

plugin.onTopicCreate = async function (payload) {
	let isQuestion;
	if (payload.data.hasOwnProperty('isQuestion')) {
		isQuestion = true;
	}

	// Overrides from ACP config
	if (plugin._settings.forceQuestions === 'on' || plugin._settings['defaultCid_' + payload.topic.cid] === 'on') {
		isQuestion = true;
	}

	if (!isQuestion) {
		return payload;
	}
	await topics.setTopicFields(payload.topic.tid, { isQuestion: 1, isSolved: 0 });
	await db.sortedSetAdd('topics:unsolved', Date.now(), payload.topic.tid);
	return payload;
};

plugin.actionTopicSave = async function (hookData) {
	if (hookData.topic && hookData.topic.isQuestion) {
		await db.sortedSetAdd(hookData.topic.isSolved === 1 ? 'topics:solved' : 'topics:unsolved', Date.now(), hookData.topic.tid);
	}
};

plugin.filterTopicEdit = async function (hookData) {
	const isNowQuestion = hookData.data.isQuestion;
	const wasQuestion = await topics.getTopicField(hookData.topic.tid, 'isQuestion');

	if (isNowQuestion != wasQuestion) {
		await toggleQuestionStatus(hookData.req.uid, hookData.topic.tid);
	}

	return hookData;
};

plugin.actionTopicPurge = async function (hookData) {
	if (hookData.topic) {
		await db.sortedSetsRemove(['topics:solved', 'topics:unsolved'], hookData.topic.tid);
	}
};

plugin.filterComposerPush = async function (hookData) {
	const tid = await posts.getPostField(hookData.pid, 'tid');
	const isQuestion = await topics.getTopicField(tid, 'isQuestion');
	hookData.isQuestion = isQuestion;

	return hookData;
};

plugin.staticApiRoutes = async function ({ router, middleware, helpers }) {
	router.get('/qna/:tid', middleware.assert.topic, async (req, res) => {
		let { isQuestion, isSolved } = await topics.getTopicFields(req.params.tid, ['isQuestion', 'isSolved']);
		isQuestion = isQuestion || '0';
		isSolved = isSolved || '0';
		helpers.formatApiResponse(200, res, { isQuestion, isSolved });
	});
};

async function renderAdmin(req, res) {
	const cids = await db.getSortedSetRange('categories:cid', 0, -1);
	const data = await categories.getCategoriesFields(cids, ['cid', 'name', 'parentCid']);
	res.render('admin/plugins/question-and-answer', {
		categories: categories.getTree(data)
	});
}

function handleSocketIO() {
	SocketPlugins.QandA = {};

	SocketPlugins.QandA.toggleSolved = async function (socket, data) {
		const canEdit = await privileges.topics.canEdit(data.tid, socket.uid);
		if (!canEdit) {
			throw new Error('[[error:no-privileges]]');
		}

		return await toggleSolved(socket.uid, data.tid, data.pid);
	};

	SocketPlugins.QandA.toggleQuestionStatus = async function (socket, data) {
		const canEdit = await privileges.topics.canEdit(data.tid, socket.uid);
		if (!canEdit) {
			throw new Error('[[error:no-privileges]]');
		}

		return await toggleQuestionStatus(socket.uid, data.tid);
	};
}

async function toggleSolved(uid, tid, pid) {
	let isSolved = await topics.getTopicField(tid, 'isSolved');
	isSolved = parseInt(isSolved, 10) === 1;

	const updatedTopicFields = isSolved
		? { isSolved: 0, solvedPid: 0 }
		: { isSolved: 1, solvedPid: pid };

	if (plugin._settings.toggleLock === 'on') {
		updatedTopicFields.locked = isSolved ? 0 : 1;
	}

	await topics.setTopicFields(tid, updatedTopicFields);

	if (isSolved) {
		await db.sortedSetAdd('topics:unsolved', Date.now(), tid);
		await db.sortedSetRemove('topics:solved', tid);
	} else {
		await db.sortedSetRemove('topics:unsolved', tid);
		await db.sortedSetAdd('topics:solved', Date.now(), tid);

		if (pid) {
			const data = await posts.getPostData(pid);
			await rewards.checkConditionAndRewardUser({
				uid: data.uid,
				condition: 'qanda/question.accepted',
				method: async function () {
					await user.incrementUserFieldBy(data.uid, 'qanda/question.accepted', 1);
				},
			});
		}
	}
	plugins.fireHook('action:topic.toggleSolved', { uid: uid, tid: tid, pid: pid, isSolved: !isSolved });
	return { isSolved: !isSolved };
}

async function toggleQuestionStatus(uid, tid) {
	let isQuestion = await topics.getTopicField(tid, 'isQuestion');
	isQuestion = parseInt(isQuestion, 10) === 1;

	if (!isQuestion) {
		await Promise.all([
			topics.setTopicFields(tid, { isQuestion: 1, isSolved: 0, solvedPid: 0 }),
			db.sortedSetAdd('topics:unsolved', Date.now(), tid),
			db.sortedSetRemove('topics:solved', tid),
		]);
	} else {
		await Promise.all([
			topics.deleteTopicFields(tid, ['isQuestion', 'isSolved', 'solvedPid']),
			db.sortedSetsRemove(['topics:solved', 'topics:unsolved'], tid),
		]);
	}
	plugins.fireHook('action:topic.toggleQuestion', { uid: uid, tid: tid, isQuestion: !isQuestion });
	return { isQuestion: !isQuestion };
}

async function canPostTopic(uid) {
	let cids = await categories.getAllCidsFromSet('categories:cid');
	cids = await privileges.categories.filterCids('topics:create', cids, uid);
	return cids.length > 0;
}

async function renderUnsolved(req, res) {
	const page = parseInt(req.query.page, 10) || 1;

	const [settings, allTids, canPost] = await Promise.all([
		user.getSettings(req.uid),
		db.getSortedSetRevRange('topics:unsolved', 0, 199),
		canPostTopic(req.uid),
	]);
	let tids = await privileges.topics.filterTids('read', allTids, req.uid);

	const start = Math.max(0, (page - 1) * settings.topicsPerPage);
	const stop = start + settings.topicsPerPage - 1;

	const topicCount = tids.length;
	const pageCount = Math.max(1, Math.ceil(topicCount / settings.topicsPerPage));
	tids = tids.slice(start, stop + 1);

	const topicsData = await topics.getTopicsByTids(tids, req.uid);

	const data = {};
	data.topics = topicsData;
	data.nextStart = stop + 1;
	data.set = 'topics:unsolved';
	data['feeds:disableRSS'] = true;
	data.pagination = pagination.create(page, pageCount);
	data.canPost = canPost;
	data.title = '[[qanda:menu.unsolved]]';

	if (req.path.startsWith('/api/unsolved') || req.path.startsWith('/unsolved')) {
		data.breadcrumbs = helpers.buildBreadcrumbs([{ text: '[[qanda:menu.unsolved]]' }]);
	}

	res.render('recent', data);
}

async function renderSolved(req, res) {
	const page = parseInt(req.query.page, 10) || 1;

	const [settings, allTids, canPost] = await Promise.all([
		user.getSettings(req.uid),
		db.getSortedSetRevRange('topics:solved', 0, 199),
		canPostTopic(req.uid),
	]);
	let tids = await privileges.topics.filterTids('read', allTids, req.uid);

	const start = Math.max(0, (page - 1) * settings.topicsPerPage);
	const stop = start + settings.topicsPerPage - 1;

	const topicCount = tids.length;
	const pageCount = Math.max(1, Math.ceil(topicCount / settings.topicsPerPage));
	tids = tids.slice(start, stop + 1);

	const topicsData = await topics.getTopicsByTids(tids, req.uid);

	const data = {};
	data.topics = topicsData;
	data.nextStart = stop + 1;
	data.set = 'topics:solved';
	data['feeds:disableRSS'] = true;
	data.pagination = pagination.create(page, pageCount);
	data.canPost = canPost;
	data.title = '[[qanda:menu.solved]]';

	if (req.path.startsWith('/api/solved') || req.path.startsWith('/solved')) {
		data.breadcrumbs = helpers.buildBreadcrumbs([{ text: '[[qanda:menu.solved]]' }]);
	}

	res.render('recent', data);
}
