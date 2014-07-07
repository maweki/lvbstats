$.extend(lvbdata, {
  create_bar_chart: function(data, t) {
    var idname;
    if (t == "day") {
      idname = '#eventsbydaybar';
    }
    else if (t == "hour") {
      idname = '#eventsbyhourbar';
    }

    var svg = d3.select(idname).append("svg")
    .append("g").attr("class", "main");

    svg.append("g")
      .attr("class", "x axis");

    svg.append("g")
        .attr("class", "y axis")
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Ereignisse");

    this.update_bar_chart(data, t);
  },

  update_bar_chart: function(data, t) {
    var xfun;

    if (t == "day") {
      xfun = function(d) { return ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][d.day]; };
      data = this.data.accumulate_by_weekday(data);
      idname = '#eventsbydaybar';
    }
    else if (t == "hour") {
      xfun = function(d) { return d.hour; };
      data = this.data.accumulate_by_hour(data);
      idname = '#eventsbyhourbar';
    }

    console.log(data);

    var width = this.get_chart_width(),
    height = 300,
    margin = this.margins;

    var svg = d3.select(idname).select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .select("g.main")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);

  x.domain(data.map(function(d) { return xfun(d); }));
  y.domain([0, d3.max(data, function(d) { return d.acc; })]);

  svg.select("g.x.axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.select("g.y.axis").transition().duration(1000)
      .call(yAxis);

  var bars = svg.selectAll(".bar")
      .data(data);
    bars.enter().append("rect")
      .attr("class", "bar");
    bars.transition().duration(1000)
      .attr("x", function(d) { return x(xfun(d)); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.acc); })
      .attr("height", function(d) { return height - y(d.acc); });
  }
});
