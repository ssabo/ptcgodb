var app = angular.module("deckBuilder", []);

// TODO: Sort the cards into groups
app.filter('sortDeck', function(){
    return function(items){
        card_list = []
        pokemon_cards = []
        trainer_cards = []
        energy_cards  = []
        other_cards   = []

        // Chop up the deck into groups
        for(key in items){
            type = items[key].card.type
            if (type.search('Trainer') != -1){
                trainer_cards.push(items[key])
            }
            else if (type.search('Energy') != -1){
                energy_cards.push(items[key])
            }
            else if (type.search('Pokémon') != -1 || type.search('Pokemon') != -1){
                pokemon_cards.push(items[key])
            }
            else{
                other_cards.push(items[key])
            }
        }

        myNameSort = function(a,b){
            if(a.card.name > b.card.name)
                return 1;
            if(a.card.name < b.card.name)
                return -1;
        }
        // sort each of the chunks of the deck by name
        pokemon_sorted = pokemon_cards.sort(myNameSort)
        trainer_sorted = trainer_cards.sort(myNameSort)
        energy_sorted  = energy_cards.sort(myNameSort)
        other_sorted   = other_cards.sort(myNameSort)

        // rebuild the deck list with the sorted chunks
        card_list = pokemon_sorted.concat(trainer_sorted, energy_sorted, other_sorted)
        return card_list
    }
})

app.controller("deckBuilderCtrl", function($scope, $http, $location){

    //active set in the card picker
    $scope.active_set = 'xy6';
    //list of cards for the active set in the card picker
    $scope.active_set_list

    //list of all sets
    $scope.sets_list
    $scope.structured_sets_list
    //cache of list of cards grouped by set
    $scope.set_cache = []

    //Deck List
    $scope.deck_list = {}
    $scope.deck_size = 0

    $scope.deck_list_uri = ""

    // Card last hovered over
    $scope.hovername = "Pokemon TCG"
    $scope.hoverset  = ""
    $scope.hovercard = "cardback"
    $scope.hoverid   = ""


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

    $scope.refresh_metadata = function(){
        $scope.update_deck_size()
        $scope.update_deck_link()
    }

    $scope.update_deck_size = function(){
        var count = 0;
        for (key in $scope.deck_list){
            num = $scope.deck_list[key].count
            count = count + num
        }
        $scope.deck_size = count
    }

    $scope.update_deck_link = function(){
        var stripped_deck = []
        for (key in $scope.deck_list){
            count = $scope.deck_list[key].count
            set = $scope.deck_list[key].card.set
            id = $scope.deck_list[key].card.id

            stripped_deck.push([set,id,count])
        }

        deck_data = [$scope.deckName, stripped_deck]

        deck_key = LZString.compressToEncodedURIComponent(JSON.stringify(deck_data))

        host = location.host

        $scope.deck_list_uri = "http://" + host + "/#/?deck=" + deck_key
    }

    $scope.card_hover = function(card){
        set_id = card.set;
        card_id = card.id;
        set_name = $scope.sets_list[set_id]
        card_name = card.name


        $scope.hovercard = set_id + "_" + card_id;
        $scope.hovername = card_name
        $scope.hoverset  = set_name
        $scope.hoverid   = card_id

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
        $scope.refresh_metadata()
    }

    $scope.remove_from_deck = function(card){
        var uniq_id = card.set + "_" + card.id;

        var record = $scope.deck_list[uniq_id];

        if(record.count == 1){
            delete $scope.deck_list[uniq_id];
        } else {
            $scope.deck_list[uniq_id].count--;
        }
        $scope.refresh_metadata()
    }

    $scope.populate_deck_from_URI = function(blob){


        deck_data = JSON.parse(LZString.decompressFromEncodedURIComponent(blob))

        $scope.deckName = deck_data[0]

        stripped_deck = deck_data[1]

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

    $http.get("/api/sets").success(function(data){
        for(series in data){
            set = data[series]
        }
        $scope.structured_sets_list = data
    })
})
