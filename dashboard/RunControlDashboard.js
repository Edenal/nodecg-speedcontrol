$(function () {
    var lastItemSize = 0;
    var blankSlateContainerHtml = $('#run-control-container').html();
// Initialize replicants we will use
    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (newValue, oldValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            runControl_UpdateList(newValue);
        }
        else {
            $('#runItems').html('');
        }
    });

    var runDataEditRunReplicant = nodecg.Replicant("runDataEditRun",{persistent: false});
    runDataEditRunReplicant.on("change", function (newValue, oldValue) {
    });

    function runControl_GetPlayers(runData) {
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

    function runControl_GetRunBodyHtml(runData) {
        var players = runControl_GetPlayers(runData);
        var bodyHtml = '<table class="table-striped">' +
            players +
            '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>' +
            '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>' +
            '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>' +
            '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>' +
            '</table>';
        return bodyHtml;

    }

    function runControl_UpdateList(runData) {
        var htmlDescriptor = '';
        var buttonRemoveIDs = [];
        var buttonChangeIDs = [];

        $.each(runData, function (index, runData) {
            var buttonRemoveIDString = 'remove' + runData.runID;
            var buttonChangeIDString = 'change' + runData.runID;
            buttonRemoveIDs.push(buttonRemoveIDString);
            buttonChangeIDs.push(buttonChangeIDString);
            htmlDescriptor += '<div class="group" id="' + runData.runID + '">' +
                '<h3>' + runData.game + ' (' + runData.category + ')' + " " + runData.players.length + "p" +
                '</h3>' +
                '<div>' +
                runControl_GetRunBodyHtml(runData) +
                '<button class="removeButton" id="' + buttonRemoveIDString + '"></button>' +
                '<button class="changeButton" nodecg-dialog="edit-game" id="' + buttonChangeIDString + '"></button>' +
                '</div>' +
                '</div>';
        });

        $('#run-control-container').html(blankSlateContainerHtml);
        $('#runItems').html(htmlDescriptor);

        $.each(buttonRemoveIDs, function (index, buttonID) {
            $('#' + buttonID).click(function () {
                var r = confirm("Do you really want to remove this run?");
                if (r) {
                    runControl_RemoveRun(index);
                }
            });

            $('#' + buttonID).button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            })
        });

        $.each(buttonChangeIDs, function (index, buttonID) {
            $('#' + buttonID).click(function () {
                runDataEditRunReplicant.value = runControl_GetRun(index);
            });

            $('#' + buttonID).button({
                icons: {
                    primary: "ui-icon-pencil"
                },
                text: false
            })
        });

        $('#runItems')
            .accordion({
                header: "> div > h3",
                collapsible: true,
                active: false,
                heightStyle: "content"
            })
            .sortable({
                axis: "y",
                handle: "h3",
                stop: function (event, ui) {
                    // IE doesn't register the blur when sorting
                    // so trigger focusout handlers to remove .ui-state-focus
                    var sortedIDs = $('#runItems').sortable("toArray");
                    var runContainer = runDataArrayReplicant.value;
                    var newRunDataArray = [];
                    $.each(sortedIDs, function (index, valueId) {
                        $.each(runContainer, function (index, valueRunData) {
                            if (valueRunData.runID == valueId) {
                                newRunDataArray.push(valueRunData);
                                return false;
                            }
                        });
                    });
                    runDataArrayReplicant.value = newRunDataArray;
                    // Refresh accordion to handle new order
                    $(this).accordion("refresh");
                }
            });
        lastItemSize = runData.length;
    }

    function runControl_RemoveRun(ID) {
        var runContainer = runDataArrayReplicant.value;
        runContainer.splice(ID, 1);
        runDataArrayReplicant.value = runContainer;
    }

    function runControl_GetRun(ID) {
        var runContainer = runDataArrayReplicant.value;
        return runContainer[ID];
    }
})
