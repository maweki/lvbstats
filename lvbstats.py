import os
from twitter import *

CONSUMER_KEY = 'i795JDFmQlZzlfJpIrQQxZ2RP'
CONSUMER_SECRET = 'ptHQEfq4aBnrUlzX5Wwdlss0iuBaZfhzm9t9OwdAtKqio5UeAC'

target = 'lvb_direkt'

MY_TWITTER_CREDS = os.path.expanduser('~/.twitter_oauth_lvbstats')
if not os.path.exists(MY_TWITTER_CREDS):
    oauth_dance("lvbStats", CONSUMER_KEY, CONSUMER_SECRET,
                MY_TWITTER_CREDS)

oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

twitter = Twitter(auth=OAuth(
    oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))
    
statuses = twitter.statuses.user_timeline(screen_name=target, count=5)

def lines_from_text(text):
    return NotImplemented

def longest_word(text):
    return NotImplemented

def date_from_created_at(cr):
    return NotImplemented

def entry_to_tuple(entry):
    entryid = entry['id']
    return entryid, (lines_from_text(''), date_from_created_at(''), longest_word(''))

for s in statuses:
    print(s['text'], s['id'], s['created_at'])
