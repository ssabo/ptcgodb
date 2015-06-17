var app = angular.module("deckBuilder", []);

app.controller("deckBuilderCtrl", function($scope, $http, $location){

    //active set in the card picker
    $scope.active_set = 'xy6';
    //list of cards for the active set in the card picker
    $scope.active_set_list

    //list of all sets
    $scope.sets_list
    //cache of list of cards grouped by set
    $scope.set_cache = []

    //Deck List
    $scope.deck_list = {}

    $scope.deck_list_uri = ""

    // Card last hovered over
    $scope.hovercard = "cardback"


    $scope.update_set_list = function(){
        //If the set list isn't cached fetch it
        if(! $scope.set_cache[$scope.active_set]){
            var set_uri = "/api/cards/" + $scope.active_set;
            $http.get(set_uri).success(function(data){
                $scope.set_cache[$scope.active_set] = data;
                $scope.active_set_list = $scope.set_cache[$scope.active_set]
            });
        } else {
            $scope.active_set_list = $scope.set_cache[$scope.active_set];
        }
    }

    $scope.update_deck_link = function(){
        var stripped_deck = []
        for (key in $scope.deck_list){
            count = $scope.deck_list[key].count
            set = $scope.deck_list[key].card.set
            id = $scope.deck_list[key].card.id

            stripped_deck.push([set,id,count])
        }
        deck_key = LZString.compressToEncodedURIComponent(JSON.stringify(stripped_deck))

        host = location.host

        $scope.deck_list_uri = "http://" + host + "/#/?deck=" + deck_key
    }

    $scope.card_hover = function(card){
        set_id = card.set;
        card_id = card.id;
        $scope.hovercard = set_id + "_" + card_id;
    }

    $scope.change_set_list = function(set_id){
        $scope.active_set = set_id;
        $scope.update_set_list();
    }

    $scope.add_to_deck = function(card){
        var uniq_id = card.set + "_" + card.id;
        if(! $scope.deck_list[uniq_id]){
            var entry = {'count': 1, 'card': card};
            $scope.deck_list[uniq_id] = entry;
        } else {
            var record = $scope.deck_list[uniq_id];
            if (record.card.type != 'Basic Energy' && record.count < 4){
                $scope.deck_list[uniq_id].count++;
            } else if (record.card.type == 'Basic Energy') {
                $scope.deck_list[uniq_id].count++;
            }
        }
        $scope.update_deck_link()
    }

    $scope.remove_from_deck = function(card){
        var uniq_id = card.set + "_" + card.id;

        var record = $scope.deck_list[uniq_id];

        if(record.count == 1){
            delete $scope.deck_list[uniq_id];
        } else {
            $scope.deck_list[uniq_id].count--;
        }
        $scope.update_deck_link()
    }

    $scope.populate_deck_from_URI = function(blob){

        stripped_deck = JSON.parse(LZString.decompressFromEncodedURIComponent(blob))

        for (key in stripped_deck){
            stripped_card = stripped_deck[key]

            set = stripped_card[0]
            id = stripped_card[1]
            count = stripped_card[2]

            api_uri = "/api/cards/" + set + "/" + id
            $http.get(api_uri).success((function(count){
                return function(data) {
                    for(var i = 0; i < count; i++ ){
                        $scope.add_to_deck(data)
                    }
                }
            })(count))
        }

    }

    // Initialize the Application
    $http.get("/api/sets?format=flat").success(function(data){
        $scope.sets_list = data;
        $scope.update_set_list();

        deck_input = $location.search().deck

        if (deck_input){
            $scope.populate_deck_from_URI(deck_input)
        }
    })


})
