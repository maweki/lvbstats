$.extend(lvbdata, {
  update_keyword_table: function(events) {
    var words = this.data.accumulate_words(events).slice(0, 50);
    if (_.isEmpty(words)) { return ; }

    var selector = d3.select('table#top50keywordTable').select('tbody').selectAll('tr').data(words);

    var row = selector.enter().append('tr');
    selector.exit().remove();
    row.append('td').attr('class', 'place');
    row.append('td').attr('class', 'word');
    row.append('td').attr('class', 'count');

    selector.select('td.place').text(function(d, i){ return i + 1; });
    selector.select('td.word').text(function(d){ return d.word; });
    selector.select('td.count').text(function(d){ return d.acc; });
  }
});
