"use strict";

/*global socket, config, ajaxify, app*/

var qanda_trans_array = [];

require(['translator'], function(translator) {
	translator.translate('[[qanda:topic_solved]],[[qanda:topic_unsolved]],[[qanda:thread.button.as_question]],[[qanda:thread.tool.as_question]]', function(translated) {
		qanda_trans_array = translated.split(',');
	});
});

$('document').ready(function() {
	$(window).on('action:ajaxify.end', function(err, data) {
		if (data.url.match(/^topic\//)) {
			addLabel();
			markPostAsSolved();
		}
	});

	$(window).on('action:topic.tools.load', addHandlers);
	$(window).on('action:post.tools.load', addPostHandlers);

	$(window).on('action:posts.loaded', markPostAsSolved);

	$(window).on('action:composer.loaded', function(err, data) {
		if (data.hasOwnProperty('composerData') && !data.composerData.isMain) {
			// Do nothing, as this is a reply, not a new post
			return;
		}

	    var item = $('<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu pull-right" role="menu"><li><a href="#" data-switch-action="post"><i class="fa fa-question-circle"></i> ' + qanda_trans_array[3] + '</a></li></ul>');
		var actionBar = $('#cmp-uuid-' + data.post_uuid + ' .action-bar');

		item.on('click', 'li', function() {
			$(window).off('action:composer.topics.post').one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid, false);
			});
		});

		if (
			config['question-and-answer'].forceQuestions === 'on' ||
			(config['question-and-answer']['defaultCid_' + data.composerData.cid] === 'on')
		) {
			$('.composer-submit')
			.attr('data-action', 'post')
			.html('<i class="fa fa-question-circle"></i> ' + qanda_trans_array[2] + '</a>')
			.filter('.btn-sm')
			.html('<i class="fa fa-question"></i> </a>');
			$(window).off('action:composer.topics.post').one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid, false);
			});
		} else {
			actionBar.append(item);
		}
	});

	function addHandlers() {
		$('.toggleQuestionStatus').on('click', toggleQuestionStatus);
		$('.toggleSolved').on('click', toggleSolved);
	}

	function addPostHandlers() {
		$('[component="qanda/post-solved"]').on('click', markPostAsAnswer);
	}

	function addLabel() {
		if (ajaxify.data.hasOwnProperty('isQuestion') && parseInt(ajaxify.data.isQuestion, 10) === 1) {
			require(['components'], function(components) {
				if (parseInt(ajaxify.data.isSolved, 10) === 0) {
					components.get('post/header').prepend('<span class="unanswered"><i class="fa fa-question-circle"></i> ' + qanda_trans_array[1] + '</span>');
				} else if (parseInt(ajaxify.data.isSolved, 10) === 1) {
					components.get('post/header').prepend('<span class="answered"><i class="fa fa-question-circle"></i> ' + qanda_trans_array[0] + '</span>');
				}
			});
		}
	}

	function toggleQuestionStatus() {
		var tid = ajaxify.data.tid;
		callToggleQuestion(tid, true);
	}

	function callToggleQuestion(tid, refresh) {
		socket.emit('plugins.QandA.toggleQuestionStatus', {tid: tid}, function(err, data) {
			app.alertSuccess(data.isQuestion ? 'Topic has been marked as a question' : 'Topic is now a regular thread');
			if (refresh) {
				ajaxify.refresh();
			}
		});
	}

	function toggleSolved() {
		var tid = ajaxify.data.tid;
		socket.emit('plugins.QandA.toggleSolved', {tid: tid}, function(err, data) {
			app.alertSuccess(data.isSolved ? 'Topic has been marked as solved' : 'Topic has been marked as unsolved');
			ajaxify.refresh();
		});
	}

	function markPostAsAnswer() {
		var tid = ajaxify.data.tid;
		var pid = $(this).parents('[data-pid]').attr('data-pid');

		socket.emit('plugins.QandA.toggleSolved', {tid: tid, pid: pid}, function(err, data) {
			app.alertSuccess(data.isSolved ? 'This post has been marked as the correct answer' : 'Topic has been marked as unsolved');
			ajaxify.refresh();
		});
	}

	function markPostAsSolved(err, data) {
		$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"]').addClass('isSolved');
	}
});
