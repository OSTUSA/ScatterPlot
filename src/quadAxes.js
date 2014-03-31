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
	var renderScale = function(paper, min, delta, tall){
		var scale = '', unit = tall ? '$' : '%';
		var ticks = [];
		var interval = !tall ? config.axes.x.tickInterval : config.axes.y.tickInterval;
		var steps = Math.ceil(delta / interval);

		if(delta != 0)
		for(var i = steps; i--;){
			var p = Math.floor(min + i * interval) - 2;

			if(tall){
				scale += 'M40,' + p;
				scale += 'l15,0';				
			}
			else{
				scale += 'M' + p + ',5';
				scale += 'l0,15';
			}

			ticks.push({
				element: paper.text(0, 0, (tall ? unit : '') + Math.ceil(p) + (!tall ? unit : ''))
				       .attr('text-anchor', 'end')
				       .attr('fill', config.axes.colors.text),
				X: (tall ? 30 : p),
				Y: (tall ? p : 30),
				R: (tall ? 0 : -Math.PI / 8)
			});
		}
		ticks.scalePath = paper.path(scale).attr('stroke', config.axes.colors.tick); // finally, draw the ticks
		ticks.scalePath.Tag = 'scale path for ' + (tall ? 'y ' : 'x ');

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
		var out = {
			paper: paper,
			dimensions: dimensions,
			scale: renderScale(paper, min, max - min, dx < dy),
			resize: function(){
				resizeAxisElement(paper, calcDimensions(axis));
			}
		};

		resizeAxisElement(paper, dimensions);

		// register the axis to be scaled when the camera moves
		cam.onMove(function(){
			var scale = out.scale;
			var lineWidth = 3 / cam.zoom;
			var cos = Math.cos, sin = Math.sin;
			var scaleMatrix;
			var ts = 1.25;

			switch(axis){
				case 'x':
					scale.scalePath.attr('stroke-width', lineWidth);
					paper.setViewBox(
						(-(paper.width >> 1) / cam.zoom) - cam.offset.x, 0,
						paper.width / cam.zoom, paper.height
					);
					scaleMatrix = [
						[ts/cam.zoom, 0, 0,],
						[0, ts, 0],
						[0,  0, 1]
					];
					break;
				case 'y':
					paper.setViewBox(
						0, (-(paper.height >> 1) / cam.zoom) - cam.offset.y,
						paper.width, paper.height / cam.zoom
					);
					scale.scalePath.attr('stroke-width', lineWidth);
					scaleMatrix = [
						[ts, 0, 0,],
						[0, ts/cam.zoom, 0],
						[0,  0, 1]
					];
					break;
			}

			for (var i = scale.length; i--;) {
				var t = scale[i], r = t.R;
				var m = scaleMatrix.X(rot2d(t.R, 3)).translate([t.X, t.Y]).serialize('svg');
				//matrix([cos(r) * 1.25, lineWidth * sin(r) * 0.75, -sin(r) * 1.25, lineWidth * cos(r) * 0.75, t.X, t.Y]);

				t.element.transform(m);
			}
		});

		return out;
	}

	var xAxis = createAxis('x');
	var yAxis = createAxis('y');

	dataSpace.onBoundsChanged(function(){
		xAxis.scale.remove(); yAxis.scale.remove();

		with(dataSpace){
			var dx = x.max() - x.min(), dy = y.max() - y.min();
			xAxis.scale = renderScale(xAxis.paper, x.min(), dx, false);
			yAxis.scale = renderScale(yAxis.paper, y.min(), dy, true);
		} 
	});

	return{
		x: xAxis, 
		y: yAxis
	}
};