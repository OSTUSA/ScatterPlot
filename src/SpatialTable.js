function SpatialTable(cellSize){
        var t = this;
        var hash = function(point){
                var x = Math.floor(point.x / cellSize);
                var y = Math.floor(point.y / cellSize);

                return x + '-' + y;             
        }       

        t.Insert = function(point, value){
                var key = hash(point);
                var cell = (t[key] = t[key] || []);

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
