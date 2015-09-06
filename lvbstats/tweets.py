import gzip
import json
import os
from functools import wraps

def prime(fun):
    @wraps(fun)
    def wrapper(*args, **kwargs):
        g = fun(*args, **kwargs)
        g.send(None)
        return g
    return wrapper

def purge_tweet(orig_tweet):
    new_tweet = {}
    for attr in ("truncated", "text", "in_reply_to_status_id",
                "in_reply_to_screen_name", "created_at", "retweet_count",
                 "id", "favorite_count", "in_reply_to_user_id"):
        new_tweet[attr] = orig_tweet[attr]

    new_tweet["user"] = {}
    for attr in ("followers_count", "friends_count", "id", "statuses_count"):
        new_tweet["user"][attr] = orig_tweet["user"][attr]

    for attr in ("online", "fulltext"): # my attributes
        if attr in orig_tweet:
            new_tweet[attr] = orig_tweet[attr]
    return new_tweet

@prime
def tweetsaver(overwrite=False, logger=None):
    from .paths import get_db_path
    while True:
        thistweet = yield
        purged = purge_tweet(thistweet)
        tweetid = purged["id"]
        path = os.path.join(get_db_path(), str(tweetid))
        if not overwrite and os.path.exists(path):
            continue
        if logger:
            logger.info(str(purged))
        with gzip.open(path, 'w') as f:
            s = json.dumps(purged)
            f.write(s.encode("utf-8"))
