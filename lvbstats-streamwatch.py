#!/usr/bin/python3

VERSION = '0.3.0'
import lvbstats.paths
from lvbstats.twit import twitter_login_stream

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

target = 221056350
shelve_filename = lvbstats.paths.get_shelve_filename()

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter stream and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--nopersist', help='Do not persist data', action="store_true")

    mutex_group.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)

def deploy_mutex():
    pass

def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    from lvbstats import lvbshelve as shelve
    db = shelve.open(shelve_filename)

    if args.version:
        print_version()
        exit(0)


    stream_api = twitter_login_stream()
    stream = stream_api.statuses.filter(follow=target)
    from twitter.stream import TwitterStream, Timeout, HeartbeatTimeout, Hangup
    for tweet in stream:
        if tweet is None:
            pass
        elif tweet is Timeout or tweet is HeartbeatTimeout or tweet is Hangup:
            pass
        elif tweet.get('text'):
            db.do_persist(tweet)
        else:
            # some data
            pass
        db.sync()

    db.close()

if __name__ == "__main__":
    import lvbstats.lvbshelve
    lvbstats.lvbshelve.options = options = parse_args()
    main(options)
