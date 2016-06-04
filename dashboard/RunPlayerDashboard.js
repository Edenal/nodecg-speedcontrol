$(function () {
    var runPlayer_activeRunID = -1;
    var runPlayer_neighbourRuns = {};
    var runPlayer_activeRunObject = undefined;
    var syncGamePlayedToTwitch = false;
    var blankSlateRunContainerHtml = $('#run-player-container').html();
    // Initialize replicants we will use
    var runDataArrayReplicantPlayer = nodecg.Replicant("runDataArray");
    runDataArrayReplicantPlayer.on("change", function (newValue, oldValue) {
        if (typeof newValue !== 'undefined' && newValue != "") {
            runPlayer_updateList(newValue);
            setActiveRun(runPlayer_activeRunID);
        }
        else {
            $('#runPlayerItems').html('');
        }
    });

    var streamControlConfigurationReplicantPlayer = nodecg.Replicant('streamControlConfiguration');
    streamControlConfigurationReplicantPlayer.on('change', function (newVal, oldVal) {
        if (newVal != "") {
            syncGamePlayedToTwitch = newVal.synchronizeAutomatically;
        }
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        if (newValue != "" && typeof newValue !== 'undefined') {
            setActiveRun(newValue.runID);
        }
        else {
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (newValue, oldValue) {
    });

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function (newVal, oldVal) {
        if (!newVal) return;
        switch (newVal[0].state) {
            case 'paused':
                disableRunChange();
                break;
            case 'finished':
                enableRunChange();
                break;
            case 'running':
                disableRunChange();
                break;
            case 'stopped':
                enableRunChange();
                break;
            default:
        }
    });

    function enableRunChange() {
        $(".playRunButton").button({disabled: false});
        $(".runPlayerNext").button({disabled: false});
    }

    function disableRunChange() {
        $(".playRunButton").button({disabled: true});
        $(".runPlayerNext").button({disabled: true});
    }

    function runPlayer_getPlayers(runData) {
        var playerString = '<tr> <td class="rowTitle">Runners</td>';
        $.each(runData.players, function (index, player) {
            if (index == 0) {
                playerString += '<td class="rowContent">' + player.names.international + '</td>' +
                    '</tr>';
            }
            else {
                playerString += '<tr><td class="rowTitle"></td><td class="rowContent">' + player.names.international + '</td>' +
                    '</tr>';
            }
        });
        return playerString;
    }

    function runPlayer_getRunBodyHtml(runData) {
        var players = runPlayer_getPlayers(runData);
        var bodyHtml = '<table class="table-striped">' +
            players +
            '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>' +
            '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>' +
            '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>' +
            '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>' +
            '</table>' +
            '<button class="playRunButton" id="playRun' + runData.runID + '">play</button>';
        return bodyHtml;

    }

    function runPlayer_updateList(runData) {
        var htmlDescriptor = '';
        $.each(runData, function (index, runData) {
            htmlDescriptor += '<div class="playerGroup" id="' + runData.runID + '">' +
                '<h3>' + runData.game + ' (' + runData.category + ')' + " " + runData.players.length + "p" +
                '</h3>' +
                '<div>' +
                runPlayer_getRunBodyHtml(runData) +
                '</div>' +
                '</div>';
        });

        $('#run-player-container').html(blankSlateRunContainerHtml);
        $('#runPlayerItems').html(htmlDescriptor);

        $('#runPlayerItems')
            .accordion({
                header: "> div > h3",
                collapsible: true,
                active: false,
                heightStyle: "content"
            });

        $(".playRunButton").button({
            text: false,
            icons: {
                primary: "ui-icon-play"
            }
        })
            .click(function () {
                nodecg.sendMessage("resetTime", 0);
                runPlayer_playRun($(this).attr('id'));
            });

        $(".runPlayerNext").button({
            text: true,
            icons: {
                primary: "ui-icon-seek-next"
            }
        }).click(function () {
            if(runDataArrayReplicantPlayer.value == "") {
                return;
            }
            var displayString = "Are you sure that you want to activate the run\n " + $(this).text().replace("Play ", "");
            if (confirm(displayString)) {
                nodecg.sendMessage("resetTime", 0);
                runPlayer_playNextRun();
            }
        });


        $(".runPlayerNext").button({
            disabled: true
        });
    }

    function runPlayer_playRun(id) {
        var runID = id.replace('playRun', '');
        runPlayer_playRunIdOnly(runID, true);
    }

    function setActiveRun(runID) {
        var thisGameIndex = runPlayer_getRunIndexInArray(Number(runID));
        var nextGameArrayIndex = thisGameIndex + 1;
        var thePreviousGameIndex = thisGameIndex - 1;
        var theNextGame = runPlayer_getRunObjectByIndex(nextGameArrayIndex);
        runPlayer_activeRunObject = runPlayer_getRunObjectByIndex(thisGameIndex);
        runPlayer_activeRunID = runID;
        var thePreviousGame = runPlayer_getRunObjectByIndex(thePreviousGameIndex);
        $('.playerGroup').find('*').removeClass('ui-state-playing');
        $('.playerGroup').find('*').removeClass('ui-state-playing-next');
        $('#' + runID + ".playerGroup").find('h3').addClass('ui-state-playing');
        $('#' + theNextGame.runID + ".playerGroup").find('h3').addClass('ui-state-playing-next');
        $("#runPlayerWindow").scrollTo($('#' + thePreviousGame.runID + ".playerGroup"), 500, {queue: false});

        $(".runPlayerNext").button({
            text: true,
            label: theNextGame != null ? "Play " + theNextGame.game : "Loop back to the beginning",
            icons: {
                primary: "ui-icon-seek-next"
            }
        });

        $(".runPlayerNext").button({
            disabled: false
        });
    }

    function runPlayer_playRunIdOnly(runID, updateActiveRunnerList) {
        var thisGameIndex = runPlayer_getRunIndexInArray(Number(runID));
        var nextGameArrayIndex = thisGameIndex + 1;
        var thePreviousGameIndex = thisGameIndex - 1;
        var theNextGame = runPlayer_getRunObjectByIndex(nextGameArrayIndex);
        runPlayer_activeRunID = runID;
        runPlayer_activeRunObject = runPlayer_getRunObjectByIndex(thisGameIndex);
        var thePreviousGame = runPlayer_getRunObjectByIndex(thePreviousGameIndex);
        $('.playerGroup').find('*').removeClass('ui-state-playing');
        $('.playerGroup').find('*').removeClass('ui-state-playing-next');
        $('#' + runID + ".playerGroup").find('h3').addClass('ui-state-playing');
        $('#' + theNextGame.runID + ".playerGroup").find('h3').addClass('ui-state-playing-next');
        $("#runPlayerWindow").scrollTo($('#' + thePreviousGame.runID + ".playerGroup"), 500, {queue: false});
        runDataActiveRunReplicant.value = runPlayer_activeRunObject;
        runDataActiveRunRunnerListReplicant.value = runPlayer_activeRunObject.players;

        if (syncGamePlayedToTwitch) {
            runPlayer_setTwitchChannelData(runPlayer_activeRunObject);
        }

        $(".runPlayerNext").button({
            text: true,
            label: theNextGame != null ? "Play " + theNextGame.game : "Loop back to the beginning",
            icons: {
                primary: "ui-icon-seek-next"
            }
        });

        $(".runPlayerNext").button({
            disabled: false
        });
    }

    function runPlayer_setTwitchChannelData(runData) {
        if (!nodecg.bundleConfig || typeof nodecg.bundleConfig.user === 'undefined' || typeof nodecg.bundleConfig.enableTwitchApi === 'undefined') {
            alert("If you want to use the twitch functionality, you need to create a file called nodecg-speedcontrol.json in nodecg/cfg and fill it with:\n" +
                "{\n" +
                "\"enableTwitchApi\": \"true\"," +
                "\"user\": \"twitchusername\"\n" +
                "}\n" +
                "exchange username with the twitch username which you want to access");
            return;
        }

        var requestObject = {};
        requestObject.channel = {};
        requestObject.channel.game = runData.game;

        nodecg.sendMessage('updateChannel',requestObject);
    }

    function runPlayer_playNextRun() {
        var activeGame = runDataActiveRunReplicant.value;
        var nextGameIndex = runPlayer_getRunIndexInArray(activeGame.runID);
        nextGameIndex++;
        if(nextGameIndex >= runDataArrayReplicantPlayer.value.length) {
            nextGameIndex = 0;
        }
        runPlayer_playRunIdOnly(runDataArrayReplicantPlayer.value[nextGameIndex].runID);
    }

    function runPlayer_getRunObjectByIndex(runIndex) {
        var runs = runDataArrayReplicantPlayer.value;
        if(runIndex >= runs.length) {
            runIndex = 0;
        }
        else if(runIndex < 0) {
            runIndex = 0;
        }
        if(typeof runs[runIndex] !== 'undefined') {
            return runs[runIndex];
        }
        return -1;
    }

    function runPlayer_getRunIndexInArray(runID) {
        var runs = runDataArrayReplicantPlayer.value;
        var foundIndex = -1;
        $.each(runs, function(index, run) {
            if(run.runID == runID) {
                foundIndex = index;
            }
        });
        return Number(foundIndex);
    }

    $(".runPlayerNext").button({
        text: true
    }).click(function () {
        if(runDataArrayReplicantPlayer.value == "") {
            return;
        }
        nodecg.sendMessage("resetTime", 0);
        runPlayer_playNextRun()
    });

    $(".runPlayerNext").button({
        disabled: true
    });
})


