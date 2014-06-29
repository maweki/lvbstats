#!/usr/bin/python3
import os

VERSION = '0.2.0'
from twitter import *

base_path = os.path.dirname(os.path.realpath(__file__))

target = 'lvb_direkt'
shelve_filename = os.path.join(base_path, 'data', 'lvb_direkt.db')
last_id_filename = os.path.join(base_path, 'data', 'lastid')


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
            _, _, info_text = text.partition(':')
            words = sorted((item.strip('.,:!?/ ') for item in info_text.split(' ') if not item.startswith('http://')),
                           key=len, reverse=True)
            return list(words)[:3]


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
    parser.add_argument('--tweetcount', default=200, type=int, help='Default number of tweets to load')
    parser.add_argument('--fromid', type=int, help="Set a tweetid to start from.")
    parser.add_argument('--json', help='Return the database as a JSON', action="store_true")
    parser.add_argument('--debug', help='Enable debug mode', action="store_true")
    parser.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)


def return_json(db):
    import json
    result = {}
    for key in db.keys():
        result[key] = db[key]
    return json.dumps(result, indent=2)

if __name__ == "__main__":
    args = parse_args()
    import shelve
    db = shelve.open(shelve_filename)

    if args.version:
        print_version()
        from sys import exit
        exit(0)

    if args.json:
        print(return_json(db))
        db.close()
        from sys import exit
        exit(0)

    api = twitter_login()
    last_id = None

    if os.path.exists(last_id_filename):
        with open(last_id_filename) as last_id_file:
            try:
                last_id = int(last_id_file.read())
            except:
                pass

    tweet_count = args.tweetcount
    from_id = None

    if args.fromid:
        last_id = None
        from_id = args.fromid


    if args.debug:
        print('Requesting', tweet_count, 'from', last_id)
    twitter_args = {'screen_name': target, 'count': tweet_count, 'exclude_replies': 'true'}

    if from_id:
        twitter_args['max_id'] = from_id

    if last_id:
        twitter_args['since_id'] = last_id
    statuses = api.statuses.user_timeline(**twitter_args)

    for s in statuses:
        tweet_id, data = entry_to_tuple(s)
        date, lines, longest_words = data
        if lines:
            if args.debug:
                from datetime import datetime
                print(tweet_id, data, str(datetime.fromtimestamp(date)))
            db[str(tweet_id)] = {'date': date, 'lines': lines, 'longest_words': longest_words}

        if not last_id or int(last_id) < int(tweet_id):
            last_id = int(tweet_id)

    if last_id:
        if args.debug:
            print('Lastid:', last_id)
        with open(last_id_filename, 'w') as last_id_file:
            last_id_file.write(str(last_id))
    db.sync()
    db.close()
