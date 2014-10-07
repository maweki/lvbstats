#!/usr/bin/python3

import lvbstats.paths

shelve_filename = lvbstats.paths.get_shelve_filename()
jsondb_filename = lvbstats.paths.get_db_filename()
shelve_live_filename = lvbstats.paths.get_shelve_filename(infix='live')
jsondb_live_filename = lvbstats.paths.get_db_filename(infix='live')

def migrate(src_shelve_path, trgt_db_path):
    from lvbstats import lvbshelve
    from lvbstats import lvbdb
    from lvbstats.twitdb import TwitDB
    shlv = TwitDB(lvbshelve.Shelf, src_shelve_path)
    jsdb = TwitDB(lvbdb.LvbDB, trgt_db_path)
    for key in shlv.keys():
        jsdb[key] = shlv[key]
    shlv.close()

def main():
    migrate(shelve_filename, jsondb_filename)
    migrate(shelve_live_filename, jsondb_live_filename)
    exit(0)


if __name__ == "__main__":
    main()
