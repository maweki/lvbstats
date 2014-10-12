$.extend(lvbdata.data, {
  get_tweets_date_range: function(events) {
    var range = {};
    range.max = new Date(_.max(events, 'date').date);
    range.min = new Date(_.min(events, 'date').date);
    return range;
  },

  get_tweets_count: function(raw_data) {
    return _.keys(raw_data).length;
  },

  get_events_count: function(events) {
    return events.length;
  },

  get_keywords_count: function(events) {
    return this.accumulate_words(events).length;
  },

  get_lines_count: function(events) {
    return this.unique_lines(events).length;
  },

  render_tweet_status: function(progress_div, raw_data) {
    var total = _.size(raw_data);
    var ok = _.size(_.filter(raw_data, function(d) { return d.deleted === false; }));
    var del = _.size(_.filter(raw_data, function(d) { return d.deleted === true; }));
    var unk = _.size(_.filter(raw_data, function(d) { return d.deleted === undefined; }));
    $(progress_div).children('.status-ok').attr('style', 'width:' + ok/total*100 + '%');
    $(progress_div).children('.status-unk').attr('style', 'width:' + unk/total*100 + '%');
    $(progress_div).children('.status-del').attr('style', 'width:' + del/total*100 + '%');
    $(progress_div).children('.status-del').children('span').text(del);
    $(progress_div).children('.status-unk').children('span').text(unk);
    $(progress_div).children('.status-ok').children('span').text(ok);
  },

  render_statistics: function() {
    var main = $('#general_stats');
    $(main).find('.tweetnum').text(this.get_tweets_count(this.raw_data));
    $(main).find('.eventnum').text(this.get_events_count(this.events));
    $(main).find('.uniqkeywords').text(this.get_keywords_count(this.events));
    $(main).find('.uniqlines').text(this.get_lines_count(this.events));
    var daterange = this.get_tweets_date_range(this.events);
    $(main).find('.tweetsfrom').text(daterange.min.toLocaleDateString());
    $(main).find('.tweetsto').text(daterange.max.toLocaleDateString());
    this.render_tweet_status($(main).find('.tweetstatus'), this.raw_data);
  }
}
);
