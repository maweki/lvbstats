import shelve
import logging

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

class LvbText(object):
    @staticmethod
    def lines_from_text(text):
        if not ': ' in text:
            return []
        else:

            def to_int_optional(num):
                if str(num).isdigit():
                    return int(num)
                else:
                    return str(num)

            lines_str, _, _ = text.partition(':')
            lines = list(to_int_optional(l) for l in lines_str.split(', ') if len(l) <= 3)
            return lines

    @staticmethod
    def longest_words(text):
        if not ': ' in text:
            return None
        else:
            from more_itertools import unique_justseen
            _, _, info_text = text.partition(':')
            words = sorted((item.strip('".,:!?/ \n()') for item in info_text.split(' ') if not (item.startswith('http://'))),
                           key=len, reverse=True)
            unique_words = unique_justseen(words)
            return list(word for word in unique_words if len(word) > 3)


def date_from_created_at(cr):
    from datetime import datetime

    created_at = datetime.strptime(cr, '%a %b %d %X %z %Y').timestamp()
    return created_at


def entry_to_tuple(entry):
    entry_id = entry['id']
    return entry_id, (date_from_created_at(entry['created_at']), LvbText.lines_from_text(entry['text']),
                      LvbText.longest_words(entry['text']))
