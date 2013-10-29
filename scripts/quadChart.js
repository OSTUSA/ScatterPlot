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
			var speed = chart.Props.AnimationSpeed;
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
if(typeof(QuadChart) == 'undefined') QuadChart = {};

QuadChart.RemoveDataPoint = function(chart, di){
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();
	var hood    = di.Neighborhood >= 0 ? chart.GetHoods()[di.Neighborhood] : null;
	
	// remove the datapoint SVG element
	di.Element.remove();

	// remove the datapoint from the set
	dataSet.shift(dataSet.indexOf(di));

	// remove the datapoint from the hood
	if(hood){
		hood.shift(hood.indexOf(di));
		
		// if that was the second data item in the array,	
		if(hood.length <= 1){
			// 'delete' the hood from the hoods array
			delete chart.GetHoods()[di.Neighborhood];
			hood[0].Neighborhood = -1;
			QuadChart.SetDataPointClickEvents(chart, hood[0]);
			
			// clean up any SVG elements that were
			// associated with this hood
			for(var k in hood.Elements){
				hood.Elements[k].remove();
			}	
		}
		else{
			QuadChart.RenderNeighborhood(chart, hood);
		}
	}
};

QuadChart.AddDataPoints = function(chart, newData){
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();
	var hoods   = chart.GetHoods();
	var threshhold = Math.pow(chart.Props.HoodRadius, 2);

	// append new data to old
	if(newData)
		dataSet = dataSet.concat(newData);
	else
		newData = dataSet;

	// insert new datapoints into the space table
	for(var i = newData.length; i--;){
		var di = newData[i];
		space.Insert(
			{x: di.X, y: di.Y},
			di,
			function(){
				// TODO re-render the axes
				// TODO adjust zoom and stuff
				QuadChart.DetermineBaseZoom(chart);
				QuadChart.RenderAxes(chart);
				//`alert('yeah');
				//chart.View.Update();
				var mean = chart.Props.Quadrants.GetMean(chart);
				var delta = chart.Props.Quadrants.Delta;
				console.log('Mean X', mean.x, 'Mean Y', mean.y);
				console.log('dx', delta.x, 'dy', delta.y);
				QuadChart.UpdateQuadrants(chart);
				chart.goHome();
			}
		);
	}

	// try to pair the new elements up with a neighborhood
	var hoodsToRender = [];
	for(var i = newData.length; i--;){
		var di = newData[i];

		// Create a new hood if, the datapoint does not
		// belong to one.
		if(di.Neighborhood < 0){
			var newHood = [di];
			// functions used for calculating the average
			// center of a neighborhood
			newHood.X = function(){
				var sum = 0;
				for(var n = this.length; n--; sum += this[n].X);
				return (sum / this.length);
			};
			newHood.Y = function(){
				var sum = 0;
				for(var n = this.length; n--; sum += this[n].Y);
				return (sum / this.length);
			};
			newHood.Index = di.Neighborhood = hoods.push(newHood) - 1;
		}

		// query for any nearby datapoints
		var nearBy = space.Get(
			{x: di.X, y: di.Y},
			chart.Props.HoodRadius
		);

		// create a hood for this data point, or
		// match it up with an existing hood
		var hood = hoods[di.Neighborhood];
		for(var j = 0; j < nearBy.length; j++){
			var dj = nearBy[j];
			if(dj.Neighborhood == di.Neighborhood) continue;
			var dx = dj.X - hood.X(), dy = dj.Y - hood.Y();

			if(dx * dx + dy * dy <= threshhold){
				if(dj.Neighborhood > -1){
					// this data point is already part of a hood
					// join that one instead
					while(hood.length){
						// move any neighbors to the new hood
						var n = hood.pop();
						n.Neighborhood = dj.Neighborhood;
						hoods[dj.Neighborhood].push(n);
					}
					//hoods.splice(hoods.indexOf(hoods[hoodId]), 1);
					hood = hoods[di.Neighborhood];
				}
				else{	
					dj.Neighborhood = di.Neighborhood
					hood.push(dj);
				}
			}
		}

		// unmark if no neighbors were found
		if(hood.length <= 1){
			di.Neighborhood = -1;
			hoods.pop(); // get rid of the empty hood
		}
		else
			hoodsToRender.push(hood);

		// render each data point as it's added
		QuadChart.RenderDatapoint(chart, di);
	}

	// render all the hoods that have been marked
	while(hoodsToRender.length){
		QuadChart.RenderNeighborhood(chart, hoodsToRender.pop());
	}

	// Dynamically resize the axes
	QuadChart.DetermineAxesScales(chart);

	chart.SetDataSet(dataSet);
};
QuadChart.DetermineNeighborhoods = function(chart){
	var hoods   = chart.GetHoods() || [];
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();

	QuadChart.AddDataPoints(chart, null);
	return hoods;
};
if(typeof(QuadChart) == 'undefined') QuadChart = {};

