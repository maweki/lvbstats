$.extend(lvbdata,{
  create_heatmap: function(data) {
    data = this.data.accumulate_by_weekday_hour(data);

    var margin = this.margins,
      width = this.get_main_div_width() -  margin.left - margin.right,
      height = this.get_main_div_width()/3.3,
      gridSize = Math.floor(width / 24),
      legendElementWidth = gridSize*2,
      buckets = 9,
      colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
      days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      times = [];
      for (var h = 0; h <= 23; h++) {
        times.push(h.toString() + '-' + ((h + 1)%24).toString());
      }

      var colorScale = d3.scale.quantile()
              .domain([0, buckets - 1, d3.max(data, function (d) { return d.acc; })])
              .range(colors);

      var svg = d3.select('#heatmap').select('svg').select('g');
      if (!svg[0][0]) {
        svg = d3.select("#heatmap").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      } else {
        d3.select('#heatmap').select('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      }

      var dayLabels = svg.selectAll(".dayLabel")
          .data(days)
          .attr("y", function (d, i) { return i * gridSize; })
          .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

      var timeLabels = svg.selectAll(".timeLabel")
          .data(times)
          .attr("x", function(d, i) { return i * gridSize; })
          .attr("transform", "translate(" + gridSize / 2 + ", -6)")
          .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", function(d, i) { return i * gridSize; })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

      var heatMap = svg.selectAll(".hour")
          .data(data);

      heatMap
        .attr("x", function(d) { return (d.hour) * gridSize; })
        .attr("y", function(d) { return (d.day) * gridSize; })
        .attr("width", gridSize)
        .attr("height", gridSize)
        .transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.acc); });

      heatMap.enter().append("rect")
          .attr("x", function(d) { return (d.hour) * gridSize; })
          .attr("y", function(d) { return (d.day) * gridSize; })
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("class", "hour bordered")
          .attr("width", gridSize)
          .attr("height", gridSize)
          .style("fill", colors[0]);

      console.log(heatMap);
      heatMap.exit().remove();

      heatMap.transition().duration(1000)
          .style("fill", function(d) { return colorScale(d.acc); });

      heatMap.selectAll("title").remove();
      heatMap.append("title").text(function(d) { return d.acc.toString() + ' Ereignisse'; });

      svg.selectAll(".legend").remove();

      var legend = svg.selectAll(".legend")
          .data([0].concat(colorScale.quantiles()), function(d) { return d; })
          .enter().append("g")
          .attr("class", "legend");

      legend.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height)
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .style("fill", function(d, i) { return colors[i]; });

      legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height + gridSize);


  },
});
