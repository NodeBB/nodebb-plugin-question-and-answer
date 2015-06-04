<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Q&amp;A Settings</div>
			<div class="panel-body">
				<form role="form" class="question-and-answer-settings">
					<div class="checkbox">
						<label>
							<input type="checkbox" name="makeDefault">
							Change the default behaviour for new topics to be a Q&amp;A topic
						</label>
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

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