QuadChart.DetermineAxesScales = function(chart){
	var space = chart.GetSpace();
	chart.Axes.X.Min = space.Min.x; chart.Axes.X.Max = space.Max.x;
	chart.Axes.Y.Min = space.Min.y; chart.Axes.Y.Max = space.Max.y;
};

QuadChart.Chart = function(description){
	var chart = this;

	chart.SelectedHood = null;
	chart.InfoBox = [];
	chart.Anims = [];
	chart.Description = description;
	chart.Axes = {};
	chart.View = {};
	
	chart.Data = {
		Hoods: [],
		DataSet: description.Chart.dataSet,
		SpaceTable: new SpatialTable(5)
	}

	// Data Getters
	chart.GetHoods   = function()  { return chart.Data.Hoods; };
	chart.GetDataSet = function()  { return chart.Data.DataSet; };
	chart.SetDataSet = function(ds){ chart.Data.DataSet = ds };
	chart.GetSpace   = function()  { return chart.Data.SpaceTable; };


	var desc = description, doc = document;
	var err = function(str){ console.log('Error: ' + str); };

	if(!desc){
		err('Chart description is null.');
		return null;	
	}

	// build begin initializing the chart
	if(!desc.Chart){
		err('Chart input object is null.');
		return null;
	}
	else{
		// margins, borders and other properties
		chart.Props = {
			Border: {
				Thickness: desc.Chart.borderWidth || 1,
				Color:     desc.Chart.borderColor || '#000'
			},
			Margins: {
				Left:   desc.Chart.marginLeft || 16,
				Right:  desc.Chart.marginRight || 16,
				Top:    desc.Chart.marginTop || 16,
				Bottom: desc.Chart.marginBottom || 16	
			},
			Quadrants: [],
			HoodRadius: 7,
			AnimationSpeed: 2.5
		};

		// populate the quadrants array
		for(var i = 4; i--;){
			chart.Props.Quadrants.push(desc.Chart.Quadrants[i] || {
				Color: '#' + (i).toString() + (i + 1).toString() + (i << 1).toString(),
				Text: '',
				RenderPoint: function(){},
				RenderGroup: function(){}
			});
		}

		chart.Props.Quadrants.GetMean = function(chart){
			var data = chart.GetDataSet();
			var mean = { x: 0, y: 0 };
			var last = chart.Props.Quadrants.LastMean || {x:0,y:0};
			
			for(var i = data.length; i--;){
				mean.x += data[i].X;
				mean.y += data[i].Y;
			}
			mean.x /= data.length;
			mean.y /= data.length;

			chart.Props.Quadrants.Delta = { x: mean.x - last.x, y: mean.y - last.y };
			chart.Props.Quadrants.LastMean = mean;

			return mean;
		};

		// setup axes
		if(!desc.Chart.xAxes || !desc.Chart.yAxes){
			err('Axes are null');
			return null;
		}
		chart.Axes = {
			X: {	
				Title:       desc.Chart.xAxes.title || {Text: 'X', Rotation: 0},
				Min:         desc.Chart.xAxes.min || 0,
				Max:         desc.Chart.xAxes.max || 100,
				LineColor:   desc.Chart.xAxes.lineColor || '#000',
				TextColor:   desc.Chart.xAxes.textColor || '#000',
				TickInterval:desc.Chart.xAxes.tickInterval || 20,
				TickLength:  desc.Chart.xAxes.tickLength || 3 			
			},
			Y: {

				Title:       desc.Chart.yAxes.title || {Text: 'Y', Rotation: 90},
				Min:         desc.Chart.yAxes.min || 0,
				Max:         desc.Chart.yAxes.max || 100,
				LineColor:   desc.Chart.yAxes.lineColor || '#000',
				TextColor:   desc.Chart.yAxes.textColor || '#000',
				TickInterval:desc.Chart.yAxes.tickInterval || 20,
				TickLength:  desc.Chart.yAxes.tickLength || 3 			
			}
		};

		// create view
		var view = chart.View = {
			Xoffset: 0,
			Yoffset: 0,
			BaseZoom: 1,
			Zoom: 3,
			Update: function(){
				var cd = chart, cvs = cd.Canvas;
				var X = cd.Axes.X, Y = cd.Axes.Y;
				var sin = Math.sin, cos = Math.cos;
				var s = 2 / (this.Zoom);
				var matrix = function(data){
					var s = '';
					for(var ei = data.length; ei--;){
						s = (ei == 0 ? 'M' : ',') + data[ei] + s;
					}
					return s;
				}

				cvs.setViewBox(cd.X(0, cvs), cd.Y(0, cvs), cd.S(cvs.width), cd.S(cvs.height), false);
				Y.cvs.setViewBox(0, cd.Y(0, Y.cvs), Y.cvs.width, cd.S(Y.cvs.height), false);
				X.cvs.setViewBox(cd.X(0, X.cvs), 0, cd.S(X.cvs.width), X.cvs.height, false);
			
				for(var i = Y.cvs.Ticks.length; i--;){
					var t = Y.cvs.Ticks[i], r = t.R;
					var m = matrix([cos(r), s * sin(r), -sin(r), s * cos(r), t.X, t.Y]);

					t.Ele.transform(m);
				}
				X.cvs.Scale.attr('stroke-width', 2 / this.Zoom);

				for(var i = X.cvs.Ticks.length; i--;){
					var t = X.cvs.Ticks[i], r = t.R;// += 0.01;
					var m = matrix([s * cos(r), sin(r), -s * sin(r), cos(r), t.X, t.Y]);

					t.Ele.transform(m);
				}
				Y.cvs.Scale.attr('stroke-width', 2 / this.Zoom);

			}
		};
		// setup some view-dependent coordinate calculation functions
		chart.X = function(x, c){
			var cv = c || cvs;
			var dx = (x - view.Xoffset);
			return (-(cv.width >> 1) / view.Zoom) - dx;	
		};
		chart.Y = function(y, c){
			var cv = c || cvs;
			var dy = (y - view.Yoffset);
			return (-(cv.height >> 1) / view.Zoom) - dy;	
		};
		chart.S = function(s){
			return s / view.Zoom;
		}	

		// Create SVG elements
		QuadChart.RenderChart(chart);

		// register animation handlers a
		QuadChart.SetupAnimation(chart);

		// determine neighborhoods
		var hoods = chart.GetHoods();
		hoods = QuadChart.DetermineNeighborhoods(chart);


		// Dynamically determine axes
		QuadChart.DetermineAxesScales(chart);


	}
};
if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.RenderAxes = function(chartData){
	var X = chartData.Axes.X;
	var Y = chartData.Axes.Y;

	var cd  = chartData;
	var cvs = cd.Canvas;//.canvas;
	var par = cd.Parent;

	var top = cvs.Top, left = cvs.Left;
	var w = cvs.width, h = cvs.height;

	if(X.cvs){
		X.cvs.remove();
		Y.cvs.remove();
	}

	// create the x, and y axis canvases
	var yc = Y.cvs = Raphael(par, 60, h);
	var xc = X.cvs = Raphael(par, w, 60);

	yc.canvas.style.position = 'absolute';
	yc.canvas.style.zIndex = 1000;
	yc.canvas.style.left  = '60px';
	yc.canvas.style.top = '0px';

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
if(typeof(QuadChart) == 'undefined') QuadChart = {};
Raphael.el.unbindall = function(){
	if(this.events)
	while(this.events.length){
		//this.unclick(this.events.pop());
		this.events.pop().unbind();
	}
};

QuadChart.SetDataPointClickEvents = function(chart, di){
	var cd = chart;
	var cvs = cd.Canvas;
	var props = cd.Props;
	var v = cd.View;
	var Hoods = cd.GetHoods();
	var ele = di.Element;
	
	if(!ele) return;
	ele.unbindall();
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
if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.RenderNeighborhood = function(chart, hood){
	var cd = chart;
	var props = cd.Props;
	var axes  = cd.Axes;
	var cvs   = cd.Canvas;
	var hoods = cd.GetHoods();
	var v     = cd.View;

	var len = hood.length;
	var di = hood[0];
	var cx = hood.X(), cy = hood.Y(), Mx, My;
	if(!di || !len) return;
	Mx = di.X; My = di.Y;

	// clean up existing elements
	for(var k in hood.Elements){
		var e = hood.Elements[k];
		e.remove();
	}

	// determine the center
	//for(var j = len; j--;){
	//	var n = hood[j];
	//	cx += n.X; cy += n.Y;
	//} cx /= len; cy /= len;

	// determine the radius
	var DX = function(n){return Math.abs(n - cx);};
	var DY = function(n){return Math.abs(n - cy);}; 
	for(var j = len; j--;){
		var n = hood[j];

		Mx = DX(n.X) > DX(Mx) ? n.X : Mx;
		My = DY(n.Y) > DY(My) ? n.Y : My;
	}
	var dx = Mx - cx, dy = My - cy;
	hood.Radius = Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 2;
	hood.Radius = hood.Radius < 5 ? 5: hood.Radius;
	hood.Opacity = 1.0;
	hood.AnimID = -1;

	hood.Focus = function(hood){
		// stop any running animation
		chart.Anims.ClearAll();

		var x = hood.X(), y = hood.Y(), speed = chart.Props.AnimationSpeed;
		var oldHood = chart.SelectedHood;

		if(oldHood)
			oldHood.Unfocus(oldHood);

		var id = hood.AnimID = chart.Anims.setInterval(function(){
			// perform the panning calculations
			var dx = 0, dy = 0, r = hood.Radius, zoom = r <= 2 ? 3 : (r > 10 ? 10 : r) + v.BaseZoom;
			
			v.Xoffset += (dx = (x - v.Xoffset)) / speed;
			v.Yoffset += (dy = (y - v.Yoffset)) / speed;

			// smooth interpolation for zoom
			v.Zoom += (zoom - v.Zoom) / speed;

			// update the camera
			v.Update();

			// Update the opacity of the datapoints and hood
			hood.Opacity += (0 - hood.Opacity) / speed;
			QuadChart.UpdateNeighborhoodFocus(hood);

			// end animation when the opacity is near the target
			if(hood.Opacity < 0.001){
				console.log('Translate done ' + Math.random());
				clearInterval(id);
				hood.AnimID = -1;
			}
		}, 16);
		hood.Elements.Shape[0].style.pointerEvents = 'visible';
		hood.Elements.Text[0].style.pointerEvents  = 'visible';
	};
	hood.Unfocus = function(hood){
		chart.ClearInfoBox();
		var speed = chart.Props.AnimationSpeed;
		// stop any running animation
		// if(hood.AnimID > 0)
		// 	clearInterval(hood.AnimID);

		var oldFadeID = hood.AnimID = setInterval(function(){
			// Update the opacity of the datapoints and hood
			hood.Opacity += (1 - hood.Opacity) / speed;
			QuadChart.UpdateNeighborhoodFocus(hood);

			if(hood.Opacity > 0.99){
				console.log('Fade ended ' + Math.random());
				clearInterval(oldFadeID);
				hood.AnimID = -1;
			}
		}, 16);
	};

	if(props && props.Quadrants)
	for(var j = props.Quadrants.length; j--;){
		if(!props.Quadrants[j].q.isPointInside(cx, cy)) continue;

		hood.Quadrant = props.Quadrants[j].q;
		var grp = props.Quadrants[j].RenderGroup(cvs, hood);
		var zoom = 12 - hood.length;

		// create the click event function
		var click = function(e){
			var hood = this.Hood;
			var oldHood = chart.SelectedHood;
			chart.ClearInfoBox();

			if(oldHood)
				oldHood.Unfocus(oldHood);
			
			if(oldHood != hood){
				hood.Focus(hood);
				chart.SelectedHood = hood;
			}	
			else
				chart.goHome();
		};

		// assign click events
		grp.Shape.click(click); grp.Text.click(click);

		// keep references to the group position on
		// Shape and text SVG elements
		grp.Shape.X = cx; grp.Shape.Y = cy;
		grp.Text.X = cx; grp.Text.Y = cy;

		// keep references from the elements to the hood
		// and vise versa
		grp.Shape.Hood = grp.Text.Hood = hood;
		hood.Elements = {
			Shape: grp.Shape,
			Text: grp.Text
		};
	}

	for(var i = len; i--;){
		QuadChart.SetDataPointClickEvents(chart, hood[i]);
	}	
}

QuadChart.RenderNeighborhoods = function(chart){
	for(var i = hoods.length; i--;){
	}
};
function SpatialTable(cellSize){
        var t = this;
	t.Max = {x: null, y: null};
	t.Min = {x: null, y: null};

        var hash = function(point){
                var x = Math.floor(point.x / cellSize);
                var y = Math.floor(point.y / cellSize);

                return x + '-' + y;             
        }       

        t.Insert = function(point, value, onBoundsChanged){
                var key = hash(point);
                var cell = (t[key] = t[key] || []);
		var boundsChanged = false;

		// update the min and max bounds of the
		// occupied area.
		if(t.Max.x == null || point.x > t.Max.x){ t.Max.x = point.x; boundsChanged = true; }
		if(t.Max.y == null || point.y > t.Max.y){ t.Max.y = point.y; boundsChanged = true; }
		if(t.Min.x == null || point.x < t.Min.x){ t.Min.x = point.x; boundsChanged = true; }
		if(t.Min.y == null || point.y < t.Min.y){ t.Min.y = point.y; boundsChanged = true; }

		if(boundsChanged) onBoundsChanged();

                cell.push(value);
                value.SpaceKey = key; // added for easy deletion
        }

        t.Get = function(point, radius){
                var values = [];
        
                var circleX   = Math.floor(point.x / cellSize);
                var circleY   = Math.floor(point.y / cellSize);
                var circleRad = Math.ceil(radius / cellSize);
                var radSqr = circleRad * circleRad;

                for(var i = circleX - circleRad; i < circleX + circleRad; i++)
                for(var j = circleY - circleRad; j < circleY + circleRad; j++){
                        // skip if this coord is outside of the query circle's
                        // radius
                        var dx = i - circleX, dy = j - circleY;
                        if(dx * dx + dy * dy > radSqr)
                                continue;               

                        var cell = t[i + '-' + j];      
                        if(cell){
                                values = values.concat(cell);
                        }
                }               

                return values;
        }

        // arg can be either a point, or a value inserted into the
        // data structure
        t.Remove = function(arg){
                if(arg.SpaceKey){
                        var bucket = t[arg.SpaceKey];
                        var i = bucket.indexOf(arg);
                        if(i) bucket = bucket.splice(i, 1);
                }
                else{
                        var key = hash(arg);
                        t[key] = [];
                }
        }
}

