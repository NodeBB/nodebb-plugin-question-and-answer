'use strict';

$('document').ready(function () {
	function translate(text, cb) {
		require(['translator'], function (translator) {
			translator.translate(text, cb);
		});
	}
	function alertType(type, message) {
		require(['alerts'], function (alerts) {
			alert[type](message);
		});
	}
	$(window).on('action:ajaxify.end', function () {
		if (ajaxify.data.template.topic) {
			markPostAsSolved();
		} else if (ajaxify.data.template.compose && ajaxify.data.isMain && ajaxify.data.topic) {
			// seperate composer page
			var actionBar = $('.composer .action-bar');
			addQnADropdown(actionBar, parseInt(ajaxify.data.topic.isQuestion, 10) === 1);
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
		var actionBar = $('.composer[data-uuid="' + data.post_uuid + '"] .action-bar');
		addQnADropdown(actionBar, data.composerData.isQuestion);
	});

	function addQnADropdown(actionBar, isQuestion) {
		translate('[[qanda:thread.tool.as_question]]', function (translated) {
			var $container = actionBar.find('.dropdown-menu');

			// Append a dropdown container if necessary (up to v1.18.4)
			if (!$container.length) {
				actionBar.append('<button type="button" class="btn btn-info dropdown-toggle" data-bs-toggle="dropdown"><span class="caret"></span></button>');
				$container = $('<ul class="dropdown-menu float-end" role="menu"></ul>');
				actionBar.append($container);
			}

			var item = $('<li><a class="dropdown-item" href="#" data-switch-action="post"><i class="fa fa-fw fa-' + (isQuestion ? 'check-' : '') + 'circle-o"></i> ' + translated + '</a></li>');

			item.on('click', () => {
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

			$container.append(item);
		});
	}

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
				return alertType('error', err);
			}

			alertType('success', data.isQuestion ? '[[qanda:thread.alert.as_question]]' : '[[qanda:thread.alert.make_normal]]');
			if (refresh) {
				ajaxify.refresh();
			}
		});
	}

	function toggleSolved() {
		var tid = ajaxify.data.tid;
		socket.emit('plugins.QandA.toggleSolved', { tid: tid }, function (err, data) {
			if (err) {
				return alertType('error', err);
			}

			alertType('success', data.isSolved ? '[[qanda:thread.alert.solved]]' : '[[qanda:thread.alert.unsolved]]');
			ajaxify.refresh();
		});
	}

	function markPostAsAnswer() {
		var tid = ajaxify.data.tid;
		var pid = $(this).parents('[data-pid]').attr('data-pid');

		socket.emit('plugins.QandA.toggleSolved', { tid: tid, pid: pid }, function (err, data) {
			if (err) {
				return alertType('error', err);
			}

			alertType('success', data.isSolved ? '[[qanda:post.alert.correct_answer]]' : '[[qanda:thread.alert.unsolved]]');
			ajaxify.refresh();
		});
	}

	function markPostAsSolved() {
		$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"][data-index="-1"]').addClass('isSolved');
		$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"][data-index="-1"] .post-footer').addClass('hidden');

		translate('[[qanda:label.solution]]', (translated) => {
			$('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"][data-index="-1"]').attr('data-label', translated);
		});
	}
});
