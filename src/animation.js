if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.SetupAnimation = function(chart){
	var par   = chart.Parent;
	var v     = chart.View;
	var axes  = chart.Axes;	

	// Append useful animation functions
	chart.Anims.setInterval = function(cb, dt){
		var out = -1;
		chart.Anims.push(out = setInterval(cb, dt));
		return out;
	};
	chart.Anims.ClearAll = function(){
		while(chart.Anims.length){
			var id = -1;
			clearInterval(id = chart.Anims.pop());
		}
	};

	// animation that returns the camera to the
	// center of the chart
	chart.goHome = function(){

		chart.Anims.ClearAll();

		if(chart.SelectedHood)
		chart.SelectedHood.Unfocus(chart.SelectedHood);

		var transID = chart.Anims.setInterval(function(){
			var speed = chart.AnimationSpeed;
			var dx = 0, dy = 0, x = (axes.X.Min + axes.X.Max) / 2, y = (axes.Y.Min + axes.Y.Max) / 2;
			v.Xoffset += (dx = (x - v.Xoffset)) / speed;
			v.Yoffset += (dy = (y - v.Yoffset)) / speed;
			v.Zoom    += (v.BaseZoom - v.Zoom) / speed;
			v.Update();

			if(dx * dx + dy * dy < 0.01){
				clearInterval(transID);
				chart.SelectedHood = null;
			}
		}, 16);
	}

	// register polling loop to check for window resizing
	par.LastWidth = par.clientWidth;
	par.LastHeight = par.clientHeight;
	var pid = par.id;
	setInterval(function(){
		var p = document.getElementById(pid);
		if(p.LastHeight != p.clientHeight || p.LastWidth != p.clientWidth){
			while(p.childNodes.length){
				p.removeChild(p.childNodes[0]);
			}

			p.LastWidth = p.clientWidth;
			p.LastHeight = p.clientHeight;

			QuadChart.RenderChart(chart);	
		}
	}, 100);
};

QuadChart.UpdateNeighborhoodFocus = function(hood){
	hood.Elements.Shape.attr('opacity', hood.Opacity);
	hood.Elements.Text.attr('opacity', hood.Opacity);

	for(var i = hood.length; i--;){
		var di = hood[i];
		di.Element.attr('opacity', 1 - hood.Opacity);
	}
};