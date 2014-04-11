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