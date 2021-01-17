'use strict';
/* globals $, app, socket */

define('admin/plugins/question-and-answer', ['settings'], function(Settings) {
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