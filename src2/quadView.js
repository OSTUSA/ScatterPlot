var QuadView = function(id, config, dataSpace, cam){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var parentEle = document.getElementById(id);
	var quadrants = [];

	if(!parentEle)
		throw new UserException('Element "' + id + '" could not be located');

	var parentWidth  = parentEle.clientWidth;
	var parentHeight = parentEle.clientHeight;
	var viewWidth, viewHeight;

	var paper = Raphael(
		parentEle, viewWidth = (parentWidth - 280), viewHeight = (parentHeight - 120)
	);
	var cvs = paper.canvas;

//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                            
	var goHome = function(){
		cam.goHome(paper, dataSpace);
		//var r = function(){ return (Math.random() - 0.5) * 200; };
		//cam.move(r(), r(), 8);
	};	
//-----------------------------------------------------------------------------
	var renderQuadrantBackgrounds = function(){
		// position and style the view's paper
		paper.Top = viewHeight; paper.Left = viewWidth;
		cvs.style.position = 'absolute';
		cvs.style.top = '0px';
		cvs.style.left = '120px';
		cvs.style.zIndex = 1000;
		cvs.style.borderBottom = cvs.style.borderLeft =  '5px solid ' + config.axes.colors.tick;

		// center at 0
		var cx = 0, cy = 0;

		// create the rectangles for all the quadrants
		quadrants.push(paper.rect(-parentWidth + cx, -parentHeight + cy, parentWidth, parentHeight));
		quadrants.push(paper.rect(cx, -parentHeight + cy, parentWidth, parentHeight));
		quadrants.push(paper.rect(cx, cy, parentWidth, parentHeight));
		quadrants.push(paper.rect(-parentWidth + cx, cy, parentWidth, parentHeight));

		// style quadrants, and wire up click events
		for(var i = 4; i--;){
			quadrants[i].attr('fill', config.quadrants.colors.background[i])
			            .attr('stroke', '#ececfb')
			            .attr('stroke-width', 3)
			            .click(goHome);
		}

		var hw = viewWidth >> 3, hh = viewHeight >> 3;
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
		console.log("I'm the view and I'm moving!");
	};
//-----------------------------------------------------------------------------

	renderQuadrantBackgrounds();
	cam.onMove(viewChanged);
	dataSpace.onRender(render);

	return paper;
};