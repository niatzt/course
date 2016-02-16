(function (Ω) {

	"use strict";
	var age = 0;
	var MainScreen = Ω.Screen.extend({
		speed:  5,
		bird: null,
		pipes: null,
		brain: null,
		score: 0,
		state: null,
		bg: 0,
		bgOffset: 0,
		sounds: {
			"point": new Ω.Sound("res/audio/sfx_point", 1),
			"hit": new Ω.Sound("res/audio/sfx_hit", 1)
		},
		shake: null,
		flash: null,
		m_state: {"vertical_distance": 0, "horizontal_distance": 0},
		explore: 0.00,
		action_to_perform: "do_nothing",
		resolution: 10,
		alpha_QL: 0.7,
		vertical_dist_range: [-350, 190],
		horizontal_dist_range: [0, 180],
		min_diff: 9999, 
		max_diff: -9999, 
		init: function () {
			this.reset();
			this.brain = initilizeBrain();
		},
		reset: function () {
			this.score = 0;
			var offset = Ω.env.w * 1;
			this.state = new Ω.utils.State("BORN");
			this.bird = new window.Bird(Ω.env.w * 0.24, Ω.env.h * 0.46, this);
			this.bg = Ω.utils.rand(2);
			this.bird.setColor(Ω.utils.rand(3));
			this.pipes = [
				new window.Pipe(0, "up", offset + Ω.env.w, Ω.env.h - 170, this.speed),
				new window.Pipe(0, "down", offset + Ω.env.w, - 100, this.speed),

				new window.Pipe(1, "up", offset + (Ω.env.w * 1.6), Ω.env.h - 170, this.speed),
				new window.Pipe(1, "down", offset + (Ω.env.w * 1.6), - 100, this.speed),

				new window.Pipe(2, "up", offset + (Ω.env.w * 2.2), Ω.env.h - 170, this.speed),
				new window.Pipe(2, "down", offset + (Ω.env.w * 2.2), - 100, this.speed)
			];
			this.setHeight(0);
			this.setHeight(1);
			this.setHeight(2);
		},
		tick: function () {
			this.state.tick();
			this.bird.tick();
			var valid = false;
			var reward = 0;
			switch (this.state.get()) {
				case "BORN":
					this.state.set("RUNNING");
					this.bird.state.set("CRUSING");
					break;
				case "RUNNING":
					if (this.state.first()) {
						this.bird.state.set("RUNNING");
					} 
					this.tick_RUNNING();
					valid = true;
					break;

				case "SCORE":
					//this.state.set("RUNNING");
					//this.tick_RUNNING();
					valid = true;
					break;

				case "DYING":
					this.state.set("GAMEOVER");
					// Step 2: Observe Reward R
					valid = true;
					//reward = -1000;
					break;

				case "GAMEOVER":
					if (this.state.first()) {
						if (this.score > window.game.best) {
							window.game.best = this.score;
						}
					}
					age ++;

					this.reset();
					this.state.set("BORN");
					break;
			}

			if (valid) {

				// Step 2: Observe State S'
				var horizontal_distance = 9999;
				var vertical_distance = 9999;
				var dy = 999;
				var bird_pos = 9999;
				var pipe_pos = 9999;
				var pipe2_pos = 9999;
				var pipex1 = 9999;
				var pipex2 = 9999;
				
				for (var i = 0; i < 6; i++) 
				{
					if (this.pipes[i].dir == "up" && this.pipes[i].x + this.pipes[i].w >= this.bird.x) 
					{
						var diff = (this.pipes[i].x + this.pipes[i].w - this.bird.x);
						if (horizontal_distance > diff) {
							horizontal_distance = diff;
							bird_pos = this.bird.y;
							pipe_pos = this.pipes[i].y;
						}
					}
				}

				var input_array = new Array( 3 )
				// input_array[0] = bird_pos/540;
				// input_array[1] = pipe_pos/540;
				// input_array[2] = horizontal_distance/180;
				//if (vertical_distance < 0  ) {input_array[0] = 1} 
				//	else {input_array[0] = 0}
				//if (dy < 0  ) {input_array[1] = 1} 
				//	else {input_array[1] = 0}
				input_array[0] = bird_pos;
				input_array[1] = pipe_pos;
				input_array[2] = horizontal_distance;

				// console.log("down: \t" + input_array[0]);
				// console.log("up: \t" + input_array[1]);
				// console.log("Horizontal:\t" + input_array[2]);

				var action_index = this.brain.forward(input_array);	
				var action_to_do = getActionByIndex(action_index);
				this.action_to_perform =  action_to_do;

				var reward = getReward(this);
				//console.log(reward);
				//console.log(action_to_do);
				this.brain.backward(reward);
				//console.log(this.brain.average_reward_window.get_average())
				//console.log("action performed: " + this.action_to_perform);


				//console.log("action performed: " + this.action_to_perform);

				if (this.action_to_perform == "click") {
					this.bird.performJump();
				}

			}

			if (this.shake && !this.shake.tick()) {
				this.shake = null;
			}
			if (this.flash && !this.flash.tick()) {
				this.flash = null;
			}

		},

		// printState: function () {

		// 	$("#debug").text("");
		// 	var debug_string = "";

		// 	// Vertical Distance
		// 	for (var vert_dist = 0; vert_dist < (this.vertical_dist_range[1] - this.vertical_dist_range[0])/this.resolution; vert_dist++) {
				
		// 		// Horizontal Distance
		// 		for (var hori_dist = 0; hori_dist < (this.horizontal_dist_range[1] - this.horizontal_dist_range[0])/this.resolution; hori_dist++) {
				
		// 			var debug_char = this.Q[vert_dist][hori_dist]["click"] > this.Q[vert_dist][hori_dist]["do_nothing"] ? 'c' : '-';
		// 			//$("#debug").append(debug_char);
		// 			debug_string = debug_string + debug_char;
		// 		}
		// 		debug_string = debug_string + "<br />";
		// 	}
		// 	$("#debug").append(debug_string);
		// },


		tick_RUNNING: function () {
			this.moveLand();

			this.pipes = this.pipes.filter(function (p) {
				p.tick();
				if (!p.counted && p.x < this.bird.x) {
					p.counted = true;
					this.score += 0.5;
					//this.sounds.point.play();
					this.state.set("SCORE");
				}

				if (p.reset) {
					this.setHeight(p.group);
				}
				return true;
			}, this);

			Ω.Physics.checkCollision(this.bird, this.pipes);
		},

		moveLand: function () {
			this.bgOffset -= this.speed;
			if (this.bgOffset < -Ω.env.w) {
				this.bgOffset += Ω.env.w;
			}
		},

		setHeight: function (group) {
			var h = (Math.random() * 160 | 0) + 130;
			this.pipes.filter(function (p) {
				return p.group === group;
			}).forEach(function (p) {
				p.y = p.dir == "up" ? h + 65 : h - p.h - 65;
			});
		},

		render: function (gfx) {
			var atlas = window.game.atlas;

			gfx.ctx.save();

			this.shake && this.shake.render(gfx);

			this.renderBG(gfx, atlas);

			this.renderGame(gfx, atlas);

			switch (this.state.get()) {
				case "GETREADY":
					this.renderGetReady(gfx, atlas);
					this.renderFG(gfx, atlas);
					break;
				case "GAMEOVER":
					this.renderFG(gfx, atlas);
					this.renderGameOver(gfx, atlas);
					break;
				case "RUNNING":
					this.renderRunning(gfx, atlas);
					this.renderFG(gfx, atlas);
					break;
				default:
					this.renderFG(gfx, atlas);
					break;
			}

			gfx.ctx.restore();

			this.flash && this.flash.render(gfx);

		},

		renderBG: function (gfx, atlas) {
			atlas.render(gfx, "bg_" + (this.bg === 1 ? "night" : "day"), 0, 0);
		},

		renderGame: function (gfx) {
			this.pipes.forEach(function (p) {
				p.render(gfx);
			});
			this.bird.render(gfx);
		},

		renderFG: function (gfx, atlas) {
			atlas.render(gfx, "land", this.bgOffset, gfx.h - 112);
			atlas.render(gfx, "land", Ω.env.w + this.bgOffset, gfx.h - 112);
		},

		renderRunning: function (gfx, atlas) {
			if (this.state.count < 30) {
				gfx.ctx.globalAlpha = 1 - (this.state.count / 30);
				this.renderGetReady(gfx, atlas);
				gfx.ctx.globalAlpha = 1;
			}
			this.renderScore(gfx, atlas);
		},

		renderGameOver: function (gfx, atlas) {

			var count = this.state.count,
				yOff;

			if (count > 20) {
				yOff = Math.min(5, count - 20);
				atlas.render(gfx, "text_game_over", 40, gfx.h * 0.24 + yOff);
			}

			if (count > 70) {
				yOff = Math.max(0, 330 - (count - 70) * 20);
				atlas.render(gfx, "score_panel", 24, gfx.h * 0.38 + yOff);
				var sc = this.score + "",
					right = 218;
				for (var i = 0; i < sc.length; i++) {
					atlas.render(gfx, "number_score_0" + sc[sc.length - i - 1], right - i * 16, 231 + yOff);
				}

				sc = window.game.best + "";
				for (i = 0; i < sc.length; i++) {
					atlas.render(gfx, "number_score_0" + sc[sc.length - i - 1], right - i * 16, 272 + yOff);
				}

				var medal = "";
				if (this.score >= 5) medal = "3";
				if (this.score >= 10) medal = "2";
				if (this.score >= 20) medal = "1";
				if (this.score >= 30) medal = "0";
				if (medal) {
					atlas.render(gfx, "medals_" + medal, 55, 240 + yOff);
				}
			}

			if (count > 100) {
				atlas.render(gfx, "button_play", 20, gfx.h - 172);
				atlas.render(gfx, "button_score", 152, gfx.h - 172);
			}
		},

		renderGetReady: function (gfx, atlas) {
			//atlas.render(gfx, "text_ready", 46, gfx.h * 0.285);
			//atlas.render(gfx, "tutorial", 88, gfx.h * 0.425);

			this.renderScore(gfx, atlas);
		},

		renderScore: function (gfx, atlas) {
			var sc = this.score + "";
			for (var i = 0; i < sc.length; i++) {
				atlas.render(gfx, "font_0" + (48 + parseInt(sc[i], 10)), i * 18 + 130, gfx.h * 0.16);
			}
		}
	});

	window.MainScreen = MainScreen;

}(window.Ω));

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}


