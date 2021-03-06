window.feish = new Object();
feish.lib = new Object();

feish.config = new Object();
feish.config.DEFAULT = new Object();
feish.config.DEFAULT.user = 'guest';
feish.config.DEFAULT.host = 'guest';
feish.config.user =  feish.config.DEFAULT.user;
feish.config.host =  feish.config.DEFAULT.host;
feish.config.path =  '~';
feish.config.end =  '$ ';
feish.config.variable = new Object();

feish.server = new Object();
feish.server.ws = false;
//feish.server.host = "ws://" + location.hostname + "/socket";
feish.server.host = "ws://localhost/socket";
feish.server.init = function() {
	try {
		feish.server.ws = new WebSocket(feish.server.host);
	} catch(e) {
		feish.server.error_handle();
	}
	feish.server.ws.onopen  = feish.server.open_handle;
	feish.server.ws.onerror = feish.server.error_handle;
	feish.server.ws.onclose = feish.server.error_handle;
}
feish.server.open_handle = function() {
	$("#status_show").attr('class', 'good');
	$("#status_show").text('Connected');
}
feish.server.error_handle = function() {
	$("#status_show").attr('class', 'bad');
	$("#status_show").text('Connecting');
	/*
	if (feish.server.ws.readyState != feish.server.ws.CLOSING || feish.server.ws.readyState != feish.server.ws.CLOSED) {
		feish.server.ws.close();
	}
	setTimeout("feish.server.init();", 10000);*/
}
feish.server.post = function(data, callback) {
	feish.server.ws.onmessage = function(event) {
		callback(event.data);
	}
	feish.server.ws.send(data);
}
feish.server.opened = function() {
	return feish.server.ws.readyState == feish.server.ws.OPEN;
}

feish.screen = new Object();
feish.screen.document    = false;
feish.screen.body        = false;
feish.screen.output      = false;
feish.screen.input       = false;
feish.screen.prompt      = false;
feish.screen.input_field = false;
feish.screen.init = function() {
	feish.screen.document    = $('document');
	feish.screen.body        = $('body');
	feish.screen.output      = $('#output');
	feish.screen.input       = $('#input');
	feish.screen.prompt      = $('#prompt');
	feish.screen.input_field = $('#input_field');
	feish.screen.input_field.keyup(feish.keyboard.keyup_handle);
	feish.screen.body.focus(feish.screen.focus_input);
	feish.screen.body.click(feish.screen.focus_input);
	//feish.screen.body.keydown(feish.keyboard.keydown_handle);
}
feish.screen.print = function(text) {
	feish.screen.output.append($("<div></div>").html(text));
}
feish.screen.println = function(text) {
	feish.screen.print(text + "<br/>");
}
feish.screen.error = function(text){
	feish.screen.print("<span class='error'>Error: </span>" + text);
}
feish.screen.less = function(text){
	return "<span class='less'>" + text + "</span>";
}
feish.screen.info = function(text){
	return "<span class='info'>" + text + "</span>";
}
feish.screen.show_input = function() {
	feish.screen.update_prompt();
	feish.screen.input_field.val('');
	feish.screen.input.attr('class', 'show');
	feish.screen.input_field.focus();
}
feish.screen.hide_input = function() {
	feish.screen.input.attr('class', 'hide');
}
feish.screen.focus_input = function() {
	var txt = "";
	if (document.selection) {
		txt = document.selection.createRange().text;
	} else if (window.getSelection) {
		txt = window.getSelection().toString();
	}
	if (txt.length == 0 && feish.screen.input.attr('class') != 'hide') {
		feish.screen.input_field.focus();
	}
}
feish.screen.update_prompt = function() {
	feish.screen.prompt.text(feish.config.user + '@' + feish.config.host + ':' + feish.config.path + feish.config.end);
}
feish.screen.scroll = function(){
	window.scrollBy(0, $(document).height());
}

feish.keyboard = new Object();
feish.keyboard.hist = new Array();
feish.keyboard.hist_pos = 0;
feish.keyboard.hist_cache = 0;
feish.keyboard.MAP = {
	TAB:   9,
	ENTER: 13,
	UP:    38,
	DOWN:  40
};
feish.keyboard.cache_cmd = function() {
	if (feish.keyboard.hist[feish.keyboard.hist_pos]) {
		feish.keyboard.hist[feish.keyboard.hist_pos] = feish.screen.input_field.val();
	} else {
		feish.keyboard.hist_cache = feish.screen.input_field.val();
	}
}
feish.keyboard.show_cmd = function() {
	if (feish.keyboard.hist[feish.keyboard.hist_pos]) {
		feish.screen.input_field.val(feish.keyboard.hist[feish.keyboard.hist_pos]);
	} else {
		feish.screen.input_field.val(feish.keyboard.hist_cache);
	}
}
feish.keyboard.keydown_handle = function(event) {

}
feish.keyboard.keyup_handle = function(event) {
	var key_code = event.which;
	switch (key_code) {
	case feish.keyboard.MAP.UP:
		feish.keyboard.cache_cmd();
		if (--feish.keyboard.hist_pos < 0) {
			feish.keyboard.hist_pos = 0;
		}
		feish.keyboard.show_cmd();
		break;
	case feish.keyboard.MAP.DOWN:
		feish.keyboard.cache_cmd();
		if (++feish.keyboard.hist_pos > feish.keyboard.hist.length) {
			feish.keyboard.hist_pos = feish.keyboard.hist.length;
		}
		feish.keyboard.show_cmd();
		break;
	case feish.keyboard.MAP.ENTER:
		feish.executor.execute();
		break;
	default:
		break;
	}
}

