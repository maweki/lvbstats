#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats
import lvbstats.paths

import logging
logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('lvbstats')

db_filename = lvbstats.paths.get_db_filename()
db_live_filename = lvbstats.paths.get_db_filename(infix='live')

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Checks archived twitter messages for deletion',
                                     epilog=('Version: ' + VERSION))

    parser.add_argument('--download_delay', default=10, type=int, help='Delay between checks')
    parser.add_argument('--max_check', default=30, type=int, help='Maximum tweets to check')
    parser.add_argument('--max_recheck', default=30, type=int, help='Maximum tweets to recheck')

    parser.add_argument('--verbose', help='Enable verbose mode', action="store_true")
    parser.add_argument('--nopersist', help='Do not persist data', action="store_true")

    parser.add_argument('--version', help='Print version information', action='store_true')

    return parser.parse_args()


def print_version():
    print(VERSION)

def check_db(db, delay, check_count, recheck_count, persist):
    allkeys = db.keys()
    to_check = set()
    to_recheck = set()
    log.debug('Scanning entries')
    for key in allkeys:
        entry = db[key]
        if not 'deleted' in entry:
            to_check.add(key)
        else:
            if not entry['deleted']:
                to_recheck.add(key)
    from random import sample
    log.debug(('to check', len(to_check), 'to recheck', len(to_recheck)))
    check = []
    check.extend(sample(to_check, min(check_count, len(to_check))))
    check.extend(sample(to_recheck, min(recheck_count, len(to_recheck))))
    log.info('Checking ' + str(len(check)))

    def get_code(url):
        from urllib.error import URLError
        from urllib.request import urlopen
        try:
            log.debug(('checking:', url))
            response = urlopen(url)
            return response.status
        except URLError as error:
            return error.code

    from time import sleep
    url_prefix = 'https://twitter.com/LVB_direkt/status/'

    for tweetid in check:
        try:
            status = get_code(url_prefix + str(tweetid))
            entry = db[tweetid]
            copy = dict(entry)
            if status == 200:
                entry['deleted'] = False
            elif status == 404:
                entry['deleted'] = True
            else:
                continue
            if persist and copy != entry:
                db.backend[tweetid] = entry
            else:
                log.debug('Not persisting:')
            log.info((tweetid, entry['deleted']))
        except Exception as e:
            log.error(e)
        sleep(delay)

def main(options):
    if not options.verbose:
        log.setLevel(logging.WARNING)

    args = options
    from lvbstats.lvbdb import LvbDB
    from lvbstats.twitdb import TwitDB
    db = TwitDB(LvbDB, db_filename)

    check_db(db, options.download_delay, options.max_check, options.max_recheck, not options.nopersist)

    live_db = TwitDB(LvbDB, db_live_filename)
    check_db(live_db, options.download_delay, options.max_check, options.max_recheck, not options.nopersist)

    if args.version:
        print_version()
        exit(0)



if __name__ == "__main__":
    import lvbstats.lvbdb
    lvbstats.options = options = parse_args()
    main(options)
