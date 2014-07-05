lvbdata = {
  data: {
    raw_data: {},
    events: {},
    load: function(url, callback) {
      data = this;
      d3.json(url, function(downloaded) {
        console.log(downloaded);
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
        var item = get_acc_obj(ev.date.getDay(), ev.date.getHours());
        item.acc += 1;
      });

      return accu_list;
    },

    accumulate_by_date: function(events) {
      var lookup = {};
      _(events).forEach(function(event){
        var date = event.date.toDateString();
        if (lookup[date]) {
          lookup[date].acc += 1;
        }
        else {
          lookup[date] = {date: new Date(date), acc: 1};
        }
      });
      return _.sortBy(_.values(lookup), 'date');
    },

    accumulate_by_week: function(events) {
      var lookup = {};
      _(events).forEach(function(event){
        var newdate = new Date(event.date - event.date.getDay()*24*60*60*1000);
        var date = newdate.toDateString();
        if (lookup[date]) {
          lookup[date].acc += 1;
        }
        else {
          lookup[date] = {date: new Date(date), acc: 1};
        }
      });
      return _.sortBy(_.values(lookup), 'date');
    }

  },

  init: function(callback) {
    this.data.load('test.json', callback);
  }
};
