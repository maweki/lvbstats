#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats
import lvbstats.paths
from lvbstats.twit import twitter_login
from lvbstats.tweets import tweetsaver

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

target = 'lvb_direkt'

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    parser.add_argument('--tweetcount', default=200, type=int, help='Default number of tweets to load')

    mutex_group.add_argument('--history', help='Download full history', action='store_true')
    parser.add_argument('--history_delay', default=90, type=int, help='Delay between history requests in seconds')

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")

    mutex_group.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()

def print_version():
    print(VERSION)

def download_history(api, tweet_count=200, download_delay=90):
    saver = tweetsaver(logger=log)

    max_id = None
    while True:
        twitter_args = {'screen_name': target, 'count': tweet_count, 'exclude_replies': 'true'}
        if max_id:
            twitter_args['max_id'] = max_id
        statuses = api.statuses.user_timeline(**twitter_args)
        for s in statuses:
            s["online"] = None
            saver.send(s)
            persisted_tweet = s["id"]
            if max_id is None:
                max_id = persisted_tweet
            if persisted_tweet and max_id and (int(max_id) > int(persisted_tweet)):
                max_id = int(persisted_tweet)
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

    if args.version:
        print_version()
        exit(0)

    api = twitter_login()

    if args.history:
        download_history(api, args.tweetcount, args.history_delay)
        exit(0)

    tweet_count = args.tweetcount
    log.info('Requesting %d', tweet_count)
    twitter_args = {'screen_name': target, 'count': tweet_count, 'exclude_replies': 'true'}

    save = tweetsaver()
    statuses = api.statuses.user_timeline(**twitter_args)

    for s in statuses:
        s["online"] = None
        save.send(s)

if __name__ == "__main__":
    lvbstats.options = options = parse_args()
    main(options)
