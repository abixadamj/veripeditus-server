from veripeditus import framework as f

class Player(f.Player):
    pass

class AnyChild(f.NPC):
    spawn_osm = {"building": "school"}
    default_image = "schoolkid"

    def on_talk(self):
        return self.say("I can make AR games :)!")
