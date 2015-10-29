"use strict";

/*global socket*/

$('document').ready(function() {
	$(window).on('action:ajaxify.end', function(err, data) {
		if (data.url.match(/^topic\//)) {
			addLabel();
		}
	});

	$(window).on('action:topic.tools.load', addHandlers);
	$(window).on('action:composer.loaded', function(err, data) {
		if (data.hasOwnProperty('composerData') && !data.composerData.isMain) {
			// Do nothing, as this is a reply, not a new post
			return;
		}

		var item = $('<li><a href="#" data-switch-action="post"><i class="fa fa-fw fa-question-circle"></i> Ask as Question</a></li>');
		$('#cmp-uuid-' + data.post_uuid + ' .action-bar .dropdown-menu').append(item);

		item.on('click', function() {
			$(window).one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid);
			});
		});

		if (config['question-and-answer'].makeDefault === 'on') {
			$('.composer-submit').attr('data-action', 'post').html('<i class="fa fa-fw fa-question-circle"></i> Ask as Question</a>');
			$(window).one('action:composer.topics.post', function(ev, data) {
				callToggleQuestion(data.data.tid);
			});
		}
	});

	function addHandlers() {
		$('.toggleQuestionStatus').on('click', toggleQuestionStatus);
		$('.toggleSolved').on('click', toggleSolved);
	}

	function addLabel() {
		require(['components'], function(components) {
			if ($('.topic-unsolved').length) {
				components.get('post/header').prepend('<span class="unanswered"><i class="fa fa-question-circle"></i> Unsolved</span>');
			} else if ($('.topic-solved').length) {
				components.get('post/header').prepend('<span class="answered"><i class="fa fa-question-circle"></i> Solved</span>');
			}
		});
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
});
