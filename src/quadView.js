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
		quadrants[0].title = paper.text(-hw + cx, -hh + cy, config.quadrants.title[0])
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', config.quadrants.colors.text[0]);
		quadrants[1].title = paper.text(hw + cx, -hh + cy, config.quadrants.title[1])
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', config.quadrants.colors.text[1]);
		quadrants[2].title = paper.text(hw + cx, hh + cy, config.quadrants.title[2])
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', config.quadrants.colors.text[2]);
		quadrants[3].title = paper.text(-hw + cx, hh + cy, config.quadrants.title[3])
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', config.quadrants.colors.text[3]);

		quadrants.colors = config.quadrants.colors;
	}
//-----------------------------------------------------------------------------
	var render = function(points, hoods){
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
			quadrants[i].title.attr({
				x: offsets.text[i][0], y: offsets.text[i][1]
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
		var qw = paper.width >> 2;
		var qh = paper.height >> 2;
		var std = dataSpace.standardDeviation();
		var median = dataSpace.median();

		var calculateZoom = function(){
			var a = Math.abs, dMax, dMin, tall = false;

			if(std.x > std.y){
				dMax = a(median.X - dataSpace.x.max());
				dMin = a(median.X - dataSpace.x.min());
			}
			else{
				tall = true;
				dMax = a(median.Y - dataSpace.y.max());
				dMin = a(median.Y - dataSpace.y.min());			
			}

			return { isTall: tall, value: dMin < dMax ? dMin : dMax }; 
		};

		var zoom;
		with(calculateZoom()){
			zoom = isTall ? qh / value : qw / value;
		}
		cam.jump(origin[0], origin[1], zoom);
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