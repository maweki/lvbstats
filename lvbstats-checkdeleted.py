#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats
import lvbstats.paths
from lvbstats.twit import twitter_login
import os
from random import shuffle
import gzip
import json
import twitter
from time import sleep

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Checks archived twitter messages for deletion',
                                     epilog=('Version: ' + VERSION))

    parser.add_argument('--download_delay', default=10, type=int, help='Delay between checks')
    parser.add_argument('--max_check', default=30, type=int, help='Maximum tweets to check')
    parser.add_argument('--max_recheck', default=30, type=int, help='Maximum tweets to recheck')

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)

def get_online_status(api, tweetid):
    try:
        api.statuses.oembed(_id=tweetid)
        return True
    except twitter.api.TwitterHTTPError as e:
        print(e)
        return False
    except Exception:
        return None

def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options

    if args.version:
        print_version()
        exit(0)

    api = twitter_login()
    dbpath = lvbstats.paths.get_db_path()
    files = os.listdir(dbpath)
    shuffle(files)

    sink = tweetsaver(overwrite=True)
    next(sink)

    to_check = options.max_check
    to_recheck = options.max_recheck
    paths = (os.path.join(dbpath, f) for f in files)
    for f in paths:
        if '.gitignore' in f:
            continue
        with gzip.open(f, 'rb') as fp:
            tweet = json.loads(fp.read().decode())
            status = tweet.get("online", None)
            check_needed = False
            if status is None and to_check > 0: # unchecked
                check_needed = True
                to_check = to_check - 1
            elif status is True and to_recheck > 0: # to recheck
                check_needed = True
                to_recheck = to_recheck - 1

            if check_needed:
                tweet["online"] = get_online_status(api, tweet["id"])
                sink.send(tweet)
                sleep(options.download_delay)

        if to_check == 0 and to_recheck == 0:
            break

if __name__ == "__main__":
    lvbstats.options = options = parse_args()
    main(options)
