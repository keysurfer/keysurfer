$(document).ready(function () {
    var $combo = $('#combo');
    var $alert = $('#alert');

    chrome.storage.sync.get({
        sequence: 'shift+space'
    }, function (items) {
        $combo.val(items.sequence)
    });

    $('#record').focus(function () {
        $combo.val('Recording...');
        Mousetrap.record(function (sequence) {
            var s = sequence.join(' ');
            $combo.val(s);
        });
    });

    $('#save').click(function () {
        chrome.storage.sync.set({
            sequence: $combo.val()
        }, function () {
            $alert.show().text('Shortcut changed to ' + $combo.val());
        });
    })
});