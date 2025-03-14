from flask import jsonify

class APIError(Exception):
    """API错误基类"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status'] = 'error'
        return rv

def error_handler(error):
    """错误处理器"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response 