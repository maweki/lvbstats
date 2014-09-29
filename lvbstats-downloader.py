#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats
import lvbstats.paths
from lvbstats.twit import twitter_login

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

target = 'lvb_direkt'
db_filename = lvbstats.paths.get_db_filename()

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    parser.add_argument('--tweetcount', default=200, type=int, help='Default number of tweets to load')
    parser.add_argument('--fromid', type=int, help="Set a tweetid to start from.")

    mutex_group.add_argument('--history', help='Download full history', action='store_true')
    parser.add_argument('--history_delay', default=90, type=int, help='Delay between history requests in seconds')

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
            persisted_tweet = db.do_persist(s)
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

def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    from lvbstats import lvbdb
    db = lvbdb.open(db_filename)

    if args.version:
        print_version()
        exit(0)

    api = twitter_login()
    last_id = None

    if args.history:
        download_history(api, db, args.tweetcount, args.history_delay)
        db.close()
        exit(0)

    try:
        last_id = db.get_last_tweetid()
    except ValueError:
        last_id = None

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
        persisted_tweet = db.do_persist(s)
        if persisted_tweet and (not last_id or int(last_id) < int(persisted_tweet)):
            last_id = int(persisted_tweet)

    if last_id:
        log.info('Lastid: %d', last_id)

    db.close()

if __name__ == "__main__":
    import lvbstats.lvbdb
    lvbstats.options = options = parse_args()
    main(options)
