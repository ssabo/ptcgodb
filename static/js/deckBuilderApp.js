var app = angular.module("deckBuilder", []);

app.controller("deckBuilderCtrl", function($scope, $http){

    //active set in the card picker
    $scope.active_set = 'xy1';
    //list of cards for the active set in the card picker
    $scope.active_set_list

    //list of all sets
    $scope.sets_list
    //cache of list of cards grouped by set
    $scope.set_cache = []

    //Deck List
    $scope.deck_list = {}

    // Card last hovered over
    $scope.hovercard


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
            console.log($scope.deck_list);
        } else {
            var record = $scope.deck_list[uniq_id];
            if (record.card.type != 'Basic Energy' && record.count < 4){
                $scope.deck_list[uniq_id].count++;
            } else if (record.card.type == 'Basic Energy') {
                $scope.deck_list[uniq_id].count++;
            }
        }
    }

    $scope.remove_from_deck = function(card){
        var uniq_id = card.set + "_" + card.id;

        var record = $scope.deck_list[uniq_id];

        if(record.count == 1){
            delete $scope.deck_list[uniq_id];
        } else {
            $scope.deck_list[uniq_id].count--;
        }
    }


    // Initialize the Application
    $http.get("/api/sets?format=flat").success(function(data){
        $scope.sets_list = data;
        $scope.update_set_list();
        $scope.hovercard = 'xy2_108'
    })
})
