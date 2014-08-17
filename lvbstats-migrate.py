#!/usr/bin/python3

import lvbstats.paths

shelve_filename = lvbstats.paths.get_shelve_filename()
jsondb_filename = lvbstats.paths.get_db_filename()
shelve_live_filename = lvbstats.paths.get_shelve_filename(infix='live')
jsondb_live_filename = lvbstats.paths.get_db_filename(infix='live')

def migrate(src_shelve_path, trgt_db_path):
    from lvbstats import lvbshelve as shelve
    from lvbstats import lvbdb
    shlv = shelve.open(src_shelve_path)
    jsdb = lvbdb.open(trgt_db_path)
    for key in shlv.keys():
        jsdb[key] = shlv[key]
    shlv.close()

def main():
    migrate(shelve_filename, jsondb_filename)
    migrate(shelve_live_filename, jsondb_live_filename)
    exit(0)


if __name__ == "__main__":
    main()
