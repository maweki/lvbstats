$.extend(lvbdata, {
  line_function: undefined,
  chart_data: {},

  create_historical_chart: function(data) {
    data = _.sortBy(data, 'date');

    var width = this.get_chart_width(),
      height = 500 - this.margins.top - this.margins.bottom;

    this.chart_data.x = d3.time.scale()
        .range([0, width]);

    this.chart_data.y = d3.scale.linear()
        .range([height, 0]);

    this.chart_data.xAxis = d3.svg.axis()
        .scale(this.chart_data.x)
        .orient("bottom");

    this.chart_data.yAxis = d3.svg.axis()
        .scale(this.chart_data.y)
        .orient("left");

    var svg = d3.select("#eventshist").append("svg")
        .attr("width", width + this.margins.left + this.margins.right)
        .attr("height", height + this.margins.top + this.margins.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    svg.append("g")
        .attr("class", "y axis")
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Ereignisse");

    svg.append("path").attr("class", "line all");
    svg.append("path").attr("class", "line deleted");

    this.refresh_historical_chart(data);

  },

  refresh_historical_chart: function(data) {
    var deleted_data = this.data.accumulate_by_week(_.filter(data, function(d){ return d.deleted; }));
    data = this.data.accumulate_by_week(data);

    var duration_amnt = 1000;
    var chart_data = this.chart_data;

    this.chart_data.line_function = d3.svg.line()
        .x(function(d) { return chart_data.x(d.date); })
        .y(function(d) { return chart_data.y(d.acc); });

    this.chart_data.x.range([0, this.get_chart_width()]);
    this.chart_data.x.domain(d3.extent(data, function(d) { return d.date; }));
    this.chart_data.y.domain([0, d3.max(data, function(d) { return d.acc; })]);

    var svg = d3.select("#eventshist").select("svg");
    svg.select("g.x.axis").transition().duration(duration_amnt).call(this.chart_data.xAxis);
    svg.select("g.y.axis").transition().duration(duration_amnt).call(this.chart_data.yAxis);
    svg.select("path.line.all").datum(data).transition().duration(duration_amnt).attr("d", this.chart_data.line_function);
    svg.select("path.line.deleted").datum(deleted_data).transition().duration(duration_amnt).attr("d", this.chart_data.line_function);
  }
});
