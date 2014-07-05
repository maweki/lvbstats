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

  update_charts: function() {
    console.log('Update Charts');
    this.refresh_historical_chart(this.filter_events_by_line(this.data.events));
    this.create_heatmap(this.filter_events_by_line(this.data.events));
  },

  read_filters_lines: function() {
    var lines_filter_checkboxes = $("#filterModal fieldset.linesFilter input[type=checkbox]:checked");
    var active_filters = [];
    $(lines_filter_checkboxes).each(function(){
      active_filters.push($(this).attr("name"));
    });
    return active_filters;
  },

  filter_events_by_line: function(events, lines_to_keep) {
    if (!lines_to_keep) {
      lines_to_keep = this.read_filters_lines();
    }
    return _.filter(events, function(event){
      return _.contains(lines_to_keep, event.line);
    });
  }
});
