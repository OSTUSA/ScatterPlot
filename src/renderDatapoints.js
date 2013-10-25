if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.SetDataPointClickEvents = function(chart, di){
	var cd = chart;
	var cvs = cd.Canvas;
	var props = cd.Props;
	var v = cd.View;
	var Hoods = cd.GetHoods();
	var ele = di.Element;	
	if(!ele) return;


	ele.toFront();
	if(di.Neighborhood >= 0){
		ele.attr('opacity', '0.0');
		ele.click(function(e){
			var x = this.X - 40, y = this.Y, di = this.di;
			var hood = this.di.Neighborhood;

			if(hood >= 0){
				var myHood = Hoods[hood];
				if(myHood.Opacity > 0.5){
					myHood.Elements.Shape.events[0].Hood = myHood;
					myHood.Elements.Shape.events[0].f(e);
					return;
				}
			}

			var info = chart.InfoBox;
			chart.ClearInfoBox();
			ele.renderInfo(cvs, v, chart.InfoBox, di);
		});
	}
	else{
		ele.click(function(){
			var x = this.X, y = this.Y, di = this.di;
			var oldHood = chart.SelectedHood;

			chart.ClearInfoBox();
			ele.renderInfo(cvs, v, chart.InfoBox, di);

			chart.Anims.ClearAll();
			if(oldHood)
				oldHood.Unfocus(oldHood);

			var transID = chart.Anims.setInterval(function(){
				var dx = 0, dy = 0;
				var speed = chart.Props.AnimationSpeed;
				v.Xoffset += (dx = (x - v.Xoffset)) / speed;
				v.Yoffset += (dy = (y - v.Yoffset)) / speed;
				v.Zoom    += (v.BaseZoom - v.Zoom) / speed;
				v.Update();


				if(dx * dx + dy * dy < 1){
					clearInterval(transID);
					chart.SelectedHood = null;
				}
			}, 16);
		});
		ele.dblclick(function(){
			var x = this.X, y = this.Y, di = this.di;
			chart.Anims.ClearAll();
			var transID = chart.Anims.setInterval(function(){
				var dx = 0, dy = 0, dz = 0;
				v.Xoffset += (dx = (x - v.Xoffset)) / speed;
				v.Yoffset += (dy = (y - v.Yoffset)) / speed;
				v.Zoom    += (dz = (10 - v.Zoom)) / speed;
				v.Update();


				if(dz < 1){
					clearInterval(transID);
					chart.SelectedHood = null;
				}
			}, 16);
		});
	}

};

QuadChart.RenderDatapoint = function(chart, di){
	var cd = chart;
	var cvs = cd.Canvas;
	var props = cd.Props;
	var v = cd.View;
	var x = di.X, y = di.Y;
	var Hoods = cd.GetHoods();

	for(var j = props.Quadrants.length; j--;){
		if(props.Quadrants[j].q.isPointInside(x, y)){
			var ele = di.Element  = props.Quadrants[j].RenderPoint(cvs, di);
			ele.toFront();
			ele.renderInfo = props.Quadrants[j].PointInfo;

			QuadChart.SetDataPointClickEvents(chart, di);

			ele.X = x; ele.Y = y; ele.InfoBox = null;
			ele.di = di;
		}
	}
};
QuadChart.RenderDatapoints = function(chart){
	var cd = chart;
	var props   = cd.Props;
	var v       = cd.View;
	var cvs     = cd.Canvas;
	var dataSet = cd.GetDataSet();

	for(var i = dataSet.length; i--;){
		var di = dataSet[i];
		QuadChart.RenderDatapoint(chart, di);
	}
};
