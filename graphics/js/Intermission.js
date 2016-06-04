'use strict';
$(function () {
    // JQuery selector initialiation ###

    var $comingUpGame = $('#comingUpGame');
    var $comingUpCathegory = $('#comingUpCathegory');
    var $comingUpSystem = $('#comingUpSystem');
    var $comingUpPlayer = $('#comingUpPlayer');

    var $justMissedGame = $('#justMissedGame');
    var $justMissedCathegory = $('#justMissedCathegory');
    var $justMissedSystem = $('#justMissedSystem');
    var $justMissedPlayer = $('#justMissedPlayer');

    var isInitialized = false;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    // NodeCG Message subscription ###
    nodecg.listenFor("displayMarqueeInformation", displayMarquee);
    nodecg.listenFor("removeMarqueeInformation", removeMarquee);

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
        if(typeof newValue !== 'undefined' && newValue != "") {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (newValue, oldValue) {
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        if(typeof newValue == 'undefined' || newValue == "") {
            return;
        }

        var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        if(!isInitialized) {
            updateMissedComingUp(newValue, comingUpRun);
            isInitialized = true;
        }
    });


    function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
            if(value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }

    function updateMissedComingUp(currentRun, nextRun) {
        changeComingUpRunInformation(nextRun);
        changeJustMissedRunInformation(currentRun);
    }

    // Replicant functions ###
    function changeComingUpRunInformation(runData) {
        var playerPanelHTML =
            '<div class="playerContainer">' +
            '<div class="runnerLogo">' +
            '<img class="playerLogo" src="/graphics/nodecg-speedcontrol/images/PlayerIcon.png">' +
            '</div>' +
            '<div class="playerLogoDelimiter">  <img class="playerDelimiter" src="/graphics/nodecg-speedcontrol/images/Delimiter.png"> </div>' +
            '<div class="runnerInfo"> </div>' +
            '</div>';
        var game = "END";
        var category = "";
        var system = "";
        var players = [];

        if(typeof runData !== "undefined") {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
            players = runData.players;
            $.each(players, function(index, player) {
                $('.playerInformationContainer').eq(1).append(playerPanelHTML);
            });
        }

        var $runnerInfoElements = $('#comingUpRunContainer .runnerInfo');
        $runnerInfoElements.each( function( index, element ) {
            animation_setGameFieldAlternate($(this),getRunnerInformationName(runData.players,index));
        });

        animation_setGameField($comingUpGame,game);
        animation_setGameField($comingUpCathegory,category);
        animation_setGameField($comingUpSystem,system);
    }

    function changeJustMissedRunInformation(runData) {
        var playerPanelHTML =
            '<div class="playerContainer">' +
                '<div class="runnerLogo">' +
                    '<img class="playerLogo" src="/graphics/nodecg-speedcontrol/images/PlayerIcon.png">' +
                '</div>' +
                '<div class="playerLogoDelimiter">  <img class="playerDelimiter" src="/graphics/nodecg-speedcontrol/images/Delimiter.png"> </div>' +
                '<div class="runnerInfo"> </div>' +
            '</div>';
        var game = "END";
        var category = "";
        var system = "";
        var players = [];

        if(typeof runData !== "undefined") {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
            players = runData.players;
            $.each(players, function(index, player) {
                $('.playerInformationContainer').first().append(playerPanelHTML);
            });
        }

        animation_setGameField($justMissedGame,game);
        animation_setGameField($justMissedCathegory,category);
        animation_setGameField($justMissedSystem,system);

        var $runnerInfoElements = $('#justMissedRunContainer .runnerInfo');
        $runnerInfoElements.each( function( index, element ) {
            animation_setGameFieldAlternate($(this),getRunnerInformationName(runData.players,index));
        });

        var $delimiters = $("img.playerDelimiter");
        $delimiters.each( function( index, element ) {
            animation_shrinkHeightRotateRevert($(this));
        });
    }

    // General functions ###

    // Gets the runner with index 'index' in the runnerarray's nickname from the rundata Replicant
    function getRunnerInformationName(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }
        return runnerDataArray[index].names.international;
    }

    function applyBackgroundTransparence(value) {
        if (value == 'On') {
            $('#window-container').css('opacity',0.5);
        }
        else if (value == 'Off') {
            $('#window-container').css('opacity',1.0);
        }
    }

    function displayMarquee(text) {
        $('#informationMarquee').html(text);
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', height: "50px",  ease: Quad.easeOut },'0');
        tm.play();
    }

    function removeMarquee() {
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '0', height: "0px",  ease: Quad.easeOut },'0');
        tm.play();
    }

    function loadCSS (href) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
        $("head").append(cssLink);
    };

    loadCSS("/graphics/nodecg-speedcontrol/css/editcss/"+sceneID+".css");
});
