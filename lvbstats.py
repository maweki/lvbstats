#!/usr/bin/python3

import os
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
        if not ':' in text:
            return []
        else:

            def to_int_optional(num):
                if str(num).isdigit():
                    return int(num)
                else:
                    return str(num)

            lines_str, _, _ = text.partition(':')
            lines = list(to_int_optional(l) for l in lines_str.split(', '))
            return lines

    @staticmethod
    def longest_words(text):
        if not ':' in text:
            return None
        else:
            _, _, info_text = text.partition(':')
            words = sorted((item.strip('.,:!?/ ') for item in info_text.split(' ') if not item.startswith('http://')),
                           key=len, reverse=True)
            return list(words)[:3]


def date_from_created_at(cr):
    # 'Fri Jun 13 15:50:52 +0000 2014'
    from datetime import datetime

    created_at = datetime.strptime(cr, '%a %b %d %X %z %Y').timestamp()
    return created_at


def entry_to_tuple(entry):
    entry_id = entry['id']
    return entry_id, (date_from_created_at(entry['created_at']), LvbText.lines_from_text(entry['text']),
                      LvbText.longest_words(entry['text']))


def parse_args():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', help='Return the database as a JSON', action="store_true")

    return parser.parse_args()


def return_json(db):
    import json
    result = {}
    for key in db.keys():
        result[key] = db[key]
    json.dumps(result)
    return result

if __name__ == "__main__":
    args = parse_args()
    import shelve
    db = shelve.open(shelve_filename)

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

    statuses = api.statuses.user_timeline(screen_name=target, count=5, since_id=last_id)

    for s in statuses:
        tweet_id, data = entry_to_tuple(s)
        date, lines, longest_words = data
        if lines:
            db[str(tweet_id)] = {'date': date, 'lines': lines, 'longest_words': longest_words}

        if not last_id or int(last_id) < int(tweet_id):
            last_id = int(tweet_id)

    if last_id:
        with open(last_id_filename, 'w') as last_id_file:
            last_id_file.write(str(last_id))
    db.sync()
    db.close()
