var active = false, // If keyboarder is active.
    links = [], // [{elem, text}], sorted by elem's top offset.
    elem,
    $status,
    input,
    prevTarget = '',// Previous entry in the input field.
    overlays = [], // List of overlay jQuery objects [overlayElem, elem]
    selectedIndex,// Index of overlays referring to selected.
    selected; // The currently selected element

function newOverlay(elem) {
    var useElem = elem;

    if (elem.parent().prop('tagName') === 'LI') {
        useElem = elem.parent();
    }

    var overlay = $('<div class="keyboarder-overlay"></div>');
    overlay.width(useElem.outerWidth());
    overlay.height(useElem.outerHeight());
    overlay.offset(useElem.offset());
    return overlay;
}

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
        elem.hide();
        input.val('');

        _.each(overlays, function (overlay) {
            overlay.overlayElem.remove();
        });

        overlays = [];
        selected = null;
        prevTarget = '';
    } else { // Activate keyboarder.
        active = true;
        elem.show();
        input.focus();
    }
}

function bisectLeft(y) {
    var low = 0;
    var high = overlays.length;
    var mid;
    var item;

    while (low < high) {
        mid = Math.floor((low + high) / 2);
        item = overlays[mid].elem.offset().top;

        if (item < y) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

function updateSelected(newIndex) {
    if (selected) {
        overlays[selectedIndex].overlayElem.removeClass('keyboarder-selected');
    }

    selectedIndex = newIndex % overlays.length;
    if (selectedIndex < 0) {
        selectedIndex = overlays.length - 1;
    }

    selected = overlays[selectedIndex].elem;
    overlays[selectedIndex].overlayElem.addClass('keyboarder-selected');

    $('html, body').animate({
        scrollTop: selected.offset().top
    }, 100);

    $status.text((selectedIndex + 1) + ' of ' + overlays.length);
}

function updateInput(event) {
    if (!active) {
        return;
    }

    // If enter key was pressed.
    if (event.keyCode === 13) {
        input.val('');
        if (selected) {
            $(selected)[0].click()
        }
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

    var target = input.val().toLowerCase();
    if (target === prevTarget) {
        return;
    }
    prevTarget = target;

    _.each(overlays, function (overlay) {
        overlay.overlayElem.remove();
    });

    overlays = [];
    selected = null;

    if (target.length === 0) {
        $status.text('');
        return;
    }

    _.each(links, function (link) {
        if (link.text.startsWith(target) && link.elem.is(':visible')) {
            var overlay = newOverlay(link.elem);
            $('body').append(overlay);
            overlays.push({
                overlayElem: overlay,
                elem: link.elem
            });
        }
    });

    if (overlays.length > 0) {
        updateSelected(bisectLeft(window.scrollY));
    }
}

$(document).ready(function () {
    // Allow our extension when user is in textfield.
    Mousetrap.prototype.stopCallback = function () {
        return false;
    };

    $('a').each(function (i, e) {
        var $e = $(e);

        var text = $e.text().trim().toLowerCase();

        var ariaLabel = $e.attr('aria-label');
        if (ariaLabel && text.length === 0) {
            links.push({
                elem: $e,
                text: ariaLabel.toLowerCase()
            });
        } else {
            links.push({
                elem: $e,
                text: text
            });
        }
    });

    $('button').each(function (i, e) {
        var $e = $(e);
        if ($e.attr('type') === 'submit') {
            links.push({
                elem: $e,
                text: $e.text().trim().toLowerCase()
            })
        }
    });

    links = _.sortBy(links, function (link) {
        return link.elem.offset().top;
    });

    elem = $('<div id="keyboarder-main"><div id="keyboarder-content"><input type="text" /><div id="keyboarder-status"></div></div></div></div>');
    input = elem.find('input');
    $status = elem.find('#keyboarder-status');

    input.on('keyup', updateInput);
    input.on('focusout', function () {
        if (active) {
            toggleKeyboarder();
        }
    });

    $('body').append(elem);

    Mousetrap.bind('command+shift+space', toggleKeyboarder);
    Mousetrap.bind('ctrl+shift+space', toggleKeyboarder);
});