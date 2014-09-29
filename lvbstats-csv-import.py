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

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))
    mutex_group = parser.add_mutually_exclusive_group()

    parser.add_argument('infile', type=argparse.FileType('r'))

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--nopersist', help='Do not persist data', action="store_true")

    mutex_group.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)


def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    from lvbstats import lvbdb
    db = lvbdb.open(db_filename)

    if args.version:
        print_version()
        exit(0)

    import csv
    reader = csv.reader(args.infile)
    for cnt, row in enumerate(reader):
        if cnt == 0:
            continue
        from datetime import datetime
        t = datetime.strptime(row[3], '%Y-%m-%d %X %z').strftime('%a %b %d %X %z %Y')
        tweet = {'id': int(row[0]),
                 'created_at': t,
                 'text': row[5]}
        db.do_persist(tweet)

if __name__ == "__main__":
    import lvbstats.lvbdb
    lvbstats.options = options = parse_args()
    main(options)
