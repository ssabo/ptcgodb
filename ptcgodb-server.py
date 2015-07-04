#!/usr/bin/env python2.7

import json
from flask import Flask, render_template, request
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
def deckbuilder():
    return render_template('deckbuilder.html')

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
        'id': card_id,
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
        'bw-series': [
            ['bwp', 'BW Black Star Promos'],
            ['bw7', 'Boundaries Crossed'],
            ['bw8', 'Plasma Storm'],
            ['bw9', 'Plasma Freeze'],
            ['bw10', 'Plasma Blast'],
            ['bw11', 'Legendary Treasures'],
            ],
        'xy-series': [
            ['xyp', 'XY Black Star Promos'],
            ['xy0', 'Kalos Starter Set'],
            ['xy1', 'XY'],
            ['xy2', 'Flashfire'],
            ['xy3', 'Furious Fists'],
            ['xy4', 'Phantom Forces'],
            ['xy5', 'Primal Clash'],
            ['dc1', 'Double Crisis'],
            ['xy6', 'Roaring Skies'],
            ],
        }

    format = request.args.get('format')
    if format == 'flat':
        flat_sets = {}
        for series in card_sets:
            for set in card_sets[series]:
                set_key = set[0]
                flat_sets[set_key] = set[1]
        return json.dumps(flat_sets)
    else:
        return json.dumps(card_sets)

if __name__ == '__main__':
    app.run()