lvbdata = {
  data: {
    raw_data: {},
    events: {},
    load: function(url, callback) {
      data = this;
      d3.json(url, function(downloaded) {
        // convert dates
        data.convert_dates(downloaded);

        // save raw data reference
        data.raw_data = downloaded;

        // convert raw data to events
        data.events = data.to_events(downloaded);

        if (callback) { callback(); }
      });
    },

    convert_dates: function(raw_data) {
      _.forOwn(raw_data, function(tweetobj, tweetid){
        tweetobj.date = new Date(tweetobj.date * 1000);
      });
    },

    unique_lines: function(events) {
      var linesort = function(a, b) {
        if (a.length != b.length) {
          return (a.length - b.length);
        }
        else {
          if (a < b) {
            return -1;
          }
          else {
            return 1;
          }
        }
      };
      return _.uniq(_.pluck(events, 'line')).sort(linesort);
    },

    to_events: function(raw_data) {
      result = [];
      _.forOwn(raw_data, function(tweetobj, tweetid){
        _(tweetobj.lines).forEach(function(thisline){
          var newevent = {
            line: thisline.toString(),
            tweetid: tweetid,
            date: tweetobj.date,
            words: tweetobj.longest_words
          };
          result.push(newevent);
        });
      });
      return result;
    },

    accumulate_by_weekday_hour: function(events) {
      accu_list = [];

      var get_acc_obj = function(day, hour) {
        for (var i = 0; i < accu_list.length; i++) {
          var thisitem = accu_list[i];
          if (thisitem.day == day && thisitem.hour == hour) {
            return thisitem;
          }
        }
        var newitem = {day: day, hour: hour, acc: 0};
        accu_list.push(newitem);
        return newitem;
      };

      _(events).forEach(function(ev){
        var item = get_acc_obj((ev.date.getDay()+6)%7, ev.date.getHours());
        item.acc += 1;
      });

      // Fill remaining
      for(var h = 0; h <= 23; h++) {
        for (var d = 0; d <= 6; d++) {
          get_acc_obj(d, h);
        }
      }

      return accu_list;
    },

    accumulate_by_weekday: function(events) {
      res = [];
      for (var day = 0; day <= 6; day++) {
        res.push({day: day, acc: 0});
      }

      var accu_wdh = this.accumulate_by_weekday_hour(events);
      _(accu_wdh).forEach(function(field){
        res[field.day].acc += field.acc;
      });

      return res;
    },

    accumulate_by_hour: function(events) {
      res = [];
      for (var hour = 0; hour <= 23; hour++) {
        res.push({hour: hour, acc: 0});
      }

      var accu_wdh = this.accumulate_by_weekday_hour(events);
      _(accu_wdh).forEach(function(field){
        res[field.hour].acc += field.acc;
      });

      return res;
    },

    accumulate_words: function(events) {
      var lookup = {};

      var add_word = function(word) {
        var lc = word.toLowerCase();
        if (!lookup[lc]) {
          lookup[lc] = {word: word, acc: 0};
        }
        lookup[lc].acc += 1;
      };

      _(events).forEach(function(event){
        _(event.words).forEach(function(word){
          add_word(word);
        });
      });

      return _.sortBy(_.values(lookup), 'acc').reverse();
    },

    accumulate_by_week: function(events) {
      var lookup = {};
      var first_date = new Date();
      _(events).forEach(function(event){
        var newdate = new Date(event.date - ((event.date.getDay()+6)%7)*24*60*60*1000);
        if (newdate < first_date) {
          first_date = newdate;
        }
        var date = newdate.toDateString();
        if (lookup[date]) {
          lookup[date].acc += 1;
        }
        else {
          lookup[date] = {date: new Date(date), acc: 1};
        }
      });

      // fill up
      while (first_date < new Date()) {
        var newdate = new Date(first_date - ((first_date.getDay()+6)%7)*24*60*60*1000);
        var date = newdate.toDateString();
        if (!lookup[date]) {
          lookup[date] = {date: new Date(date), acc: 0};
        }
        first_date.setDate(first_date.getDate() + 7);
      }

      return _.sortBy(_.values(lookup), 'date');
    },

    accumulate_by_day: function(events) {
      var lookup = {};
      var first_date = new Date();
      _(events).forEach(function(event){
        var newdate = new Date(event.date);
        if (newdate < first_date) {
          first_date = newdate;
        }
        var date = newdate.toDateString();
        if (lookup[date]) {
          lookup[date].acc += 1;
        }
        else {
          lookup[date] = {date: new Date(date), acc: 1};
        }
      });

      // fill up
      while (first_date < new Date()) {
        var newdate = new Date(first_date);
        var date = newdate.toDateString();
        if (!lookup[date]) {
          lookup[date] = {date: new Date(date), acc: 0};
        }
        first_date.setDate(first_date.getDate() + 1);
      }

      return _.sortBy(_.values(lookup), 'date');
    },

    accumulate_by_line: function(events) {
      lookup = {};
      _(events).forEach(function(event){
        if (!lookup[event.line]) {
          lookup[event.line] = {line: event.line, acc: 0};
        }
        lookup[event.line].acc += 1;
      });
      return _.sortBy(_.values(lookup), 'acc').reverse();
    }

  },

  margins: {top: 20, right: 30, bottom: 70, left: 50},

  get_main_div_width: function() {
    return $('.main').width();
  },

  get_chart_width: function() {
    return this.get_main_div_width() - this.margins.left - this.margins.right;
  },

  get_half_chart_width: function() {
    return $('.halfchart').width() - this.margins.left - this.margins.right;
  },

  init: function(callback) {
    this.data.load('test.json', callback);
  }
};
