var QuadData = function(config, onBoundsChanged){
//   __   __        _      _    _        
//   \ \ / /_ _ _ _(_)__ _| |__| |___ ___
//    \ V / _` | '_| / _` | '_ \ / -_|_-<
//     \_/\__,_|_| |_\__,_|_.__/_\___/__/
//                                       
	var _onRenderCallbacks = new ll(), _onBoundsChangedCallbacks = new ll();
	var dataSpace = new SpatialTable(5);
	var allData = [];
	var hoods = [];
	var hoodRadius = config.hoodRadius;
	var mean = {x: 0, y: 0};
//-----------------------------------------------------------------------------
//    ___     _          _          __              _   _             
//   | _ \_ _(_)_ ____ _| |_ ___   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   |  _/ '_| \ V / _` |  _/ -_) |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |_| |_| |_|\_/\__,_|\__\___| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                            
	var floatingAvg = function(iBar, n, jBar, k){
		return (iBar * n) / (n + k) + (jBar * k) / (n + k);
	};
//-----------------------------------------------------------------------------
	var onRender = function(points, hoods){
		var node = _onRenderCallbacks.first;
		while(node){
			node.value(points, hoods);
			node = node.next;
		}
	}
//-----------------------------------------------------------------------------
	var onBoundsChanged = function(){
		var node = _onBoundsChangedCallbacks.first;
		while(node){
			node.value();
			node = node.next;
		}
	};
//-----------------------------------------------------------------------------
	var updateMean = function(data, newDataAvg, removing){
		// NOTE: for this to work for additions and removal, the length
		// of the removed data must be negated
		var oldLen = allData.length;
		var changeLen = removing ? -data.length : data.length;

		mean.x = floatingAvg(mean.x, oldLen, newDataAvg.x, changeLen);
		mean.y = floatingAvg(mean.x, oldLen, newDataAvg.y, changeLen);
	};
//-----------------------------------------------------------------------------
	var createNewHood = function(hoods, di){
		// Create a new hood if the datapoint does not
		// belong to one.
		if(!di.Neighborhood || di.Neighborhood < 0){
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
			newHood.R = function(x, y){
				var max_dx = 0, max_dy = 0;
				for(var n = this.length; n--;){
					var dx = Math.abs(this[n].X - x), dy = Math.abs(this[n].Y - y);
					max_dx = dx > max_dx ? dx : max_dx;
					max_dy = dy > max_dy ? dy : max_dy;
				}

				return Math.sqrt(max_dx * max_dx + max_dy * max_dy);
			};
			newHood.Index = di.Neighborhood = hoods.push(newHood) - 1;
		}
	};
//-----------------------------------------------------------------------------
	var matchExisting = function(hoods, nearBy, di){
		var threshhold = Math.pow(hoodRadius, 2);

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

					hood = hoods[di.Neighborhood];
				}
				else{	
					dj.Neighborhood = di.Neighborhood
					hood.push(dj);
				}
			}
		}

		return hood;
	};
//-----------------------------------------------------------------------------
	var extractNeighbors = function(newData){
		// try to pair the new elements up with a neighborhood
		var hoodsToRender = [];
		for(var i = newData.length; i--;){
			var di = newData[i];

			createNewHood(hoods, di);

			// query for any nearby datapoints
			var nearBy = dataSpace.Get(
				{x: di.X, y: di.Y},
				hoodRadius
			);

			var hood = matchExisting(hoods, nearBy, di);

			// unmark if no neighbors were found
			if(hood.length <= 1){
				di.Neighborhood = -1;
				hoods.pop(); // get rid of the empty hood
			}
			else
				hoodsToRender.push(hood);
		}

		return hoodsToRender;
	}
//-----------------------------------------------------------------------------
//    ___       _           __              _   _             
//   |   \ __ _| |_ __ _   / _|_  _ _ _  __| |_(_)___ _ _  ___
//   | |) / _` |  _/ _` | |  _| || | ' \/ _|  _| / _ \ ' \(_-<
//   |___/\__,_|\__\__,_| |_|  \_,_|_||_\__|\__|_\___/_||_/__/
//                                                            
	var add = function(data){
		// make sure that the data provided is not null. If it isn't, make sure
		// it's an array, or convert it if it's not already.
		if(!data) return;
		data = (typeof(data.length) != 'undefined' ? data : [data]);
		var newDataAvg = {
			x: 0, y: 0
		};

		// add all the data points to the space
		for(var i = data.length; i--;){
			// add the value to the space. invoke the change event if 
			// the space was expanded through the addition of this point.
			dataSpace.Insert(
				{x: data[i].X, y: data[i].Y},
				data[i],
				onBoundsChanged
			);

			newDataAvg.x += data[i].X;
			newDataAvg.y += data[i].Y;
		}

		// average for the new data set
		newDataAvg.x /= data.length;
		newDataAvg.y /= data.length;

		updateMean(data, newDataAvg, false);
		allData = allData.concat(data);

		// draw the new points and hoods
		onRender(data, extractNeighbors(data));
	};
//-----------------------------------------------------------------------------
	var remove = function(data){

	};
//-----------------------------------------------------------------------------
	add(config.data);

	return {
		add: add,
		remove: remove,
		onRender: function(callback){ return _onRenderCallbacks.add(callback); },
		onBoundsChanged: function(callback){ return _onBoundsChangedCallbacks.add(callback); },
		x: {
			max: function(){ return dataSpace.Max.x; },
			min: function(){ return dataSpace.Min.x; }
		},
		y: {
			max: function(){ return dataSpace.Max.y; },
			min: function(){ return dataSpace.Min.y; }
		},
		mean: function(){ return mean; }
	};
}