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
            else if (type.search('Pokémon') != -1 || type.search('Pokemon') != -1 ||
                type.search('Mega') != -1){
                pokemon_cards.push(items[key])
            }
            else{
                other_cards.push(items[key])
            }
        }

        myTypeSort = function(a,b){
            if(a.card.type > b.card.type)
                return 1;
            if(a.card.type < b.card.type)
                return -1;
            if(a.card.type == b.card.type){
                if(a.card.name > b.card.name)
                    return 1;
                if(a.card.name < b.card.name)
                    return -1;
                return 0;
            }
        }
        // sort each of the chunks of the deck by name
        pokemon_sorted = pokemon_cards.sort(myTypeSort)
        trainer_sorted = trainer_cards.sort(myTypeSort)
        energy_sorted  = energy_cards.sort(myTypeSort)
        other_sorted   = other_cards.sort(myTypeSort)

        // rebuild the deck list with the sorted chunks
        card_list = pokemon_sorted.concat(trainer_sorted, energy_sorted, other_sorted)
        return card_list
    }
})

app.controller("deckBuilderCtrl", function($scope, $http, $location, $q){

    //active set in the card picker
    $scope.active_set = 'standard';
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
    $scope.hovercard = "/static/assets/cardback.png"
    $scope.hoverid   = ""

    //Randomly pick a CDN to serve card images from
    $scope.cdn_num = Math.floor((Math.random() * 10) + 1)
    $scope.cdn = "http://assets"+$scope.cdn_num+".pokemon.com/assets/cms2/img/cards/web/"

    // Fetches and caches a card set and returns the http promise
    $scope.fetch_set_list = function(set_id){
        var set_uri = "/api/cards/" + set_id;
        return $http.get(set_uri).success(function(data){
            $scope.set_cache[set_id] = data;
        })
    }

    // Update the active set list
    $scope.update_set_list = function(){

        if($scope.active_set == 'standard' || $scope.active_set == 'expanded'){
            var standard_uri = "/api/sets/" + $scope.active_set;
            standard_sets = $http.get(standard_uri);

            $q.all([standard_sets]).then(function(results){
                sets = results[0].data;

                format_sets = {}


                // Fetch uncached sets in the format
                for(var i = 0; i < sets.length; i++){
                    set_id = sets[i];

                    if(! $scope.set_cache[set_id] ){
                        set_list = $scope.fetch_set_list(set_id)
                        format_sets[set_id] = set_list;
                    }
                }

                // Update the set list with the aggregate of the format sets
                $q.all(format_sets).then(function(results){
                    set_list = []

                    for(var i = 0; i < sets.length; i++){
                        set_id = sets[i]
                        set_list = set_list.concat($scope.set_cache[set_id]);
                    }
                    $scope.active_set_list = set_list;
                })
            })
        } else {
            var set_uri = "/api/cards/" + $scope.active_set;

            // Fetch individual set
            set = $scope.fetch_set_list($scope.active_set);

            // Update the set list
            $q.all([set]).then(function(results){

                set_list = $scope.set_cache[$scope.active_set];

                $scope.active_set_list = set_list;
            })
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

        assets_url = $scope.cdn+set_id.toUpperCase()+"/"+set_id.toUpperCase()+"_EN_"+card_id+".png"

        $scope.hovercard = assets_url;
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

    $scope.save_deck = function(){
        window.prompt("Copy to clipboard: Ctrl+C, Enter", $scope.deck_list_uri)
    }

    // Initialize the Application
    $http.get("/api/sets?format=flat").success(function(data){
        $scope.sets_list = data;
        $scope.sets_list['standard'] = 'Standard'
        $scope.sets_list['expanded'] = 'Expanded'

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
