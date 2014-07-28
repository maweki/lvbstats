#!/usr/bin/python3
import os

VERSION = '0.3.0'
from twitter import *
import lvbstats.paths

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

target = 'lvb_direkt'
shelve_filename = lvbstats.paths.get_shelve_filename()

options = None


def twitter_login():
    CONSUMER_KEY = 'i795JDFmQlZzlfJpIrQQxZ2RP'
    CONSUMER_SECRET = 'ptHQEfq4aBnrUlzX5Wwdlss0iuBaZfhzm9t9OwdAtKqio5UeAC'

    MY_TWITTER_CREDS = os.path.expanduser('~/.twitter_oauth_lvbstats')
    if not os.path.exists(MY_TWITTER_CREDS):
        oauth_dance("lvbStats", CONSUMER_KEY, CONSUMER_SECRET,
                    MY_TWITTER_CREDS)

    oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

    twitter = Twitter(auth=OAuth(
        oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))
    return twitter


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


def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    parser.add_argument('--tweetcount', default=200, type=int, help='Default number of tweets to load')
    parser.add_argument('--fromid', type=int, help="Set a tweetid to start from.")

    mutex_group.add_argument('--history', help='Download full history', action='store_true')
    parser.add_argument('--history_delay', default=90, type=int, help='Delay between history requests in seconds')

    mutex_group.add_argument('--json', help='Return the database as a JSON', action="store_true")
    parser.add_argument('--jsonstyle', type=str, default='indent', help='Style of JSON (plain or indent)')

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--nopersist', help='Do not persist data', action="store_true")

    mutex_group.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)


def download_history(api, db, tweet_count=200, download_delay=90):
    max_id = None
    while True:
        twitter_args = {'screen_name': target, 'count': tweet_count, 'exclude_replies': 'true'}
        if max_id:
            twitter_args['max_id'] = max_id
        statuses = api.statuses.user_timeline(**twitter_args)
        for s in statuses:
            persisted_tweet = do_persist(s, db)
            if max_id is None:
                max_id = persisted_tweet
            if persisted_tweet and max_id and (int(max_id) > int(persisted_tweet)):
                max_id = int(persisted_tweet)
        db.sync()
        if statuses:
            del statuses # free memory
            from time import sleep
            sleep(download_delay)
            continue
        else:
            break



def do_persist(tweet, db):
    tweet_id, data = entry_to_tuple(tweet)
    date, lines, longest_words = data
    if lines and longest_words:
        from datetime import datetime
        log.info('\t%d,\t%s - %s', tweet_id, data, str(datetime.fromtimestamp(date)))
        if not options.nopersist:
            db[str(tweet_id)] = {'date': date, 'lines': lines, 'longest_words': longest_words}
        return tweet_id
    return None


def return_json(db):
    jsonstyle = options.jsonstyle
    import json
    result = {}
    for key in db.keys():
        result[key] = db[key]
    if jsonstyle == 'plain':
        return json.dumps(result)
    elif jsonstyle == 'indent':
        return json.dumps(result, indent=2)
    return json.dumps(result, indent=2)

def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    from lvbstats import lvbshelve as shelve
    db = shelve.open(shelve_filename)

    if args.version:
        print_version()
        exit(0)

    if args.json:
        print(return_json(db))
        db.close()
        exit(0)

    api = twitter_login()
    last_id = None

    if args.history:
        download_history(api, db, args.tweetcount, args.history_delay)
        db.close()
        exit(0)

    last_id = db.get_last_tweetid()

    tweet_count = args.tweetcount
    from_id = None

    if args.fromid:
        last_id = None
        from_id = args.fromid


    log.info('Requesting %d from %d', tweet_count, last_id)
    twitter_args = {'screen_name': target, 'count': tweet_count, 'exclude_replies': 'true'}

    if from_id:
        twitter_args['max_id'] = from_id

    if last_id:
        twitter_args['since_id'] = last_id
    statuses = api.statuses.user_timeline(**twitter_args)

    for s in statuses:
        persisted_tweet = do_persist(s, db)
        if persisted_tweet and (not last_id or int(last_id) < int(persisted_tweet)):
            last_id = int(persisted_tweet)

    if last_id:
        log.info('Lastid: %d', last_id)

    db.sync()
    db.close()

if __name__ == "__main__":
    options = parse_args()
    main(options)
