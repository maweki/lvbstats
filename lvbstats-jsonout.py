#!/usr/bin/python3

from lvbstats import VERSION
import lvbstats.paths
import json
import os
import gzip
import re

options = None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description='Reads @lvb_direkt\'s Twitter feed and saves statistics on it',
                                     epilog=('Version: ' + VERSION))

    return parser.parse_args()

class UnusableTweetException(Exception):
    pass

line_regex = re.compile(r"^(?:(?:TRAM|BUS) ?)?((?:N )?\d{1,3}(?:(?: ?SEV)|E)?)$", re.IGNORECASE)
excl_regex = re.compile(r"^\d{1,2}:\d{2} ?Uhr", re.IGNORECASE)

def tweet_deleted(json_in):
    online = json_in.get("online", None)
    if online is None:
        return None
    else:
        return not online

def tweet_lines(json_in):

    text = json_in["text"]
    lines_str, _, __ = json_in["text"].partition(":")
    lines = (l.strip() for l in lines_str.split(","))
    try:
        return list(line_regex.match(l).group(1) for l in lines)
    except:
        raise UnusableTweetException()

def tweet_date(json_in):
    from datetime import datetime
    created_at = datetime.strptime(json_in['created_at'], '%a %b %d %X %z %Y').timestamp()
    return int(created_at)

def tweet_text(json_in):
    if 'fulltext' in json_in and json_in['fulltext']:
        return json_in['fulltext']
    if excl_regex.match(json_in['text']):
        raise UnusableTweetException()
    # text is from tweet
    _, __, text = json_in['text'].partition(':')
    if 'http://' in text:
        text, _, __ = text.rpartition('http://')
    text = text.strip(' .')
    return text


def tweet_json(json_in):
    tweetid = json_in['id']
    jsondata = {}
    jsondata['deleted'] = tweet_deleted(json_in)
    jsondata['lines'] = tweet_lines(json_in)
    jsondata['text'] = tweet_text(json_in)
    jsondata['date'] = tweet_date(json_in)
    return '"{id}" : {json}'.format(id=tweetid, json=json.dumps(jsondata, ensure_ascii=False))


def main():
    dbpath = lvbstats.paths.get_db_path()
    tweetpaths = (os.path.join(dbpath, f) for f in os.listdir(dbpath) if f.isnumeric())

    def get_tweet_json(tweetpath):
        from lvbstats.tweets import get_tweet_file
        try:
            with get_tweet_file(tweetpath) as tweetfile:
                tweet = json.loads(tweetfile.read().decode())
                return tweet_json(tweet)
        except UnusableTweetException:
            return None

    print("{", end='')
    jsons = (get_tweet_json(tweetpath) for tweetpath in tweetpaths)
    jsons_filtered = (j for j in jsons if j)
    this = next(jsons_filtered)
    while True:
        try:
            print(this, end='')
            this = next(jsons_filtered)
            print(', ', end='')
        except StopIteration:
            break
    print("}")

    exit(0)


if __name__ == "__main__":
    options = parse_args()
    main()
