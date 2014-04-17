function ll(){
  this.last = this.first = null;

  var remove = function(){
    var t = this, l = t.list;
    l.first = (t == l.first ? t.next : l.first);
    l.last  = (t == l.last  ? t.prev : l.last);
    if(t.prev) t.prev.next = t.next;
    if(t.next) t.next.prev = t.prev;
    return t.value;
  };
  
  this.add = function(value){
    node = {list: this, value: value, next: null, prev: this.last, remove: remove};
    this.first = this.first ? this.first : node;
    if(this.last) this.last.next = node;
    this.last = node;
    return node;
  };
  
  this.remove = function(node){ node.remove; };
  
  return this;
}
//     ___ _     _          _   _        _                  
//    / __| |___| |__  __ _| | | |_  ___| |_ __  ___ _ _ ___
//   | (_ | / _ \ '_ \/ _` | | | ' \/ -_) | '_ \/ -_) '_(_-<
//    \___|_\___/_.__/\__,_|_| |_||_\___|_| .__/\___|_| /__/
//                                        |_|               
var rot2d = function(theta, size){
	// construct a result matrix
	var r = new Array(size);
	for(var i = size; i--; ){
		r[i] = Array
			.apply(null, new Array(r.length))
			.map(Number.prototype.valueOf,0);
	}

	var c = Math.cos(theta), s = Math.sin(theta);

	r[0][0] = c; r[1][0] = -s;
	r[0][1] = s; r[1][1] =  c;
	r[2][2] = 1;

	return r;
};
//-----------------------------------------------------------------------------
var I = function(size){
	var out = new Array(size);
	for(var i = size; i--;){
		out[i] = [];
		for(var j = 0; j < size; j++)
			out[i].push(j == i ? 1 : 0);
	}

	return out;
};
//-----------------------------------------------------------------------------
//    __  __     _   _            _    
//   |  \/  |___| |_| |_  ___  __| |___
//   | |\/| / -_)  _| ' \/ _ \/ _` (_-<
//   |_|  |_\___|\__|_||_\___/\__,_/__/
//                                     
([]).__proto__.X = function(m){
	// make sure m's row matches this's column length
	if(!(m[0] && m[0].length == this.length)) return null;
	
	// construct a result matrix
	var r = new Array(m.length);
	for(var i = r.length; i--; r[i] = new Array(this.length));

	// multiply
	for(var i = 0; i < r.length; i++){
		for(var j = 0; j < r[0].length; j++){
			r[i][j] = 0;
			for(var k = 0; k < r[0].length; r[i][j] += this[k][j] * m[i][k++]);
		}
	}

	return r;
};
//-----------------------------------------------------------------------------
([]).__proto__.translate = function(position){
	for(var i = 0; i < position.length; i++)
		this[this.length - 1][i] = position[i];
	return this;
};
//-----------------------------------------------------------------------------
([]).__proto__.serialize = function(args){
	var str = '';
	if(typeof(args) == 'string'){
		switch(args){
			case 'svg':
				str = 'M';
				for(var i = 0; i < this.length; i++){
					var col = this[i], len = col.length > 2 ? 2 : col.length;
					for(var j = 0; j < len;)
						 str += col[j].toFixed(3) + (j++ == len - 1 ? '' : ',');
					str += (i == this.length - 1 ? '' : ',');
				}
				break;
		}
	}
	return str;
};
var QuadAnim = {
	_anims: [],
	setInterval: function(callback, frequency){
		var out = -1;
		this._anims.push(out = setInterval(callback, frequency));
		return out;
	},
	clearInterval: function(id){
		this._anims.splice(this._anims.indexOf(id), 1);
		clearInterval(id);
	},
	clearAll: function(){
		while(this._anims.length){
			clearInterval(this._anims.pop());
		}
	},
	animateUntil: function(callback, conditionFunc){
		var t = this;
		var id = t.setInterval(function(){
			callback();
			if(conditionFunc()){
				t._anims.splice(t._anims.indexOf(id), 1);
				clearInterval(id);
				return;
			}
		}, 16);

		return id;
	}
};
var QuadAxes = function(id, config, dataSpace, cam){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var parentEle = document.getElementById(id);

	if(!parentEle)
		throw new UserException('Element "' + id + '" could not be located');

//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                            
	var parentHeight = function(){ return parentEle.clientHeight; };
//-----------------------------------------------------------------------------
	var parentWidth = function(){ return parentEle.clientHeight; };
//-----------------------------------------------------------------------------
	var viewWidth = function(){
		return parentEle.clientWidth - 280;
	}
//-----------------------------------------------------------------------------
	var viewHeight = function(){
		return parentEle.clientHeight - 120;
	}
//-----------------------------------------------------------------------------
	var calcDimensions = function(axis){
		var dimensions = {
			top: 0,
			left: 60,
			width: viewWidth(),
			height: viewHeight()
		}

		// determine bounds, and dimensions
		switch(axis){
			case 'x':
				dimensions.height = 60;
				dimensions.left += 60;
				dimensions.top  += parentHeight() - 116;
				break;
			case 'y':
				dimensions.width = 60;
				break;
		}

		return dimensions;
	};
//-----------------------------------------------------------------------------
	var resizeAxisElement = function(paper, dimensions){
		// set styles needed for 
		with(paper.canvas.style){
			position = 'absolute';
			zIndex = 1000;
			top = dimensions.top + 'px'; left = dimensions.left + 'px';
		}

		paper.setSize(dimensions.width, dimensions.height);
	};
//-----------------------------------------------------------------------------
	var renderScale = function(paper, tall){
		var vb = paper.canvas.viewBox.baseVal;
		var scale = '';
		var ticks = [];
		var min = tall ? vb.y : vb.x;
		var max = min + (tall ? vb.height : vb.width);
		var delta = max - min;
		var stdDev = dataSpace.standardDeviation();
		var steps = tall ? config.axes.y.tickInterval : config.axes.x.tickInterval
		var interval = delta / steps;

		if(delta != 0)
		for(var i = steps; i--;){
			var p = ((min + i * interval) - 2).toFixed(2);

			if(p < min || p >= max + interval) continue;

			if(tall){
				scale += 'M40,' + p;
				scale += 'l15,0';				
			}
			else{
				scale += 'M' + p + ',5';
				scale += 'l0,15';
			}

		}
		ticks.scalePath = paper.path(scale).attr('stroke', config.axes.colors.tick); // finally, draw the ticks
		ticks.interval = interval;
		ticks.min = min;
		ticks.max = max;
		ticks.tall = tall;
		ticks.steps = steps;

		// provides a method to clean up existing scale
		// so that the scale and text can be redrawn for new
		// bounds on this axis.
		ticks.remove = function(){
			paper.clear();
		}

		return ticks;
	}
//-----------------------------------------------------------------------------
	var createAxis = function(axis){
		// todo, set up vars that are shared between axes
		var dimensions = calcDimensions(axis);
		var min, max, dx = 0, dy = 0;
		var drawnLabels = [];

		// determine bounds, and dimensions
		switch(axis){
			case 'x':
				max = dataSpace.x.max();
				min = dataSpace.x.min();
				dx = max - min;
				break;
			case 'y':
				max = dataSpace.y.max();
				min = dataSpace.y.min();
				dy = max - min;
				break;
		}

		// create the paper, and dimension it
		var paper = Raphael(parentEle, dimensions.width, dimensions.height);
		paper.setViewBox(0, 0, dimensions.width, dimensions.height);

		var out = {
			paper: paper,
			dimensions: dimensions,
			scale: renderScale(paper, dx < dy),
			resize: function(){
				resizeAxisElement(paper, calcDimensions(axis));
			}
		};

		var redrawLabelsScaleTicks = function(){
			var scale = out.scale;
			var lineWidth = 3 / cam.zoom;
			var cos = Math.cos, sin = Math.sin;
			var scaleMatrix;
			var ts = 1.25, interval = out.scale.interval;
			var tall = out.scale.tall;
			var paperZoom = {
				off: 0, delta: 0
			};

			scaleMatrix = [
				[ts, 0, 0,],
				[0, ts, 0],
				[0,  0, 1]
			];

			switch(axis){
				case 'x':
					paperZoom.off = (-(paper.width >> 1) / cam.zoom) - cam.offset.x;
					paperZoom.delta = paper.width / cam.zoom;
					break;
				case 'y':
					paperZoom.off = (-(paper.height >> 1) / cam.zoom) - cam.offset.y;
					paperZoom.delta = paper.height / cam.zoom;
					break;
			}
			scale.scalePath.attr('stroke-width', lineWidth);

			var vb = paper.canvas.viewBox.baseVal;
			var labels = out.scale.steps;
			var unit = tall ? '$' : '%';
			var min = tall ? vb.y : vb.x;
			var max = min + (tall ? vb.height : vb.width);

			// blow away drawn labels
			while(drawnLabels.length) drawnLabels.pop().remove();
			if(labels < 20)
			for (var i = labels + 1; i--;) {
				var r = 0, x = 30, y = 30, p = ((min + i * interval) - 2);
				var frac = i / labels;

				if(!tall){
					r = -Math.PI / 8;
					x = p;
				}
				else{
					y = p;
				}
					
				if(out.scale.min > p || out.scale.max - interval < p) continue;
				var m = scaleMatrix.X(rot2d(r, 3)).translate([x, y]).serialize('svg');
				drawnLabels.push(
					paper.text(0, 0, (tall ? unit : '') + Math.ceil(frac * paperZoom.delta + paperZoom.off) + (!tall ? unit : ''))
						   .attr('font-family', QUAD_FONT)
						   .attr('font-weight', 'bold')
					       .attr('text-anchor', 'end')
					       .attr('fill', config.axes.colors.text)
					       .transform(m)
				);
			}
		};

		paper.canvas.setAttribute('preserveAspectRatio', 'none');

		resizeAxisElement(paper, dimensions);
		redrawLabelsScaleTicks();

		// register the axis to be scaled when the camera moves
		cam.onMove(redrawLabelsScaleTicks);

		return out;
	}

	var xAxis = createAxis('x');
	var yAxis = createAxis('y');

	dataSpace.onBoundsChanged(function(){
		xAxis.scale.remove(); yAxis.scale.remove();

		with(dataSpace){
			var dx = x.max() - x.min(), dy = y.max() - y.min();
			xAxis.scale = renderScale(xAxis.paper, false);
			yAxis.scale = renderScale(yAxis.paper, true);
		} 
	});

	return{
		x: xAxis, 
		y: yAxis
	}
};
var QuadBackground = function(id, config){
	var parentEle = document.getElementById(id);

	if(!parentEle)
		throw new UserException('Element "' + id + '" could not be located');

	var parentWidth  = function(){ return parentEle.clientWidth; };
	var parentHeight = function(){ return parentEle.clientHeight; };

	var paper = Raphael(
		parentEle, parentWidth(), parentHeight()
	);

	var renderPoint = function(position, color){
		//DiagText(cvs, datapoint);
		var point = paper.circle(position.x, position.y, 2);

		point.attr('fill', color)
		     .attr('stroke', '#ececfb')
		     .attr('stroke-width', '3')
		     .attr('r', 6);
	
		return point;
	};

	var render = function(){
		var hw = parentWidth() >> 1, hh = parentHeight() >> 1; 

		// white bg
		paper.rect(0, 0, parentWidth(), parentHeight())
			.attr('stroke-width', 0)
		    .attr('fill', '#fff');
		paper.canvas.style.zIndex = 0;

		// y axis title   
		paper.text(30, hh - 64, config.axes.y.title)
			.attr('fill', '#a1c800')
			.attr('font-size', 20)
			.attr('font-family', QUAD_FONT)
			.attr('font-weight', 'bold')
		    .transform('r-90');

		// x axis title
		var xTitle = paper.text(hw - 42, parentHeight() - 30, config.axes.x.title)
			.attr('fill', '#a1c800')
			.attr('font-family', QUAD_FONT)
			.attr('font-weight', 'bold')
			.attr('font-size', 20);

		// key
		var off = 125;
		paper.rect(parentWidth() - off, 0, 120, 2)
			.attr('stroke-width', 0)
		    .attr('fill', config.axes.colors.tick);
		paper.text(parentWidth() - off, 15, 'Key')
			.attr('font-size', 16)
			.attr('font-family', QUAD_FONT)
			.attr('font-weight', 'bold')
		    .attr('text-anchor', 'start');
		paper.rect(parentWidth() - off, 30, 120, 2)
			.attr('stroke-width', 0)
		    .attr('fill', config.axes.colors.tick);


		// render user defined key values
		for(var i = 0; i < config.key.length; i++){
			var keyItem = config.key[i];
			keyItem.pos = {
				x: parentWidth() - (off - 5),
				y: (i * 30) + 50
			};

			renderPoint(keyItem.pos, keyItem.color);
			paper.text(keyItem.pos.x + 20, keyItem.pos.y, keyItem.title)
				.attr('font-size', 14)
				.attr('font-family', QUAD_FONT)
				.attr('font-weight', 'bold')
			    .attr('text-anchor', 'start');
		}
	};

	render();

	paper.resize = function(){
		paper.clear();
		paper.setSize(parentWidth(), parentHeight());
		render();
	};

	return paper;
}
function QuadCamera(x, y, z){
	return {
		_onMoveListeners: new ll(),
		_onGoHomeListeners: new ll(),
		_dx: 0,
		_dy: 0,
		_lastAnimId: -1,
		lag: 4,
		offset: {
			x: x || 0, y: y || 0
		},
		zoom: z || 1,
		baseZoom: 0,
		onMove: function(callback){
			if(typeof(callback) !== 'function')
				throw new UserException(
					'A callback function must be provided'
				);

			return this._onMoveListeners.add(callback);
		},
		onGoHome: function(callback){
			if(typeof(callback) !== 'function')
				throw new UserException(
					'A callback function must be provided'
				);

			return this._onGoHomeListeners.add(callback);
		},
		emitMove: function(e){
			var node = this._onMoveListeners.first;
			while(node){
				node.value(e);
				node = node.next;
			}
		},
		emitGoHome: function(e){
			var node = this._onGoHomeListeners.first;
			while(node){
				node.value(e);
				node = node.next;
			}
		},
		move: function(x, y, z){
			var off = this.offset;
			var cam = this;

			// allow the user to ignore the zoom parameter
			if(!z) z = this.zoom;

			QuadAnim.clearInterval(cam._lastAnimId);
			cam._lastAnimId = QuadAnim.animateUntil(
				function(){
					var dx = 0, dy = 0;
					off.x += (cam._dx = dx = (-x - off.x)) / cam.lag;
					off.y += (cam._dx = dy = (-y - off.y)) / cam.lag;
					cam.zoom += (z - cam.zoom) / cam.lag;

					cam.emitMove(cam);
				},
				function(){
					var t = cam;
					return t._dx * t._dx + t._dy * t._dy < 0.01;
				}
			);
		},
		jump: function(x, y, z){
			var off = this.offset;
			var cam = this;

			// allow the user to ignore the zoom parameter
			if(!z) z = this.zoom;

			cam.zoom = z;
			off.x = -x;
			off.y = -y;

			cam.emitMove(cam);
		},
		goHome: function(viewPaper, dataSpace, callback){
			if(callback) callback();
			this.emitGoHome(this);
		},
		updateBaseZoom: function(viewPaper, dataSpace){
			var a = Math.abs, dMax, dMin, tall = false;
			var qw = viewPaper.width >> 2;
			var qh = viewPaper.height >> 2;
			var median = dataSpace.median();
			var std = dataSpace.standardDeviation();

			if(std.x > std.y){
				dMax = a(median.x - dataSpace.x.max());
				dMin = a(median.x - dataSpace.x.min());
			}
			else{
				tall = true;
				dMax = a(median.y - dataSpace.y.max());
				dMin = a(median.y - dataSpace.y.min());			
			}

			var divisior = tall ? qh : qw;

			if(dMax * dMin == 0) return 1; // avoid div by 0
			return (this.baseZoom = divisior / (dMin < dMax ? dMin : dMax)); 
		}
	};
}
function aprFls(){
	return (new Date()).getDate()==1 && (new Date()).getMonth()==3;
}
var QUAD_FONT = !aprFls() ? 'Open Sans' : 'Comic Sans MS';

