$.extend(lvbdata, {
  create_pie: function(data) {
    var svg = d3.select("#piechartline")
    	.append("svg")
    	.append("g").attr("class", "main");

    svg.append("g")
    	.attr("class", "slices");
    svg.append("g")
    	.attr("class", "labels");
    svg.append("g")
    	.attr("class", "lines");

    svg.append("text").attr("class", "infotext").attr("text-anchor", "middle");

    this.update_pie(data);
  },

  update_pie: function(data) {
    var width = this.get_chart_width(),
        height = width/1.8,
      radius = Math.min(width, height) / 1.9;

    var svg = d3.select("#piechartline")
    .select("svg").attr("height", height).attr("width", width)
    .select("g.main");

    var infotext = svg.select('text.infotext');


    var pie = d3.layout.pie()
    	.sort(null)
    	.value(function(d) {
    		return d.acc;
    	});

    var arc = d3.svg.arc()
    	.outerRadius(radius * 0.8)
    	.innerRadius(radius * 0.4);

    var outerArc = d3.svg.arc()
    	.innerRadius(radius * 0.9)
    	.outerRadius(radius * 0.9);

    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var key = function(d){ return d.data.line; };

    change(this.data.accumulate_by_line(data));


    function change(data) {

    	/* ------- PIE SLICES -------*/
    	var slice = svg.select(".slices").selectAll("path.slice")
    		.data(pie(data), key);

    	slice.enter()
    		.insert("path")
      .style("fill", "rgb(65, 182, 196)"/*function(d) { return color(d.data.line); }*/)
    		.attr("class", "slice");

    	slice
    		.transition().duration(1000)
    		.attrTween("d", function(d) {
    			this._current = this._current || d;
    			var interpolate = d3.interpolate(this._current, d);
    			this._current = interpolate(0);
    			return function(t) {
    				return arc(interpolate(t));
    			};
    		});

      slice.on("mouseout", function(){ infotext.text(''); });
      slice.on("mousemove", function(d){ infotext.text('Linie ' + d.data.line + ' / ' + d.data.acc.toString() + ' Ereignisse'); });

    	slice.exit()
    		.remove();

    	/* ------- TEXT LABELS -------*/

    	var text = svg.select(".labels").selectAll("text")
    		.data(pie(data), key);

    	text.enter()
    		.append("text")
    		.attr("dy", ".35em");

      text.text(function(d) {
    			return d.data.line;
    		})
      .style('visibility', function(d, i){ if (i > 10) return "hidden"; });

    	function midAngle(d){
    		return d.startAngle + (d.endAngle - d.startAngle)/2;
    	}

    	text.transition().duration(1000)
    		.attrTween("transform", function(d) {
    			this._current = this._current || d;
    			var interpolate = d3.interpolate(this._current, d);
    			this._current = interpolate(0);
    			return function(t) {
    				var d2 = interpolate(t);
    				var pos = outerArc.centroid(d2);
    				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
    				return "translate("+ pos +")";
    			};
    		})
    		.styleTween("text-anchor", function(d){
    			this._current = this._current || d;
    			var interpolate = d3.interpolate(this._current, d);
    			this._current = interpolate(0);
    			return function(t) {
    				var d2 = interpolate(t);
    				return midAngle(d2) < Math.PI ? "start":"end";
    			};
    		});

    	text.exit()
    		.remove();

    	/* ------- SLICE TO TEXT POLYLINES -------*/

    	var polyline = svg.select(".lines").selectAll("polyline")
    		.data(pie(data), key);

    	polyline.enter()
    		.append("polyline");

      polyline.style('visibility', function(d, i){ if (i > 10) return "hidden"; });

    	polyline.transition().duration(1000)
    		.attrTween("points", function(d){
    			this._current = this._current || d;
    			var interpolate = d3.interpolate(this._current, d);
    			this._current = interpolate(0);
    			return function(t) {
    				var d2 = interpolate(t);
    				var pos = outerArc.centroid(d2);
    				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
    				return [arc.centroid(d2), outerArc.centroid(d2), pos];
    			};
    		});

    	polyline.exit()
    		.remove();
    }
  }
});
