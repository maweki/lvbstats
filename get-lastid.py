#!/usr/bin/python3

import lvbstats.paths
shelve_filename = lvbstats.paths.get_shelve_filename()

if __name__ == "__main__":
    import shelve
    db = shelve.open(shelve_filename)
    maxid = max(int(tweetid) for tweetid in db.keys())
    print(maxid)
