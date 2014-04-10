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