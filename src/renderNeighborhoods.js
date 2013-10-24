if(typeof(QuadChart) == 'undefined') QuadChart = {};
QuadChart.RenderNeighborhood = function(chart, hood){
	var cd = chart;
	var props = cd.Props;
	var axes  = cd.Axes;
	var cvs   = cd.Canvas;
	var hoods = cd.GetHoods();
	var v     = cd.View;

	var len = hood.length;
	var di = hood[0];
	var cx = hood.X(), cy = hood.Y(), Mx, My;
	if(!di || !len) return;
	Mx = di.X; My = di.Y;

	// clean up existing elements
	for(var k in hood.Elements){
		var e = hood.Elements[k];
		e.remove();
	}

	// determine the center
	//for(var j = len; j--;){
	//	var n = hood[j];
	//	cx += n.X; cy += n.Y;
	//} cx /= len; cy /= len;

	// determine the radius
	var DX = function(n){return Math.abs(n - cx);};
	var DY = function(n){return Math.abs(n - cy);}; 
	for(var j = len; j--;){
		var n = hood[j];
		
		Mx = DX(n.X) > DX(Mx) ? n.X : Mx;
		My = DY(n.Y) > DY(My) ? n.Y : My;
	}
	var dx = Mx - cx, dy = My - cy;
	hood.Radius = Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 2;
	hood.Radius = hood.Radius < 5 ? 5: hood.Radius;
	hood.Opacity = 1.0;
	hood.AnimID = -1;

	hood.Focus = function(hood){
		// stop any running animation
		chart.Anims.ClearAll();

		var x = hood.X(), y = hood.Y(), speed = chart.Props.AnimationSpeed;
		var oldHood = chart.SelectedHood;

		if(oldHood)
			oldHood.Unfocus(oldHood);

		var id = hood.AnimID = chart.Anims.setInterval(function(){
			// perform the panning calculations
			var dx = 0, dy = 0, r = hood.Radius, zoom = r <= 2 ? 3 : (r > 10 ? 10 : r) + v.BaseZoom;
			
			v.Xoffset += (dx = (x - v.Xoffset)) / speed;
			v.Yoffset += (dy = (y - v.Yoffset)) / speed;

			// smooth interpolation for zoom
			v.Zoom += (zoom - v.Zoom) / speed;

			// update the camera
			v.Update();

			// Update the opacity of the datapoints and hood
			hood.Opacity += (0 - hood.Opacity) / speed;
			QuadChart.UpdateNeighborhoodFocus(hood);

			// end animation when the opacity is near the target
			if(hood.Opacity < 0.001){
				console.log('Translate done ' + Math.random());
				clearInterval(id);
				hood.AnimID = -1;
			}
		}, 16);
		hood.Elements.Shape[0].style.pointerEvents = 'visible';
		hood.Elements.Text[0].style.pointerEvents  = 'visible';
	};
	hood.Unfocus = function(hood){
		chart.ClearInfoBox();
		var speed = chart.Props.AnimationSpeed;
		// stop any running animation
		// if(hood.AnimID > 0)
		// 	clearInterval(hood.AnimID);

		var oldFadeID = hood.AnimID = setInterval(function(){
			// Update the opacity of the datapoints and hood
			hood.Opacity += (1 - hood.Opacity) / speed;
			QuadChart.UpdateNeighborhoodFocus(hood);

			if(hood.Opacity > 0.99){
				console.log('Fade ended ' + Math.random());
				clearInterval(oldFadeID);
				hood.AnimID = -1;
			}
		}, 16);
	};

	if(props && props.Quadrants)
	for(var j = props.Quadrants.length; j--;){
		if(!props.Quadrants[j].q.isPointInside(cx, cy)) continue;

		hood.Quadrant = props.Quadrants[j].q;
		var grp = props.Quadrants[j].RenderGroup(cvs, hood);
		var zoom = 12 - hood.length;

		// create the click event function
		var click = function(e){
			var hood = this.Hood;
			var oldHood = chart.SelectedHood;
			chart.ClearInfoBox();

			if(oldHood)
				oldHood.Unfocus(oldHood);
			
			if(oldHood != hood){
				hood.Focus(hood);
				chart.SelectedHood = hood;
			}	
			else
				chart.goHome();
		};

		// assign click events
		grp.Shape.click(click); grp.Text.click(click);

		// keep references to the group position on
		// Shape and text SVG elements
		grp.Shape.X = cx; grp.Shape.Y = cy;
		grp.Text.X = cx; grp.Text.Y = cy;

		// keep references from the elements to the hood
		// and vise versa
		grp.Shape.Hood = grp.Text.Hood = hood;
		hood.Elements = {
			Shape: grp.Shape,
			Text: grp.Text
		};
	}

}

QuadChart.RenderNeighborhoods = function(chart){
	for(var i = hoods.length; i--;){
	}
};
