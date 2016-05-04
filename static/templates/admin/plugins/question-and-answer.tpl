<form role="form" class="question-and-answer-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">General Settings</div>
		<div class="col-sm-10 col-xs-12">
			<div class="checkbox">
				<label>
					<input type="checkbox" name="forceQuestions">
					Only allow questions to be asked (disables regular topic behaviour)
				</label>
				<p class="help-block">
					This option supercedes the one below
				</p>
			</div>
			<hr />
			<div class="checkbox">
				<label>
					<input type="checkbox" name="makeDefault">
					Change the default behaviour for new topics to be a Q&amp;A topic
				</label>
			</div>
			<div class="form-group">
				<label for="defaultCid">Limit this to a single category</label>
				<select class="form-control" id="defaultCid" name="defaultCid">
					<option value="0">N/A</option>
					<!-- BEGIN categories -->
					<option value="{../cid}">{../name}</option>
					<!-- END categories -->
				</select>
			</div>
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