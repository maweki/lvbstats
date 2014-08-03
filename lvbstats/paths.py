import os
BASE_PATH = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))

def get_shelve_filename(base_path=None):
    if not base_path:
        base_path = BASE_PATH
    return os.path.join(base_path, 'data', 'lvb_direkt.db')

def get_pid_filename(base_path=None):
    if not base_path:
        base_path = BASE_PATH
    return os.path.join(base_path, 'data', 'streamwatch.pid')
