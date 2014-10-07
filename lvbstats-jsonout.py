#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats.paths

db_filename = lvbstats.paths.get_db_filename()
db_live_filename = lvbstats.paths.get_db_filename(infix='live')

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))

    parser.add_argument('--markdeleted', help='Mark deleted tweets', action="store_true")
    parser.add_argument('--nostatic', help='Don\'t print data from static database', action="store_true")
    parser.add_argument('--nolive', help='Don\'t print data from live/stream database', action='store_true')
    parser.add_argument('--jsonstyle', type=str, default='indent', help='Style of JSON (plain or indent)')

    return parser.parse_args()


def return_json(db, deleted=frozenset()):
    jsonstyle = options.jsonstyle
    import json
    result = {}
    for key in db.keys():
        result[key] = db[key]
        del result[key]['id']
        del result[key]['_id']
        if key in deleted:
            result[key]['deleted'] = True
    if jsonstyle == 'plain':
        return json.dumps(result)
    elif jsonstyle == 'indent':
        return json.dumps(result, indent=2)
    return json.dumps(result, indent=2)

def main():
    from lvbstats.lvbdb import LvbDB
    from lvbstats.twitdb import TwitDB
    db = TwitDB(LvbDB, db_filename)
    live_db =  TwitDB(LvbDB, db_live_filename)

    deleted = frozenset()
    if options.markdeleted:
        last_tweet_id = int(db.get_last_tweetid())
        deleted = set(key for key in (set(live_db.keys()) - set(db.keys())) if int(key) < last_tweet_id)

    if not options.nostatic and not options.nolive:
        uniondict = {}
        for key in db.keys():
            uniondict[key] = db[key]
        for key in live_db.keys():
            uniondict[key] = live_db[key]
        print(return_json(uniondict, deleted))

    if not options.nostatic and options.nolive:
        print(return_json(db, deleted))

    if options.nostatic and not options.nolive:
        print(return_json(live_db, deleted))

    exit(0)


if __name__ == "__main__":
    options = parse_args()
    main()
