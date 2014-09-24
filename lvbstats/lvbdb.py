from tinydb import TinyDB, where
from tinydb.storages import JSONStorage
from tinydb.middlewares import ConcurrencyMiddleware
from tweets import date_from_created_at, entry_to_tuple
from lvbshelve import DudShelf
import logging

log = logging.getLogger('lvbstats')
options = None

def open(filename):
    return LvbDB(filename, storage=ConcurrencyMiddleware(JSONStorage))

class LvbDB(TinyDB, DudShelf):
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

    def keys(self):
        return frozenset(item['id'] for item in self.all())

    def __getitem__(self, key):
        item = self.get(where('id') == key)
        if item:
            return item
        else:
            raise KeyError()

    def __setitem__(self, key, value):
        value['id'] = key
        if self.contains(where('id') == key):
            self.update(value, where('id') == key)
        else:
            self.insert(value)

    def __delitem__(self, key):
        _ = self[key]
        self.remove(where('id') == key)
