$.extend(lvbdata, {
  update_keyword_table: function(events) {
    var words = this.data.accumulate_words(events).slice(0, 50);

    var selector = d3.select('table#top50keywordTable').select('tbody').selectAll('tr').data(words);

    var row = selector.enter().append('tr');
    selector.exit().remove();
    row.append('td').attr('class', 'place');
    row.append('td').attr('class', 'word');
    row.append('td').attr('class', 'count');
    row.append('td').attr('class', 'filterplus');
    row.append('td').attr('class', 'filterminus');

    selector.select('td.place').text(function(d, i){ return i + 1; });
    selector.select('td.word').text(function(d){ return d.word; });
    selector.select('td.count').text(function(d){ return d.acc; });
    var filter = $("#filterModal input.keywordfilter");

    selector.select('td.filterplus').text(function(d){ return '+' + d.word.toLowerCase(); }).
    on("click", function(d){
      filter.val((filter.val() + ' ' + d.word.toLowerCase()).trim());
      lvbdata.update_charts(); });

    selector.select('td.filterminus').text(function(d){ return '-' + d.word.toLowerCase(); }).
    on("click", function(d){
      filter.val((filter.val() + ' -' + d.word.toLowerCase()).trim());
      lvbdata.update_charts();});
  }
});
