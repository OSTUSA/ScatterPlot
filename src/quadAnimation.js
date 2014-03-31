var QuadAnim = {
	_anims: [],
	setInterval: function(callback, frequency){
		var out = -1;
		this._anims.push(out = setInterval(callback, frequency));
		return out;
	},
	clearInterval: function(id){
		this._anims.splice(this._anims.indexOf(id), 1);
		clearInterval(id);
	},
	clearAll: function(){
		while(this._anims.length){
			clearInterval(this._anims.pop());
		}
	},
	animateUntil: function(callback, conditionFunc){
		var t = this;
		var id = t.setInterval(function(){
			callback();
			if(conditionFunc()){
				t._anims.splice(t._anims.indexOf(id), 1);
				clearInterval(id);
				return;
			}
		}, 16);

		return id;
	}
};