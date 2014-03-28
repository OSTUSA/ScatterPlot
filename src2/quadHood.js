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
//    ___      _    _ _       __              _   _             
//   | _ \_  _| |__| (_)__   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ || | '_ \ | / _| |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_|  \_,_|_.__/_|_\__| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                                                              

//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / - \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
// 
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

		cam.move(X, Y, 30 / R);
	};
//-----------------------------------------------------------------------------
	var quadIndex = inQuadrant([X = hood.X(), Y = hood.Y()]);

	// The hood had already been built, remove the old elements
	// so that we can redraw it at a more up to date size
	if(hood.elements && hood.elements.length > 0){
		while(hood.elements.length){
			hood.elements.pop().remove();
		}
	}

	var element = paper.circle(X, Y, (R = Math.floor(hood.R(X, Y) + 3)))
		.attr('fill', quadrants.colors.dataFill[quadIndex])
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

	onGoHomeNode = cam.onGoHome(unfocus);
	hood.elements = [element, number];
	hood.remove = function(){
		for(var i = hood.elements.length; i--;){
			hood.elements[i].remove();
		}

		// unregister this node from the goHome event
		onGoHomeNode.remove();
	};

	return hood;
}