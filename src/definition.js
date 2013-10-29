if(typeof(QuadChart) == 'undefined') QuadChart = {};

QuadChart.DetermineAxesScales = function(chart){
/*	
		var mx, Mx, my, My;
		var dataSet = chart.GetDataSet();
		mx = Mx = dataSet[0].X;
		my = My = dataSet[0].Y;
		for(var i = dataSet.length; i--;){
			var di = dataSet[i];
			mx = di.X < mx ? di.X : mx;
			Mx = di.X > Mx ? di.X : Mx;
			my = di.Y < my ? di.Y : my;
			My = di.Y > My ? di.Y : My;
		}
*/
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
	chart.GetHoods   = function(){ return chart.Data.Hoods; };
	chart.GetDataSet = function(){ return chart.Data.DataSet; };
	chart.GetSpace   = function(){ return chart.Data.SpaceTable; };


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
