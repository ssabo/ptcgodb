#!/usr/bin/env python2.7

import json
from flask import Flask, render_template
from flask.ext.mongokit import MongoKit, Document

app = Flask(__name__)
app.config.update(dict(
    DEBUG=True,
    MONGODB_DATABASE='ptcgodb',

))


class Card(Document):
    structure = {
        'id': int,
        'name': unicode,
        'type': unicode,
        'set': unicode
    }
    required_fields = ['id', 'name', 'type', 'set']

db = MongoKit(app)
db.register([Card])


@app.route("/")
def root():
    return render_template('index.html')


@app.route('/api/cards/<set_id>')
def api_cards(set_id):

    results = db['cards'].Card.find({
        'set': set_id
    }, {
        '_id': 0,
        'name': 1,
        'type': 1,
        'id': 1,
        'set': 1,
    })
    cards = []
    for card in results:
        cards.append(card)
    return json.dumps(cards)


@app.route('/api/cards/<set_id>/<card_id>')
def api_single_card(set_id, card_id):

    results = db['cards'].Card.find_one({
        'set': set_id,
        'id': int(card_id),
    }, {
        '_id': 0,
        'name': 1,
        'type': 1,
        'id': 1,
        'set': 1,
    })
    return json.dumps(results)


@app.route('/api/sets')
def api_sets():
    card_sets = {
        'bw-series': {
            'bw8': 138,
            'bw9': 122,
            'bw10': 105,
            'bw11': 115,
            },
        'xy-series': {
            'xy0': 39,
            'xy1': 146,
            'xy2': 109,
            'xy3': 113,
            },
        }
    return json.dumps(card_sets)

if __name__ == '__main__':
    app.run()