if(typeof(QuadChart) == 'undefined') QuadChart = {};

QuadChart.RemoveDataPoint = function(chart, di){
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();
	var hood    = di.Neighborhood >= 0 ? chart.GetHoods()[di.Neighborhood] : null;
	
	// remove the datapoint SVG element
	di.Element.remove();

	// remove from the space table
	space.Remove(di);

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
			hood[0].Element.attr('opacity', 1);
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

		//QuadChart.UpdateQuadrants(chart);
	}

	// render all the hoods that have been marked
	while(hoodsToRender.length){
		QuadChart.RenderNeighborhood(chart, hoodsToRender.pop());
	}

	// Dynamically resize the axes
	QuadChart.DetermineAxesScales(chart);
	QuadChart.DetermineBaseZoom(chart);
	chart.SetDataSet(dataSet);

	return dataSet;
};
QuadChart.DetermineNeighborhoods = function(chart){
	var hoods   = chart.GetHoods() || [];
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();

	QuadChart.AddDataPoints(chart, null);
	return hoods;
};
