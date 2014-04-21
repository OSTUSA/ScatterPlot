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
			             .click(function(){
			             	window.location ='/asset/' + point.Id + '/summary';
			             })
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

			if(q.within(point))
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
		if(!element || quadIndex < 0)
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