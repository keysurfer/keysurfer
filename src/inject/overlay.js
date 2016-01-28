function Overlay($link) {
    this.$link = $link;

    // The element to use for Overlay positioning and sizing.
    var $positionElement = $link;

    // If the parent is a list element see if the link is the only child in the list element.
    // If it is the only child then use the parent list element for the overlay.
    if (this.$link.parent().prop('tagName') === 'LI') {
        var parentText = this.$link.parent().text().trim().toLowerCase();
        var linkText = this.$link.text().trim().toLowerCase();
        if (linkText === parentText) {
            $positionElement = $link.parent();
        }
    }

    this.$overlayElem = $('<div class="keyboarder-overlay"><div class="keyboarder-number"></div></div>');
    this.$overlayElem.width($positionElement.outerWidth());
    this.$overlayElem.height($positionElement.outerHeight());
    this.$overlayElem.offset($positionElement.offset());

    this.$numberElem = this.$overlayElem.find('.keyboarder-number');

    $('body').append(this.$overlayElem);
}

Overlay.prototype.remove = function () {
    this.$overlayElem.remove();
};

Overlay.prototype.top = function () {
    return this.$overlayElem.offset().top;
};

Overlay.prototype.hideNumber = function () {
    this.$numberElem.hide();
};

Overlay.prototype.showNumber = function (text) {
    this.$numberElem.text(text).show();
};

Overlay.prototype.select = function () {
    this.$overlayElem.addClass('keyboarder-selected');
};

Overlay.prototype.deselect = function () {
    this.$overlayElem.removeClass('keyboarder-selected');
    this.hideNumber();
};

Overlay.prototype.isOnScreen = function () {
    // Check if it's beyond the bottom.
    if (this.top() > window.scrollY + window.innerHeight) {
        return false;
    }

    // If it's above the top of the screen then stop looking.
    if (this.top() < window.scrollY) {
        return false;
    }

    return true;
};

Overlay.prototype.click = function () {
    if (this.$link.prop('tagName') === 'INPUT') {
        this.$link.focus();
    } else {
        this.$link[0].click();
    }
};