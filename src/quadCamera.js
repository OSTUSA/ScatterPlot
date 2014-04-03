function QuadCamera(x, y, z){
	return {
		_onMoveListeners: new ll(),
		_onGoHomeListeners: new ll(),
		_dx: 0,
		_dy: 0,
		_lastAnimId: -1,
		lag: 4,
		offset: {
			x: x || 0, y: y || 0
		},
		zoom: z || 1,
		baseZoom: 0,
		onMove: function(callback){
			if(typeof(callback) !== 'function')
				throw new UserException(
					'A callback function must be provided'
				);

			return this._onMoveListeners.add(callback);
		},
		onGoHome: function(callback){
			if(typeof(callback) !== 'function')
				throw new UserException(
					'A callback function must be provided'
				);

			return this._onGoHomeListeners.add(callback);
		},
		emitMove: function(e){
			var node = this._onMoveListeners.first;
			while(node){
				node.value(e);
				node = node.next;
			}
		},
		emitGoHome: function(e){
			var node = this._onGoHomeListeners.first;
			while(node){
				node.value(e);
				node = node.next;
			}
		},
		move: function(x, y, z){
			var off = this.offset;
			var cam = this;

			// allow the user to ignore the zoom parameter
			if(!z) z = this.zoom;

			QuadAnim.clearInterval(cam._lastAnimId);
			cam._lastAnimId = QuadAnim.animateUntil(
				function(){
					var dx = 0, dy = 0;
					off.x += (cam._dx = dx = (-x - off.x)) / cam.lag;
					off.y += (cam._dx = dy = (-y - off.y)) / cam.lag;
					cam.zoom += (z - cam.zoom) / cam.lag;

					cam.emitMove(cam);
				},
				function(){
					var t = cam;
					return t._dx * t._dx + t._dy * t._dy < 0.01;
				}
			);
		},
		jump: function(x, y, z){
			var off = this.offset;
			var cam = this;

			// allow the user to ignore the zoom parameter
			if(!z) z = this.zoom;

			cam.zoom = z;
			off.x = -x;
			off.y = -y;

			cam.emitMove(cam);
		},
		goHome: function(viewPaper, dataSpace, callback){
			if(callback) callback();
			this.emitGoHome(this);
		},
		updateBaseZoom: function(viewPaper, dataSpace){
			var a = Math.abs, dMax, dMin, tall = false;
			var qw = viewPaper.width >> 2;
			var qh = viewPaper.height >> 2;
			var median = dataSpace.median();
			var std = dataSpace.standardDeviation();

			if(std.x > std.y){
				dMax = a(median.x - dataSpace.x.max());
				dMin = a(median.x - dataSpace.x.min());
			}
			else{
				tall = true;
				dMax = a(median.y - dataSpace.y.max());
				dMin = a(median.y - dataSpace.y.min());			
			}

			var divisior = tall ? qh : qw;

			if(dMax * dMin == 0) return 1; // avoid div by 0
			return (this.baseZoom = divisior / (dMin < dMax ? dMin : dMax)); 
		}
	};
}