if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.RenderBackground = function(cvs, cd, border){
		var back = Raphael(
			cvs,
			cvs.clientWidth,
			cvs.clientHeight
		);
		//back.style.position = 'absolute';

		// white bg
		back.rect(0, 0,
			cvs.clientWidth,
			cvs.clientHeight)
			.attr('stroke-width', 0)
		    .attr('fill', '#fff');
		back.canvas.style.zIndex = 0;

		// y axis title   
		back.text(30, cvs.clientHeight >> 1, cd.Axes.Y.Title)
    		.attr('fill', '#a1c800')
    		.attr('font-size', 20)
		    .transform('r-90');

		// x axis title
		back.text((cvs.clientWidth >> 1), cvs.clientHeight - 30, cd.Axes.X.Title)
    		.attr('fill', '#a1c800')
    		.attr('font-size', 20);

    	// key
    	var off = 125;
    	back.rect(cvs.clientWidth - off, 0, 120, 2)
    		.attr('stroke-width', 0)
    	    .attr('fill', cd.Axes.X.LineColor);
    	back.text(cvs.clientWidth - off, 15, 'Key')
    		.attr('font-size', 16)
    	    .attr('text-anchor', 'start');
    	back.rect(cvs.clientWidth - off, 30, 120, 2)
    		.attr('stroke-width', 0)
    	    .attr('fill', cd.Axes.X.LineColor);

    	back.rect(cvs.clientWidth - (off + 1), 44, 12, 12)
			.attr('fill', '#bbbbbb')
        	.attr('stroke', '#ececfb')
			.attr('stroke-width', '3');
		back.text(cvs.clientWidth - (off - 25), 50, 'Outlying')
				.attr('font-size', 14)
			    .attr('text-anchor', 'start');	
		for(var i = cd.Props.Quadrants.length; i--;){
			var q = cd.Props.Quadrants[i];
			var pos = {X:cvs.clientWidth - (off - 5),Y:(i*30) + 80};
			q.RenderPoint(back, pos).attr('r', 6);
			back.text(pos.X + 20, pos.Y, cd.Props.Quadrants[i].Text)
				.attr('font-size', 14)
			    .attr('text-anchor', 'start');

		}

		return back;
};
