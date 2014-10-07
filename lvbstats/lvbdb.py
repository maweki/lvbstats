from tinydb import TinyDB, where
from tinydb.storages import JSONStorage
from tinydb.middlewares import ConcurrencyMiddleware
from lvbstats.lvbshelve import DudShelf


class LvbDB(TinyDB, DudShelf):

    @staticmethod
    def open(path):
        return LvbDB(path, storage=ConcurrencyMiddleware(JSONStorage))

    def keys(self):
        return frozenset(item['id'] for item in self.all())

    def __getitem__(self, key):
        item = self.get(where('id') == key)
        if item:
            return item
        else:
            raise KeyError()

    def __setitem__(self, key, value):
        value['id'] = key
        if self.contains(where('id') == key):
            self.update(value, where('id') == key)
        else:
            self.insert(value)

    def __delitem__(self, key):
        _ = self[key]
        self.remove(where('id') == key)