feish.executor = new Object();
feish.executor.REQUEST = { COMMAND: 0, COMPLETE: 1 };
feish.executor.execute = function() {
	var cmd_text = feish.screen.input_field.val();
	feish.screen.hide_input();
	feish.keyboard.hist.push(cmd_text);
	feish.keyboard.hist_pos = feish.keyboard.hist.length;
	feish.screen.print(feish.screen.less(feish.screen.prompt.text()) +  cmd_text);

	var args = $.trim(cmd_text).split(' ');

	if (args[0] == "") {
		feish.executor.at_exit();
	} else if (feish.command[args[0]]) {
		if (feish.command[args[0]](args)) {
			feish.executor.at_exit();
		}
	} else {
		feish.command.server(args);
	}
}
feish.executor.at_exit = function() {
	feish.screen.show_input();
	feish.screen.scroll();
}

feish.command = new Object();
feish.command.clear = function(args) {
	feish.screen.output.html('');
	return true;
};
feish.command.var = function(args) {
	if (args.length > 3) {
		feish.screen.error('Too many arguments.');
	} else if (args.length < 2) {
		feish.screen.error('No argument.');
	} else if (args.length < 3) {
		feish.screen.error('No value to set.');
	} else if (args[1].match(/^[a-zA-Z$_][0-9a-zA-Z$_]*$/)) {
		feish.config.variable[args[1]] = args[2];
		feish.screen.print(args[1] + ' = ' + args[2]);
	} else {
		feish.screen.error('Invalid name ' + args[1] + '.');
	}
	return true;
}
feish.command.echo = function(args) {
	args.shift();
	feish.screen.print(args.join(' '));
	return true;
}
feish.command.hello = function(args) {
	feish.screen.print('hello ' + feish.config.user);
	return true;
}
feish.command.open = function(args) {
	args.shift();
	for (url in args) {
		if (url.indexOf("http://") == -1 && url.indexOf("https://")) {
			url = "http://"+url;
		} 
		window.open(url, '_blank', '');
	}
	return true;
}
feish.command.wait = function(args) {
	var time = Number(args[1]);
	if (typeof time != 'number') {
		feish.screen.error('need number');
		return true;
	} else {
		feish.screen.print('wait ' + time + 's');
		setTimeout('feish.executor.at_exit();', time * 1000);
		return false;
	}
}
feish.command.login = function(args) {
	var data = JSON.stringify({
		type: feish.executor.REQUEST.COMMAND,
		args: args
	});
	feish.server.post(data, function(d) {
		if (d.status == 1) {
			feish.config.user = args[1];
			feish.screen.update_prompt();
		}
		feish.screen.print(d);
		feish.executor.at_exit();
	});
	return false;
}
feish.command.logout = function(args) {
	var data = JSON.stringify({
		type: feish.executor.REQUEST.COMMAND,
		args: args
	});
	feish.server.post(data, function(d) {
		if (d.status == 1) {
			feish.config.user = feish.config.DEFAULT.user;
			feish.screen.update_prompt();
		}
		feish.screen.print(d);
		feish.executor.at_exit();
	});
	return false;
}
feish.command.calc = function(args){
	args.shift();
	var out ="";
	var exp = args.join(" ");
	var expin = exp;
	if (exp.match(/^[0-9\+\-\/\*\. \^\(\)]+$/)) {
		exp = exp.replace(/([0-9]+)\^([0-9]+)/g, "Math.pow($1,$2)");
		feish.screen.println(expin+" = "+eval(exp));
	} else {
		feish.screen.error("could not calculate that.");
	}
	feish.executor.at_exit();
	return true;
}
feish.command.server = function(args) {
	var data = JSON.stringify({
		type: feish.executor.REQUEST.COMMAND,
		args: args
	});
	if (feish.server.opened()) {
		feish.server.post(data, function(d) {
			feish.screen.print(d);
			feish.executor.at_exit();
		});
	} else {
		feish.screen.error('Server Closed');
		feish.executor.at_exit();
	}
}

feish.onload = function() {
	try {
		feish.server.init();
	} catch(e) {

	}
	feish.screen.init();
	feish.screen.update_prompt();
	feish.screen.input_field.focus();
}

$(document).ready(function() {
	feish.onload();
});
