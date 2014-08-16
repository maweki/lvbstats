import os
BASE_PATH = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))

def get_db_filename(base_path=None, infix=None):
    if not base_path:
        base_path = BASE_PATH
    if not infix:
        return os.path.join(base_path, 'data', 'lvb_direkt.jsondb')
    else:
        return os.path.join(base_path, 'data', 'lvb_direkt.' + str(infix) + '.jsondb')

def get_shelve_filename(base_path=None, infix=None):
    if not base_path:
        base_path = BASE_PATH
    if not infix:
        return os.path.join(base_path, 'data', 'lvb_direkt.db')
    else:
        return os.path.join(base_path, 'data', 'lvb_direkt.' + str(infix) + '.db')

def get_pid_filename(base_path=None):
    if not base_path:
        base_path = BASE_PATH
    return os.path.join(base_path, 'data', 'streamwatch.pid')
