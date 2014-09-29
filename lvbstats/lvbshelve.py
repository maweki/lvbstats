import shelve

class Shelf(shelve.DbfilenameShelf):
    @staticmethod
    def open(path):
        return Shelf(path)

class DudShelf(object):
    def sync(self):
        pass

    def close(self):
        pass
