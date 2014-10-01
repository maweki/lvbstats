import logging
log = logging.getLogger('lvbstats')

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
        _, _, info_text = text.partition(':')
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

def find_full_text(partial, page):
    for line in page.splitlines():
        if partial in line and partial.strip():
            start_index = line.find(partial)
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
                return find_full_text(text, decompress(page.read().decode('utf-8')))
            return find_full_text(text, page.read().decode('utf-8'))
        except UnicodeDecodeError as e:
            log.error((UnicodeDecodeError, e, 'page headers', page.getheaders()))
            return text

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

    return entry_id, (date_from_created_at(entry['created_at']),
        lines, LvbText.longest_words(text), text)
