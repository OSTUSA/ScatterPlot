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
	var renderScale = function(paper, min, max, tall){
		var scale = '';
		var ticks = [];
		var delta = max - min;
		var stdDev = dataSpace.standardDeviation();
		var interval = !tall ? config.axes.x.tickInterval / stdDev.x :
		                       config.axes.y.tickInterval / stdDev.y;
		var steps = Math.ceil(delta / interval);

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
		var out = {
			paper: paper,
			dimensions: dimensions,
			scale: renderScale(paper, min, max, dx < dy),
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

			switch(axis){
				case 'x':
					paper.setViewBox(
						paperZoom.off = (-(paper.width >> 1) / cam.zoom) - cam.offset.x, 0,
						paperZoom.delta = paper.width / cam.zoom, paper.height
					);
					scaleMatrix = [
						[ts/cam.zoom, 0, 0,],
						[0, ts, 0],
						[0,  0, 1]
					];
					break;
				case 'y':
					paper.setViewBox(
						0, paperZoom.off = (-(paper.height >> 1) / cam.zoom) - cam.offset.y,
						paper.width, paperZoom.delta = paper.height / cam.zoom
					);
					scaleMatrix = [
						[ts, 0, 0,],
						[0, ts/cam.zoom, 0],
						[0,  0, 1]
					];
					break;
			}
			scale.scalePath.attr('stroke-width', lineWidth);


			var topLblIndex    = Math.ceil((paperZoom.off + paperZoom.delta) / interval);
			var bottomLblIndex = Math.ceil(paperZoom.off / interval);
			var offsetMin = bottomLblIndex * interval;
			var labels = topLblIndex - bottomLblIndex;
			var unit = tall ? '$' : '%';
			var min = tall ? paper.canvas.viewBox.baseVal.y : paper.canvas.viewBox.baseVal.x;
			var max = min + (tall ? paper.canvas.viewBox.baseVal.height : paper.canvas.viewBox.baseVal.width);

			min = (~~(min / interval) + 1) * interval;
			max = (~~(max / interval) + 1) * interval;

			// blow away drawn lables
			while(drawnLabels.length) drawnLabels.pop().remove();
			if(labels < 20)
			for (var i = labels + 1; i--;) {
				var r = 0, x = 30, y = 30, p = ((min + i * interval) - 2);

				if(!tall){
					r = -Math.PI / 8;
					x = p;
				}
				else{
					y = p;
				}
					
				if(out.scale.min > p || out.scale.max < p) continue;

				var m = scaleMatrix.X(rot2d(r, 3)).translate([x, y]).serialize('svg');
				drawnLabels.push(
					paper.text(0, 0, (tall ? unit : '') + Math.ceil(p) + (!tall ? unit : ''))
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
			xAxis.scale = renderScale(xAxis.paper, x.min(), dx, false);
			yAxis.scale = renderScale(yAxis.paper, y.min(), dy, true);
		} 
	});

	return{
		x: xAxis, 
		y: yAxis
	}
};