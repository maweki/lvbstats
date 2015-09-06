import lvbstats.paths
from lvbstats.twit import twitter_login
from lvbstats.tweets import tweetsaver
import sys

tweetid = sys.argv[1]
print(tweetid)

api = twitter_login()
dbpath = lvbstats.paths.get_db_path()
status = api.statuses.show(id=tweetid)
save = tweetsaver()
save.send(status)
