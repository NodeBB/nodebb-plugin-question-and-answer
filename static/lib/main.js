"use strict";

/*global socket*/

$('document').ready(function() {
	$(window).on('action:ajaxify.end', function(err, data) {
		if (data.url.match(/^topic\//)) {
			addHandlers();
		}
	});

	function addHandlers() {
		$('.toggleQuestionStatus').on('click', toggleQuestionStatus);
		$('.toggleSolved').on('click', toggleSolved);
	}

	function toggleQuestionStatus() {
		var tid = ajaxify.variables.get('topic_id');
		socket.emit('plugins.QandA.toggleQuestionStatus', {tid: tid}, function(err, data) {
			app.alertSuccess(data.isQuestion ? 'Topic has been marked as a question' : 'Topic is now a regular thread');
			ajaxify.refresh();
		});
	}

	function toggleSolved() {
		var tid = ajaxify.variables.get('topic_id');
		socket.emit('plugins.QandA.toggleSolved', {tid: tid}, function(err, data) {
			app.alertSuccess(data.isSolved ? 'Topic has been marked as solved' : 'Topic has been marked as unsolved');
			ajaxify.refresh();
		});
	}
});