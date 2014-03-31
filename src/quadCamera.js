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
		baseZoom: z || 1,
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
		goHome: function(viewPaper, dataSpace){
			var z; // this will be fed into the move invocation as zoom
			var mean   = dataSpace.mean();
			var stddev = dataSpace.standardDeviation();

			var w, h;
			var dw = w = Math.abs(dataSpace.x.max() - dataSpace.x.min());
				dw = dw < viewPaper.width ? viewPaper.width : dw;
			var dh = h = Math.abs(dataSpace.y.max() - dataSpace.y.min());
				dh = dh < viewPaper.height ? viewPaper.height : dh;

			var sf = w > h ? w : h;

			if(Math.abs(w - dw) < Math.abs(h - dh)){
				z = sf / (stddev.x * 4);
			}
			else{
				z = sf / (stddev.y * 4);
			} this.baseZoom = z;

			// move to the home position
			this.move(mean.x, mean.y, z);

			this.emitGoHome(this);
		}
	};
}