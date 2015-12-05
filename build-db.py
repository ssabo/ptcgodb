#!/usr/bin/env python2.7

import urllib2
from mongokit import *
from bs4 import BeautifulSoup

base_url = 'http://www.pokemon.com/us/pokemon-tcg/pokemon-cards/%(series)s/%(set_id)s/%(card)s/'

connection = Connection()


@connection.register
class Card(Document):
    structure = {
        'id': unicode,
        'name': unicode,
        'type': unicode,
        'set': unicode
    }
    required_fields = ['id', 'name', 'type', 'set']


def __get_dom(card, set_id, series):
    url = base_url % {
        'card': card,
        'set_id': set_id,
        'series': series
    }
    dom = urllib2.urlopen(url)
    soup = BeautifulSoup(dom)
    return soup


def __save_metadata(card_id, set_id, soup):
    description = soup.find('div', {'class': 'card-description'})

    card_name = ''
    for chunk in description.find('h1').stripped_strings:
        card_name = card_name + chunk

    card_type = description.find('h2').string

    card = connection.ptcgodb.cards.Card(
        connection.ptcgodb.cards.find_one({
            'id': card_id,
            'set': set_id
        })
    )

    card['id'] = unicode(card_id)
    card['name'] = unicode(card_name)
    card['type'] = unicode(card_type)
    card['set'] = unicode(set_id)

    card.save()


def __save_assets(card_id, set_id, soup):
    img_url = 'http:' + soup.find('div', {'class': 'card-image'}).find('img')['src']
    img_data = urllib2.urlopen(img_url).read()
    file_name = 'static/assets/%(set)s_%(card)s.png' % {
        'set': set_id,
        'card': card_id
    }

    asset = open(file_name, 'wb')
    asset.write(img_data)
    asset.close()


def __save_card(card_id, set_id, series='xy-series'):
    soup = __get_dom(card_id, set_id, series)
    __save_metadata(card_id, set_id, soup)
    __save_assets(card_id, set_id, soup)
    print 'Card %(set)s - %(card)s saved' % {
        'set': set_id,
        'card': card_id,
        }


if __name__ == '__main__':

    card_sets = {
        'bw-series': {
            'bw1': 114,
            'bw2': 98,
            'bw3': 102,
            'bw4': 103,
            'bw5': 111,
            'bw6': 128,
            'dv1': 20,
            'bw7': 153,
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
            'xy4': 119,
            'xy5': 160,
            'dc1': 34,
            'xy6': 108,
            'xy7': 98,
        },
    }

    # Normal Sets
    for series, sets in card_sets.iteritems():
        for set_id, count in sets.iteritems():
            for card in range(1, count+1):
                __save_card(card, set_id, series)

    #special rule for radient collection in BW11
    radient_set       = 'bw11'
    radient_series    = 'bw-series'
    num_radient_cards = 25
    for i in range (1, num_radient_cards+1):
        radient_card = 'RC%(id)s' % {'id': i }
        __save_card(radient_card, radient_set, radient_series)

    #special rules for promo cards

    bw_promo_set    = 'bwp'
    bw_promo_series = 'bw-series'
    bwp_valid_ids   = range(1,29+1) + range(32, 76+1) + range(79, 101+1)
    for i in bwp_valid_ids:
        id = i
        if i < 10:
            id = "0" + str(i)
        bw_card = 'BW%(id)s' % { 'id' : id }
        __save_card(bw_card, bw_promo_set, bw_promo_series)

    xy_promo_set    = 'xyp'
    xy_promo_series = 'xy-series'
    # Cards which are released but not available at source
    # 46 - Gallade-EX
    # 51 - Kyogre
    # 52 - Groudon
    # 60 - Gyarados
    # 61 - Flygon
    # 62 - Absol
    # 63 - MAbsol
    # 64 - Rayquaza
    xyp_valid_cards = range(1, 44+1) + range(46, 50+1) + range(53,55+1) + range(66, 66+1)
    for i in xyp_valid_cards:
        id = i
        if id < 10:
            id = "0" + str(i)
        xy_card = 'XY%(id)s' % { 'id' : id }
        __save_card(xy_card, xy_promo_set, xy_promo_series)
