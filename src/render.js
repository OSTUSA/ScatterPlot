if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.DetermineBaseZoom = function(chart){
        var axes  = chart.Axes;
        var cvs   = chart.Canvas;
        var v     = chart.View;

        var w, h;
        var dw = w = Math.abs(axes.X.Max - axes.X.Min); dw = dw < cvs.width ? cvs.width   : dw;
        var dh = h = Math.abs(axes.Y.Max - axes.Y.Min); dh = dh < cvs.height ? cvs.height : dh;

        var cx = (axes.X.Max + axes.X.Min) / 2;
        var cy = (axes.Y.Max + axes.Y.Min) / 2;

        var sf = w > h ? w : h;

        if(Math.abs(w - dw) < Math.abs(h - dh)){
                v.BaseZoom = cvs.width / (sf + 30);
        }
        else{
                v.BaseZoom = cvs.height / (sf + 30);
        } v.Zoom = v.BaseZoom;

	v.Xoffset = cx;
	v.Yoffset = cy;
};

QuadChart.UpdateQuadrants = function(chart){
        var axes  = chart.Axes;
        var cvs   = chart.Canvas;
        var v     = chart.View;
	var delta = chart.Props.Quadrants.Delta;
        QuadChart.DetermineBaseZoom(chart);

	if(delta)
	for(var i = chart.Props.Quadrants.length; i--;){
		var quad = chart.Props.Quadrants[i];
		var tstring = 'T' + delta.x + ',' + delta.y;
		var tsOut = quad.q.transform(tstring);
	}
};

QuadChart.RenderChart = function(chart){
	// some raphael init/assignment
	var cvs = document.getElementById(chart.Description.Chart.renderTo);
	if(!cvs){
		err('Specified target element not found');
		return null;
	}
	chart.Parent = cvs;	

	chart.ClearInfoBox = function(){
		if(chart.InfoBox.length){
			while(chart.InfoBox.length)
				chart.InfoBox.pop().remove();
		}
	};

	var rx = 0, ry = 0;
	var par = chart.Parent;
	var raphCvs = chart.Canvas = Raphael(
		par,
		rx = (par.clientWidth  - 280),
		ry = (par.clientHeight - 120)
	);
	raphCvs.Top = ry; raphCvs.Left = rx;
	raphCvs.canvas.style.position = 'absolute';
	raphCvs.canvas.style.top = '0px';//-cvs.clientHeight + 'px';
	raphCvs.canvas.style.left = '120px';

	// create the background axes titles
	var border = 5;
	var bg = QuadChart.RenderBackground(par, chart, border);


	raphCvs.canvas.style.borderBottom = border + 'px solid ' + chart.Axes.X.LineColor;
	raphCvs.canvas.style.borderLeft = border + 'px solid ' + chart.Axes.Y.LineColor;
	par.Cvs = raphCvs;

	var props = chart.Props;
	var axes  = chart.Axes;
	var cvs   = chart.Canvas;
	var v     = chart.View;	

	var w, h;
	var dw = w = Math.abs(axes.X.Max - axes.X.Min); dw = dw < raphCvs.width ? raphCvs.width   : dw;
	var dh = h = Math.abs(axes.Y.Max - axes.Y.Min); dh = dh < raphCvs.height ? raphCvs.height : dh;

	var cx = (axes.X.Max + axes.X.Min) / 2;
	var cy = (axes.Y.Max + axes.Y.Min) / 2;

	QuadChart.DetermineBaseZoom(chart);

	var w = (dw >> 1), 
	    h = (dh >> 1);

	// render quadrands
	props.Quadrants[0].q = raphCvs.rect(-w + cx, -h + cy, w, h);
	props.Quadrants[1].q = raphCvs.rect(cx, -h + cy, w, h);
	props.Quadrants[2].q = raphCvs.rect(cx, cy, w, h);
	props.Quadrants[3].q = raphCvs.rect(-w + cx, cy, w, h);

	for(var i = 4; i--;){
		props.Quadrants[i].q
		.attr('fill', props.Quadrants[i].Color)
		.attr('stroke', props.Border.Color)
		.attr('stroke-width', props.Border.Thickness)
		.click(function(){chart.ClearInfoBox();chart.goHome();});
	}

	var hw = w >> 3, hh = h >> 3;
	raphCvs.text(-hw + cx, -hh + cy, props.Quadrants[0].Text)
	   .click(chart.goHome)
	   .attr('font-family', 'arial')
	   .attr('fill', props.Quadrants[0].TextColor);
	raphCvs.text(hw + cx, -hh + cy, props.Quadrants[1].Text)
	   .click(chart.goHome)
	   .attr('font-family', 'arial')
	   .attr('fill', props.Quadrants[1].TextColor);
	raphCvs.text(hw + cx, hh + cy, props.Quadrants[2].Text)
	   .click(chart.goHome)
	   .attr('font-family', 'arial')
	   .attr('fill', props.Quadrants[2].TextColor);
	raphCvs.text(-hw + cx, hh + cy, props.Quadrants[3].Text)
	   .click(chart.goHome)
	   .attr('font-family', 'arial')
	   .attr('fill', props.Quadrants[3].TextColor);
	// render chart axes
	QuadChart.RenderAxes(chart);

	// render neighborhoods
	//QuadChart.RenderNeighborhoods(chart);	

	// render lone data points
	//QuadChart.RenderDatapoints(chart);


	v.Update();

};
