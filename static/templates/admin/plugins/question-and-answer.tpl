<form role="form" class="question-and-answer-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12
                settings-header">[[qanda:admin.form.general_settings]]</div>
		<div class="col-sm-10 col-xs-12">
			<div class="checkbox">
				<label>
					<input type="checkbox" name="forceQuestions">
					[[qanda:admin.form.label.only_allow_all]]
				</label>
				<p class="help-block">
					[[qanda:admin.form.tips]]
				</p>
			</div>
			<hr />
			<label>
				[[qanda:admin.form.label.only_allow_following]]
			</label>
			<!-- BEGIN categories -->
			<div class="checkbox">
				<label>
					<input type="checkbox" name="defaultCid_{../cid}">
					{../name}
				</label>
			</div>
			<!-- END categories -->
		</div>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('question-and-answer', $('.question-and-answer-settings'));

		$('#save').on('click', function() {
			Settings.save('question-and-answer', $('.question-and-answer-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'question-and-answer-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>
