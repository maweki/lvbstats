import shelve
import logging
from tweets import date_from_created_at, entry_to_tuple

log = logging.getLogger('lvbstats')
options = None

def open(filename, flag='c', protocol=None, writeback=False):
    return Shelf(filename, flag, protocol, writeback)

class Shelf(shelve.DbfilenameShelf):
    def get_last_tweetid(self):
        return max(int(tweetid) for tweetid in self.keys())

    def do_persist(self, tweet):
        tweet_id, data = entry_to_tuple(tweet)
        date, lines, longest_words = data
        if lines and longest_words:
            from datetime import datetime
            log.info('\t%d,\t%s - %s', tweet_id, data, str(datetime.fromtimestamp(date)))
            if not options.nopersist:
                self[str(tweet_id)] = {'date': date, 'lines': lines, 'longest_words': longest_words}
            return tweet_id
        return None

class DudShelf(object):
    def sync(self):
        pass

    def close(self):
        pass
