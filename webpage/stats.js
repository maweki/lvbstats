$.extend(lvbdata.data, {
  get_tweets_date_range: function(events) {
    var range = {};
    range.max = _.max(events, 'date').date;
    range.min = _.min(events, 'date').date;
    return range;
  },

  get_tweets_count: function(raw_data) {
    return _.keys(raw_data).length;
  },

  get_events_count: function(events) {
    return events.length;
  },

  render_statistics: function() {
    var main = $('#general_stats');
    $(main).find('.tweetnum').text(this.get_tweets_count(this.raw_data));
    $(main).find('.eventnum').text(this.get_events_count(this.events));
    var daterange = this.get_tweets_date_range(this.events);
    $(main).find('.tweetsfrom').text(daterange.min);
    $(main).find('.tweetsto').text(daterange.max);
  }
}
);