function getReward(my_bird)
{
	var reward = 0;

	if( my_bird !== undefined && my_bird.state !== undefined )
	{
		var current_state = my_bird.state.get();

		//console.log(current_state);
		switch (current_state) 
		{
			//case "BORN":
			//	break;

			case "RUNNING":
				reward = 0;
				break;

			case "DYING":
				reward = -1;
				break;

			case "SCORE":
				reward = 100;
				my_bird.state.set("RUNNING");
				break;

		}
	}
	/*
	else
	{
		console.log( my_bird );
		console.log( bird );
		console.log( this );
	}
	*/
	return reward;
}

function getActionByIndex(action_index)
{
	var bird_action = "";

	if( action_index === 0 )
	{
		bird_action = "do_nothing"
	}
	else
	{
		bird_action = "click";
	}	
	return bird_action;
}

function initilizeBrain()
{
	var num_inputs = 3; // horizontal, vertical
	var num_actions = 2; // do nothing, tick
	var temporal_window = 3; // amount of temporal memory. 0 = agent lives in-the-moment :)
	var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

	// the value function network computes a value of taking any of the possible actions
	// given an input state. Here we specify one explicitly the hard way
	// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
	// to just insert simple relu hidden layers.
	var layer_defs = [];
	layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
	layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
	layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
	layer_defs.push({type:'regression', num_neurons:num_actions});

	// options for the Temporal Difference learner that trains the above net
	// by backpropping the temporal difference learning rule.
	var tdtrainer_options = {learning_rate:0.01, momentum:0.0, batch_size:64, l2_decay:0.01};

	var opt = {};
	opt.temporal_window = temporal_window;
	opt.experience_size = 30000;
	opt.start_learn_threshold = 1000;
	opt.gamma = 0.7;
	opt.learning_steps_total = 1000000;
	opt.learning_steps_burnin = 50000;
	opt.epsilon_min = 0.05;
	opt.epsilon_test_time = 0.05;
	opt.layer_defs = layer_defs;
	opt.tdtrainer_options = tdtrainer_options;

	//console.log("Restarting brain\n XXXXXXXXXXXXXXXXXXXXXXXX")
	return new deepqlearn.Brain(num_inputs, num_actions, opt);
}