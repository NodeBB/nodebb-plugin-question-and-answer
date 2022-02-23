'use strict';

define('admin/plugins/question-and-answer', ['settings', 'translator', 'alerts'], function (Settings, Translator, alerts) {
	const admin = {};
	admin.init = function () {
		Settings.load('question-and-answer', $('.question-and-answer-settings'));

		render(ajaxify.data.categories, $('.all-categories'));

		$('#save').on('click', function () {
			Settings.save('question-and-answer', $('.question-and-answer-settings'), function () {
				alerts.alert({
					type: 'success',
					alert_id: 'question-and-answer-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});

		function render(categories, container) {
			renderList(categories, container, 0);

			function renderList(categories, container, parentId) {
				if (!categories || !categories.length) {
					return;
				}

				var count = 0;
				categories.forEach(function (category, idx, parent) {
					Translator.translate(category.name, function (translated) {
						if (category.name !== translated) {
							category.name = translated;
						}
						count += 1;

						if (count === parent.length) {
							renderTemplate();
						}
					});
				});

				if (!categories.length) {
					renderTemplate();
				}

				function renderTemplate() {
					app.parseAndTranslate('admin/plugins/question-and-answer-items', {
						cid: parentId,
						categories: categories,
					}, function (html) {
						container.append(html);

						// Handle and children categories in this level have
						for (var x = 0, numCategories = categories.length; x < numCategories; x += 1) {
							renderList(categories[x].children, $('li[data-cid="' + categories[x].cid + '"]'), categories[x].cid);
						}

						$('.question-and-answer-settings').deserialize(ajaxify.data.settings);
					});
				}
			}
		}
	}
	return admin;
});
