var sets_data
var card_data = []

function renderSets(){
    card_sets = []

    $.each(sets_data, function(series, sets){
        $.each(sets, function(id, set){
           card_sets.push("<div id='" + id + "' class='card_set'><h2>" + set + "</h2><div id='" + id + "_cards' class='card_list'></div></div>")
        })
    })

    $('#sets').html(card_sets.join("\n"))
    $('.card_list').hide()

}

function fetchSet(set_id){
    uri = "/api/cards/" + set_id
    $.getJSON(uri, function(data){
        card_data[set_id] = data
        renderSetList(set_id)
    })
}

function renderSetList(set_id){

    cards = []
    cards.push("<ol>")

    set_dom_id = "#" + set_id + "_cards"

    $.each(card_data[set_id], function(key, val){
        //card = "<li id='" + set_id + "_" + val.id + "'>" + val.name + "<img id='img_" + set_id + "_" + val.id + "' class='card_image' /></li>"
        card = "<li id='" + set_id + "_" + val.id + "'>" + val.name + "</li>"
        cards.push(card)
    })
    cards.push("</ol>")

    $(set_dom_id).html(cards.join("\n"))
    $(".card_image").hide()

    $("li").hover(function(){
        card_id = this.id
        image_id = "#card_image"
        $(image_id).attr('src', "/static/assets/" + card_id + ".png")
        $(image_id).show()

    }, function(){
        card_id = this.id
        image_id = "#img_" + card_id
        $(image_id).hide()
    })
    $(set_dom_id).show()
}

function toggleSet(set_id){

    $('.card_list').hide()


    set_dom_id = '#' + set_id + "_cards"

    if( ! card_data[set_id]){
        fetchSet(set_id)
    } else {
        $(set_dom_id).show()
    }
}

function objectFollowScroll($myObject, $negativeOffset){
    $window = $(window)

    if($window.scrollTop() > $myObject.offset().top){
        $myObject.stop().animate({
            marginTop: $window.scrollTop() - $negativeOffset
        }, 'fast')
    } else {
        $myObject.stop().animate({
            marginTop: 0
        }, 'fast')
    }
}

$(document).ready(function(){

    $.getJSON("/api/sets", function(data){
        sets_data = data
        renderSets()

        $(".card_set").click(function(){
            toggleSet(this.id)
        })

    })

    $(window).scroll(function(){
        $card_image = $('#hover_pane')
        $deck = $('#deck')

        objectFollowScroll($card_image, 0)
        objectFollowScroll($deck, 50)


    })

})




