if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.RenderAxes = function(chartData){
	var X = chartData.Axes.X;
	var Y = chartData.Axes.Y;

	var cd  = chartData;
	var cvs = cd.Canvas;//.canvas;
	var par = cd.Parent;

	var top = cvs.Top, left = cvs.Left;
	var w = cvs.width, h = cvs.height;

	// create the x, and y axis canvases
	var yc = Y.cvs = Raphael(par, 60, h);
	var xc = X.cvs = Raphael(par, w, 60);

	yc.canvas.style.position = 'absolute';
	yc.canvas.style.zIndex = 1000;
	yc.canvas.style.left  = '60px';
	yc.canvas.style.top = '0px';//(cd.Canvas.Top + 5) + 'px';

	xc.canvas.style.position = 'absolute';
	xc.canvas.style.zIndex = 1000;
	xc.canvas.style.left  = '120px';
	xc.canvas.style.top = cvs.height + 4 + 'px';

	var dx = Math.ceil(X.Max - X.Min), dy = Math.ceil(Y.Max - Y.Min);

	// create arrays to hold the tick labels
	yc.Ticks = []; xc.Ticks = [];

	yc.rect(0, Y.Min - dy * 2, yc.width, dy << 2)
	  .attr('fill', '#fff')
	  .attr('stroke-width', 0);
	xc.rect(X.Min - dx * 2, 0, dx << 2, xc.height)
	  .attr('fill', '#fff')
	  .attr('stroke-width', 0);

	var yScale = '', xScale = '', dx = X.Max - X.Min, dy = Y.Max - Y.Min;
	for(var i = Math.ceil(dy / Y.TickInterval); i--;){
		var y = Y.Min + i * Y.TickInterval;
		yScale += 'M40,' + y;
		yScale += 'l15,0';

		yc.Ticks.push({
			Ele: yc.text(0, 0, '$'+Math.ceil(y))
			       .attr('text-anchor', 'end')
			       .attr('fill', Y.TextColor),
			X: 30,
			Y: y,
			R: 0
		});

		if(i == 0){
		//	alert(y);
		}
	}
	yc.Scale = yc.path(yScale)
	             .attr('stroke', Y.LineColor);

	for(var i = Math.ceil(dx / X.TickInterval) + 1; i--;){
		var x = X.Min + i * X.TickInterval;
		xScale += 'M' + x + ',5';
		xScale += 'l0,15';

		xc.Ticks.push({
			Ele: xc.text(0, 0, Math.ceil(x)+'%')
			       .attr('text-anchor', 'end')
			       .attr('fill', Y.TextColor),
			X: x + 2,
			Y: 30,
			R: (Math.PI * 2) - Math.PI / 4
		});
	}
	xc.Scale = xc.path(xScale)
	             .attr('stroke', X.LineColor);
};