'use strict';

$('document').ready(function () {
	function translate(text, cb) {
		require(['translator'], function (translator) {
			translator.translate(text, cb);
		});
	}
	function alertType(type, message) {
		require(['alerts'], function (alerts) {
			alerts[type](message);
		});
	}
	$(window).on('action:ajaxify.end', function () {
		if (ajaxify.data.template.compose && ajaxify.data.isMain && ajaxify.data.topic) {
			// seperate composer page
			var actionBar = $('.composer .action-bar');
			addQnADropdownHandler(actionBar);
		}
	});

	$(window).on('action:topic.tools.load', addHandlers);
	$(window).on('action:post.tools.load', addPostHandlers);

	$(window).on('action:posts.loaded', markPostAsSolved);
	$(window).on('action:topic.loaded', markPostAsSolved);

	$(window).on('action:composer.loaded', function (ev, data) {
		// Return early if it is a reply and not a new topic
		if (data.hasOwnProperty('composerData') && !data.composerData.isMain) {
			return;
		}
		var actionBar = $('.composer[data-uuid="' + data.post_uuid + '"] .action-bar');
		addQnADropdownHandler(actionBar);
	});

	require(['hooks', 'translator'], function (hooks, translator) {
		hooks.on('filter:composer.create', async (hookData) => {
			const translated = await translator.translate('[[qanda:thread.tool.as_question]]');
			hookData.createData.submitOptions.push({
				action: 'ask-as-question',
				text: `<i class="fa fa-fw fa-${hookData.postData.isQuestion ? 'check-' : ''}circle-o"></i> ${translated}`
			});
			return hookData;
		});
	});

	function addQnADropdownHandler(actionBar) {
		const item = actionBar.find(`[data-action="ask-as-question"]`);
		item.on('click', () => {
			item.find('.fa').toggleClass('fa-circle-o').toggleClass('fa-check-circle-o');
			// Don't close dropdown on toggle (for better UX)
			return false;
		});

		$(window).one('action:composer.submit', function (ev, data) {
			if (item.find('.fa').hasClass('fa-check-circle-o')) {
				data.composerData.isQuestion = true;
			}
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

		socket.emit('plugins.QandA.markPostAsAnswer', { tid: tid, pid: pid }, function (err, data) {
			if (err) {
				return alertType('error', err);
			}

			alertType('success', data.isSolved ? '[[qanda:post.alert.correct_answer]]' : '[[qanda:thread.alert.unsolved]]');
			ajaxify.refresh();
		});
	}

	function markPostAsSolved() {
		if (!ajaxify.data.solvedPid) {
			return;
		}
		$('[component="topic"]').addClass('solved');
		const solvedEl = $('[component="post"][data-pid="' + ajaxify.data.solvedPid + '"]').first();
		if (solvedEl.length) {
			const prev = solvedEl.prevAll('[component="post"][data-index="0"]');
			if (!prev.length) {
				return;
			}

			solvedEl.addClass('isSolved');
			$(`[data-necro-post-index="${solvedEl.attr('data-index')}"]`).addClass('hidden');
			translate('[[qanda:label.solution]]', (translated) => {
				solvedEl.attr('data-label', translated);
			});
		}
	}
});
