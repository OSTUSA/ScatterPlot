if(typeof(QuadChart) == 'undefined') QuadChart = {};
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
			di
		);
	}

	// try to pair the new elements up with a neighborhood
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
		//if(hoods[hoodId]) // TODO: find a real fix for this
		if(hood.length <= 1){
			di.Neighborhood = -1;
			hoods.pop(); // get rid of the empty hood
		}
		else
			QuadChart.RenderNeighborhood(chart, hood);

		// render each data point as it's added
		QuadChart.RenderDatapoint(chart, di);
	}	
};
QuadChart.DetermineNeighborhoods = function(chart){
	var hoods   = chart.GetHoods() || [];
	var space   = chart.GetSpace();
	var dataSet = chart.GetDataSet();

	QuadChart.AddDataPoints(chart, null);
	return hoods;
};
