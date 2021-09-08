'use strict';

$('document').ready(function () {
	function translate(text, cb) {
		require(['translator'], function (translator) {
			translator.translate(text, cb);
		});
	}
	$(window).on('action:ajaxify.end', function () {
		if (ajaxify.data.template.topic) {
			markPostAsSolved();
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
		translate('[[qanda:thread.tool.as_question]]', function (translated) {
			var item = $('<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu pull-right" role="menu"><li><a href="#" data-switch-action="post"><i class="fa fa-fw fa-' + (data.composerData.isQuestion ? 'check-' : '') + 'circle-o"></i> ' + translated + '</a></li></ul>');
			var actionBar = $('.composer[data-uuid="' + data.post_uuid + '"] .action-bar');

			item.on('click', 'li [data-switch-action="post"]', function () {
				var icon = item.find('.fa');
				icon.toggleClass('fa-circle-o').toggleClass('fa-check-circle-o');
				// Don't close dropdown on toggle (for better UX)
				return false;
			});

			$(window).one('action:composer.submit', function (ev, data) {
				var icon = item.find('.fa');
				if (icon.hasClass('fa-check-circle-o')) {
					data.composerData.isQuestion = true;
				}
			});

			actionBar.append(item);
		});
	});

	$(window).on('action:posts.edited', function (ev, data) {
		require(['api'], function (api) {
			api.get(`/plugins/qna/${data.topic.tid}`, {})
				.then((res) => {
					const toggled = (ajaxify.data.isQuestion || '0') !== res.isQuestion || (ajaxify.data.isSolved || '0') !== res.isSolved;
					if (toggled) {
						ajaxify.refresh();
					}
				});
		});
	});

	function addHandlers() {
		$('.toggleQuestionStatus').on('click', toggleQuestionStatus);
		$('.toggleSolved').on('click', toggleSolved);
	}

	function addPostHandlers() {
		$('[component="qanda/post-solved"]').on('click', markPostAsAnswer);
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

			app.alertSuccess(data.isQuestion ? '[[qanda:thread.alert.as_question]]' : '[[qanda:thread.alert.make_normal]]');
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

			app.alertSuccess(data.isSolved ? '[[qanda:thread.alert.solved]]' : '[[qanda:thread.alert.unsolved]]');
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

			app.alertSuccess(data.isSolved ? '[[qanda:post.alert.correct_answer]]' : '[[qanda:thread.alert.unsolved]]');
			ajaxify.refresh();
		});
	}

	function markPostAsSolved() {
		if (ajaxify.data.pagination.currentPage === 1) {
			$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"]').addClass('isSolved');
			$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"][data-index="-1"] .post-footer').addClass('hidden');
		}
	}
});
