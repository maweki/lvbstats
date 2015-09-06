def _twitter_login(constructor):
    import os
    from twitter import oauth_dance, OAuth, read_token_file
    CONSUMER_KEY = 'i795JDFmQlZzlfJpIrQQxZ2RP'
    CONSUMER_SECRET = 'ptHQEfq4aBnrUlzX5Wwdlss0iuBaZfhzm9t9OwdAtKqio5UeAC'

    MY_TWITTER_CREDS = os.path.expanduser('~/.twitter_oauth_lvbstats')
    if not os.path.exists(MY_TWITTER_CREDS):
        oauth_dance("lvbStats", CONSUMER_KEY, CONSUMER_SECRET,
                    MY_TWITTER_CREDS)

    oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

    twitter = constructor(auth=OAuth(
        oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))
    return twitter

def twitter_login():
    from twitter import Twitter
    return _twitter_login(Twitter)
twitter_login_api = twitter_login

def twitter_login_stream():
    from twitter import TwitterStream
    return _twitter_login(TwitterStream)
