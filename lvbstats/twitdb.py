from lvbstats.tweets import entry_to_tuple
from lvbstats import options
import logging

log = logging.getLogger('lvbstats')

from functools import lru_cache

class TwitDB(object):

    def __init__(self, backend_cls, path, *backend_nargs, **backend_kwargs):
        self.backend = backend_cls.open(path, *backend_nargs, **backend_kwargs)

    def get_last_tweetid(self):
        return max(int(tweetid) for tweetid in self.keys())

    def do_persist(self, tweet, override=False, web=False):
        tweet_id, data = entry_to_tuple(tweet, web)
        date, lines, longest_words, text = data
        if lines and longest_words:
            from datetime import datetime
            log.info('\t%d,\t%s - %s', tweet_id, data, str(datetime.fromtimestamp(date)))

            if str(tweet_id) in self.keys() and not override:
                return tweet_id

            if not options.nopersist:
                self.backend[str(tweet_id)] = {'date': date, 'lines': lines, 'longest_words': longest_words, 'text': text}
                self.keys.cache_clear()
            return tweet_id
        return None

    def __getitem__(self, key):
        return self.backend[key]

    @lru_cache()
    def keys(self):
        return frozenset(self.backend.keys())

    def close(self):
        self.backend.close()
