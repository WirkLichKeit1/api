from app.extensions import db

class BaseRepository:
    def __init__(self, model):
        self.model = model
    
    def get_by_id(self, id: int):
        return self.model.query.get(id)
    
    def get_all(self):
        return self.model.query.all()
    
    def save(self, instance):
        db.session.add(instance)
        db.session.commit()
        return instance
    
    def delete(self, instance):
        db.session.delete(instance)
        db.session.commit()