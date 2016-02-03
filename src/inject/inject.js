var $keysurferElem,
    $status,
    $input,
    $selected; // The currently selected element


var active = false, // If keyboarder is active.
    links = [], // [{elem, text}], sorted by elem's top offset.
    top10 = [],
    prevTarget = null,// Previous entry in the $input field.
    overlays = [], // List of overlay jQuery objects [overlayElem, $elem]
    selectedIndex; // Index of overlays referring to selected.

function nextSelection() {
    updateSelected(selectedIndex + 1);
    return false;
}

function prevSelection() {
    updateSelected(selectedIndex - 1);
    return false;
}

function toggleKeyboarder() {
    if (active) { // Deactivate keyboarder.
        active = false;
        $keysurferElem.hide();
        $input.val('');
        $status.val('');

        _.each(overlays, function (overlay) {
            overlay.remove();
        });

        overlays = [];
        $selected = null;
        prevTarget = null;
    } else { // Activate keyboarder.
        gatherLinks();
        active = true;
        $keysurferElem.show();
        $input.focus();
        $input.val('');
        $status.val('');
    }
    return false;
}

function bisectLeft(y) {
    var low = 0;
    var high = overlays.length;
    var mid;
    var item;

    while (low < high) {
        mid = Math.floor((low + high) / 2);
        item = overlays[mid].top();

        if (item < y) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

function resetTop10() {
    // Remove old top 10.
    _.each(top10, function (overlay) {
        overlay.hideNumber();
    });

    top10 = [];

    // Find new top 10.
    for (var i = (selectedIndex + 1) % overlays.length;
         i != selectedIndex && top10.length < 10;
         i = (i + 1) % overlays.length) {
        var overlay = overlays[i];

        if (!overlay.isOnScreen()) {
            break;
        }

        top10.push(overlay);
        overlay.showNumber('alt+' + top10.length);
    }

    overlays[selectedIndex].showNumber('enter');
}

function doTop10(event, combo) {
    if (!active) {
        return true;
    }

    // Get what number was pressed.
    var number = Number(combo.substr(combo.length - 1));

    // See if a top 10 exists for it.
    if (number > top10.length) {
        return true;
    }

    top10[number - 1].click();
    return false;
}

function updateSelected(newIndex) {
    if (overlays.length === 0) {
        return;
    }

    if ($selected) {
        $selected.deselect();
    }

    selectedIndex = newIndex % overlays.length;
    if (selectedIndex < 0) {
        selectedIndex = overlays.length - 1;
    }

    $selected = overlays[selectedIndex];
    $selected.select();

    $('html, body').animate({
        scrollTop: $selected.top() - 10
    }, 100, resetTop10);

    $status.text((selectedIndex + 1) + ' of ' + overlays.length);
}

function updateInput(event) {
    if (!active) {
        return;
    }

    // If enter key was pressed.
    if (event.keyCode === 13) {
        $input.val('');
        $status.val('');
        if ($selected) {
            $selected.click();
        }
        _.each(overlays, function (overlay) {
            overlay.remove();
        });

        overlays = [];
        $selected = null;
        prevTarget = null;
        return false;
    }

    if (event.keyCode === 40) { // Down key.
        nextSelection();
        return false;
    }

    if (event.keyCode === 38) { // Up key.
        prevSelection();
        return false;
    }

    var target = $input.val().toLowerCase().trimLeft();
    if (target === prevTarget) {
        return true;
    }
    prevTarget = target;

    _.each(overlays, function (overlay) {
        overlay.remove();
    });

    overlays = [];
    $selected = null;

    if (target.length === 0) {
        $status.html('<span id="keyboarder-status-none">Start typing to search</span>');
        return false;
    }

    _.each(links, function (link) {
        if (link.text.startsWith(target) && link.elem.is(':visible')) {
            var overlay = new Overlay(link.elem);
            overlays.push(overlay);
        }
    });

    if (overlays.length > 0) {
        updateSelected(bisectLeft(window.scrollY));
    } else {
        $status.text('No links match');
    }
    return false;
}

function gatherLinks() {
    links = [];

    $('a').each(function (i, e) {
        var $a = $(e);

        var text = $a.text().trim().toLowerCase();

        var ariaLabel = $a.attr('aria-label');
        if (ariaLabel && text.length === 0) {
            links.push({
                elem: $a,
                text: ariaLabel.toLowerCase()
            });
        } else {
            links.push({
                elem: $a,
                text: text
            });
        }
    });

    $('button').each(function (i, e) {
        var $button = $(e);
        if ($button.attr('type') === 'submit') {
            links.push({
                elem: $button,
                text: $button.text().trim().toLowerCase()
            })
        }
    });

    // List of inputs we've already added to the list of links.
    var seenInputs = {};

    $('input[type="submit"]').each(function (i, e) {
        var $input = $(e);
        var text = $input.val().trim().toLowerCase();

        if (text !== '') {
            seenInputs[$input[0].outerHTML] = true;
            links.push({
                elem: $input,
                text: text
            })
        }
    });

    $('label[for]').each(function (i, e) {
        var $label = $(e);
        var $input = $('#' + $label.attr('for'));

        var text = $label.text().trim().toLowerCase();
        if ($input.length && text !== '' && !seenInputs[$input[0]]) {
            seenInputs[$input[0].outerHTML] = true;
            links.push({
                elem: $input,
                text: text
            });
        }
    });

    $('input[placeholder]').each(function (i, e) {
        var $input = $(e);
        var text = $(e).attr('placeholder').trim().toLowerCase();

        if (text !== '' && !seenInputs[$input[0].outerHTML]) {
            seenInputs[$input[0].outerHTML] = true;
            links.push({
                elem: $input,
                text: text
            });
        }
    });

    links = _.sortBy(links, function (link) {
        return link.elem.offset().top;
    });
}

$(document).ready(function () {
    // Allow our extension when user is in textfield.
    Mousetrap.prototype.stopCallback = function () {
        return false;
    };

    // Make keysurfer element and add it to the page.
    $keysurferElem = $('<div id="keyboarder-main"><div id="keyboarder-content"><input type="text" /><div id="keyboarder-status"></div></div></div></div>');
    $input = $keysurferElem.find('input');
    $status = $keysurferElem.find('#keyboarder-status');
    $('body').append($keysurferElem);

    $input.on('keyup', updateInput);

    // When keysurfer loses focus deactivate it.
    $input.on('focusout', function () {
        if (active) {
            toggleKeyboarder();
        }
    });

    // Get the hotkey for keysurfer and bind it to toggle activation.
    chrome.storage.sync.get({
        sequence: 'shift+space'
    }, function (items) {
        Mousetrap.bind(items.sequence, toggleKeyboarder);
    });

    // Bind alt+# keys to clicking links.
    Mousetrap.bind(['alt+1', 'alt+2', 'alt+3', 'alt+4', 'alt+5', 'alt+6', 'alt+7', 'alt+8', 'alt+9'], doTop10);
});