var QuadChart = function(id, config){
	if(!typeof(id)==='string' || !config){
		throw new UserException(
			'Must provide non null configuration object and vaild element id.'
		);
	}
	var viewCamera = QuadCamera(0, 0, 1);
	var data = QuadData(config);
	var view = QuadView(id, config, data, viewCamera);


	data.onBoundsChanged(function(){
		var m = data.median();
		console.log('bounds changed');
		view.setOrigin([m.x, m.y]);
		viewCamera.goHome(view.paper, data);
	});

	// construct the chart object, with references to
	// all it's consitituent objects
	var chart = {
		data: data,
		background: QuadBackground(id, config),
		axes: QuadAxes(id, config, data, viewCamera),
		view: view,
		camera: viewCamera,
		resize: function(){
			this.background.resize();
			this.axes.x.resize();
			this.axes.y.resize();
			this.view.resize();
		}
	};

	return chart;
}
var QuadData = function(config, onBoundsChanged){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var _onRenderCallbacks = new ll(), _onBoundsChangedCallbacks = new ll();
	var dataSpace = new SpatialTable(5);
	var allData = [];
	var hoods = [];
	var hoodRadius = config.hoodRadius;
	var mean = {x: 0, y: 0};
	var median = {x: 0, y: 0};
	var standardDeviation = {x: 0, y: 0};
//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                            
	var floatingAvg = function(iBar, n, jBar, k){
		return (iBar * n) / (n + k) + (jBar * k) / (n + k);
	};
//-----------------------------------------------------------------------------
	var floatingStdDev = function(iStdDev, n, jVar, k, mean){
		var iVar = iStdDev * iStdDev;
		return Math.sqrt((iVar * n) / (n + k) + (jVar * k) / (n + k));
	}
//-----------------------------------------------------------------------------
	var onRender = function(points, hoods){
		var node = _onRenderCallbacks.first;
		while(node){
			node.value(points, hoods);
			node = node.next;
		}
	}
//-----------------------------------------------------------------------------
	var onBoundsChanged = function(){
		var node = _onBoundsChangedCallbacks.first;
		while(node){
			node.value();
			node = node.next;
		}
	};
//-----------------------------------------------------------------------------
	var updateMean = function(data, newDataAvg, removing){
		// NOTE: for this to work for additions and removal, the length
		// of the removed data must be negated
		var oldLen = allData.length;
		var changeLen = removing ? -data.length : data.length;

		mean.x = floatingAvg(mean.x, oldLen, newDataAvg.x, changeLen);
		mean.y = floatingAvg(mean.y, oldLen, newDataAvg.y, changeLen);
	};
//-----------------------------------------------------------------------------
	var updateStdDev = function(data, newDataVar, removing){
		var oldLen = allData.length;
		var changeLen = removing ? -data.length : data.length;
		var stddev = standardDeviation;

		stddev.x = floatingStdDev(stddev.x, oldLen, newDataVar.x, changeLen);
		stddev.y = floatingStdDev(stddev.y, oldLen, newDataVar.y, changeLen);
	};
//-----------------------------------------------------------------------------
	var createNewHood = function(di){
		// Create a new hood if the datapoint does not
		// belong to one.
		if(!di.Neighborhood || di.Neighborhood < 0){
			var newHood = [di];
			// functions used for calculating the average
			// center of a neighborhood
			newHood.X = function(){
				var sum = 0;
				for(var n = this.length; n--; sum += this[n].X);
				return (sum / this.length);
			};
			newHood.Y = function(){
				var sum = 0;
				for(var n = this.length; n--; sum += this[n].Y);
				return (sum / this.length);
			};
			newHood.R = function(x, y){
				var max_dx = 0, max_dy = 0;
				for(var n = this.length; n--;){
					var dx = Math.abs(this[n].X - x), dy = Math.abs(this[n].Y - y);
					max_dx = dx > max_dx ? dx : max_dx;
					max_dy = dy > max_dy ? dy : max_dy;
				}

				return Math.sqrt(max_dx * max_dx + max_dy * max_dy);
			};
			newHood.Index = di.Neighborhood = hoods.push(newHood) - 1;
		}
	};
//-----------------------------------------------------------------------------
	var matchExisting = function(nearBy, di){
		var threshhold = Math.pow(hoodRadius, 2);

		// create a hood for this data point, or
		// match it up with an existing hood
		var hood = hoods[di.Neighborhood];
		for(var j = 0; j < nearBy.length; j++){
			var dj = nearBy[j];
			if(dj.Neighborhood == di.Neighborhood) continue;
			var dx = dj.X - hood.X(), dy = dj.Y - hood.Y();

			if(dx * dx + dy * dy <= threshhold){
				if(dj.Neighborhood > -1){
					// this data point is already part of a hood
					// join that one instead
					while(hood.length){
						// move any neighbors to the new hood
						var n = hood.pop();
						n.Neighborhood = dj.Neighborhood;
						hoods[dj.Neighborhood].push(n);
					}
					// remove the hood that was created for di we don't
					// need it anymore.
					hoods.pop();
					hood = hoods[di.Neighborhood];
				}
				else{	
					dj.Neighborhood = di.Neighborhood;
					hood.push(dj);
				}
			}
		}

		return hood;
	};
//-----------------------------------------------------------------------------
	var extractNeighbors = function(newData){
		// try to pair the new elements up with a neighborhood
		var hoodsToRender = [];
		for(var i = newData.length; i--;){
			var di = newData[i];

			createNewHood(di);

			// query for any nearby datapoints
			var nearBy = dataSpace.Get(
				{x: di.X, y: di.Y},
				hoodRadius
			);

			var before = di.Neighborhood;
			// if(di.Serial == "AT83F01269"){
			// 	console.log('Something is about to go wrong');
			// }
			var hood = matchExisting(nearBy, di);
			// if(!hood){
			// 	console.log('Something is pretty wrong');
			// }

			// unmark if no neighbors were found
			if(hood.length <= 1){
				di.Neighborhood = -1;
				hoods.pop(); // get rid of the empty hood
			}
			else
				hoodsToRender.push(hood);
		}

		return hoodsToRender;
	}
//-----------------------------------------------------------------------------
//    ___       _           __              _   _             
//   |   \ __ _| |_ __ _   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   | |) / _` |  _/ _` | |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |___/\__,_|\__\__,_| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                                                            
	var add = function(data){
		// make sure that the data provided is not null. If it isn't, make sure
		// it's an array, or convert it if it's not already.
		if(!data) return;
		data = (typeof(data.length) != 'undefined' ? data : [data]);
		var newDataAvg = {
			x: 0, y: 0
		};
		var newDataStdDev = {
			x: 0, y: 0
		};
		var boundsChanged = false;

		// add all the data points to the space
		for(var i = data.length; i--;){
			// add the value to the space. invoke the change event if 
			// the space was expanded through the addition of this point.
			dataSpace.Insert(
				{x: data[i].X, y: data[i].Y},
				data[i],
				function(){ boundsChanged = true; }
			);

			newDataAvg.x += data[i].X;
			newDataAvg.y += data[i].Y;
		}

		// average for the new data set
		newDataAvg.x /= data.length;
		newDataAvg.y /= data.length;

		updateMean(data, newDataAvg, false);

		// calculated the variance from the newly updated mean
		var variance = QuadStats.variance(data, mean);
		updateStdDev(data, variance, false);

		// sort the data, by X and Y. Keep the median of both
		allData = allData.concat(data).sort(function(a, b){
			return a.X - b.X;
		});
		median.x = allData[allData.length >> 1].X;
		median.y = allData.sort(function(a, b){
			return a.Y - b.Y;
		})[allData.length >> 1].Y;

		// draw the new points and hoods
		onRender(data, /*extractNeighbors(data)*/[]);

		// kick off bounds changed event
		if(boundsChanged) onBoundsChanged();
	};
//-----------------------------------------------------------------------------
	var getSingular = function(point, tolerance, key){
		var results = dataSpace.Get(point, tolerance);
		
		if(results.length > 1){
			var nearest = -1, minDist = 0;

			for(var i = results.length; i--;){
				var dx = Math.abs(results[i].X - point.x);
				var dy = Math.abs(results[i].Y - point.y);
				var dist = Math.sqrt(dx * dx - dy * dy);

				if(key == results[i].Serial){
					return results[i];					
				}
				else if(nearest < 0 || dist < minDist){
					minDist = dist;
					nearest = i;
				}
			}

			if(nearest >= 0 && minDist <= tolerance){
				return results[i];
			}
		}

		return results[0];
	};
//-----------------------------------------------------------------------------
	var remove = function(data){

	};
//-----------------------------------------------------------------------------
	var clear = function(){
		// blow away all data and remove the datapoints
		while(allData.length){
			allData.pop().viewable.remove();
		}

		// blow away all entries in the space table
		while(dataSpace.length){
			dataSpace.pop();
		}
	};
//-----------------------------------------------------------------------------
	add(config.data);

	return {
		add: add,
		remove: remove,
		getSingle: getSingular,
		clear: clear,
		onRender: function(callback){ return _onRenderCallbacks.add(callback); },
		onBoundsChanged: function(callback){ return _onBoundsChangedCallbacks.add(callback); },
		x: {
			max: function(){ return dataSpace.Max.x; },
			min: function(){ return dataSpace.Min.x; }
		},
		y: {
			max: function(){ return dataSpace.Max.y; },
			min: function(){ return dataSpace.Min.y; }
		},
		mean: function(){ return mean; },
		median: function(){ return median; },
		standardDeviation: function(){ return standardDeviation; },
		allData:  function(){ return allData; },
		allHoods: function(){ return hoods; }
	};
}
var QUAD_LAST_INFOBOX = null;
var QUAD_LAST_POINT = null;
var QUAD_LAST_POINT_GO_HOME = null;

