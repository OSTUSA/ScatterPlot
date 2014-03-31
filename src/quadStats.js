var QuadStats = {
	mean: function(data){
		var avg = {x: 0, y: 0};
		for(var i = data.length; i--;){
			avg.x += data[i].X;
			avg.y += data[i].Y;
		}

		return {x: avg.x / data.length, y: avg.y / data.length};
	},
	variance: function(data, mean){
		var variance = {
			x: 0, y: 0
		};

		for(var i = data.length; i--;){
			var dx = data[i].X - mean.x;
			var dy = data[i].Y - mean.y;
			variance.x += dx * dx;
			variance.y += dy * dy;
		}

		variance.x /= data.length;
		variance.y /= data.length;

		return variance;
	}
};