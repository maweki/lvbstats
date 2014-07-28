import shelve

def open(filename, flag='c', protocol=None, writeback=False):
    return Shelf(filename, flag, protocol, writeback)

class Shelf(shelve.DbfilenameShelf):
    def get_last_tweetid(self):
        return max(int(tweetid) for tweetid in self.keys())
