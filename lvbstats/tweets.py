import gzip
import json
import os
from functools import wraps
import logging
log = logging.getLogger('lvbstats')

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
        if attr in orig_tweet:
            new_tweet[attr] = orig_tweet[attr]

    if "user" in orig_tweet:
        new_tweet["user"] = {}
        for attr in ("followers_count", "friends_count", "id", "statuses_count"):
            new_tweet["user"][attr] = orig_tweet["user"][attr]

    for attr in ("online", "fulltext"): # my attributes
        if attr in orig_tweet:
            new_tweet[attr] = orig_tweet[attr]
    return new_tweet

@prime
def tweetsaver(overwrite=False):
    from .paths import get_db_path
    while True:
        thistweet = yield
        purged = purge_tweet(thistweet)
        tweetid = purged["id"]
        path = os.path.join(get_db_path(), str(tweetid))
        if not overwrite and os.path.exists(path):
            continue
        with gzip.open(path, 'w') as f:
            s = json.dumps(purged)
            f.write(s.encode("utf-8"))

class LvbText(object):
    @staticmethod
    def lines_from_text(text):
        if not ': ' in text:
            return []
        else:
            def to_int_optional(num):
                if str(num).isdigit():
                    return int(num)
                else:
                    return str(num)

            lines_str, _, _ = text.partition(':')
            lines = list(to_int_optional(l) for l in lines_str.split(', ') if len(l) <= 3)
            return lines

    @staticmethod
    def longest_words(text):
        from more_itertools import unique_justseen
        info_text = text
        words = sorted((item.strip('".,:!?/ \n()') for item in info_text.split(' ') if not (item.startswith('http://'))),
                       key=len, reverse=True)
        unique_words = unique_justseen(words)
        return list(word for word in unique_words if len(word) > 3)

def date_from_created_at(cr):
    from datetime import datetime

    created_at = datetime.strptime(cr, '%a %b %d %X %z %Y').timestamp()
    return created_at

def split_text(text):
    if not ': ' in text:
        return '', text
    lines, _, info_text = text.partition(':')
    info_text = info_text.strip()
    return lines, info_text

def get_match(haystack, needle):
    if len(haystack.strip()) < len(needle):
        return None
    from difflib import SequenceMatcher
    matcher = SequenceMatcher(a=needle, b=haystack)
    matching_acc = 0
    for block in matcher.get_matching_blocks():
        _, _, match_count = block
        matching_acc += match_count

    if matching_acc > 0.9 * len(needle):
        for block in matcher.get_matching_blocks():
            needle_idx, _, match_count = block
            if needle_idx == 0 and match_count > 0:
                return needle[:match_count]
    return None

def find_full_text(partial, page):
    for line in page.splitlines():
        log.debug(line)
        match = get_match(line, partial)
        if match and partial.strip():
            start_index = line.find(match)
            line = line[start_index:]
            next_message_index = line.find('+++')
            if next_message_index > -1:
                line = line[:next_message_index]
            next_tag_index = line.find('<')
            if next_tag_index > -1:
                line = line[:next_tag_index]
            line = line.strip(' .\t\n<>*')
            line = line.strip(' *.')
            if line:
                log.info(('Found on web', line))
                return line
    log.info('No Webfind')
    return None

def query_web(text):
    text = text.strip()
    if not text:
        raise ValueError('No text to search web for')
    log.info(('Querying web', text))
    from http.client import HTTPConnection
    v = HTTPConnection("v.lvb.de")
    v.request("GET", "/")
    page = v.getresponse()
    if not page.status == 200:
        return text
    else:
        try:
            if ('Content-Encoding', 'gzip') in page.getheaders():
                from gzip import decompress
                return find_full_text(text, decompress(page.read()).decode('utf-8'))
            return find_full_text(text, page.read().decode('utf-8'))
        except UnicodeDecodeError as e:
            log.error((UnicodeDecodeError, e, 'page headers', page.getheaders()))
            raise

def entry_to_tuple(entry, _query_web=False):
    entry_id = entry['id']
    lines = LvbText.lines_from_text(entry['text'])
    if lines and _query_web and '...' in entry['text']:
        _, text = split_text(entry['text'])
        retries = 4
        while retries:
            from time import sleep
            sleep(10)
            retries -= 1
            try:
                webresult = query_web(text[0:-26])
                if webresult:
                    text = webresult
                    break
                continue
            except Exception as e:
                log.error((e, type(e)))
                continue
        else:
            log.info('Couldn\'t retrieve page')
    else:
        _, text = split_text(entry['text'])
        text = text[:-22]
    text = text.strip()
    log.debug(text)

    return entry_id, (date_from_created_at(entry['created_at']),
        lines, LvbText.longest_words(text), text)
