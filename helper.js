(function() {
    // Settings
    var settings = {};

    function initSettings() {
        chrome.extension.sendRequest({action: "initSettings"}, function(value) {
            settings = value;
            setLocale();
        });
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if(request["action"] === "updateSetting") {
                settings[request["key"]] = request["value"];
            }
            if(request["key"] === 'languageForSpeechInput') {
                setLocale();
            }
            sendResponse();
        });
    }

    initSettings();



    function setLocale() {
        var h = document.getElementsByTagName('html')[0];
        h.lang = settings['languageForSpeechInput'];
    }

    function installSpeechInput() {
        var sq = document.getElementById('search-query');
        if (typeof sq !== 'undefined') {
            sq.setAttribute('x-Webkit-Speech');
        }

        var t = document.getElementsByClassName('text-area-editor twttr-editor');
        for (var i = 0, l = t.length; i < l; i++) {
            var tsp = document.getElementById('twp-speech-input' + i);
            if (!tsp) {
                if (typeof t[i] !== 'undefined') {
                    var ipt = createSpeechInput('twp-speech-input' + i);
                    ipt.onwebkitspeechchange = function() {
                        var t = document.getElementsByClassName('twitter-anywhere-tweet-box-editor');
                        var target = t[i - 1];
                        var txt = target.value;
                        var start = target.selectionStart;
                        var end = target.selectionEnd;
                        var insertTxt = document.getElementById('twp-speech-input' + (i - 1)).value;
                        target.value = txt.substring(0, start) + insertTxt + txt.substring(end, txt.length);
                        target.selectionStart = target.selectionEnd = start + insertTxt.length;
                    };
                    t[i].appendChild(ipt);
                }
            }
        }
    }

    function createSpeechInput(id) {
        var i = document.createElement('input');

        i.id = id;
        i.setAttribute('x-Webkit-Speech');
        i.setAttribute('autocomplete', 'off');
        i.setAttribute('autocorrect', 'off');
        i.style.border = '0px';
        i.style.top = '0px';
        i.style.right = '0px';
        i.style.position = 'absolute';
        i.style.color = 'rgba(0, 0, 255, 0)';
        i.style.background = 'rgba(0, 0, 255, 0)';
        i.style.outline = 'none';
        i.style.fontSize = '20px';
        i.style.width = '20px';

        return i;
    }

    function DOMNodeInserted(event) {
        if ((event.target instanceof Text) === false) {
            installSpeechInput();
            installEventListener();
            installHashTagInput();
            installFavoriteUserEventListener();
            updateBadge();
            updateFieldColor();
        }
    }

    function installEventListener() {
        var target = document.getElementById('new-tweets-bar');
        if (target) {
            target.addEventListener('mousedown', markAsRead, false);
        }
    }

    function installHashTagInput() {
        var button = document.getElementsByClassName('tweet-button')[0];
        if (button) {
            button.addEventListener('mousedown', addHashTag, false);
        }
    }

    function installFavoriteUserEventListener() {
        var targets = document.getElementsByClassName('tweet-image');
        for (var i = 0, l = targets.length; i < l; i++) {
            var t = targets[i];
            if (!t.onclick) {
                t.onclick = function(event) {
                    var sn = event.target.parentElement.parentElement.getAttribute('data-screen-name');
                    // check if the name exist
                    var f = settings['favoriteUsers'];
                    var isDeleted = false;
                    for (var i = 0, l = f.length; i < l; i++) {
                        if (f[i] === sn) {
                            f.splice(i, 1);
                            cleanFieldColor();
                            isDeleted = true;
                            break;
                        }
                    }
                    if (!isDeleted) {
                        f.push(sn);
                    }
                    chrome.extension.sendRequest({action: "setSetting", key:'favoriteUsers', value:f});
                }
            }
        }
    }

    function addHashTag() {
        var t = document.getElementsByClassName('twitter-anywhere-tweet-box-editor')[0];
        t.value += ' ' + settings['hashtag'];
    }

    function updateBadge() {
        var target = document.getElementById('new-tweets-bar');
        if (target) {
            var tc = target.textContent;
            var count = tc.match(/\d+/);
            chrome.extension.sendRequest({type:"updateBadge", text:count[0]});
        } else {
            chrome.extension.sendRequest({type:"updateBadge", text:''});
        }
    }

    var screenname = null;
    function updateFieldColor() {
        var ns = document.getElementsByClassName('stream-item-content');

        var fs = settings['favoriteUsers'];

        if (!screenname) {
            screenname = document.getElementById('screen-name').outerText;
        }

        for (var i = 0, l = ns.length; i < l; i++) {
            var t = ns[i];

            // update for favorite users
            if (fs) {
                var uname = t.getAttribute('data-screen-name');
                for (var n = 0, m = fs.length; n < m; n++) {
                    if (uname === fs[n]) {
                        t.style.backgroundColor = 'rgba(0, 255, 0, 0.199219)';
                        break;
                    }
                }
            }

            // update for reply
            var txt = t.getElementsByClassName('tweet-text')[0].textContent;
            if (txt.match(screenname)) {
                t.style.backgroundColor = 'rgba(255, 0, 0, 0.199219)';
            }
        }
    }

    function cleanFieldColor() {
        var ns = document.getElementsByClassName('stream-item-content');
        for (var i = 0, l = ns.length; i < l; i++) {
            ns[i].style.backgroundColor = '';
        }
    }

    function markAsRead() {
        if (settings['markCurrentTweetsAsTransparent']) {
            var is = document.getElementsByClassName('stream-item');
            for (var i = 0, l = is.length; i < l; i++) {
                is[i].style.opacity = 0.7;
            }
        }
    }

    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        if(request["action"] === "scrollToTop") {
            window.scrollTo(0, 0);
        }
        sendResponse();
    });

    document.addEventListener("DOMNodeInserted", DOMNodeInserted, false);
})();
// vim:set ts=4 sw=4 expandtab:
