"use strict";

/*global socket, config, ajaxify, app*/

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

		var item = $('<li><a href="#" data-switch-action="post"><i class="fa fa-fw fa-question-circle"></i> Ask as Question</a></li>');
		var dropdownEl = $('#cmp-uuid-' + data.post_uuid + ' .action-bar .dropdown-menu');

		if (config['question-and-answer'].forceQuestions === 'on') {
			dropdownEl.empty();
		}

		dropdownEl.append(item);

		item.on('click', function() {
			$(window).off('action:composer.topics.post').one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid);
			});
		});

		if (
			config['question-and-answer'].forceQuestions === 'on' ||
			(
				config['question-and-answer'].makeDefault === 'on' &&
				(config['question-and-answer'].defaultCid === "0" || parseInt(config['question-and-answer'].defaultCid, 10) === data.composerData.cid)
			)
		) {
			$('.composer-submit').attr('data-action', 'post').html('<i class="fa fa-fw fa-question-circle"></i> Ask as Question</a>');
			$(window).off('action:composer.topics.post').one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid);
			});
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
					components.get('post/header').prepend('<span class="unanswered"><i class="fa fa-question-circle"></i> Unsolved</span>');
				} else if (parseInt(ajaxify.data.isSolved, 10) === 1) {
					components.get('post/header').prepend('<span class="answered"><i class="fa fa-question-circle"></i> Solved</span>');
				}
			});
		}
	}

	function toggleQuestionStatus() {
		var tid = ajaxify.data.tid;
		callToggleQuestion(tid);
	}

	function callToggleQuestion(tid) {
		socket.emit('plugins.QandA.toggleQuestionStatus', {tid: tid}, function(err, data) {
			app.alertSuccess(data.isQuestion ? 'Topic has been marked as a question' : 'Topic is now a regular thread');
			ajaxify.refresh();
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
