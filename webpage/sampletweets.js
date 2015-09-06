$.extend(lvbdata, {
  update_sample_tweets: function(events) {
    $('#sampletweets + p > span.filteredcount').text(events.length);

    var tweetsdiv = $('#sampletweetsdiv');
    var to_remove = tweetsdiv.children();
    var sampletweetids = _.uniq(_.sample(_.pluck(events, 'tweetid'), 5));
    while (sampletweetids.length) {
      var thisid = sampletweetids.pop();
      var thistweet = this.data.raw_data[thisid];
      var delicon = '';
      if (thistweet.deleted === null) {
        delicon = '<span data-toggle="tooltip" data-placement="right" title="Tweetstatus unbekannt" class="glyphicon glyphicon-question-sign"></span>';
      } else if (thistweet.deleted) {
        delicon = '<span data-toggle="tooltip" data-placement="right" title="Tweet gelöscht" class="glyphicon glyphicon-remove-sign"></span>';
      }
      else {
        delicon = '<span data-toggle="tooltip" data-placement="right" title="Tweet wahrscheinlich noch vorhanden" class="glyphicon glyphicon-ok-sign"></span>';
      }
      var html = '<a href="https://twitter.com/LVB_direkt/status/'+ thisid +'" class="list-group-item" target="_blank">';
      html += '<h4 class="list-group-item-heading">Tweet ' + thisid + ' ' + delicon + '</h4>';
      html += '<p class="list-group-item-text">Linien: ' + thistweet.lines.join(', ') + '</p>';
      html += '<p class="list-group-item-text">Schlüsselwörter: ' + thistweet.longest_words.join(', ')  + '</p>';
      html += '<p class="list-group-item-text">Datum und Uhrzeit: '+ thistweet.date.toLocaleString() +'</p>';
      if (thistweet.text) {
        html += '<p class="list-group-item-text">Volltext: '+ thistweet.text +'</p>';
      }
      html += '</a>';
      tweetsdiv.append(html);
    }
    tweetsdiv.find('*[data-toggle="tooltip"]').tooltip();
    to_remove.remove();
    $('#sampletweets + p > span.filteredtweetscount').text(_.uniq(_.pluck(events, 'tweetid')).length);
  }
});
