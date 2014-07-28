#!/usr/bin/python3

import lvbstats.paths
shelve_filename = lvbstats.paths.get_shelve_filename()

if __name__ == "__main__":
    from lvbstats import lvbshelve as shelve
    db = shelve.open(shelve_filename)
    print(db.get_last_tweetid())
