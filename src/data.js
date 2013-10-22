if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.DetermineNeighborhoods = function(chart){
	var threshhold = Math.pow(5, 2);
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

	for(var i = 0; i < chart.DataSet.length; i++){
		var di = chart.DataSet[i];

		// Create a new hood if, the datapoint does not
		// belong to one.
		if(di.Neighborhood < 0){
			var newHood = [di];
			newHood.Index = di.Neighborhood = hoods.push(newHood) - 1;
		}

		var hoodId = di.Neighborhood;
		for(var j = 0; j < chart.DataSet.length; j++){
			var dj = chart.DataSet[j];
			if(dj.Neighborhood == hoodId) continue;
			var dx = dj.X - hoodX(hoodId), dy = dj.Y - hoodY(hoodId);

			if(dx * dx + dy * dy <= threshhold){
				if(dj.Neighborhood > -1){
					// this data point is already part of a hood
					// join that one instead
					while(hoods[hoodId].length){
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
};