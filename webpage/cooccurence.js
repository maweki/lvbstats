$.extend(lvbdata, {
  cooccurence_matrix_order: 0,
  cooccurence_matrix_order_modes: ['name', 'count', 'group'],

  get_cooccurence_matrix: function(data, limit) {
    if (!limit) {
      limit = 50;
    }

    var keyword_list = this.data.accumulate_words(data).slice(0,limit).reverse();

    var matrix = { links: [], nodes: [] };
    var lookup = {};
    var matrix_array = [];
    var i, i2;
    for (i = 0; i < keyword_list.length; i++) {
      var thiscolumn = [];
      for (i2 = 0; i2 < keyword_list.length; i2++) {
        thiscolumn.push(0);
      }
      matrix_array.push(thiscolumn);
    }

    var idx = 0;
    while (keyword_list.length) {
      var keyword = keyword_list.pop().word.toLowerCase();
      lookup[keyword] = idx;
      matrix.nodes.push( {name: keyword} );
      idx++;
    }

    var add_cooccurence = function(word1, word2) {
      if(lookup[word1] >= 0 && lookup[word2] >= 0) {
        matrix_array[lookup[word1]][lookup[word2]]++;
      }
    };

    var count = 0;

    _.forEach(data, function(tweet){
      var wordlist = _.map(tweet.words, function(word) { return word.toLowerCase(); });
      var i1, i2;
      for (i1 = 0; i1 < wordlist.length; i1++) {
        for (i2 = 0; i2 < wordlist.length; i2++) {
          add_cooccurence(wordlist[i1], wordlist[i2]);
        }
      }
    });

    for (i = 0; i < matrix_array.length; i++) {
      for (i2 = 0; i2 < matrix_array.length; i2++) {
        if (matrix_array[i][i2]) {
          matrix.links.push({value: matrix_array[i][i2], source: i, target: i2});
        }
      }
    }

    return matrix;
  },

  init_cooccurence_matrix: function(data) {
    var svg = d3.select("#keywordcooccurence").append("svg")
      .append("g")
        .attr("class", "main");
    svg.append("rect")
      .attr("class", "background");

    this.update_cooccurence_matrix(data);
  },

  update_cooccurence_matrix: function(data) {
    data = this.get_cooccurence_matrix(data);

    var margin = {top: 130, right: 0, bottom: 10, left: 130},
        width = this.get_chart_width() - margin.left - margin.right,
        height = width;

    var max = 0;
    _.forEach(data.links, function(link) { max = Math.max(max, link.value); });
    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, max]).clamp(true),
        c = d3.scale.category10().domain(d3.range(10));

    var svg = d3.select("#keywordcooccurence").select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .select("g.main")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var matrix = [],
          nodes = data.nodes,
          n = nodes.length;

      // Compute index per node.
      nodes.forEach(function(node, i) {
        node.index = i;
        node.count = 0;
        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
      });

      // Convert links to matrix; count character occurrences.
      var values = [];
      data.links.forEach(function(link) {
        matrix[link.source][link.target].z = link.value;
        matrix[link.target][link.source].z = link.value;
        nodes[link.source].count += link.value;
        nodes[link.target].count += link.value;
        values.push(link.value);
      });
      values.sort();

      var groupqueue = [];
      var seen = [];
      for (var i = 0; i < nodes.length; i++) {
        if (!groupqueue.length){
          var min_node = _.min(_.difference(nodes, seen), 'count');
          groupqueue.push(min_node);
          seen.push(min_node);
          i--;
        }
        else {
          var thisnode = groupqueue.shift();
          thisnode.group = i;
          var thisidx = _.indexOf(nodes, thisnode);
          var childnodes = [];
          for (var l = 0; l < matrix.length; l++) {
            //console.log(matrix[thisidx][l], values[values.length/2]);
            if (matrix[thisidx][l].z > values[values.length/2]) {
              childnodes.push(nodes[l]);
            }
          }
          childnodes = _.difference(childnodes, seen);
          // add them to seen
          seen = seen.concat(childnodes);
          // order them by count
          childnodes = _.sortBy(childnodes, 'count').reverse();
          // add ordered to groupque
          groupqueue = groupqueue.concat(childnodes);
        }
      }

      // Precompute the orders.
      var orders = {
        name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
        count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
        group: d3.range(n).sort(function(a, b) { return nodes[a].group - nodes[b].group; })
      };

      // The default sort order.
      x.domain(orders.count);

      svg.select("rect.background")
          .attr("width", width)
          .attr("height", height);

      var mouseover = function(p) {
        svg.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
        svg.selectAll(".column text").classed("active", function(d, i) {  return i == p.x; });
      };

      var mouseout = function () {
        svg.selectAll("text").classed("active", false);
      };

      var row = function(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function(d) { return d.z; }));

          cell.enter().append("rect");
          cell.attr("class", "cell")
            .attr("x", function(d) { return x(d.x); })
            .attr("width", x.rangeBand())
            .attr("height", x.rangeBand())
            .style("fill-opacity", function(d) { return z(d.z); })
            .style("fill", "rgb(34, 94, 168)" )
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
      };

      var rows = svg.selectAll(".row")
          .data(matrix);
      rows.exit().remove();

      var newrows = rows.enter().append("g")
          .attr("class", "row");

      rows.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
          .each(row);

      newrows.append("line");
      rows.select("line").attr("x2", width);

      newrows.append("text");
      rows.select("text")
          .attr("x", -6)
          .attr("y", x.rangeBand() / 2)
          .attr("dy", ".32em")
          .attr("text-anchor", "end")
          .text(function(d, i) { return nodes[i].name; });

      var column = svg.selectAll(".column")
          .data(matrix);
          column.exit().remove();
      var newcolumns = column.enter().append("g")
          .attr("class", "column");
        column
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

      newcolumns.append("line");
      column.select("line").attr("x1", -width);

      newcolumns.append("text");
      column.select("text")
          .attr("x", 6)
          .attr("y", x.rangeBand() / 2)
          .attr("dy", ".32em")
          .attr("text-anchor", "start")
          .text(function(d, i) { return nodes[i].name; });



      var order = function(value, duration) {
        if (duration === undefined) {
          duration = 1000;
        }
        x.domain(orders[value]);

        var t = svg.transition().duration(duration);

        t.selectAll(".row")
            .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
          .selectAll(".cell")
            .attr("x", function(d) { return x(d.x); });
        t.selectAll(".column")
            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
      };

      order(this.cooccurence_matrix_order_modes[this.cooccurence_matrix_order % this.cooccurence_matrix_order_modes.length], 0);
      svg.on("click", _.bind(function() {
        this.cooccurence_matrix_order++;
        order(this.cooccurence_matrix_order_modes[this.cooccurence_matrix_order % this.cooccurence_matrix_order_modes.length]);
      }, this));


  }
});
