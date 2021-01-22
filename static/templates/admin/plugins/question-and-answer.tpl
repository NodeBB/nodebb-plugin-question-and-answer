<form role="form" class="question-and-answer-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12
                settings-header">[[qanda:admin.form.general_settings]]</div>
		<div class="col-sm-10 col-xs-12">

			<div class="checkbox">
				<label>
					<input type="checkbox" name="toggleLock">
					[[qanda:admin.form.label.toggle_lock]]
				</label>
			</div>
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
			<div class="all-categories">
			</div>
		</div>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>