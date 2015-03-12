$.extend(lvbdata, {
  init_filter_dialog: function() {
    this.init_filter_dialog_lines();
    this.init_filter_dialog_daterange();
    this.init_filter_dialog_status();
  },

  init_filter_dialog_lines: function() {
    var filter_field = $("#filterModal fieldset.linesFilter");
    var lines = this.data.unique_lines(this.data.events);
    _.forEach(lines, function(line) {
      var html = '<div class="checkbox col-md-1"><label><input checked="checked" name="' + line + '" type="checkbox">' + line + '</label></div>';
      $(html).appendTo(filter_field);
    });
    $("#filterModal fieldset.linesFilter input[type=checkbox]").change(this.update_charts.bind(this));
  },

  init_filter_dialog_keywords: function() {
    $("#filterModal input.keywordfilter").on('input', this.update_charts.bind(this));
    $('#filterModal span.input-group-addon.keyword-clear').click(function(){ $("#filterModal input.keywordfilter").val('').trigger('input');  });
  },

  init_filter_dialog_daterange: function() {
    var daterange = this.data.get_tweets_date_range(this.data.events);
    this.daterange_el = $('#filterModal .input-daterange').datepicker({
      format: "d.m.yyyy",
      startDate: daterange.min.toLocaleDateString(),
      endDate: daterange.max.toLocaleDateString(),
      language: "de",
      calendarWeeks: true,
      autoclose: true
    });
    this.reset_filter_dialog_daterange();
    this.daterange_el.children('.date-clear').click(this.reset_filter_dialog_daterange.bind(this));
    this.daterange_el.children('input').datepicker().on("changeDate", this.update_charts.bind(this));
  },

  init_filter_dialog_status: function() {
    $('#filterModal input[name="tweetStatusSelect"]').on('change', this.update_charts.bind(this));
  },

  get_default_daterange: _.memoize(function() {
      return this.data.get_tweets_date_range(this.data.events);
  }),

  reset_filter_dialog_daterange: function() {
    var daterange = this.get_default_daterange();
    var endInput = this.daterange_el.children('[name="end"]'),
      startInput = this.daterange_el.children('[name="start"]');
    startInput.val(daterange.min.toLocaleDateString());
    endInput.val(daterange.max.toLocaleDateString());
    $(endInput).datepicker("update");
    $(startInput).datepicker("update");
  },

  read_filter_daterange: function() {
    var endInput = this.daterange_el.children('[name="end"]'),
      startInput = this.daterange_el.children('[name="start"]');
    var endDate = new Date($(endInput).datepicker("getDate"));
    endDate.setDate($(endInput).datepicker("getDate").getDate() + 1);
    return {
      start: $(startInput).datepicker("getDate"),
      end: endDate
    };
  },

  filter_events_by_date_range: function(events, daterange) {
    var start = daterange.start,
      end = daterange.end;
    return _.filter(events, function(ev){ return (ev.date > start && ev.date < end); });
  },

  get_filter_status: function() {
    return $('#filterModal input[name="tweetStatusSelect"]:checked').val();
  },

  filter_events_by_status: function(events, status) {
    if (!status) {
      status = this.get_filter_status();
    }
    if (status == 'all') { return events; }

    if (status == 'deleted-only') {
      return _.filter(events, function(d) { return d.deleted; });
    }
    return events;
  },

  update_charts: _.throttle(function() {
    console.log('Update Charts');

    var filter_values = this.read_filters_keywords();
    var daterange = this.read_filter_daterange();
    this.print_filter_keywords(filter_values);

    var events_filtered = this.filter_events_by_line(this.data.events);
    events_filtered = this.filter_events_by_date_range(events_filtered, daterange);
    events_filtered = this.filter_events_by_keywords(events_filtered, filter_values);
    events_filtered = this.filter_events_by_status(events_filtered);

    this.refresh_historical_chart(events_filtered);
    this.create_heatmap(events_filtered);
    this.update_bar_chart(events_filtered, 'day');
    this.update_bar_chart(events_filtered, 'hour');
    this.update_pie(events_filtered);
    this.update_keyword_table(events_filtered);
    this.update_sample_tweets(events_filtered);
    this.update_cooccurence_matrix(events_filtered);

    var t = this;
    _.defer(function(){t.setFilterUrlField(t.filtersToUrl());});
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
  },

  urlToFilters: function() {
      var m = new URI(_.trim(document.URL,'/')).search(true),
      fixarr = ['kw', 'lin', 'lex'],
      any = false;

      while (fixarr.length) {
        var s = fixarr.pop();
        if (m[s] && _.isString(m[s])) { m[s] = [m[s]]; }
      }

      if (m.to) {
        this.daterange_el.children('[name="end"]').val(new Date(Date.parse(m.to)).toLocaleDateString()).datepicker("update");
      }

      if (m.from) {
        this.daterange_el.children('[name="start"]').val(new Date(Date.parse(m.from)).toLocaleDateString()).datepicker("update");
      }

      if (m.lex) {
        _.forEach(m.lex, this.filter_exclude_line, this);
      }

      if (m.lin) {
        _.forEach(_.difference(this.data.unique_lines(this.data.events),m.lin),this.filter_exclude_line, this);
      }

      if (m.kw) {
        $("#filterModal input.keywordfilter").val(m.kw.join(' '));
        any = any || true;
      }

      if (m.status) {
        $('#filterModal input[name="tweetStatusSelect"][value="'+m.status+'"]').attr('checked', true).change();
      }
      if (any) this.update_charts();
  },

  filtersToUrl: function() {
      var sameDate = function(a, b) {
        return (a.getFullYear() == b.getFullYear()) && (a.getDate() == b.getDate()) && (a.getMonth() == b.getMonth());
      };

      var url = new URI(document.URL),
      kws = this.read_filters_keywords(),
      f_lines = this.read_filters_lines(),
      all_lines = this.data.unique_lines(this.data.events);

      // keywords
      if (!_.isEmpty(kws)) {
        url.setSearch("kw", kws);
      }
      else {
        url.removeSearch("kw");
      }

      // lines
      url.removeSearch("lin");
      url.removeSearch("lex");
      if (!_.isEmpty(_.difference(all_lines, f_lines))) {
        if (f_lines.length > all_lines.length / 2) { // less lines are excluded
            url.setSearch("lex", _.difference(all_lines, f_lines));
        }
        else { // less lines are included
            url.setSearch("lin", f_lines);
        }
      }

      // dates
      var daterange = this.read_filter_daterange(),
      daterange_default = this.get_default_daterange(),
      showdate;
      if (daterange_default.min.toLocaleDateString() == daterange.start.toLocaleDateString()) {
        url.removeSearch('from');
      }
      else {
        showdate = new Date(daterange.start + 1);
        url.setSearch('from', showdate.getFullYear() + '-' + (showdate.getMonth() + 1) + '-' + showdate.getDate());
      }

      var datelimit = new Date();
      datelimit.setDate(daterange_default.max.getDate() + 1);
      if (sameDate(datelimit, daterange.end)) {
        url.removeSearch('to');
      }
      else {
        showdate = new Date(daterange.end - 1);
        url.setSearch('to', showdate.getFullYear() + '-' + (showdate.getMonth() + 1) + '-' + showdate.getDate());
      }

      // deletemode
      if (this.get_filter_status() == 'all') {
        url.removeSearch('status');
      }
      else {
        url.setSearch('status', this.get_filter_status());
      }

      return url.toString();
  },

  setFilterUrlField: function(url) {
      $("#filterModal input.filter-url").val(url);
  }
});
