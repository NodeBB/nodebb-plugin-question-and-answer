"use strict";

var plugin = {};

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;

	app.get('/admin/plugins/q&a', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/q&a', renderAdmin);

	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/q&a',
		icon: 'fa-question-circle',
		name: 'Q&A'
	});

	callback(null, header);
};


function renderAdmin(req, res, next) {
	res.render('admin/plugins/q&a', {});
}

module.exports = plugin;