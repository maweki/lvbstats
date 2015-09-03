VERSION = '0.7.1'

options = None

from enum import Enum

class DownloadMode(Enum):
    nightly = 1
    archive = 2
    live = 3
    jsonimport = 4
