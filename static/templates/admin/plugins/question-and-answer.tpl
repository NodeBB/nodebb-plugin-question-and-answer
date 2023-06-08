<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<form role="form" class="question-and-answer-settings">
				<div class="row">
					<div class="col-12">

						<div class="form-check">
							<label class="form-check-label">[[qanda:admin.form.label.toggle_lock]]</label>
							<input class="form-check-input" type="checkbox" name="toggleLock">
						</div>

						<div class="form-check">
							<label class="form-check-label">[[qanda:admin.form.label.only_allow_admins]]</label>
							<input class="form-check-input" type="checkbox" name="onlyAdmins">
						</div>

						<div class="form-check">
							<label class="form-check-label">[[qanda:admin.form.label.only_allow_all]]</label>
							<input class="form-check-input" type="checkbox" name="forceQuestions">
							<p class="form-text">
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
		</div>
	</div>
</div>

