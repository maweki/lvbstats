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
  },

  update_charts: function() {
    console.log('Update Charts');

    var filter_values = this.read_filters_keywords();
    this.print_filter_keywords(filter_values);

    var events_filtered = this.filter_events_by_line(this.data.events);
    events_filtered = this.filter_events_by_keywords(events_filtered, filter_values);

    this.refresh_historical_chart(events_filtered);
    this.create_heatmap(events_filtered);
    this.update_keyword_table(events_filtered);
  },

  read_filters_lines: function() {
    var lines_filter_checkboxes = $("#filterModal fieldset.linesFilter input[type=checkbox]:checked");
    var active_filters = [];
    $(lines_filter_checkboxes).each(function(){
      active_filters.push($(this).attr("name"));
    });
    return active_filters;
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

  filter_events_by_keywords: function(events, filter_values) {
    if (!filter_values.length) {
      return events;
    }
    else {
      var filtered_events = [];
      _.forEach(events, function(event){
        var event_words = _.map(event.words, function(val){ return val.toString().toLowerCase();});
        if (_.intersection(event_words, filter_values).length > 0) {
          filtered_events.push(event);
        }
      });
      return filtered_events;
    }
  }
});
