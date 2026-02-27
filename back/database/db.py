import sqlite3
from sqlite3 import Error
from contextlib import contextmanager

def get_conn():
    conn = sqlite3.connect("database/db.sqlite")
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_conn()
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Error as e:
        conn.rollback()
        return e
    finally:
        cur.close()
        conn.close()