var QuadDataPoint = function(point, paper, quadrants, cam){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var info = [];
	var onGoHomeNode = null;
//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
// 
	var pointInfoBox = function(){
		info.hide = function(){
			while(info.length){
				info.pop().remove();
			}
			return info;
		}

		info.show = function(){
			var x = 0, y = 0, s = 5 / cam.zoom;
			var tri = 'M'+x+','+y+'l-2,4l,4,0';
			x -= 50;
			y += 4;

			if(QUAD_LAST_INFOBOX){
				QUAD_LAST_INFOBOX.hide();
			}

			var rectangle = 'M' + x + ',' + y + 'm0,5' +
			                'c0,-5,0,-5,5,-5 l85,0 c5,0,5,0,5,5' + 
			                'l0,10' + 
			                'c0,5,0,5,-5,5 l-85,0 c-5,0,-5,0,-5,-5' +
			                'l0,-10';

			info.push(paper.path(tri + rectangle + 'Z')
			             .attr('fill', '#000')
             		     .attr('font-family', QUAD_FONT)
			             .attr('font-weight', 'bold')
			             .attr('opacity', 0.5)
			             .transform('M' + s + ',0, 0,' + s + ',' + point.X + ',' + point.Y)
			);

			info.push(paper.text(x + 2, y + 3, 'Asset Serial # ' + point.Serial)
			             .attr('fill', '#fff')
             		     .attr('font-family', QUAD_FONT)
			             .attr('text-anchor', 'start')
			             .attr('font-weight', 'bold')
			             .attr('font-size', '4px')
			             .transform('M' + s + ',0, 0,' + s + ',' + point.X + ',' + point.Y)
			);

			info.push(paper.text(x + 2, y + 10, 'Utilization     ' + Math.ceil(point.X) + '%')
			             .attr('fill', '#fff')
             		     .attr('font-family', QUAD_FONT)
			             .attr('text-anchor', 'start')
			             .attr('font-weight', 'normal')
			             .attr('font-size', '3px')
			             .transform('M' + s + ',0, 0,' + s + ',' + point.X + ',' + point.Y)
			);

			info.push(paper.text(x + 2, y + 15, 'Cost per hour    $' + Math.ceil(point.Y))
			             .attr('fill', '#fff')
             		     .attr('font-family', QUAD_FONT)
			             .attr('text-anchor', 'start')
			             .attr('font-weight', 'normal')
			             .attr('font-size', '3px')
			             .transform('M' + s + ',0, 0,' + s + ',' + point.X + ',' + point.Y)
			);

			x += 55;

			QUAD_LAST_INFOBOX = info;
		}

		return info;
	};
//-----------------------------------------------------------------------------
	var inQuadrant = function(point){
		for(var i = quadrants.length; i--;){
			var q = quadrants[i];

			var x = q.attrs.x, y = q.attrs.y;
			var w = q.attrs.width, h = q.attrs.height;

			if(point[0] >= x && point[0] < x + w &&
			   point[1] >= y && point[1] < y + h)
				return i;
		}

		return -1;
	}
//-----------------------------------------------------------------------------
	var focus = function(){
		QUAD_LAST_POINT = this;
		info.show();
		cam.jump(point.X, point.Y);
	};
//-----------------------------------------------------------------------------
	var quadIndex = inQuadrant([point.X, point.Y]);
	var infoBox = pointInfoBox();

	point.scaledPos = { 
		x: point.NormX * paper.width,
		y: point.NormY * paper.height
	};

	var element = paper.circle(point.X.toFixed(2), point.Y.toFixed(2), 6 / cam.baseZoom);

	element.attr('fill', quadrants.colors.dataFill[quadIndex])
	element.attr('stroke', '#ececfb')
	element.attr('stroke-width', 3)
	element.click(focus);

	// register one handler for hiding the info box
	if(!QUAD_LAST_POINT_GO_HOME)
	QUAD_LAST_POINT_GO_HOME = cam.onGoHome(function(){
		if(QUAD_LAST_INFOBOX)
		QUAD_LAST_INFOBOX.hide();
	});
//-----------------------------------------------------------------------------
//    ___      _    _ _       __              _   _             
//   | _ \_  _| |__| (_)__   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ || | '_ \ | / _| |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_|  \_,_|_.__/_|_\__| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                                                              
	var remove = function(){
		info.hide();
		element.remove();

		// remove this node's goHome instance from the handler
		//onGoHomeNode.remove();
	};
//-----------------------------------------------------------------------------
	var reassign = function(){
		var quadIndex = inQuadrant([point.X, point.Y]);
		if(!element)
			console.log('Oh no...');
		element.attr('fill', quadrants.colors.dataFill[quadIndex]);

		return quadIndex;
	};
//-----------------------------------------------------------------------------
	// add a reference to the original datum to
	// the drawable bits that represent it
	point.viewable = {
		infoBox: infoBox,
		element: element,
		remove: remove,
		reassign: reassign
	};

	return point.viewable;
}
var QUAD_LAST_HOOD;

