$.extend(lvbdata, {
  init_filter_dialog: function() {
    this.init_filter_dialog_lines();
  },

  init_filter_dialog_lines: function() {
    var filter_field = $("#filterModal fieldset.linesFilter");
    var lines = this.data.unique_lines(this.data.events);
    _(lines).forEach(function(line) {
      var html = '<div class="checkbox col-md-1"><label><input checked="checked" name="' + line + '" type="checkbox">' + line + '</label></div>';
      $(html).appendTo(filter_field);
    });
    $("#filterModal fieldset.linesFilter input[type=checkbox]").change(this.update_charts.bind(this));
  },

  init_filter_dialog_keywords: function() {
    $("#filterModal input.keywordfilter").on('input', this.update_charts.bind(this));
    $('#filterModal span.input-group-addon.clear').click(function(){ $("#filterModal input.keywordfilter").val('').trigger('input');  });
  },

  update_charts: _.throttle(function() {
    console.log('Update Charts');

    var filter_values = this.read_filters_keywords();
    this.print_filter_keywords(filter_values);

    var events_filtered = this.filter_events_by_line(this.data.events);
    events_filtered = this.filter_events_by_keywords(events_filtered, filter_values);

    this.refresh_historical_chart(events_filtered);
    this.create_heatmap(events_filtered);
    this.update_bar_chart(events_filtered, 'day');
    this.update_bar_chart(events_filtered, 'hour');
    this.update_pie(events_filtered);
    this.update_keyword_table(events_filtered);
    this.update_sample_tweets(events_filtered);
  }, 1000),

  read_filters_lines: function() {
    var lines_filter_checkboxes = $("#filterModal fieldset.linesFilter input[type=checkbox]:checked");
    var active_filters = [];
    $(lines_filter_checkboxes).each(function(){
      active_filters.push($(this).attr("name"));
    });
    return active_filters;
  },

  filter_exclude_line: function(line) {
    var checkbox = $("#filterModal fieldset.linesFilter input[type=checkbox][name=\""+line+"\"]");
    checkbox.prop('checked', false);
    this.update_charts();
  },

  filter_drilldown_line: function(line) {
    var checkbox = $("#filterModal fieldset.linesFilter input[type=checkbox][name=\""+line+"\"]");
    var checkboxes = $("#filterModal fieldset.linesFilter input[type=checkbox][name!=\""+line+"\"]");
    checkbox.prop('checked', true);
    checkboxes.prop('checked', false);
    this.update_charts();
  },

  read_filters_keywords: function() {
    var filter_values = $("#filterModal input.keywordfilter").val().trim().split(" ");
    filter_values = _.map(filter_values, function(val){ return val.toString().toLowerCase();});
    filter_values = _.filter(filter_values, function(val){ return (val.length > 0); });
    filter_values = _.uniq(filter_values);
    return filter_values;
  },

  print_filter_keywords: function(filter_values) {
    $("#filterModal .keywordcheck").text(filter_values.join(" ODER "));
  },

  filter_events_by_line: function(events, lines_to_keep) {
    if (!lines_to_keep) {
      lines_to_keep = this.read_filters_lines();
    }
    return _.filter(events, function(event){
      return _.contains(lines_to_keep, event.line);
    });
  },

  split_filter_words: function(filter_values) {
    var vals = {positive: [], negative: []};
    for (var idx = 0; idx < filter_values.length; idx++) {
      var needle = filter_values[idx];
      if (needle[0] == '-') {
        if (needle.substring(1).length) {
          vals.negative.push(needle.substring(1));
        }
      }
      else {
        vals.positive.push(needle);
      }
    }
    return vals;
  },

  filter_events_by_keywords: function(events, filter_values) {
    if (!filter_values.length) {
      return events;
    }
    else {
      filter_values = filter_values.sort();
      var filters = this.split_filter_words(filter_values);

      var keep = [];
      if (filters.positive.length) {
        _.forEach(events, function(event){
            var event_words = _.map(event.words, function(val){ return val.toString().toLowerCase();});
            for (var idx_a = 0; idx_a < filters.positive.length; idx_a++) {
              for (var idx_b = 0; idx_b < event_words.length; idx_b++) {
                var haystack = event_words[idx_b];
                var needle = filters.positive[idx_a];
                var find = haystack.search(needle);
                if (find > -1) {
                  keep.push(event);
                  return;
                }
              }
            }
        });
      }
      else {
        keep = events;
      }

      filtered_events = [];
      if (filters.negative.length) {
        _.forEach(keep, function(event){
            var event_words = _.map(event.words, function(val){ return val.toString().toLowerCase();});
            for (var idx_a = 0; idx_a < filters.negative.length; idx_a++) {
              for (var idx_b = 0; idx_b < event_words.length; idx_b++) {
                var haystack = event_words[idx_b];
                var needle = filters.negative[idx_a];
                var find = haystack.search(needle);
                if (find > -1) {
                  return;
                }
              }
            }
            filtered_events.push(event);
        });
      }
      else {
        filtered_events = keep;
      }

      return filtered_events;
    }
  }
});
