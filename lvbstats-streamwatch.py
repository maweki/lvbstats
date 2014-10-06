#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats.paths
from lvbstats.twit import twitter_login_stream

import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger('lvbstats')

target = 221056350
db_filename = lvbstats.paths.get_db_filename(infix='live')

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter stream and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    mutex_group.add_argument('--kill', help='Kill existing watcher', action="store_true")

    mutex_group.add_argument('--web', help='Retrieve full text from web', action="store_true", default=True)

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--nopersist', help='Do not persist data', action="store_true")

    mutex_group.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)

def get_existing_pid():
    pidfile_path = lvbstats.paths.get_pid_filename()

    otherpid = -0
    try:
        with open(pidfile_path) as pidfile:
            otherpid = int(pidfile.read())
    except:
        pass
    return otherpid

def kill_existing():
    import os, os.path
    otherpid = get_existing_pid()

    if not os.path.exists('/proc/'+str(otherpid)):
        log.info('Process not active active')
    else:
        os.kill(int(otherpid), 15)
    exit(0)

def deploy_mutex():
    import os, os.path
    pid = os.getpid()
    pidfile_path = lvbstats.paths.get_pid_filename()

    otherpid = get_existing_pid()

    if os.path.exists('/proc/'+str(otherpid)):
        log.info('Process allready active')
        exit(0)
    else:
        with open(pidfile_path, 'w') as pidfile:
            pidfile.write(str(pid))


def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    if args.version:
        print_version()
        exit(0)


    stream_api = twitter_login_stream()
    stream = stream_api.statuses.filter(follow=target)
    from twitter.stream import Timeout, HeartbeatTimeout, Hangup
    for tweet in stream:
        log.debug(tweet)
        if tweet is None:
            pass
        elif tweet is Timeout or tweet is HeartbeatTimeout or tweet is Hangup:
            pass
        elif tweet.get('text'):
            if tweet['user']['id'] != 221056350:
                continue
            from lvbstats.lvbdb import LvbDB
            from lvbstats.twitdb import TwitDB
            db = TwitDB(LvbDB, db_filename)
            db.do_persist(tweet, web=options.web)
        else:
            # some data
            pass

if __name__ == "__main__":
    import lvbstats.lvbdb
    lvbstats.options = options = parse_args()
    if options.kill:
        kill_existing()
    deploy_mutex()
    main(options)
