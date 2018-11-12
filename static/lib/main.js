'use strict';

/* global $, window, socket, config, ajaxify, app */

var translations = [];

$('document').ready(function() {
	$(window).on('action:ajaxify.end', function(err, data) {
		if (data.url.match(/^topic\//)) {
			if(translations.length == 0)
			{
				require(['translator'], function(translator) {
					translator.translate('[[qanda:topic_solved]],[[qanda:topic_unsolved]],[[qanda:thread.tool.as_question]],[[qanda:thread.alert.as_question]],[[qanda:thread.alert.make_normal]],[[qanda:thread.alert.solved]],[[qanda:thread.alert.unsolved]],[[qanda:post.alert.correct_answer]]', function(translated) {
						translations = translated.split(',');
						addLabel();
						markPostAsSolved();
					});
				});
			}
			else
			{
				addLabel();
				markPostAsSolved();
			}
		}
	});

	$(window).on('action:topic.tools.load', addHandlers);
	$(window).on('action:post.tools.load', addPostHandlers);

	$(window).on('action:posts.loaded', markPostAsSolved);

	$(window).on('action:composer.loaded', function (ev, data) {
		// Return early if it is a reply and not a new topic
		if (data.hasOwnProperty('composerData') && !data.composerData.isMain) {
			return;
		}

		var item = $('<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu pull-right" role="menu"><li><a href="#" data-switch-action="post"><i class="fa fa-fw fa-question-circle"></i>' + translations[2] + '</a></li></ul>');
		var actionBar = $('.composer[data-uuid="' + data.post_uuid + '"] .action-bar');

		item.on('click', 'li', function () {
			$(window).one('action:composer.submit', function (e, data) {
				data.composerData.isQuestion = true;
			});
		});

		actionBar.append(item);
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
			require(['components'], function (components) {
				if (parseInt(ajaxify.data.isSolved, 10) === 0) {
					components.get('post/header').prepend('<span class="unanswered"><i class="fa fa-question-circle"></i> ' + translations[1] + '</span>');
				} else if (parseInt(ajaxify.data.isSolved, 10) === 1) {
					components.get('post/header').prepend('<span class="answered"><i class="fa fa-question-circle"></i> ' + translations[0] + '</span>');
				}
			});
		}
	}

	function toggleQuestionStatus() {
		var tid = ajaxify.data.tid;
		callToggleQuestion(tid, true);
	}

	function callToggleQuestion(tid, refresh) {
		socket.emit('plugins.QandA.toggleQuestionStatus', { tid: tid }, function (err, data) {
			if (err) {
				return app.alertError(err);
			}

			app.alertSuccess(translations[data.isQuestion ? 3 : 4]);
			if (refresh) {
				ajaxify.refresh();
			}
		});
	}

	function toggleSolved() {
		var tid = ajaxify.data.tid;
		socket.emit('plugins.QandA.toggleSolved', { tid: tid }, function (err, data) {
			if (err) {
				return app.alertError(err);
			}

			app.alertSuccess(translations[data.isSolved ? 5 : 6]);
			ajaxify.refresh();
		});
	}

	function markPostAsAnswer() {
		var tid = ajaxify.data.tid;
		var pid = $(this).parents('[data-pid]').attr('data-pid');

		socket.emit('plugins.QandA.toggleSolved', { tid: tid, pid: pid }, function (err, data) {
			if (err) {
				return app.alertError(err);
			}

			app.alertSuccess(translations[data.isSolved ? 7 : 6]);
			ajaxify.refresh();
		});
	}

	function markPostAsSolved() {
		$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"]').addClass('isSolved');
	}
});
