#!/usr/bin/python3

VERSION = '0.4.2'
import lvbstats.paths

shelve_filename = lvbstats.paths.get_shelve_filename()
shelve_live_filename = lvbstats.paths.get_shelve_filename(infix='live')

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))

    parser.add_argument('--nostatic', help='Don\'t print data from static database', action="store_true")
    parser.add_argument('--nolive', help='Don\'t print data from live/stream database', action='store_true')
    parser.add_argument('--jsonstyle', type=str, default='indent', help='Style of JSON (plain or indent)')

    return parser.parse_args()


def return_json(db):
    jsonstyle = options.jsonstyle
    import json
    result = {}
    for key in db.keys():
        result[key] = db[key]
    if jsonstyle == 'plain':
        return json.dumps(result)
    elif jsonstyle == 'indent':
        return json.dumps(result, indent=2)
    return json.dumps(result, indent=2)

def main():
    from lvbstats import lvbshelve as shelve
    db = shelve.open(shelve_filename)
    live_db = shelve.open(shelve_live_filename)

    if not options.nostatic and not options.nolive:
        uniondict = {}
        uniondict.update(db)
        uniondict.update(live_db)
        print(return_json(uniondict))

    if not options.nostatic and options.nolive:
        print(return_json(db))

    if options.nostatic and not options.nolive:
        print(return_json(live_db))

    db.close()
    live_db.close()
    exit(0)


if __name__ == "__main__":
    options = parse_args()
    main()