var QuadHood = function(hood, paper, quadrants, cam){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var X, Y, R;
	var onGoHomeNode;

//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / - \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
// 
	var inQuadrant = function(hood){
		var quadIndex = -2;

		for(var j = hood.length; j--;){
			var point = [hood[j].X, hood[j].Y];
			for(var i = quadrants.length; i--;){
				var q = quadrants[i];

				var x = q.attrs.x, y = q.attrs.y;
				var w = q.attrs.width, h = q.attrs.height;

				if(point[0] >= x && point[0] < x + w &&
				   point[1] >= y && point[1] < y + h)
					if(quadIndex == -2 || quadIndex == i)
						quadIndex = i;
					else
						return -1;
			}			
		}
		return quadIndex;
	}
//-----------------------------------------------------------------------------
	var unfocus = function(){
		if(!QUAD_LAST_HOOD) return;
		
		for(var i = 0; i < QUAD_LAST_HOOD.elements.length; i++){
			QUAD_LAST_HOOD.elements[i]
				.attr('opacity', 1.0)
				.toFront();
		}

		QUAD_LAST_HOOD = null;
	};
//-----------------------------------------------------------------------------
	var focus = function(){

		unfocus();
		QUAD_LAST_HOOD = hood;
		var opacity = 1.0;

		QuadAnim.animateUntil(function(){
			for(var i = hood.elements.length; i--;){
				hood.elements[i].attr('opacity', opacity -= 0.05);
			}
		},
		function(){
			if(opacity < 0.1){
				for(var i = hood.elements.length; i--;){
					hood.elements[i]
						.attr('opacity', 0)
						.toBack();
				}
				return true;
			}
			return false;
		});

		cam.jump(X, Y, 30 / R);
	};
//-----------------------------------------------------------------------------
	var drawGroup = function(quadIndex){
		var fillColor = quadIndex >= 0 ? quadrants.colors.dataFill[quadIndex] : '#bbbbbb';
		var element = null;

		// calculate the center and radius of the group.
		X = hood.X(); Y = hood.Y(); R = Math.floor(hood.R(X, Y) + 3);

		// drawGroupShape as an outlier if all points do not reside in one specific quadrant
		if(quadIndex < 0){
			element = paper.rect(X - R, Y - R, R << 1, R << 1);
		}
		else{
			element = paper.circle(X, Y, R);
		}

		element.attr('fill', fillColor)
			.attr('stroke', '#ececfb')
			.attr('stroke-width', '3')
			.attr('opacity', 1.0)
			.click(focus);

		var number = paper.text(X, Y, hood.length + '')
			.attr('stroke', '#ffffff')
			.attr('stroke-width', '1')
			.attr('fill', '#ffffff')
			.attr('font-size', (R > 20 ? 20 : R) + 'px')
			.toFront()
			.click(focus);

		return [element, number];
	}
//-----------------------------------------------------------------------------
	var quadIndex = inQuadrant(hood);

	// The hood had already been built, remove the old elements
	// so that we can redraw it at a more up to date size
	if(hood.elements && hood.elements.length > 0){
		while(hood.elements.length){
			hood.elements.pop().remove();
		}
	}

	onGoHomeNode = cam.onGoHome(unfocus);
	hood.elements = drawGroup(quadIndex);

//-----------------------------------------------------------------------------
//    ___      _    _ _       __              _   _             
//   | _ \_  _| |__| (_)__   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ || | '_ \ | / _| |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_|  \_,_|_.__/_|_\__| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                                                              

	hood.remove = function(){
		for(var i = hood.elements.length; i--;){
			hood.elements[i].remove();
		}

		// unregister this node from the goHome event
		onGoHomeNode.remove();
	};
//-----------------------------------------------------------------------------
	hood.reassign = function(){
		var quadIndex = inQuadrant(hood);
		
		for(var i = hood.elements.length; i--;){
			hood.elements[i].remove();
		}

		hood.elements = drawGroup(quadIndex);
	};

	return hood;
}
var QuadStats = {
	mean: function(data){
		var avg = {x: 0, y: 0};
		for(var i = data.length; i--;){
			avg.x += data[i].X;
			avg.y += data[i].Y;
		}

		return {x: avg.x / data.length, y: avg.y / data.length};
	},
	variance: function(data, mean){
		var variance = {
			x: 0, y: 0
		};

		for(var i = data.length; i--;){
			var dx = data[i].X - mean.x;
			var dy = data[i].Y - mean.y;
			variance.x += dx * dx;
			variance.y += dy * dy;
		}

		variance.x /= data.length;
		variance.y /= data.length;

		return variance;
	}
};
var QuadView = function(id, config, dataSpace, cam){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var parentEle = document.getElementById(id);
	var quadrants = [];
	var origin = [0,0];
	var quadrantPopulations = [
		0, 0, 0, 0
	];

	if(!parentEle)
		throw new UserException('Element "' + id + '" could not be located');

	var parentHeight = function(){ return parentEle.clientHeight; };
	var parentWidth = function(){ return parentEle.clientWidth; };
	var viewWidth = function(){
		return parentEle.clientWidth - 280;
	}
	var viewHeight = function(){
		return parentEle.clientHeight - 120;
	}

	var paper = Raphael(
		parentEle, parentWidth() - 280, parentHeight() - 120
	);
	paper.canvas.setAttribute('preserveAspectRatio', 'none');
	var cvs = paper.canvas;

//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                            
//-----------------------------------------------------------------------------
	var goHome = function(){
		cam.goHome(paper, dataSpace);
	};
//-----------------------------------------------------------------------------
	var renderQuadrantBackgrounds = function(){
		// position and style the view's paper
		paper.Top = viewHeight(); paper.Left = viewWidth();
		cvs.style.position = 'absolute';
		cvs.style.top = '0px';
		cvs.style.left = '120px';
		cvs.style.zIndex = 1000;
		cvs.style.borderBottom = cvs.style.borderLeft =  '5px solid ' + config.axes.colors.tick;

		// center at 0
		var cx = 0, cy = 0;
		var width = 55000, height = 3300;

		// create the rectangles for all the quadrants
		quadrants.push(paper.rect(-width + cx, -height + cy, width, height));
		quadrants.push(paper.rect(cx, -height + cy, width, height));
		quadrants.push(paper.rect(cx, cy, width, height));
		quadrants.push(paper.rect(-width + cx, cy, width, height));

		// style quadrants, and wire up click events
		for(var i = 4; i--;){
			quadrants[i].attr('fill', config.quadrants.colors.background[i])
			            .attr('stroke', '#ececfb')
			            .attr('stroke-width', 5)
			            .click(goHome);
		}

		var hw = viewWidth() << 4, hh = viewHeight() << 4;
		quadrants[0].title = paper.text(0, 0, config.quadrants.title[0])
		   .click(goHome)
		   .attr('font-family', QUAD_FONT)
		   .attr('font-weight', 'bold')
		   .attr('text-anchor', 'end')
		   .attr('fill', config.quadrants.colors.text[0]);
		quadrants[1].title = paper.text(0, 0, config.quadrants.title[1])
		   .click(goHome)
		   .attr('font-family', QUAD_FONT)
		   .attr('font-weight', 'bold')
		   .attr('text-anchor', 'start')
		   .attr('fill', config.quadrants.colors.text[1]);
		quadrants[2].title = paper.text(0, 0, config.quadrants.title[2])
		   .click(goHome)
		   .attr('font-family', QUAD_FONT)
		   .attr('font-weight', 'bold')
		   .attr('text-anchor', 'start')
		   .attr('fill', config.quadrants.colors.text[2]);
		quadrants[3].title = paper.text(0, 0, config.quadrants.title[3])
		   .click(goHome)
		   .attr('font-family', QUAD_FONT)
		   .attr('font-weight', 'bold')
		   .attr('text-anchor', 'end')
		   .attr('fill', config.quadrants.colors.text[3]);

		quadrants.colors = config.quadrants.colors;
	}
//-----------------------------------------------------------------------------
	var render = function(points, hoods){
		if(!cam.baseZoom) cam.updateBaseZoom(paper, dataSpace);

		for(var i = points.length; i--;){
			QuadDataPoint(points[i], paper, quadrants, cam);
		}

		for(var i = hoods.length; i--;){
			QuadHood(hoods[i], paper, quadrants, cam);
		}
	};
//-----------------------------------------------------------------------------
	var viewChanged = function(camera){
		paper.setViewBox(
			(-(paper.width >> 1) / camera.zoom) - camera.offset.x,
			(-(paper.height >> 1) / camera.zoom) - camera.offset.y,
			paper.width / camera.zoom,
			paper.height / camera.zoom,
			false
		);

		var center = {
			x: paper.canvas.viewBox.baseVal.x + (paper.canvas.viewBox.baseVal.width >> 1),
			y: paper.canvas.viewBox.baseVal.y + (paper.canvas.viewBox.baseVal.height >> 1)
		};

		for (var i = quadrants.length; i--;) {
			var x, y, padding = 60;

// 0  |  1
//---------
// 3  |  2

			switch(i){
				case 0: // relocate
					x = center.x > origin[0] - padding ? origin[0] - padding : center.x;
					y = center.y > origin[1] - padding ? origin[1] - padding : center.y;
					break;
				case 1: // retain
					x = center.x < origin[0] + padding ? origin[0] + padding : center.x;
					y = center.y > origin[1] - padding ? origin[1] - padding : center.y;
					break;
				case 2: // replace
					x = center.x < origin[0] + padding ? origin[0] + padding : center.x;
					y = center.y < origin[1] + padding ? origin[1] + padding : center.y;
					break;
				case 3:
					x = (center.x > origin[0] - padding) ? origin[0] - padding : center.x;
					y = center.y < origin[1] + padding ? origin[1] + padding : center.y;
					break;
			}

			quadrants[i].title.transform(I(3).translate([x, y]).serialize('svg'));
		};
	};
//-----------------------------------------------------------------------------
	var setOrigin = function(point){
		var hw = viewWidth() >> 4, hh = viewHeight() >> 4;
		var cx = point[0], cy = point[1];

		var offsets = {
			quad: [
			[-parentWidth() + cx, -parentHeight() + cy],
			[cx, -parentHeight() + cy],
			[cx, cy],
			[-parentWidth() + cx, cy]
			],
			text: [
				[-hw + cx, -hh + cy],
				[ hw + cx, -hh + cy],
				[ hw + cx,  hh + cy],
				[ -hw + cx, hh + cy]
			]
		};

		for(var i = 4; i--;){
			quadrants[i].attr({
				x: offsets.quad[i][0], y: offsets.quad[i][1],
				width: parentWidth(), height: parentHeight()
			});
		}

		// re assign all the hoods and datapoints
		// update the quadrantPopulations
		// TODO refactor this into an event on the quadData / dataSpace object
		var data = dataSpace.allData();
		quadrantPopulations = [0, 0, 0, 0];
		origin = [cx, cy];
		for(var i = data.length; i--;){
			++quadrantPopulations[data[i].viewable.reassign()];
		}

		var hoods = dataSpace.allHoods();
		for(var i = hoods.length; i--;){
			hoods[i].reassign();
		}
	};
//-----------------------------------------------------------------------------

	renderQuadrantBackgrounds();
	cam.onMove(viewChanged);
	cam.onGoHome(function(){
		if(!cam.baseZoom) cam.updateBaseZoom(paper, dataSpace);
		cam.jump(origin[0], origin[1], cam.baseZoom);
	});
	dataSpace.onRender(render);

	return {
		paper: paper,
		setOrigin: setOrigin,
		getOrigin: function(){ return origin; },
		quadrantPopulations: function(){
			return quadrantPopulations;
		},
		resize: function(){
			this.paper.setSize(viewWidth(), viewHeight());
		}
	};
};
function SpatialTable(cellSize){
        var t = this;
	t.Max = {x: null, y: null};
	t.Min = {x: null, y: null};

        (1).__proto__.near = function(n, bias){
                return Math.abs(this - n) <= bias;
        };

        var hash = function(point){
                var x = Math.floor(point.x / cellSize);
                var y = Math.floor(point.y / cellSize);

                return x + '-' + y;             
        }       

        t.Insert = function(point, value, onBoundsChanged){
                var key = hash(point);
                var cell = (t[key] = t[key] || []);
		var boundsChanged = false;

		// update the min and max bounds of the
		// occupied area.
		if(t.Max.x == null || point.x > t.Max.x){ t.Max.x = point.x; boundsChanged = true; }
		if(t.Max.y == null || point.y > t.Max.y){ t.Max.y = point.y; boundsChanged = true; }
		if(t.Min.x == null || point.x < t.Min.x){ t.Min.x = point.x; boundsChanged = true; }
		if(t.Min.y == null || point.y < t.Min.y){ t.Min.y = point.y; boundsChanged = true; }

		if(boundsChanged) onBoundsChanged();

                cell.push(value);
                value.SpaceKey = key; // added for easy deletion
        }

        t.Get = function(point, radius){
                var values = [];
        
                var circleX   = Math.floor(point.x / cellSize);
                var circleY   = Math.floor(point.y / cellSize);
                var circleRad = Math.ceil(radius / cellSize);
                var radSqr = circleRad * circleRad;

                for(var i = circleX - circleRad; i < circleX + circleRad; i++)
                for(var j = circleY - circleRad; j < circleY + circleRad; j++){
                        // skip if this coord is outside of the query circle's
                        // radius
                        var dx = i - circleX, dy = j - circleY;
                        if(dx * dx + dy * dy > radSqr)
                                continue;               

                        var cell = t[i + '-' + j];      
                        if(cell){
                                values = values.concat(cell);
                        }
                }               

                return values;
        }

        // arg can be either a point, or a value inserted into the
        // data structure
        t.Remove = function(arg){
                if(arg.SpaceKey){
                        var bucket = t[arg.SpaceKey];
                        var i = bucket.indexOf(arg);
                        if(i>=0) bucket = bucket.splice(i, 1);
                }
                else{
                        var key = hash(arg);
                        t[key] = [];
                }
        }
}


