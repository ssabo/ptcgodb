var default_set = 'xy3'
var cardset_cache = []
var decklist = {}

function setupSetList(set_blob){
    set_list = []

    $.each(set_blob, function(series, sets){
        $.each(sets, function(id, set){
            set_list.push("<li><a href='#' class='cardset' data-setid='" + id + "'>" + set + "</a></li>")
        })
    })

    $('#setpickerlist').html(set_list.join("\n"))

    $('.cardset').click(function(){
        switchSet(this.dataset.setid)
    })

    switchSet(default_set)
}

function switchSet(setid){
    uri = "/api/cards/" + setid
    if( ! cardset_cache[setid] ) {
        $.getJSON(uri, function(data){
            cardset_cache[setid] = data
            displaySet(setid)
        })
    } else {
        displaySet(setid)
    }
}

function displaySet(setid){
    cardlist = []

    $.each(cardset_cache[setid], function(key,value){
        cardid = value['id']
        cardname = value['name']
        card="<li class='list-group-item card' data-setid='" + setid + "' data-cardid='" + cardid + "' data-cardname='" + cardname + "'>" + cardname + "</li>"
        cardlist.push(card)
    })

    $('#setlist').html(cardlist.join("\n"))

    $(".card").click(addCardToDeck)

    registerCardHover()
}

function addCardToDeck(){
    cardid = this.dataset.cardid
    setid = this.dataset.setid
    cardname = this.dataset.cardname

    uniq_id = setid + "_" + cardid

    if(decklist[uniq_id]){
        if(decklist[uniq_id]['count'] >= 4){
            return
        } else {
            decklist[uniq_id]['count']++
        }
    } else {
        card_obj = []
        card_obj['name'] = cardname
        card_obj['setid'] = setid
        card_obj['cardid'] = cardid
        card_obj['count'] = 1
        decklist[uniq_id] = card_obj
    }

    refreshDeckList()
}

function removeCardFromDeck(){
    cardid = this.dataset.cardid
    setid = this.dataset.setid

    uniq_id = setid + "_" + cardid

    if(decklist[uniq_id]){
        decklist[uniq_id]['count']--
        if(decklist[uniq_id]['count'] <= 0){
            delete decklist[uniq_id]
        }
    }

    refreshDeckList()
}

function refreshDeckList(){
    deck_dom = []

    $.each(decklist, function(key, value){
        cardid = value['cardid']
        name = value['name']
        setid = value['setid']
        count = value['count']

        card = "<li class='list-group-item card deckcard' data-setid='"+ setid + "' data-cardid='" + cardid + "' data-cardname='" + name + "'>" + name + "<span class='badge'>" + count + "</span></li>"
        deck_dom.push(card)

    })

    $("#decklist").html(deck_dom.join("\n"))

    $('.deckcard').click(removeCardFromDeck)
    registerCardHover()

}

function registerCardHover(){
    $(".card").hover(function(){
        cardid = this.dataset.cardid
        setid = this.dataset.setid

        uri = "/static/assets/" + setid + "_" + cardid + ".png"
        $('#cardimage').attr('src', uri)

    })
}

$(document).ready(function(){
    $.getJSON("/api/sets", function(data){
        setupSetList(data)
        refreshDeckList()
    })
})