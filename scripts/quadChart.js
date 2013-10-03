var QuadChart = {
	SelectedHood: null,
	Hoods: [],
	InfoBox: [],
	Anims: [],
	Chart: function(description){
		var chart = {}, desc = description, doc = document;
		var err = function(str){ console.log('Error: ' + str); };

		QuadChart.Anims.setInterval = function(cb, dt){
			var out = -1;
			QuadChart.Anims.push(out = setInterval(cb, dt));
			return out;
		};
		QuadChart.Anims.ClearAll = function(){
			while(QuadChart.Anims.length){
				var id = -1;
				clearInterval(id = QuadChart.Anims.pop());
			}
		};

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
			// margins and borders
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
				Quadrants: []
			};

			chart.DataSet = desc.Chart.dataSet;
	
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

			var view = chart.View = {
				Xoffset: 0,
				Yoffset: 0,
				Zoom: 3,
				Update: function(){
					var cd = chart, cvs = cd.Canvas;
					var X = cd.Axes.X, Y = cd.Axes.Y;
					var sin = Math.sin, cos = Math.cos;
					var s = 2 / this.Zoom;
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

			// Dynamically determine axes
			var mx, Mx, my, My;
			mx = Mx = chart.DataSet[0].X;
			my = My = chart.DataSet[0].Y;
			for(var i = chart.DataSet.length; i--;){
				var di = chart.DataSet[i];
				mx = di.X < mx ? di.X : mx;
				Mx = di.X > Mx ? di.X : Mx;
				my = di.Y < my ? di.Y : my;
				My = di.Y > My ? di.Y : My;
			}
			chart.Axes.X.Min = mx; chart.Axes.X.Max = Mx;
			chart.Axes.Y.Min = my; chart.Axes.Y.Max = My;


			// some raphael init/assignment
			var cvs = doc.getElementById(desc.Chart.renderTo);
			if(!cvs){
				err('Specified target element not found');
				return null;
			}

			chart.Parent = cvs;
			var rx = 0, ry = 0;
			var raphCvs = chart.Canvas = Raphael(
				cvs,
				rx = (cvs.clientWidth  - 280),
				ry = (cvs.clientHeight - 120)
			);
			raphCvs.Top = ry; raphCvs.Left = rx;
			raphCvs.canvas.style.position = 'absolute';
			raphCvs.canvas.style.top = '0px';//-cvs.clientHeight + 'px';
			raphCvs.canvas.style.left = '120px';

			// create the background axes titles
			var border = 5;
			var bg = QuadChart.RenderBackground(cvs, chart, border);


			raphCvs.canvas.style.borderBottom = border + 'px solid ' + chart.Axes.X.LineColor;
			raphCvs.canvas.style.borderLeft = border + 'px solid ' + chart.Axes.Y.LineColor;
			cvs.Cvs = raphCvs;

			// setup some view-dependent coordinate calculation functions
			chart.X = function(x, c){
				var cv = (c ? c.canvas : null) || cvs;
				var dx = (x - view.Xoffset);
				return (-(cv.clientWidth >> 1) / view.Zoom) - dx;	
			};
			chart.Y = function(y, c){
				var cv = (c ? c.canvas : null) || cvs;
				var dy = (y - view.Yoffset);
				return (-(cv.clientHeight >> 1) / view.Zoom) - dy;	
			};
			chart.S = function(s){
				return s / view.Zoom;
			}	

			// construct the chart's dom
			QuadChart.BuildChart(chart);
		}
	},
	RenderBackground: function(cvs, cd, border){
		var back = Raphael(
			cvs,
			cvs.offsetWidth,
			cvs.offsetHeight
		);
		//back.style.position = 'absolute';

		// white bg
		back.rect(0, 0,
			cvs.offsetWidth,
			cvs.offsetHeight)
			.attr('stroke-width', 0)
		    .attr('fill', '#fff');

		// y axis title   
		back.text(30, cvs.offsetHeight >> 1, cd.Axes.Y.Title)
    		.attr('fill', '#a1c800')
    		.attr('font-size', 20)
		    .transform('r-90');

		// x axis title
		back.text((cvs.offsetWidth >> 1), cvs.offsetHeight - 30, cd.Axes.X.Title)
    		.attr('fill', '#a1c800')
    		.attr('font-size', 20);

    	// key
    	var off = 125;
    	back.rect(cvs.offsetWidth - off, 0, 120, 2)
    		.attr('stroke-width', 0)
    	    .attr('fill', cd.Axes.X.LineColor);
    	back.text(cvs.offsetWidth - off, 15, 'Key')
    		.attr('font-size', 16)
    	    .attr('text-anchor', 'start');
    	back.rect(cvs.offsetWidth - off, 30, 120, 2)
    		.attr('stroke-width', 0)
    	    .attr('fill', cd.Axes.X.LineColor);

    	back.rect(cvs.offsetWidth - (off + 1), 44, 12, 12)
			.attr('fill', '#bbbbbb')
        	.attr('stroke', '#ececfb')
			.attr('stroke-width', '3');
		back.text(cvs.offsetWidth - (off - 25), 50, 'Outlying')
				.attr('font-size', 14)
			    .attr('text-anchor', 'start');	
		for(var i = cd.Props.Quadrants.length; i--;){
			var q = cd.Props.Quadrants[i];
			var pos = {X:cvs.offsetWidth - (off - 5),Y:(i*30) + 80};
			q.RenderPoint(back, pos).attr('r', 6);
			back.text(pos.X + 20, pos.Y, cd.Props.Quadrants[i].Text)
				.attr('font-size', 14)
			    .attr('text-anchor', 'start');

		}

		return back;
	},
	ClearInfoBox: function(){
		if(QuadChart.InfoBox.length){
			while(QuadChart.InfoBox.length)
				QuadChart.InfoBox.pop().remove();
		}
	},
	DetermineNeighborhoods: function(cd){
		var threshhold = Math.pow(10, 2);
		var hoods = [];

		// functions used for calculating the average
		// center of a neighborhood
		var hoodX = function(i){
			var neighbors = hoods[i], sum = 0;
			for(var n = neighbors.length; n--; sum += neighbors[n].X);
			return (sum / neighbors.length);
		};
		var hoodY = function(i){
			var neighbors = hoods[i], sum = 0;
			for(var n = neighbors.length; n--; sum += neighbors[n].Y);
			return (sum / neighbors.length);
		};

		for(var i = 0; i < cd.DataSet.length; i++){
			var di = cd.DataSet[i];

			// Create a new hood if, the datapoint does not
			// belong to one.
			if(di.Neighborhood < 0){
				var newHood = [di];
				newHood.Index = di.Neighborhood = hoods.push(newHood) - 1;
			}

			var hoodId = di.Neighborhood;
			for(var j = 0; j < cd.DataSet.length; j++){
				var dj = cd.DataSet[j];
				if(dj.Neighborhood == hoodId) continue;
				var dx = dj.X - hoodX(hoodId), dy = dj.Y - hoodY(hoodId);

				if(dx * dx + dy * dy <= threshhold){
					if(dj.Neighborhood > -1){
						// this data point is already part of a hood
						// join that one instead
						while(hoods[hoodId].length){
							if(hoods[hoodId].length > 1)
								var sdfsd = 0;
							// move any neighbors to the new hood
							var n = hoods[hoodId].pop();
							n.Neighborhood = dj.Neighborhood;
							hoods[dj.Neighborhood].push(n);
						}
						//hoods.splice(hoods.indexOf(hoods[hoodId]), 1);
						hoodId = di.Neighborhood;
					}
					else{	
						dj.Neighborhood = hoodId
						hoods[hoodId].push(dj);
					}
				}
			}

			// unmark if no neighbors were found
			//if(hoods[hoodId]) // TODO: find a real fix for this
			if(hoods[hoodId].length <= 1){
				di.Neighborhood = -1;
				hoods.pop(); // get rid of the empty hood
			}
		}
		return hoods;
	},
	UpdateNeighborhoodFocus: function(hood){
		hood.Elements.Shape.attr('opacity', hood.Opacity);
		hood.Elements.Text.attr('opacity', hood.Opacity);

		for(var i = hood.length; i--;){
			var di = hood[i];
			di.Element.attr('opacity', 1 - hood.Opacity);

			if(hood.Opacity < 0.1){
				di.Element[0].style.pointerEvents = 'auto';
				hood.Elements.Shape[0].style.pointerEvents = 'none';
				hood.Elements.Text[0].style.pointerEvents = 'none';
				hood.Elements.Shape.hide();
				hood.Elements.Text.hide();
			}
			else{
				di.Element[0].style.pointerEvents = 'none';
				hood.Elements.Shape[0].style.pointerEvents = 'auto';
				hood.Elements.Text[0].style.pointerEvents = 'auto';
				hood.Elements.Shape.show();
				hood.Elements.Text.show();
			}
		}
	},
	RenderNeighborhoods: function(cvs, chartData, hoods){
		var cd = chartData;
		var props = cd.Props;
		var axes  = cd.Axes;
		var cvs   = cd.Canvas;
		var v     = cd.View;

		for(var i = hoods.length; i--;){
			var len = hoods[i].length;
			var di = hoods[i][0];
			var cx = 0, cy = 0, Mx, My;
			if(!di || !len) continue;
			Mx = di.X; My = di.Y;

			// determine the center
			for(var j = len; j--;){
				var n = hoods[i][j];
				cx += n.X; cy += n.Y;
			} cx /= len; cy /= len;

			// determine the radius
			var DX = function(n){return Math.abs(n - cx);};
			var DY = function(n){return Math.abs(n - cy);};
			for(var j = len; j--;){
				var n = hoods[i][j];
				
				Mx = DX(n.X) > DX(Mx) ? n.X : Mx;
				My = DY(n.Y) > DY(My) ? n.Y : My;
			}
			var dx = Mx - cx, dy = My - cy;
			var hood = hoods[i];
			hood.Radius = Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 2;
			hood.Radius = hood.Radius < 5 ? 5: hood.Radius;
			hood.X = cx; hood.Y = cy;
			hood.Opacity = 1.0;
			hood.AnimID = -1;

			hood.Focus = function(hood){
				// stop any running animation
				QuadChart.Anims.ClearAll();

				var x = hood.X, y = hood.Y;
				var oldHood = QuadChart.SelectedHood;

				if(oldHood)
					oldHood.Unfocus(oldHood);

				var id = hood.AnimID = QuadChart.Anims.setInterval(function(){
					// perform the panning calculations
					var dx = 0, dy = 0;
					v.Xoffset += (dx = (x - v.Xoffset)) / 10;
					v.Yoffset += (dy = (y - v.Yoffset)) / 10;

					// smooth interpolation for zoom
					v.Zoom += (zoom - v.Zoom) / 10;

					// update the camera
					v.Update();

					// Update the opacity of the datapoints and hood
					hood.Opacity += (0 - hood.Opacity) / 10;
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
				QuadChart.ClearInfoBox();
				
				// stop any running animation
				// if(hood.AnimID > 0)
				// 	clearInterval(hood.AnimID);

				var oldFadeID = hood.AnimID = setInterval(function(){
					// Update the opacity of the datapoints and hood
					hood.Opacity += (1 - hood.Opacity) / 10;
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
	 			var click = function(){
					var hood = this.Hood;
					var oldHood = QuadChart.SelectedHood;
					QuadChart.ClearInfoBox();

					if(oldHood)
						oldHood.Unfocus(oldHood);
					hood.Focus(hood);
					QuadChart.SelectedHood = hood;
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
		}
	},
	RenderDatapoints: function(cvs, chartData){
		var cd = chartData;
		var props = cd.Props;
		var v     = cd.View;

		for(var i = cd.DataSet.length; i--;){
			var di = cd.DataSet[i];
			var x = di.X, y = di.Y;

			for(var j = props.Quadrants.length; j--;){
				if(props.Quadrants[j].q.isPointInside(x, y)){
					var ele = props.Quadrants[j].RenderPoint(cvs, di);
					var renderInfo = props.Quadrants[j].PointInfo;

					if(di.Neighborhood >= 0){
						ele.attr('opacity', '0.0');
						ele[0].style.pointerEvents = 'none';
						di.Element = ele;

				   		ele.click(function(){
							var x = this.X - 40, y = this.Y, di = this.di;
							var qc = QuadChart, info = qc.InfoBox;
							QuadChart.ClearInfoBox();
							renderInfo(cvs, v, QuadChart.InfoBox, di);

						});
					}
					else{
				   		ele.click(function(){
							var x = this.X, y = this.Y, di = this.di;
							var oldHood = QuadChart.SelectedHood;

							QuadChart.ClearInfoBox();
							renderInfo(cvs, v, QuadChart.InfoBox, di);

							QuadChart.Anims.ClearAll();
							if(oldHood)
								oldHood.Unfocus(oldHood);

							var transID = QuadChart.Anims.setInterval(function(){
								var dx = 0, dy = 0;
								v.Xoffset += (dx = (x - v.Xoffset)) / 10;
								v.Yoffset += (dy = (y - v.Yoffset)) / 10;
								v.Zoom    += (3 - v.Zoom) / 10;
								v.Update();


								if(dx * dx + dy * dy < 1){
									clearInterval(transID);
									QuadChart.SelectedHood = null;
								}
							}, 16);
						});
						ele.dblclick(function(){
							var x = this.X, y = this.Y, di = this.di;
							QuadChart.Anims.ClearAll();
							var transID = QuadChart.Anims.setInterval(function(){
								var dx = 0, dy = 0, dz = 0;
								v.Xoffset += (dx = (x - v.Xoffset)) / 10;
								v.Yoffset += (dy = (y - v.Yoffset)) / 10;
								v.Zoom    += (dz = (10 - v.Zoom)) / 10;
								v.Update();


								if(dz < 1){
									clearInterval(transID);
									QuadChart.SelectedHood = null;
								}
							}, 16);
						});
					}

					ele.X = x; ele.Y = y; ele.InfoBox = null;
					ele.di = di;
				}
			}
		}
	},
	RenderAxes: function(chartData){
		var X = chartData.Axes.X;
		var Y = chartData.Axes.Y;

		var cd  = chartData;
		var cvs = cd.Canvas.canvas;
		var par = cd.Parent;

		var top = cvs.offsetTop, left = cvs.clientLeft;
		var w = cvs.offsetWidth, h = cvs.clientHeight;

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
		xc.canvas.style.top = cvs.clientHeight + 'px';

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

		for(var i = Math.ceil(dx / X.TickInterval); i--;){
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
	},
	BuildChart: function(chartData){
		window.LCD = chartData;

		var cd = chartData;
		var props = cd.Props;
		var axes  = cd.Axes;
		var cvs   = cd.Canvas;
		var v     = cd.View;		

		var dw = Math.abs(axes.X.Max - axes.X.Min); dw = dw < cvs.width ? cvs.width : dw;
		var dh = Math.abs(axes.Y.Max - axes.Y.Min); dh = dh < cvs.height ? cvs.height : dh;

		var w = (dw >> 1), 
		    h = (dh >> 1);

		var goHome = function(){

			QuadChart.Anims.ClearAll();

			if(QuadChart.SelectedHood)
			QuadChart.SelectedHood.Unfocus(QuadChart.SelectedHood);

			var transID = QuadChart.Anims.setInterval(function(){
				var dx = 0, dy = 0, x = 0, y = 0;
				v.Xoffset += (dx = (x - v.Xoffset)) / 10;
				v.Yoffset += (dy = (y - v.Yoffset)) / 10;
				v.Zoom    += (3 - v.Zoom) / 10;
				v.Update();

				if(dx * dx + dy * dy < 0.01){
					clearInterval(transID);
					QuadChart.SelectedHood = null;
				}
			}, 16);
		}

		props.Quadrants[0].q = cvs.rect(-w, -h, w, h);
		props.Quadrants[1].q = cvs.rect(0, -h, w, h);
		props.Quadrants[2].q = cvs.rect(0, 0, w, h);
		props.Quadrants[3].q = cvs.rect(-w, 0, w, h);

		for(var i = 4; i--;){
			props.Quadrants[i].q
			.attr('fill', props.Quadrants[i].Color)
			.attr('stroke', props.Border.Color)
			.attr('stroke-width', props.Border.Thickness)
			.click(function(){QuadChart.ClearInfoBox();goHome();});
		}

		var hw = w >> 3, hh = h >> 3;
		cvs.text(-hw, -hh, props.Quadrants[0].Text)
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', props.Quadrants[0].TextColor);
		cvs.text(hw, -hh, props.Quadrants[1].Text)
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', props.Quadrants[1].TextColor);
		cvs.text(hw, hh, props.Quadrants[2].Text)
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', props.Quadrants[2].TextColor);
		cvs.text(-hw, hh, props.Quadrants[3].Text)
		   .click(goHome)
		   .attr('font-family', 'arial')
		   .attr('fill', props.Quadrants[3].TextColor);

		// determine neighborhoods
		var hoods = QuadChart.DetermineNeighborhoods(cd);
		QuadChart.Hoods = hoods;

		// render neighborhoods
		QuadChart.RenderNeighborhoods(cvs, cd, hoods);	

		// render lone data points
		QuadChart.RenderDatapoints(cvs, cd);

		// render chart axes
		QuadChart.RenderAxes(cd);

		v.Update();
	}
}; 
