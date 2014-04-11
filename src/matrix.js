//     ___ _     _          _   _        _                  
//    / __| |___| |__  __ _| | | |_  ___| |_ __  ___ _ _ ___
//   | (_ | / _ \ '_ \/ _` | | | ' \/ -_) | '_ \/ -_) '_(_-<
//    \___|_\___/_.__/\__,_|_| |_||_\___|_| .__/\___|_| /__/
//                                        |_|               
var rot2d = function(theta, size){
	// construct a result matrix
	var r = new Array(size);
	for(var i = size; i--; ){
		r[i] = Array
			.apply(null, new Array(r.length))
			.map(Number.prototype.valueOf,0);
	}

	var c = Math.cos(theta), s = Math.sin(theta);

	r[0][0] = c; r[1][0] = -s;
	r[0][1] = s; r[1][1] =  c;
	r[2][2] = 1;

	return r;
};
//-----------------------------------------------------------------------------
var I = function(size){
	var out = new Array(size);
	for(var i = size; i--;){
		out[i] = [];
		for(var j = 0; j < size; j++)
			out[i].push(j == i ? 1 : 0);
	}

	return out;
};
//-----------------------------------------------------------------------------
//    __  __     _   _            _    
//   |  \/  |___| |_| |_  ___  __| |___
//   | |\/| / -_)  _| ' \/ _ \/ _` (_-<
//   |_|  |_\___|\__|_||_\___/\__,_/__/
//                                     
([]).__proto__.X = function(m){
	// make sure m's row matches this's column length
	if(!(m[0] && m[0].length == this.length)) return null;
	
	// construct a result matrix
	var r = new Array(m.length);
	for(var i = r.length; i--; r[i] = new Array(this.length));

	// multiply
	for(var i = 0; i < r.length; i++){
		for(var j = 0; j < r[0].length; j++){
			r[i][j] = 0;
			for(var k = 0; k < r[0].length; r[i][j] += this[k][j] * m[i][k++]);
		}
	}

	return r;
};
//-----------------------------------------------------------------------------
([]).__proto__.translate = function(position){
	for(var i = 0; i < position.length; i++)
		this[this.length - 1][i] = position[i];
	return this;
};
//-----------------------------------------------------------------------------
([]).__proto__.serialize = function(args){
	var str = '';
	if(typeof(args) == 'string'){
		switch(args){
			case 'svg':
				str = 'M';
				for(var i = 0; i < this.length; i++){
					var col = this[i], len = col.length > 2 ? 2 : col.length;
					for(var j = 0; j < len;)
						 str += col[j].toFixed(3) + (j++ == len - 1 ? '' : ',');
					str += (i == this.length - 1 ? '' : ',');
				}
				break;
		}
	}
	return str;
};