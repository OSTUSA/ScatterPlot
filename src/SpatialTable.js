function SpatialTable(cellSize){
        var t = this;
	t.Max = {x: null, y: null};
	t.Min = {x: null, y: null};

        (1).__proto__.near = function(n, bias){
                return Math.abs(this - n) <= bias;
        };

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
                        if(i>=0) bucket = bucket.splice(i, 1);
                }
                else{
                        var key = hash(arg);
                        t[key] = [];
                }
        }
}

